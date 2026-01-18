import { useState } from 'react'
import { Check, X, Zap, Star, ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/config/plans'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
import PageTransition from '@/components/PageTransition'

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)

  const handleSubscribe = async () => {
    // Check if user is logged in
    if (!user) {
      navigate(`/login?redirect=/pricing&plan=${yearly ? 'yearly' : 'monthly'}`)
      return
    }

    // Check if already premium
    if (isPremium) {
      navigate('/app/settings')
      return
    }

    setLoading(true)
    try {
      const priceId = yearly ? STRIPE_PRICES.PREMIUM_YEARLY : STRIPE_PRICES.PREMIUM_MONTHLY
      await createCheckoutSession(priceId, true, user.id)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur lors de la création de la session de paiement. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 dark:text-white">
              Choisis ton plan MECAI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Commence gratuitement, upgrade quand tu veux
            </p>

            {/* Toggle Mensuel/Annuel */}
            <div className="flex items-center justify-center gap-4">
              <span className={`${yearly ? 'text-gray-500' : 'font-semibold'} dark:text-gray-300`}>Mensuel</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={`${yearly ? 'font-semibold' : 'text-gray-500'} dark:text-gray-300`}>
                Annuel
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  -25%
                </Badge>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">

            {/* FREE */}
            <Card className="p-8 relative dark:bg-gray-800 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Gratuit</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pour découvrir</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold dark:text-white">0€</span>
                <span className="text-gray-500 dark:text-gray-400">/mois</span>
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {PLANS.free.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" disabled={!!user}>
                {user ? 'Plan actuel' : 'Commencer'}
              </Button>
            </Card>

            {/* PREMIUM */}
            <Card className="p-8 relative border-2 border-blue-500 shadow-lg dark:bg-gray-800">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                RECOMMANDÉ
              </Badge>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Premium</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Diagnostics illimités</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold dark:text-white">
                  {yearly ? '89€' : '9,99€'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/{yearly ? 'an' : 'mois'}</span>
                {yearly && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    {PLANS.premium.yearlyDiscount}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.premium.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSubscribe}
                disabled={loading || isPremium}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Chargement...
                  </>
                ) : isPremium ? (
                  'Déjà Premium'
                ) : (
                  'Passer Premium'
                )}
              </Button>
            </Card>
          </div>

          {/* FAQ / Trust */}
          <div className="mt-16 text-center">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <span className="flex items-center gap-1">💳 Paiement sécurisé</span>
              <span className="flex items-center gap-1">✅ Annulation à tout moment</span>
              <span className="flex items-center gap-1">🔒 Données chiffrées</span>
              <span className="flex items-center gap-1">💯 Satisfait ou remboursé 14 jours</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Une question ?{' '}
              <a href="mailto:contact@mymecai.com" className="text-blue-600 hover:underline">
                contact@mymecai.com
              </a>
            </p>
            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              ⚠️ Les diagnostics IA sont fournis à titre indicatif.
              Pour toute intervention mécanique, consultez un professionnel certifié.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
