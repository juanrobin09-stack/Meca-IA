import { useUserLimits } from '@/hooks/useUserLimits'
import { Sparkles } from 'lucide-react'

interface PremiumBadgeProps {
  className?: string
  showLoading?: boolean
}

export function PremiumBadge({ className = '', showLoading = false }: PremiumBadgeProps) {
  const limits = useUserLimits()

  // Si loading et showLoading est false, ne rien afficher
  if (limits.loading && !showLoading) return null

  // Si loading et showLoading est true, afficher un skeleton
  if (limits.loading && showLoading) {
    return (
      <div className={`h-7 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse ${className}`}></div>
    )
  }

  // Si pas premium, ne rien afficher
  if (!limits.isPremium) return null

  return (
    <div className={`group relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/30 dark:border-amber-400/30 ${className}`}>
      <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold tracking-wide">PREMIUM</span>
    </div>
  )
}

export default PremiumBadge
