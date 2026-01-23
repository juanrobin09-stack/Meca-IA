import { useNavigate } from 'react-router-dom'
import { useUserLimits } from '@/hooks/useUserLimits'
import { Sparkles, AlertTriangle } from 'lucide-react'

interface PremiumDisclaimerProps {
  feature: 'diagnostic' | 'chat' | 'devis'
  className?: string
}

export function PremiumDisclaimer({ feature, className = '' }: PremiumDisclaimerProps) {
  const limits = useUserLimits()
  const navigate = useNavigate()

  // Si premium ou loading, ne rien afficher
  if (limits.isPremium || limits.loading) return null

  const featureConfig = {
    diagnostic: {
      limit: limits.diagnosticsLimit,
      name: 'diagnostics',
      period: 'ce mois',
      canUse: limits.canUseDiagnostic
    },
    chat: {
      limit: limits.chatLimit,
      name: 'messages',
      period: "aujourd'hui",
      canUse: limits.canUseChat
    },
    devis: {
      limit: limits.devisLimit,
      name: 'analyses de devis',
      period: 'ce mois',
      canUse: limits.canUseDevis
    }
  }

  const config = featureConfig[feature]

  // Ne rien afficher si l'utilisateur peut encore utiliser la fonctionnalité
  if (config.canUse) return null

  return (
    <div className={`rounded-xl p-4 mb-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-white">
              Limite Atteinte
            </h3>
          </div>

          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
            Tu as atteint la limite de {config.limit} {config.name} {config.period}.
          </p>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Passe Premium pour un acces illimite !
          </p>

          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/25"
          >
            <Sparkles className="w-4 h-4" />
            Passer Premium
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumDisclaimer
