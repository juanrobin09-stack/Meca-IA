/**
 * UpgradeBanner - Banner subtil pour les promotions Premium
 *
 * Alternative non-intrusive au PaywallModal.
 * S'affiche en bas de l'écran et peut être fermé facilement.
 */

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
import { useAuth } from '@/hooks/useAuth'

interface UpgradeBannerProps {
  /** Message personnalisé à afficher */
  message?: string
  /** Afficher le banner */
  show: boolean
  /** Callback quand fermé */
  onClose: () => void
  /** Feature concernée (pour tracking) */
  feature?: 'diagnostic' | 'chat' | 'devis' | 'general'
}

export function UpgradeBanner({
  message = 'Passe Premium pour un accès illimité',
  show,
  onClose,
  feature = 'general'
}: UpgradeBannerProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // Animation d'entrée
  useEffect(() => {
    if (show) {
      // Petit délai pour l'animation
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [show])

  if (!show) return null

  const handleUpgrade = async () => {
    if (!user) return

    setLoading(true)
    try {
      await createCheckoutSession(STRIPE_PRICES.PREMIUM_MONTHLY, true, user.id)
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`
        fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
        bg-gradient-to-r from-indigo-600 to-purple-600
        text-white rounded-lg shadow-lg
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        z-50
      `}
    >
      <div className="p-4">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 bg-white/20 rounded-full shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {message}
            </p>
            <p className="text-xs text-white/80 mt-1">
              Diagnostics illimités, chat 24/7, et plus encore
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-white/90 text-xs h-8"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? 'Chargement...' : '9,99€/mois'}
              </Button>
              <button
                onClick={onClose}
                className="text-xs text-white/70 hover:text-white underline"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de feature pour tracking */}
      <span className="hidden" data-feature={feature} />
    </div>
  )
}

export default UpgradeBanner
