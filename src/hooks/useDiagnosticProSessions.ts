import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiagnosticProSession } from '@/types'

export function useDiagnosticProSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<DiagnosticProSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('diagnostic_pro_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSessions(data as DiagnosticProSession[])
    } catch (error) {
      console.error('Error fetching diagnostic pro sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const deleteSession = useCallback(
    async (id: string) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      console.log('[useDiagnosticProSessions] Deleting session:', id, 'for user:', userId)

      const { error } = await supabase
        .from('diagnostic_pro_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('[useDiagnosticProSessions] Delete error:', error)
        throw new Error(`Erreur de suppression: ${error.message}`)
      }

      console.log('[useDiagnosticProSessions] Session deleted successfully')
      setSessions((prev) => prev.filter((s) => s.id !== id))
    },
    [userId]
  )

  const loadSession = useCallback(
    async (id: string) => {
      const existing = sessions.find((s) => s.id === id)
      if (existing) {
        return existing
      }

      const { data, error } = await supabase
        .from('diagnostic_pro_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return data as DiagnosticProSession
    },
    [sessions]
  )

  return {
    sessions,
    loading,
    fetchSessions,
    deleteSession,
    loadSession,
    refreshSessions: fetchSessions,
  }
}
