import { useNavigate } from 'react-router-dom'
import { useUserLimits } from '@/hooks/useUserLimits'
import { Sparkles, AlertTriangle, Crown } from 'lucide-react'

interface PremiumDisclaimerProps {
  feature: 'diagnostic' | 'chat' | 'devis'
  className?: string
}

export function PremiumDisclaimer({ feature, className = '' }: PremiumDisclaimerProps) {
  const limits = useUserLimits()
  const navigate = useNavigate()

  // Si premium, ne rien afficher
  if (limits.isPremium) return null

  // Si loading, afficher un skeleton
  if (limits.loading) {
    return (
      <div className={`rounded-xl p-4 mb-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse ${className}`}>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>
    )
  }

  const featureConfig = {
    diagnostic: {
      current: limits.diagnosticsThisMonth,
      limit: limits.diagnosticsLimit,
      remaining: Math.max(0, limits.diagnosticsLimit - limits.diagnosticsThisMonth),
      name: 'diagnostics',
      period: 'ce mois',
      canUse: limits.canUseDiagnostic
    },
    chat: {
      current: limits.chatMessagesToday,
      limit: limits.chatLimit,
      remaining: Math.max(0, limits.chatLimit - limits.chatMessagesToday),
      name: 'messages',
      period: "aujourd'hui",
      canUse: limits.canUseChat
    },
    devis: {
      current: limits.devisAnalysesThisMonth,
      limit: limits.devisLimit,
      remaining: Math.max(0, limits.devisLimit - limits.devisAnalysesThisMonth),
      name: 'analyses de devis',
      period: 'ce mois',
      canUse: limits.canUseDevis
    }
  }

  const config = featureConfig[feature]

  return (
    <div className={`rounded-xl p-4 mb-4 ${
      config.canUse
        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
        : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'
    } ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {config.canUse ? (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            )}
            <h3 className="font-bold text-neutral-900 dark:text-white">
              {config.canUse ? 'Version Gratuite' : 'Limite Atteinte'}
            </h3>
          </div>

          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
            {config.canUse
              ? `Tu as utilisé ${config.current}/${config.limit} ${config.name} ${config.period}.`
              : `Tu as atteint la limite de ${config.limit} ${config.name} ${config.period}.`
            }
          </p>

          {!config.canUse && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Passe Premium pour un acces illimite !
            </p>
          )}

          <button
            onClick={() => navigate('/pricing')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
              config.canUse
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/25'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {config.canUse ? 'Voir Premium' : 'Passer Premium'}
          </button>
        </div>

        {config.canUse && (
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {config.remaining}/{config.limit}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">restants</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumDisclaimer
