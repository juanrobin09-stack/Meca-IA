import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface UserLimitsState {
  diagnosticsThisMonth: number
  chatMessagesToday: number
  devisAnalysesThisMonth: number
  isPremium: boolean
  loading: boolean
}

interface UserLimits extends UserLimitsState {
  diagnosticsLimit: number
  chatLimit: number
  devisLimit: number
  canUseDiagnostic: boolean
  canUseChat: boolean
  canUseDevis: boolean
  refresh: () => Promise<void>
}

const FREE_DIAGNOSTICS_LIMIT = 2
const FREE_CHAT_LIMIT = 10
const FREE_DEVIS_LIMIT = 1

export function useUserLimits(): UserLimits {
  const [state, setState] = useState<UserLimitsState>({
    diagnosticsThisMonth: 0,
    chatMessagesToday: 0,
    devisAnalysesThisMonth: 0,
    isPremium: false,
    loading: true
  })

  const mountedRef = useRef(true)
  const loadingRef = useRef(false)

  const loadUsage = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, loading: false }))
        }
        loadingRef.current = false
        return
      }

      console.log('🔄 Chargement usage pour user:', user.id)

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Error loading profile:', profileError)
        if (mountedRef.current) {
          setState(prev => ({ ...prev, loading: false }))
        }
        loadingRef.current = false
        return
      }

      // Check premium status
      const isPremium = profile?.subscription_status === 'premium'

      // Get chat messages count for today (for free users)
      let chatMessagesToday = 0
      if (!isPremium) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('sender', 'user')
          .gte('created_at', startOfDay.toISOString())

        chatMessagesToday = count || 0
      }

      console.log('✅ Usage chargé:', {
        isPremium,
        diagnostics: profile?.free_diagnostics_used || 0,
        devis: profile?.free_devis_used || 0,
        chat: chatMessagesToday
      })

      if (mountedRef.current) {
        setState({
          diagnosticsThisMonth: profile?.free_diagnostics_used || 0,
          chatMessagesToday,
          devisAnalysesThisMonth: profile?.free_devis_used || 0,
          isPremium,
          loading: false
        })
      }
    } catch (error) {
      console.error('❌ Error loading usage:', error)
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }))
      }
    } finally {
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Chargement initial
    loadUsage()

    // Refresh toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh usage (30s interval)')
      loadUsage()
    }, 30000)

    // Refresh au focus de la fenêtre
    const handleFocus = () => {
      console.log('👀 Window focused, refreshing usage...')
      loadUsage()
    }
    window.addEventListener('focus', handleFocus)

    // Refresh on visibility change (quand l'onglet devient visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible, refreshing usage...')
        loadUsage()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      mountedRef.current = false
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadUsage])

  // Limites
  const diagnosticsLimit = state.isPremium ? 999999 : FREE_DIAGNOSTICS_LIMIT
  const chatLimit = state.isPremium ? 999999 : FREE_CHAT_LIMIT
  const devisLimit = state.isPremium ? 999999 : FREE_DEVIS_LIMIT

  // Remaining counts
  const diagnosticsRemaining = Math.max(0, diagnosticsLimit - state.diagnosticsThisMonth)
  const chatRemaining = Math.max(0, chatLimit - state.chatMessagesToday)
  const devisRemaining = Math.max(0, devisLimit - state.devisAnalysesThisMonth)

  return {
    ...state,
    diagnosticsLimit,
    chatLimit,
    devisLimit,
    canUseDiagnostic: state.isPremium || diagnosticsRemaining > 0,
    canUseChat: state.isPremium || chatRemaining > 0,
    canUseDevis: state.isPremium || devisRemaining > 0,
    refresh: loadUsage,
    loading: state.loading
  }
}
