import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as Profile, DiagnosticLimitStatus } from '@/types'

const FREE_DIAGNOSTICS_LIMIT = 2
const FREE_DEVIS_LIMIT = 1

export interface DevisLimitStatus {
  canAnalyze: boolean
  remaining: number
  isPremium: boolean
}

export function useSubscription(profile: Profile | null) {
  const [loading, setLoading] = useState(false)

  // Fetch fresh profile data from database
  const getFreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!profile?.id) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single()

    if (error) {
      console.error('Error fetching fresh profile:', error)
      return null
    }

    return data as Profile
  }, [profile?.id])

  const checkDiagnosticLimit = useCallback(async (): Promise<DiagnosticLimitStatus> => {
    if (!profile) {
      return { canDiagnose: false, remaining: 0, isPremium: false }
    }

    // Get fresh data from database
    const freshProfile = await getFreshProfile()
    if (!freshProfile) {
      return { canDiagnose: false, remaining: 0, isPremium: false }
    }

    // Premium users have unlimited access
    if (freshProfile.subscription_status === 'premium') {
      return { canDiagnose: true, remaining: Infinity, isPremium: true }
    }

    // Check if we need to reset the counter (new month)
    const resetDate = new Date(freshProfile.free_diagnostics_reset_at)
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
          free_devis_used: 0,
          free_diagnostics_reset_at: now.toISOString(),
        })
        .eq('id', freshProfile.id)

      return { canDiagnose: true, remaining: FREE_DIAGNOSTICS_LIMIT, isPremium: false }
    }

    const remaining = FREE_DIAGNOSTICS_LIMIT - freshProfile.free_diagnostics_used
    console.log('[useSubscription] checkDiagnosticLimit:', {
      used: freshProfile.free_diagnostics_used,
      remaining,
      canDiagnose: remaining > 0
    })
    return { canDiagnose: remaining > 0, remaining, isPremium: false }
  }, [profile, getFreshProfile])

  const checkDevisLimit = useCallback(async (): Promise<DevisLimitStatus> => {
    if (!profile) {
      return { canAnalyze: false, remaining: 0, isPremium: false }
    }

    // Get fresh data from database
    const freshProfile = await getFreshProfile()
    if (!freshProfile) {
      return { canAnalyze: false, remaining: 0, isPremium: false }
    }

    // Premium users have unlimited access
    if (freshProfile.subscription_status === 'premium') {
      return { canAnalyze: true, remaining: Infinity, isPremium: true }
    }

    // Check if we need to reset the counter (new month)
    const resetDate = new Date(freshProfile.free_diagnostics_reset_at)
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
          free_devis_used: 0,
          free_diagnostics_reset_at: now.toISOString(),
        })
        .eq('id', freshProfile.id)

      return { canAnalyze: true, remaining: FREE_DEVIS_LIMIT, isPremium: false }
    }

    const devisUsed = freshProfile.free_devis_used ?? 0
    const remaining = FREE_DEVIS_LIMIT - devisUsed
    console.log('[useSubscription] checkDevisLimit:', {
      used: devisUsed,
      remaining,
      canAnalyze: remaining > 0
    })
    return { canAnalyze: remaining > 0, remaining, isPremium: false }
  }, [profile, getFreshProfile])

  const incrementDiagnosticCount = useCallback(async (): Promise<boolean> => {
    if (!profile?.id) return false

    // Get fresh profile first to check current status
    const freshProfile = await getFreshProfile()
    if (!freshProfile) return false

    // Don't increment for premium users
    if (freshProfile.subscription_status === 'premium') return true

    setLoading(true)
    try {
      // Use SQL increment to avoid race conditions and stale data issues
      // This increments the value directly in the database
      const newCount = freshProfile.free_diagnostics_used + 1

      const { error } = await supabase
        .from('profiles')
        .update({
          free_diagnostics_used: newCount,
        })
        .eq('id', profile.id)

      if (error) {
        console.error('[useSubscription] Error incrementing counter:', error)
        return false
      }

      console.log('[useSubscription] Counter incremented to:', newCount)
      return true
    } finally {
      setLoading(false)
    }
  }, [profile?.id, getFreshProfile])

  const incrementDevisCount = useCallback(async (): Promise<boolean> => {
    if (!profile?.id) return false

    // Get fresh profile first to check current status
    const freshProfile = await getFreshProfile()
    if (!freshProfile) return false

    // Don't increment for premium users
    if (freshProfile.subscription_status === 'premium') return true

    setLoading(true)
    try {
      const currentCount = freshProfile.free_devis_used ?? 0
      const newCount = currentCount + 1

      const { error } = await supabase
        .from('profiles')
        .update({
          free_devis_used: newCount,
        })
        .eq('id', profile.id)

      if (error) {
        console.error('[useSubscription] Error incrementing devis counter:', error)
        return false
      }

      console.log('[useSubscription] Devis counter incremented to:', newCount)
      return true
    } finally {
      setLoading(false)
    }
  }, [profile?.id, getFreshProfile])

  const addSingleDiagnostic = useCallback(async () => {
    // This is called after a pay-per-use purchase
    // We don't need to do anything here since the user
    // already paid for this specific diagnostic
    // The webhook will handle the database update if needed
  }, [])

  const isPremium = profile?.subscription_status === 'premium'
  const diagnosticsUsed = profile?.free_diagnostics_used ?? 0
  const diagnosticsRemaining = isPremium ? Infinity : Math.max(0, FREE_DIAGNOSTICS_LIMIT - diagnosticsUsed)
  const devisUsed = profile?.free_devis_used ?? 0
  const devisRemaining = isPremium ? Infinity : Math.max(0, FREE_DEVIS_LIMIT - devisUsed)

  return {
    loading,
    isPremium,
    diagnosticsUsed,
    diagnosticsRemaining,
    devisUsed,
    devisRemaining,
    checkDiagnosticLimit,
    checkDevisLimit,
    incrementDiagnosticCount,
    incrementDevisCount,
    addSingleDiagnostic,
    getFreshProfile,
  }
}
