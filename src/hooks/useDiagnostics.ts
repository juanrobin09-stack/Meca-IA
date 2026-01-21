import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Diagnostic, Message } from '@/types'

export function useDiagnostics(userId: string | undefined) {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [currentDiagnostic, setCurrentDiagnostic] = useState<Diagnostic | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDiagnostics = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiagnostics(data as Diagnostic[])
    } catch (error) {
      console.error('Error fetching diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDiagnostics()
  }, [fetchDiagnostics])

  const createDiagnostic = useCallback(
    async (problemDescription: string): Promise<Diagnostic> => {
      if (!userId) throw new Error('User not logged in')

      const newDiagnostic = {
        user_id: userId,
        problem_description: problemDescription,
        conversation: [],
      }

      const { data, error } = await supabase
        .from('diagnostics')
        .insert(newDiagnostic)
        .select()
        .single()

      if (error) throw error

      const diagnostic = data as Diagnostic
      setCurrentDiagnostic(diagnostic)
      setDiagnostics((prev) => [diagnostic, ...prev])

      return diagnostic
    },
    [userId]
  )

  const updateDiagnostic = useCallback(
    async (id: string, updates: Partial<Diagnostic>) => {
      const { data, error } = await supabase
        .from('diagnostics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updated = data as Diagnostic
      setDiagnostics((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      )
      if (currentDiagnostic?.id === id) {
        setCurrentDiagnostic(updated)
      }

      return updated
    },
    [currentDiagnostic]
  )

  const addMessage = useCallback(
    async (diagnosticId: string, message: Message) => {
      const diagnostic = diagnostics.find((d) => d.id === diagnosticId) || currentDiagnostic

      if (!diagnostic) throw new Error('Diagnostic not found')

      const updatedConversation = [...diagnostic.conversation, message]

      return updateDiagnostic(diagnosticId, {
        conversation: updatedConversation,
      })
    },
    [diagnostics, currentDiagnostic, updateDiagnostic]
  )

  const updateDiagnosisResult = useCallback(
    async (
      diagnosticId: string,
      result: {
        diagnosis_summary?: string
        urgency_level?: 'low' | 'medium' | 'high'
        estimated_cost_min?: number
        estimated_cost_max?: number
        car_brand?: string
        car_model?: string
        car_year?: number
        car_mileage?: number
      }
    ) => {
      return updateDiagnostic(diagnosticId, result)
    },
    [updateDiagnostic]
  )

  const loadDiagnostic = useCallback(
    async (id: string) => {
      const existing = diagnostics.find((d) => d.id === id)
      if (existing) {
        setCurrentDiagnostic(existing)
        return existing
      }

      const { data, error } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const diagnostic = data as Diagnostic
      setCurrentDiagnostic(diagnostic)
      return diagnostic
    },
    [diagnostics]
  )

  const deleteDiagnostic = useCallback(
    async (id: string) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      console.log('[useDiagnostics] Deleting diagnostic:', id, 'for user:', userId)

      const { error } = await supabase
        .from('diagnostics')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.error('[useDiagnostics] Delete error:', error)
        throw new Error(`Erreur de suppression: ${error.message}`)
      }

      console.log('[useDiagnostics] Diagnostic deleted successfully')
      setDiagnostics((prev) => prev.filter((d) => d.id !== id))
      if (currentDiagnostic?.id === id) {
        setCurrentDiagnostic(null)
      }
    },
    [currentDiagnostic, userId]
  )

  return {
    diagnostics,
    currentDiagnostic,
    loading,
    createDiagnostic,
    updateDiagnostic,
    addMessage,
    updateDiagnosisResult,
    loadDiagnostic,
    deleteDiagnostic,
    setCurrentDiagnostic,
    refreshDiagnostics: fetchDiagnostics,
  }
}
