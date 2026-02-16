/**
 * UsageLimitIndicator - Affiche les limites d'utilisation de manière subtile
 *
 * Composant non-intrusif qui montre à l'utilisateur ses limites restantes
 * sans bloquer son workflow avec des modals.
 */

import { Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UsageLimitIndicatorProps {
  /** Nombre utilisé */
  used: number
  /** Limite totale */
  limit: number
  /** Label du type (ex: "diagnostics", "messages") */
  label: string
  /** Période (ex: "ce mois", "aujourd'hui") */
  period?: string
  /** Taille du composant */
  size?: 'sm' | 'md'
  /** Afficher même si premium */
  showIfPremium?: boolean
  /** Est premium */
  isPremium?: boolean
  /** Callback quand on clique pour upgrade */
  onUpgradeClick?: () => void
  /** Classe CSS additionnelle */
  className?: string
}

export function UsageLimitIndicator({
  used,
  limit,
  label,
  period = 'ce mois',
  size = 'sm',
  showIfPremium = false,
  isPremium = false,
  onUpgradeClick,
  className
}: UsageLimitIndicatorProps) {
  // Ne pas afficher pour les utilisateurs premium (sauf si demandé)
  if (isPremium && !showIfPremium) {
    return null
  }

  const remaining = Math.max(0, limit - used)
  const percentage = (used / limit) * 100
  const isLow = remaining <= 1
  const isEmpty = remaining === 0

  // Couleurs selon l'état
  const getStatusColor = () => {
    if (isEmpty) return 'text-red-500'
    if (isLow) return 'text-amber-500'
    return 'text-muted-foreground'
  }

  const getBgColor = () => {
    if (isEmpty) return 'bg-red-500/10'
    if (isLow) return 'bg-amber-500/10'
    return 'bg-muted/50'
  }

  const getBarColor = () => {
    if (isEmpty) return 'bg-red-500'
    if (isLow) return 'bg-amber-500'
    return 'bg-primary'
  }

  if (size === 'sm') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
          getBgColor(),
          getStatusColor(),
          className
        )}
      >
        {isEmpty ? (
          <>
            <Info className="h-3 w-3" />
            <span>0 {label} restant</span>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="ml-1 text-primary hover:underline"
              >
                <Sparkles className="h-3 w-3 inline mr-0.5" />
                Passer Premium
              </button>
            )}
          </>
        ) : (
          <>
            <span>{remaining}/{limit} {label}</span>
            {isLow && onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="ml-1 text-primary hover:underline"
              >
                <Sparkles className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // Version md plus détaillée
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={getStatusColor()}>
          {remaining} {label} restants {period}
        </span>
        {isEmpty && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Passer Premium
          </button>
        )}
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', getBarColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isLow && !isEmpty && (
        <p className="text-xs text-muted-foreground">
          Il te reste {remaining} {label}. {onUpgradeClick && (
            <button onClick={onUpgradeClick} className="text-primary hover:underline">
              Passe Premium
            </button>
          )} pour un accès illimité.
        </p>
      )}
    </div>
  )
}

export default UsageLimitIndicator
