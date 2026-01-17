import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as Profile, DiagnosticLimitStatus } from '@/types'

const FREE_DIAGNOSTICS_LIMIT = 2

export function useSubscription(profile: Profile | null) {
  const [loading, setLoading] = useState(false)

  const checkDiagnosticLimit = useCallback(async (): Promise<DiagnosticLimitStatus> => {
    if (!profile) {
      return { canDiagnose: false, remaining: 0, isPremium: false }
    }

    // Premium users have unlimited access
    if (profile.subscription_status === 'premium') {
      return { canDiagnose: true, remaining: Infinity, isPremium: true }
    }

    // Check if we need to reset the counter (new month)
    const resetDate = new Date(profile.free_diagnostics_reset_at)
    const now = new Date()
    const isDifferentMonth =
      resetDate.getMonth() !== now.getMonth() ||
      resetDate.getFullYear() !== now.getFullYear()

    if (isDifferentMonth) {
      // Reset counter in database
      await supabase
        .from('profiles')
        .update({
          free_diagnostics_used: 0,
          free_diagnostics_reset_at: now.toISOString(),
        })
        .eq('id', profile.id)

      return { canDiagnose: true, remaining: FREE_DIAGNOSTICS_LIMIT, isPremium: false }
    }

    const remaining = FREE_DIAGNOSTICS_LIMIT - profile.free_diagnostics_used
    return { canDiagnose: remaining > 0, remaining, isPremium: false }
  }, [profile])

  const incrementDiagnosticCount = useCallback(async () => {
    if (!profile) return

    // Don't increment for premium users
    if (profile.subscription_status === 'premium') return

    setLoading(true)
    try {
      await supabase
        .from('profiles')
        .update({
          free_diagnostics_used: profile.free_diagnostics_used + 1,
        })
        .eq('id', profile.id)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const addSingleDiagnostic = useCallback(async () => {
    // This is called after a pay-per-use purchase
    // We don't need to do anything here since the user
    // already paid for this specific diagnostic
    // The webhook will handle the database update if needed
  }, [])

  const isPremium = profile?.subscription_status === 'premium'
  const diagnosticsUsed = profile?.free_diagnostics_used ?? 0
  const diagnosticsRemaining = isPremium ? Infinity : Math.max(0, FREE_DIAGNOSTICS_LIMIT - diagnosticsUsed)

  return {
    loading,
    isPremium,
    diagnosticsUsed,
    diagnosticsRemaining,
    checkDiagnosticLimit,
    incrementDiagnosticCount,
    addSingleDiagnostic,
  }
}
