import { useState } from 'react'
import { Check, X, Zap, User, Briefcase, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/config/plans'
import { useAuth } from '@/hooks/useAuth'
import PageTransition from '@/components/PageTransition'

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const { user } = useAuth()

  const handleSubscribe = async (planId: 'premium' | 'pro') => {
    const plan = PLANS[planId]
    const priceId = yearly ? plan.stripePriceYearly : plan.stripePriceMonthly

    // TODO: Integrate with Stripe checkout
    console.log('Subscribe to:', planId, 'Price ID:', priceId)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 dark:text-white">
              Choisis ton plan MecaIA
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
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            {/* FREE */}
            <Card className="p-8 relative dark:bg-gray-800 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Gratuit</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pour decouvrir</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold dark:text-white">0EUR</span>
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
                POPULAIRE
              </Badge>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Premium 👤</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pour les particuliers</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold dark:text-white">
                  {yearly ? '89EUR' : '9.99EUR'}
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
                {PLANS.premium.notIncluded.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSubscribe('premium')}
              >
                Passer Premium
              </Button>
            </Card>

            {/* PRO */}
            <Card className="p-8 relative bg-gradient-to-b from-gray-900 to-gray-800 text-white border-0">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black">
                ENTREPRISE
              </Badge>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">Pro 👔</h3>
                <p className="text-gray-400 text-sm">Pour les professionnels</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold">
                  {yearly ? '249EUR' : '29.99EUR'}
                </span>
                <span className="text-gray-400">/{yearly ? 'an' : 'mois'}</span>
                {yearly && (
                  <p className="text-sm text-amber-400 font-medium mt-1">
                    {PLANS.pro.yearlyDiscount}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {PLANS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => handleSubscribe('pro')}
              >
                Passer Pro
              </Button>
            </Card>
          </div>

          {/* FAQ / Trust */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Sans engagement - Annulation en 1 clic - Paiement securise Stripe
            </p>
            <p className="text-sm text-gray-400">
              Une question ?{' '}
              <a href="mailto:contact@mecaia.fr" className="text-blue-600 hover:underline">
                contact@mecaia.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
