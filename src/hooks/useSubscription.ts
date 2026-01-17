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
      // Use atomic RPC function to avoid race conditions
      // This ensures the counter is incremented correctly even with concurrent requests
      const { data, error } = await supabase.rpc('increment_diagnostic_count', {
        p_user_id: profile.id,
      })

      if (error) {
        console.error('[useSubscription] RPC error, using fallback:', error)
        // Fallback to direct update if RPC not available (for backwards compatibility)
        const newCount = (freshProfile.free_diagnostics_used || 0) + 1
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ free_diagnostics_used: newCount })
          .eq('id', profile.id)

        if (updateError) {
          console.error('[useSubscription] Fallback update also failed:', updateError)
          return false
        }
        console.log('[useSubscription] Counter incremented (fallback) to:', newCount)
        return true
      }

      console.log('[useSubscription] Counter incremented atomically to:', data)
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
      // Use atomic RPC function to avoid race conditions
      const { data, error } = await supabase.rpc('increment_devis_count', {
        p_user_id: profile.id,
      })

      if (error) {
        console.error('[useSubscription] RPC error, using fallback:', error)
        // Fallback to direct update
        const newCount = (freshProfile.free_devis_used || 0) + 1
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ free_devis_used: newCount })
          .eq('id', profile.id)

        if (updateError) {
          console.error('[useSubscription] Fallback update also failed:', updateError)
          return false
        }
        console.log('[useSubscription] Devis counter incremented (fallback) to:', newCount)
        return true
      }

      console.log('[useSubscription] Devis counter incremented atomically to:', data)
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
