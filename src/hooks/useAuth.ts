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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }))
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setState((prev) => ({ ...prev, loading: false }))
      }
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

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      // Create profile if it doesn't exist
      if (error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single()
        setState((prev) => ({ ...prev, profile: newProfile as Profile, loading: false }))
        return
      }
    }

    setState((prev) => ({ ...prev, profile: data as Profile, loading: false }))
  }

  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create profile with display name
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
      })
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

  return {
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    deleteAccount,
    refreshProfile: () => state.user && fetchProfile(state.user.id),
  }
}
