import { useUserLimits } from '@/hooks/useUserLimits'
import { Sparkles } from 'lucide-react'

interface PremiumBadgeProps {
  className?: string
  showLoading?: boolean
}

export function PremiumBadge({ className = '', showLoading = false }: PremiumBadgeProps) {
  const limits = useUserLimits()

  if (limits.loading && !showLoading) return null

  if (limits.loading && showLoading) {
    return (
      <div className={`h-7 w-16 bg-muted rounded-lg animate-pulse ${className}`}></div>
    )
  }

  if (!limits.isPremium) return null

  return (
    <div className={`group relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/15 from-violet-500/20 dark:to-cyan-500/20 border border-violet-400/30 ${className}`}>
      <Sparkles className="w-3 h-3 text-violet-400" />
      <span className="text-violet-400 text-[11px] font-semibold tracking-wide">PREMIUM</span>
    </div>
  )
}

export default PremiumBadge
