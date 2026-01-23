import { useState } from 'react'
import { Check, X, Zap, Star, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 border-b">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Link to={user ? '/app' : '/'}>
              <Button variant="ghost" size="sm" className="h-10 px-3">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Tarifs</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 pb-24">
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Plans MECAI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 dark:text-white">
              Choisis ton plan
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Commence gratuitement, passe Premium quand tu veux
            </p>
          </div>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-muted/50 rounded-2xl max-w-xs mx-auto">
            <span className={`text-sm ${yearly ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
              Mensuel
            </span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <div className="flex items-center gap-1">
              <span className={`text-sm ${yearly ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                Annuel
              </span>
              <Badge className="bg-green-500 text-white text-[10px] px-1.5">
                -25%
              </Badge>
            </div>
          </div>

          {/* Pricing Cards - Stack on mobile */}
          <div className="grid gap-6 max-w-lg mx-auto">

            {/* PREMIUM - First on mobile (recommended) */}
            <Card className="p-5 relative border-2 border-primary shadow-lg dark:bg-gray-800 order-first">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4">
                RECOMMANDÉ
              </Badge>

              <div className="flex items-center gap-4 mb-4 pt-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Star className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Premium</h3>
                  <p className="text-sm text-muted-foreground">Pour les passionnés</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold dark:text-white">
                  {yearly ? '89€' : '9,99€'}
                </span>
                <span className="text-muted-foreground">/{yearly ? 'an' : 'mois'}</span>
              </div>
              {yearly && (
                <p className="text-sm text-green-600 font-medium mb-4 -mt-2">
                  Soit 7,42€/mois - {PLANS.premium.yearlyDiscount}
                </p>
              )}

              {/* Features List */}
              <ul className="space-y-2.5 mb-6">
                {PLANS.premium.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleSubscribe}
                disabled={loading || isPremium}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Chargement...
                  </>
                ) : isPremium ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Déjà Premium
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Passer Premium
                  </>
                )}
              </Button>
            </Card>

            {/* FREE */}
            <Card className="p-5 relative dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <Zap className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Gratuit</h3>
                  <p className="text-sm text-muted-foreground">Pour découvrir</p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold dark:text-white">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>

              {/* Features - Included */}
              <ul className="space-y-2.5 mb-4">
                {PLANS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Features - Not Included */}
              <ul className="space-y-2.5 mb-6">
                {PLANS.free.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="line-through opacity-60">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                className="w-full h-12 text-base"
                disabled={!!user}
                onClick={() => !user && navigate('/register')}
              >
                {user ? 'Plan actuel' : 'Commencer gratuitement'}
              </Button>
            </Card>
          </div>

          {/* Comparison Table - Mobile Friendly */}
          <div className="mt-10">
            <h3 className="text-lg font-bold text-center mb-4 dark:text-white">
              Comparatif détaillé
            </h3>
            <Card className="overflow-hidden dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Fonctionnalité</th>
                      <th className="text-center p-3 font-medium">Gratuit</th>
                      <th className="text-center p-3 font-medium text-primary">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3">Diagnostics Pro</td>
                      <td className="p-3 text-center">2/mois</td>
                      <td className="p-3 text-center font-medium text-primary">Illimités</td>
                    </tr>
                    <tr>
                      <td className="p-3">Véhicules enregistrés</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-center font-medium text-primary">Illimités</td>
                    </tr>
                    <tr>
                      <td className="p-3">Chat mécanicien</td>
                      <td className="p-3 text-center">10 msg/jour</td>
                      <td className="p-3 text-center font-medium text-primary">Illimité 24/7</td>
                    </tr>
                    <tr>
                      <td className="p-3">Analyse de devis (anti-arnaque)</td>
                      <td className="p-3 text-center">1/mois</td>
                      <td className="p-3 text-center font-medium text-primary">Illimité</td>
                    </tr>
                    <tr>
                      <td className="p-3">Diagnostic vidéo IA</td>
                      <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-gray-400" /></td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr>
                      <td className="p-3">Prévision de pannes</td>
                      <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-gray-400" /></td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr>
                      <td className="p-3">Recherche de garage</td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr>
                      <td className="p-3">Recherche de pièces</td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr>
                      <td className="p-3">Historique diagnostics</td>
                      <td className="p-3 text-center">7 jours</td>
                      <td className="p-3 text-center font-medium text-primary">Illimité</td>
                    </tr>
                    <tr>
                      <td className="p-3">Export PDF</td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                      <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                    </tr>
                    <tr>
                      <td className="p-3">Support</td>
                      <td className="p-3 text-center">Standard</td>
                      <td className="p-3 text-center font-medium text-primary">Prioritaire</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 text-center">
            <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-full">
                💳 Paiement sécurisé
              </span>
              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-full">
                ✅ Annulation libre
              </span>
              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 rounded-full">
                🔒 Données chiffrées
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Une question ?{' '}
              <a href="mailto:contact@mymecai.com" className="text-primary hover:underline">
                contact@mymecai.com
              </a>
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Les Diagnostics Pro sont fournis à titre indicatif.
              Pour toute intervention mécanique, consultez un professionnel certifié.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
