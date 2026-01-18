import { useState } from 'react'
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
import { Loader2, Sparkles, CheckCircle2, CreditCard } from 'lucide-react'

type PaywallMode = 'diagnostic' | 'devis' | 'video' | 'prevision' | 'chat' | 'vehicle'

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: PaywallMode
  title?: string
  subtitle?: string
}

const defaultContent: Record<PaywallMode, {
  title: string
  subtitle: string
  unitLabel: string
  unitButton: string
  unitPrice: string
  priceId: string
  productType: ProductType
  features: string[]
}> = {
  diagnostic: {
    title: 'Tes 2 diagnostics gratuits sont épuisés',
    subtitle: 'Passe Premium pour des diagnostics illimités et un suivi complet de ta voiture.',
    unitLabel: '1 diagnostic immédiat',
    unitButton: 'Acheter 1 diagnostic',
    unitPrice: '2.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
    productType: 'diagnostic',
    features: [
      'Diagnostics IA illimités',
      'Diagnostic vidéo IA',
      'Analyseur de devis (anti-arnaque)',
      'Prévision de pannes',
      'Chat mécanicien 24/7',
      'Véhicules illimités',
    ],
  },
  devis: {
    title: 'Tu as utilisé ton analyse gratuite ce mois',
    subtitle: 'Passe Premium pour analyser tous tes devis en illimité.',
    unitLabel: '1 analyse de devis',
    unitButton: 'Acheter 1 analyse',
    unitPrice: '1.99€',
    priceId: STRIPE_PRICES.PAY_PER_DEVIS,
    productType: 'devis',
    features: [
      'Analyses de devis illimitées',
      'Détection arnaques automatique',
      'Diagnostics IA illimités',
      'Chat mécanicien 24/7',
      'Support prioritaire',
    ],
  },
  video: {
    title: '🎥 Diagnostic Vidéo Premium',
    subtitle: "Le diagnostic vidéo est une fonctionnalité Premium. L'IA analyse tes vidéos pour un diagnostic ultra-précis !",
    unitLabel: '1 diagnostic vidéo',
    unitButton: 'Acheter 1 analyse',
    unitPrice: '4.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
    productType: 'video',
    features: [
      'Diagnostic vidéo illimité',
      'Analyse audio + visuelle',
      'Diagnostics IA illimités',
      'Prévision de pannes',
      'Chat mécanicien 24/7',
    ],
  },
  prevision: {
    title: '🔮 Prévision de Pannes Premium',
    subtitle: "Anticipe les réparations de ton véhicule grâce à l'IA prédictive.",
    unitLabel: '1 analyse prédictive',
    unitButton: 'Acheter 1 prévision',
    unitPrice: '3.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
    productType: 'diagnostic',
    features: [
      'Prévision de pannes illimitée',
      'Budget annuel estimé',
      'Alertes préventives',
      'Diagnostics IA illimités',
      'Historique complet',
    ],
  },
  chat: {
    title: '💬 Limite quotidienne atteinte',
    subtitle: 'Tu as utilisé tes 10 messages gratuits aujourd\'hui. Reviens demain ou passe Premium pour un accès illimité 24/7 !',
    unitLabel: '10 messages supplémentaires',
    unitButton: 'Acheter 10 messages',
    unitPrice: '2.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
    productType: 'chat',
    features: [
      'Chat mécanicien 24/7 illimité',
      'Contexte véhicule automatique',
      'Diagnostics IA illimités',
      'Diagnostic vidéo IA',
      'Sans limite quotidienne',
    ],
  },
  vehicle: {
    title: '🚗 Limite de véhicules atteinte',
    subtitle: 'Tu as atteint la limite de 1 véhicule gratuit. Passe Premium pour enregistrer tous tes véhicules !',
    unitLabel: '1 véhicule supplémentaire',
    unitButton: 'Acheter 1 slot',
    unitPrice: '1.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
    productType: 'diagnostic',
    features: [
      'Véhicules illimités',
      'Prévision de pannes par véhicule',
      'Historique par véhicule',
      'Diagnostics contextuels',
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
}: PaywallModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const content = defaultContent[mode]
  const displayTitle = title || content.title
  const displaySubtitle = subtitle || content.subtitle

  async function handlePurchase(priceId: string, isSubscription: boolean, productType?: ProductType) {
    if (!user) return

    setLoading(priceId)
    try {
      await createCheckoutSession(priceId, isSubscription, user.id, undefined, productType)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur lors du paiement. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {/* Premium Option */}
          <Card className="border-primary ring-2 ring-primary">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                <CardTitle className="text-base sm:text-lg">Premium</CardTitle>
                <span className="text-[10px] sm:text-xs bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 rounded-full ml-auto">
                  Recommandé
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                9,99€<span className="text-xs sm:text-sm font-normal text-muted-foreground">/mois</span>
              </div>
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
                className="w-full text-sm sm:text-base"
                onClick={() => handlePurchase(STRIPE_PRICES.PREMIUM_MONTHLY, true)}
                disabled={loading !== null}
              >
                {loading === STRIPE_PRICES.PREMIUM_MONTHLY ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Passer Premium
              </Button>
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                Ou{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => handlePurchase(STRIPE_PRICES.PREMIUM_YEARLY, true)}
                  disabled={loading !== null}
                >
                  89€/an (2 mois offerts)
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Pay per use Option */}
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

          <button
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground w-full text-center py-2"
            onClick={() => onOpenChange(false)}
          >
            Plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
