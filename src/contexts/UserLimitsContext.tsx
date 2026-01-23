import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface UserLimitsState {
  diagnosticsThisMonth: number
  chatMessagesToday: number
  devisAnalysesThisMonth: number
  isPremium: boolean
  initialLoading: boolean // Only true on first load
  refreshing: boolean // True during background refresh (doesn't cause UI changes)
}

interface UserLimits extends UserLimitsState {
  diagnosticsLimit: number
  chatLimit: number
  devisLimit: number
  canUseDiagnostic: boolean
  canUseChat: boolean
  canUseDevis: boolean
  refresh: () => Promise<void>
  loading: boolean // For backwards compatibility (same as initialLoading)
}

const FREE_DIAGNOSTICS_LIMIT = 2
const FREE_CHAT_LIMIT = 10
const FREE_DEVIS_LIMIT = 1

const CACHE_KEY = 'mecaia_user_limits_cache'

interface CachedState {
  isPremium: boolean
  diagnosticsThisMonth: number
  devisAnalysesThisMonth: number
  timestamp: number
}

function getCachedState(): CachedState | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached) as CachedState
      // Cache valid for 5 minutes
      if (Date.now() - data.timestamp < 5 * 60 * 1000) {
        return data
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null
}

function setCachedState(state: Omit<CachedState, 'timestamp'>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }))
  } catch {
    // Ignore cache errors
  }
}

const defaultState: UserLimitsState = {
  diagnosticsThisMonth: 0,
  chatMessagesToday: 0,
  devisAnalysesThisMonth: 0,
  isPremium: false,
  initialLoading: true,
  refreshing: false
}

// Initialize from cache to prevent flash
function getInitialState(): UserLimitsState {
  const cached = getCachedState()
  if (cached) {
    return {
      ...defaultState,
      isPremium: cached.isPremium,
      diagnosticsThisMonth: cached.diagnosticsThisMonth,
      devisAnalysesThisMonth: cached.devisAnalysesThisMonth,
      initialLoading: true // Still need to verify with server
    }
  }
  return defaultState
}

const UserLimitsContext = createContext<UserLimits | null>(null)

export function UserLimitsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserLimitsState>(getInitialState)

  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  const hasLoadedOnceRef = useRef(false)

  const loadUsage = useCallback(async (isInitial = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) return
    loadingRef.current = true

    // Only set refreshing if not initial load and we've loaded before
    if (!isInitial && hasLoadedOnceRef.current) {
      // Don't set refreshing state to avoid UI flicker
      // The refresh happens silently in the background
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            initialLoading: false,
            refreshing: false
          }))
        }
        loadingRef.current = false
        return
      }

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Error loading profile:', profileError)
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            initialLoading: false,
            refreshing: false
          }))
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

      const newState = {
        diagnosticsThisMonth: profile?.free_diagnostics_used || 0,
        chatMessagesToday,
        devisAnalysesThisMonth: profile?.free_devis_used || 0,
        isPremium
      }

      // Update cache
      setCachedState(newState)

      if (mountedRef.current) {
        setState({
          ...newState,
          initialLoading: false,
          refreshing: false
        })
        hasLoadedOnceRef.current = true
      }
    } catch (error) {
      console.error('❌ Error loading usage:', error)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          initialLoading: false,
          refreshing: false
        }))
      }
    } finally {
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Initial load
    loadUsage(true)

    // Silent refresh every 30 seconds (no loading state)
    const interval = setInterval(() => {
      loadUsage(false)
    }, 30000)

    // Refresh on window focus (silent)
    const handleFocus = () => {
      loadUsage(false)
    }
    window.addEventListener('focus', handleFocus)

    // Refresh on visibility change (silent)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUsage(false)
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

  // Compute derived values
  const diagnosticsLimit = state.isPremium ? 999999 : FREE_DIAGNOSTICS_LIMIT
  const chatLimit = state.isPremium ? 999999 : FREE_CHAT_LIMIT
  const devisLimit = state.isPremium ? 999999 : FREE_DEVIS_LIMIT

  const diagnosticsRemaining = Math.max(0, diagnosticsLimit - state.diagnosticsThisMonth)
  const chatRemaining = Math.max(0, chatLimit - state.chatMessagesToday)
  const devisRemaining = Math.max(0, devisLimit - state.devisAnalysesThisMonth)

  const value: UserLimits = {
    ...state,
    diagnosticsLimit,
    chatLimit,
    devisLimit,
    canUseDiagnostic: state.isPremium || diagnosticsRemaining > 0,
    canUseChat: state.isPremium || chatRemaining > 0,
    canUseDevis: state.isPremium || devisRemaining > 0,
    refresh: () => loadUsage(false),
    loading: state.initialLoading // Backwards compatibility
  }

  return (
    <UserLimitsContext.Provider value={value}>
      {children}
    </UserLimitsContext.Provider>
  )
}

export function useUserLimits(): UserLimits {
  const context = useContext(UserLimitsContext)
  if (!context) {
    throw new Error('useUserLimits must be used within a UserLimitsProvider')
  }
  return context
}

// Clear cache on logout
export function clearUserLimitsCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // Ignore
  }
}
