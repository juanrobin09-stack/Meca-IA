import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession, STRIPE_PRICES, type ProductType } from '@/lib/stripe'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, CheckCircle2, CreditCard, Shield, Star, Users } from 'lucide-react'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import UpgradeBanner from './UpgradeBanner'

// Témoignages pour la réassurance
const TESTIMONIALS = [
  {
    name: 'Thomas L.',
    text: 'Economisé 400€ sur un devis moteur, le garagiste gonflait les prix !',
    rating: 5,
  },
  {
    name: 'Sophie M.',
    text: 'Le diagnostic m\'a évité une panne sur l\'autoroute. Merci MECA IA !',
    rating: 5,
  },
]

type PaywallMode = 'diagnostic' | 'devis' | 'video' | 'prevision' | 'chat' | 'vehicle'

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: PaywallMode
  title?: string
  subtitle?: string
  /** Force l'affichage du modal même pendant le cooldown (ex: limite vraiment atteinte) */
  forceModal?: boolean
}

const defaultContent: Record<PaywallMode, {
  title: string
  subtitle: string
  unitLabel: string
  unitButton: string
  unitPrice: string
  priceId: string
  productType: ProductType
  hideUnitPurchase?: boolean
  features: string[]
}> = {
  diagnostic: {
    title: 'Tes 2 diagnostics gratuits sont épuisés',
    subtitle: 'Passe Premium pour des diagnostics illimités et toutes les fonctionnalités avancées !',
    unitLabel: '',
    unitButton: '',
    unitPrice: '',
    priceId: '',
    productType: 'diagnostic',
    hideUnitPurchase: true, // No single purchase - only Premium
    features: [
      'Diagnostics Pro illimités',
      'Diagnostic vidéo IA',
      'Prévision de pannes intelligente',
      'Chat mécanicien 24/7 illimité',
      'Analyses de devis illimitées',
      'Véhicules illimités',
      'Historique complet illimité',
    ],
  },
  devis: {
    title: 'Tu as utilisé ton analyse gratuite ce mois',
    subtitle: 'Passe Premium pour analyser tous tes devis et détecter les arnaques automatiquement !',
    unitLabel: '1 analyse de devis',
    unitButton: 'Acheter 1 analyse',
    unitPrice: '1.99€',
    priceId: STRIPE_PRICES.PAY_PER_DEVIS,
    productType: 'devis',
    features: [
      'Analyses de devis illimitées',
      'Détection arnaques automatique',
      'Comparaison prix du marché',
      'Diagnostics Pro illimités',
      'Chat mécanicien 24/7 illimité',
    ],
  },
  video: {
    title: 'Diagnostic Vidéo - Fonctionnalité Premium',
    subtitle: "L'IA analyse tes vidéos (bruit moteur, fumée, etc.) pour un diagnostic ultra-précis !",
    unitLabel: '',
    unitButton: '',
    unitPrice: '',
    priceId: '',
    productType: 'video',
    hideUnitPurchase: true,
    features: [
      'Diagnostic vidéo illimité',
      'Analyse audio + visuelle par IA',
      'Diagnostics Pro illimités',
      'Prévision de pannes',
      'Chat mécanicien 24/7 illimité',
    ],
  },
  prevision: {
    title: 'Prévision de Pannes - Fonctionnalité Premium',
    subtitle: "Anticipe les réparations de ton véhicule et évite les mauvaises surprises !",
    unitLabel: '',
    unitButton: '',
    unitPrice: '',
    priceId: '',
    productType: 'diagnostic',
    hideUnitPurchase: true,
    features: [
      'Prévision de pannes illimitée',
      'Budget entretien estimé',
      'Alertes préventives',
      'Diagnostics Pro illimités',
      'Historique complet illimité',
    ],
  },
  chat: {
    title: 'Limite quotidienne atteinte (10 messages/jour)',
    subtitle: 'Reviens demain ou passe Premium pour discuter avec ton mécanicien IA 24/7 sans limite !',
    unitLabel: '',
    unitButton: '',
    unitPrice: '',
    priceId: '',
    productType: 'chat',
    hideUnitPurchase: true,
    features: [
      'Chat mécanicien 24/7 illimité',
      'Contexte véhicule automatique',
      'Diagnostics Pro illimités',
      'Diagnostic vidéo IA',
      'Prévision de pannes',
    ],
  },
  vehicle: {
    title: 'Limite de véhicules atteinte (1 véhicule)',
    subtitle: 'Passe Premium pour enregistrer tous tes véhicules et profiter de diagnostics personnalisés !',
    unitLabel: '',
    unitButton: '',
    unitPrice: '',
    priceId: '',
    productType: 'diagnostic',
    hideUnitPurchase: true,
    features: [
      'Véhicules illimités',
      'Prévision de pannes par véhicule',
      'Historique par véhicule',
      'Diagnostics contextualisés',
      'Chat mécanicien personnalisé',
    ],
  },
}

