import { useUserLimits } from '@/hooks/useUserLimits'
import { Crown } from 'lucide-react'

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
      <div className={`h-6 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse ${className}`}></div>
    )
  }

  // Si pas premium, ne rien afficher
  if (!limits.isPremium) return null

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 rounded-full shadow-lg shadow-pink-500/25 ${className}`}>
      <Crown className="w-3.5 h-3.5 text-white" />
      <span className="text-white text-xs font-bold tracking-wide">PREMIUM</span>
    </div>
  )
}

export default PremiumBadge
