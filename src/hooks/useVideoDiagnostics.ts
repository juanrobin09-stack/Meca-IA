import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { VideoDiagnostic } from '@/types'

export function useVideoDiagnostics(userId: string | undefined) {
  const [videoDiagnostics, setVideoDiagnostics] = useState<VideoDiagnostic[]>([])
  const [loading, setLoading] = useState(true)

  const loadVideoDiagnostics = useCallback(async () => {
    if (!userId) {
      setVideoDiagnostics([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('video_diagnostics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading video diagnostics:', error)
        return
      }

      setVideoDiagnostics(data as VideoDiagnostic[])
    } catch (error) {
      console.error('Error loading video diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadVideoDiagnostics()
  }, [loadVideoDiagnostics])

  const deleteVideoDiagnostic = useCallback(async (id: string) => {
    if (!userId) {
      throw new Error('Utilisateur non connecté')
    }

    console.log('[useVideoDiagnostics] Deleting video diagnostic:', id, 'for user:', userId)

    const { error } = await supabase
      .from('video_diagnostics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[useVideoDiagnostics] Delete error:', error)
      throw new Error(`Erreur de suppression: ${error.message}`)
    }

    console.log('[useVideoDiagnostics] Video diagnostic deleted successfully')
    setVideoDiagnostics(prev => prev.filter(d => d.id !== id))
  }, [userId])

  return {
    videoDiagnostics,
    loading,
    deleteVideoDiagnostic,
    refresh: loadVideoDiagnostics
  }
}
