import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as Profile, DiagnosticLimitStatus } from '@/types'

const FREE_DIAGNOSTICS_LIMIT = 2
const FREE_DEVIS_LIMIT = 1

export interface DevisLimitStatus {
  canAnalyze: boolean
  remaining: number
  isPremium: boolean
  purchasedCredits?: number
}

export interface ExtendedDiagnosticLimitStatus extends DiagnosticLimitStatus {
  purchasedCredits?: number
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

  const checkDiagnosticLimit = useCallback(async (): Promise<ExtendedDiagnosticLimitStatus> => {
    if (!profile) {
      return { canDiagnose: false, remaining: 0, isPremium: false, purchasedCredits: 0 }
    }

    // Get fresh data from database
    const freshProfile = await getFreshProfile()
    if (!freshProfile) {
      return { canDiagnose: false, remaining: 0, isPremium: false, purchasedCredits: 0 }
    }

    // Premium users have unlimited access
    if (freshProfile.subscription_status === 'premium') {
      return { canDiagnose: true, remaining: Infinity, isPremium: true, purchasedCredits: 0 }
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

      return {
        canDiagnose: true,
        remaining: FREE_DIAGNOSTICS_LIMIT,
        isPremium: false,
        purchasedCredits: freshProfile.purchased_diagnostic_credits || 0
      }
    }

    const freeRemaining = FREE_DIAGNOSTICS_LIMIT - freshProfile.free_diagnostics_used
    const purchasedCredits = freshProfile.purchased_diagnostic_credits || 0

    // User can diagnose if they have free diagnostics OR purchased credits
    const canDiagnose = freeRemaining > 0 || purchasedCredits > 0

    console.log('[useSubscription] checkDiagnosticLimit:', {
      used: freshProfile.free_diagnostics_used,
      freeRemaining,
      purchasedCredits,
      canDiagnose
    })

    return {
      canDiagnose,
      remaining: freeRemaining,
      isPremium: false,
      purchasedCredits
    }
  }, [profile, getFreshProfile])

  const checkDevisLimit = useCallback(async (): Promise<DevisLimitStatus> => {
    if (!profile) {
      return { canAnalyze: false, remaining: 0, isPremium: false, purchasedCredits: 0 }
    }

    // Get fresh data from database
    const freshProfile = await getFreshProfile()
    if (!freshProfile) {
      return { canAnalyze: false, remaining: 0, isPremium: false, purchasedCredits: 0 }
    }

    // Premium users have unlimited access
    if (freshProfile.subscription_status === 'premium') {
      return { canAnalyze: true, remaining: Infinity, isPremium: true, purchasedCredits: 0 }
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

      return {
        canAnalyze: true,
        remaining: FREE_DEVIS_LIMIT,
        isPremium: false,
        purchasedCredits: freshProfile.purchased_devis_credits || 0
      }
    }

    const devisUsed = freshProfile.free_devis_used ?? 0
    const freeRemaining = FREE_DEVIS_LIMIT - devisUsed
    const purchasedCredits = freshProfile.purchased_devis_credits || 0

    // User can analyze if they have free devis OR purchased credits
    const canAnalyze = freeRemaining > 0 || purchasedCredits > 0

    console.log('[useSubscription] checkDevisLimit:', {
      used: devisUsed,
      freeRemaining,
      purchasedCredits,
      canAnalyze
    })

    return {
      canAnalyze,
      remaining: freeRemaining,
      isPremium: false,
      purchasedCredits
    }
  }, [profile, getFreshProfile])

  const incrementDiagnosticCount = useCallback(async (): Promise<boolean> => {
    if (!profile?.id) return false

    // Get fresh profile first to check current status
    const freshProfile = await getFreshProfile()
    if (!freshProfile) return false

    // Don't increment for premium users
    if (freshProfile.subscription_status === 'premium') return true

    const freeRemaining = FREE_DIAGNOSTICS_LIMIT - (freshProfile.free_diagnostics_used || 0)
    const purchasedCredits = freshProfile.purchased_diagnostic_credits || 0

    setLoading(true)
    try {
      // If no free diagnostics left, use purchased credit
      if (freeRemaining <= 0 && purchasedCredits > 0) {
        console.log('[useSubscription] Using purchased diagnostic credit')
        const { data, error } = await supabase.rpc('use_diagnostic_credit', {
          p_user_id: profile.id,
        })

        if (error) {
          console.error('[useSubscription] Error using purchased credit:', error)
          // Fallback to direct update
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ purchased_diagnostic_credits: purchasedCredits - 1 })
            .eq('id', profile.id)

          if (updateError) {
            console.error('[useSubscription] Fallback also failed:', updateError)
            return false
          }
        }

        console.log('[useSubscription] Used purchased credit, remaining:', data ?? (purchasedCredits - 1))
        return true
      }

      // Otherwise, increment free diagnostic counter
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

    const freeRemaining = FREE_DEVIS_LIMIT - (freshProfile.free_devis_used || 0)
    const purchasedCredits = freshProfile.purchased_devis_credits || 0

    setLoading(true)
    try {
      // If no free devis left, use purchased credit
      if (freeRemaining <= 0 && purchasedCredits > 0) {
        console.log('[useSubscription] Using purchased devis credit')
        const { data, error } = await supabase.rpc('use_devis_credit', {
          p_user_id: profile.id,
        })

        if (error) {
          console.error('[useSubscription] Error using purchased credit:', error)
          // Fallback to direct update
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ purchased_devis_credits: purchasedCredits - 1 })
            .eq('id', profile.id)

          if (updateError) {
            console.error('[useSubscription] Fallback also failed:', updateError)
            return false
          }
        }

        console.log('[useSubscription] Used purchased devis credit, remaining:', data ?? (purchasedCredits - 1))
        return true
      }

      // Otherwise, increment free devis counter
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
  const purchasedDiagnosticCredits = (profile as any)?.purchased_diagnostic_credits ?? 0
  const devisUsed = profile?.free_devis_used ?? 0
  const devisRemaining = isPremium ? Infinity : Math.max(0, FREE_DEVIS_LIMIT - devisUsed)
  const purchasedDevisCredits = (profile as any)?.purchased_devis_credits ?? 0

  return {
    loading,
    isPremium,
    diagnosticsUsed,
    diagnosticsRemaining,
    purchasedDiagnosticCredits,
    devisUsed,
    devisRemaining,
    purchasedDevisCredits,
    checkDiagnosticLimit,
    checkDevisLimit,
    incrementDiagnosticCount,
    incrementDevisCount,
    addSingleDiagnostic,
    getFreshProfile,
  }
}
