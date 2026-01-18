import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DevisAnalysis } from '@/types'

export function useDevis(userId: string | undefined) {
  const [devisList, setDevisList] = useState<DevisAnalysis[]>([])
  const [currentDevis, setCurrentDevis] = useState<DevisAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDevis = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('devis_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDevisList(data as DevisAnalysis[])
    } catch (error) {
      console.error('Error fetching devis:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDevis()
  }, [fetchDevis])

  const saveDevis = useCallback(
    async (analysisData: {
      analysis_result: string
      image_url?: string
      garage_name?: string
      original_amount?: number
      potential_savings?: number
      verdict_type?: 'good' | 'warning' | 'bad' | 'neutral'
      is_fair_price?: boolean
    }): Promise<DevisAnalysis> => {
      if (!userId) throw new Error('User not logged in')

      const newDevis = {
        user_id: userId,
        ...analysisData,
      }

      const { data, error } = await supabase
        .from('devis_analyses')
        .insert(newDevis)
        .select()
        .single()

      if (error) throw error

      const devis = data as DevisAnalysis
      setCurrentDevis(devis)
      setDevisList((prev) => [devis, ...prev])

      return devis
    },
    [userId]
  )

  const loadDevis = useCallback(
    async (id: string) => {
      const existing = devisList.find((d) => d.id === id)
      if (existing) {
        setCurrentDevis(existing)
        return existing
      }

      const { data, error } = await supabase
        .from('devis_analyses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const devis = data as DevisAnalysis
      setCurrentDevis(devis)
      return devis
    },
    [devisList]
  )

  const deleteDevis = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('devis_analyses').delete().eq('id', id)

      if (error) throw error

      setDevisList((prev) => prev.filter((d) => d.id !== id))
      if (currentDevis?.id === id) {
        setCurrentDevis(null)
      }
    },
    [currentDevis]
  )

  return {
    devisList,
    currentDevis,
    loading,
    saveDevis,
    loadDevis,
    deleteDevis,
    setCurrentDevis,
    refreshDevis: fetchDevis,
  }
}