export default function PaywallModal({
  open,
  onOpenChange,
  mode = 'diagnostic',
  title,
  subtitle,
  forceModal = false,
}: PaywallModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [bannerVisible, setBannerVisible] = useState(false)

  // Système de cooldown pour éviter le spam
  const {
    promptType,
    onDismiss,
    onShow,
    setForceModal
  } = useUpgradePrompt()

  // Déterminer ce qu'on doit afficher
  const shouldShowModal = forceModal || promptType === 'modal'
  const shouldShowBanner = !forceModal && promptType === 'banner'

  // Mettre à jour forceModal dans le hook
  useEffect(() => {
    setForceModal(forceModal)
  }, [forceModal, setForceModal])

  // Tracker quand le modal est ouvert
  useEffect(() => {
    if (open && shouldShowModal) {
      onShow()
    }
  }, [open, shouldShowModal, onShow])

  // Gérer la fermeture
  const handleClose = useCallback(() => {
    onDismiss()
    onOpenChange(false)
    // Si on était en mode modal mais qu'on a un cooldown, montrer le banner
    if (shouldShowBanner) {
      setBannerVisible(true)
    }
  }, [onDismiss, onOpenChange, shouldShowBanner])

  // Fermer le banner
  const handleBannerClose = useCallback(() => {
    setBannerVisible(false)
    onDismiss()
  }, [onDismiss])

  const content = defaultContent[mode]
  const displayTitle = title || content.title
  const displaySubtitle = subtitle || content.subtitle

  // Si on doit montrer un banner (soit par cooldown, soit après fermeture du modal)
  if ((open && shouldShowBanner && !shouldShowModal) || bannerVisible) {
    return (
      <UpgradeBanner
        show={true}
        message={displayTitle}
        onClose={handleBannerClose}
        feature={mode === 'diagnostic' || mode === 'video' || mode === 'prevision' ? 'diagnostic' : mode === 'chat' ? 'chat' : mode === 'devis' ? 'devis' : 'general'}
      />
    )
  }

  // Si le modal ne doit pas s'afficher (cooldown actif)
  if (open && !shouldShowModal && !shouldShowBanner) {
    // Fermer silencieusement
    if (open) {
      onOpenChange(false)
    }
    return null
  }

  async function handlePurchase(priceId: string, isSubscription: boolean, productType?: ProductType) {
    if (!user) return

    setLoading(priceId)
    try {
      console.log('Creating checkout session with:', { priceId, isSubscription, userId: user.id, productType })
      await createCheckoutSession(priceId, isSubscription, user.id, undefined, productType)
    } catch (error: unknown) {
      console.error('Checkout error details:', error)
      const err = error as { message?: string }
      alert(`Erreur: ${err?.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open && shouldShowModal} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose()
      else onOpenChange(isOpen)
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-center text-lg sm:text-xl">
            {displayTitle}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {displaySubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-green-600" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-violet-600" />
              <span>500+ utilisateurs</span>
            </div>
          </div>

          {/* Premium Option */}
          <Card className="border-primary ring-2 ring-primary relative overflow-hidden">
            {/* Badge promo */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              OFFRE LIMITEE
            </div>
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                <CardTitle className="text-base sm:text-lg">Premium</CardTitle>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                9,99€<span className="text-xs sm:text-sm font-normal text-muted-foreground">/mois</span>
              </div>
              <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Annule à tout moment, sans frais
              </p>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
              <p className="text-xs text-muted-foreground font-medium">Inclus dans Premium :</p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {content.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full text-sm sm:text-base bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600"
                onClick={() => handlePurchase(STRIPE_PRICES.PREMIUM_MONTHLY, true)}
                disabled={loading !== null}
              >
                {loading === STRIPE_PRICES.PREMIUM_MONTHLY ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Passer Premium maintenant
              </Button>
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                Ou{' '}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => handlePurchase(STRIPE_PRICES.PREMIUM_YEARLY, true)}
                  disabled={loading !== null}
                >
                  89€/an (2 mois offerts)
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <div className="bg-gradient-to-r from-violet-50 from-violet-950/30 dark:to-cyan-950/30 rounded-lg p-3 border border-violet-800">
            <div className="flex items-start gap-2">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-xs text-violet-200 mt-1 italic">
              "{TESTIMONIALS[0].text}"
            </p>
            <p className="text-[10px] text-violet-400 mt-1 font-medium">
              — {TESTIMONIALS[0].name}
            </p>
          </div>

          {/* Pay per use Option - Only show if not hidden */}
          {!content.hideUnitPurchase && (
            <Card>
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <CardTitle className="text-base sm:text-lg">À l'unité</CardTitle>
                </div>
                <div className="text-xl sm:text-2xl font-bold">
                  {content.unitPrice}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    {content.unitLabel}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    Pas d'abonnement
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  onClick={() => handlePurchase(content.priceId, false, content.productType)}
                  disabled={loading !== null}
                >
                  {loading === content.priceId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {content.unitButton}
                </Button>
              </CardContent>
            </Card>
          )}

          <button
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground w-full text-center py-2"
            onClick={handleClose}
          >
            Plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
