import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
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

type PaywallMode = 'diagnostic' | 'devis'

interface PaywallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: PaywallMode
  title?: string
  subtitle?: string
}

const defaultContent = {
  diagnostic: {
    title: 'Tes 2 diagnostics gratuits sont épuisés',
    subtitle: 'Passe Premium pour comprendre ta voiture et prendre les bonnes décisions avant chaque visite au garage !',
    unitLabel: '1 diagnostic immédiat',
    unitButton: 'Acheter 1 diagnostic',
    unitPrice: '2.99€',
    priceId: STRIPE_PRICES.PAY_PER_USE,
  },
  devis: {
    title: 'Tu as utilisé ton analyse gratuite ce mois',
    subtitle: 'Passe Premium pour analyser tous tes devis et ne plus te faire avoir !',
    unitLabel: '1 analyse de devis',
    unitButton: 'Acheter 1 analyse',
    unitPrice: '1.99€',
    priceId: STRIPE_PRICES.PAY_PER_DEVIS,
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

  async function handlePurchase(priceId: string, isSubscription: boolean) {
    if (!user) return

    setLoading(priceId)
    try {
      await createCheckoutSession(priceId, isSubscription, user.id)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur lors du paiement. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {displayTitle}
          </DialogTitle>
          <DialogDescription className="text-center">
            {displaySubtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Premium Option */}
          <Card className="border-primary ring-2 ring-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Premium</CardTitle>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto">
                  Recommandé
                </span>
              </div>
              <div className="text-2xl font-bold">
                9.99€<span className="text-sm font-normal text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Diagnostics illimités
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Analyses de devis illimitées
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Historique permanent
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Support prioritaire
                </li>
              </ul>
              <Button
                className="w-full"
                onClick={() => handlePurchase(STRIPE_PRICES.PREMIUM_MONTHLY, true)}
                disabled={loading !== null}
              >
                {loading === STRIPE_PRICES.PREMIUM_MONTHLY ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Passer Premium
              </Button>
              <p className="text-xs text-center text-muted-foreground">
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
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">À l'unité</CardTitle>
              </div>
              <div className="text-2xl font-bold">
                {content.unitPrice}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {content.unitLabel}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pas d'abonnement
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handlePurchase(content.priceId, false)}
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
            className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
            onClick={() => onOpenChange(false)}
          >
            Plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
