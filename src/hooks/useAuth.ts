import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User as Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Timeout pour éviter le loading infini si Supabase ne répond pas
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.loading) {
          console.warn('Auth timeout - setting loading to false')
          return { ...prev, loading: false }
        }
        return prev
      })
    }, 5000) // 5 secondes max

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }))
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setState((prev) => ({ ...prev, loading: false }))
      }
    }).catch((error) => {
      clearTimeout(timeout)
      console.error('Error getting session:', error)
      // Si erreur Supabase, on arrête le loading pour permettre l'accès
      setState((prev) => ({ ...prev, loading: false }))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState((prev) => ({ ...prev, session, user: session?.user ?? null }))
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setState((prev) => ({ ...prev, profile: null, loading: false }))
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId: string, retryCount = 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      // Profile doesn't exist yet - wait and retry a few times
      // The database trigger should create the profile automatically
      if (error.code === 'PGRST116') {
        if (retryCount < 5) {
          // Wait a bit for the database trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 800))
          return fetchProfile(userId, retryCount + 1)
        }
        // After retries, profile still doesn't exist - log error but continue
        console.error('Profile not found after retries - trigger may have failed')
        setState((prev) => ({ ...prev, profile: null, loading: false }))
        return
      }
      // Other errors - just set loading to false
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    setState((prev) => ({ ...prev, profile: data as Profile, loading: false }))
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create or update profile with display name using upsert to handle race condition
    // (onAuthStateChange may create an empty profile before this runs)
    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email, // Required field - NOT NULL in database
          display_name: displayName,
        }, {
          onConflict: 'id',
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating/updating profile:', profileError)
      } else if (profileData) {
        // Update state immediately with the new profile
        setState((prev) => ({ ...prev, profile: profileData as Profile }))
      }
    }

    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setState({ user: null, profile: null, session: null, loading: false })
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!state.user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single()

    if (error) throw error
    setState((prev) => ({ ...prev, profile: data as Profile }))
    return data
  }

  async function deleteAccount() {
    if (!state.user) throw new Error('No user logged in')

    // Delete diagnostics first (cascade should handle this, but let's be safe)
    await supabase.from('diagnostics').delete().eq('user_id', state.user.id)
    await supabase.from('payments').delete().eq('user_id', state.user.id)
    await supabase.from('profiles').delete().eq('id', state.user.id)

    // Sign out
    await signOut()
  }

  async function refreshProfile(): Promise<Profile | null> {
    if (!state.user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', state.user.id)
      .single()

    if (error) {
      console.error('Error refreshing profile:', error)
      return null
    }

    const profile = data as Profile
    setState((prev) => ({ ...prev, profile }))
    return profile
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }

  return {
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    deleteAccount,
    refreshProfile,
    resetPassword,
    updatePassword,
  }
}
