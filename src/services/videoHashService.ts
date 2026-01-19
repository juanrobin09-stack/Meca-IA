import { supabase } from '@/lib/supabase'
import type { VideoAnalysisResult, VideoAnalysisCache } from '@/types/video'

export class VideoHashService {
  /**
   * Génère un hash unique de la vidéo
   * Basé sur : taille + nom + premiers bytes du fichier
   * Utilise Web Crypto API (compatible navigateur)
   */
  static async generateVideoHash(videoFile: File): Promise<string> {
    const fileData = {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      lastModified: videoFile.lastModified
    }

    // Lire premiers 2000 bytes pour fingerprint unique
    const arrayBuffer = await videoFile.slice(0, 2000).arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const combined = JSON.stringify(fileData) + Array.from(uint8Array).join(',')

    // Utiliser Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(combined)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convertir en hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }

  /**
   * Vérifie si cette vidéo a déjà été analysée
   */
  static async checkExistingAnalysis(
    userId: string,
    videoHash: string
  ): Promise<VideoAnalysisCache | null> {
    try {
      const { data, error } = await supabase
        .from('video_diagnoses')
        .select('*')
        .eq('user_id', userId)
        .eq('video_hash', videoHash)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('Video cache check skipped:', error.message)
        return null
      }

      return data as VideoAnalysisCache | null
    } catch (err) {
      console.error('Error in checkExistingAnalysis:', err)
      return null
    }
  }

  /**
   * Sauvegarde l'analyse pour cohérence future
   */
  static async saveAnalysis(
    userId: string,
    videoHash: string,
    analysisResult: VideoAnalysisResult,
    videoUrl?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_diagnoses')
        .upsert({
          user_id: userId,
          video_hash: videoHash,
          video_url: videoUrl,
          analysis_result: analysisResult,
          confidence_score: analysisResult.confiance,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_hash'
        })

      if (error) {
        console.warn('Video analysis save skipped:', error.message)
      }
    } catch (err) {
      console.warn('Error in saveAnalysis:', err)
    }
  }

  /**
   * Récupère l'historique des analyses vidéo d'un utilisateur
   */
  static async getUserVideoAnalyses(userId: string, limit = 10): Promise<VideoAnalysisCache[]> {
    try {
      const { data, error } = await supabase
        .from('video_diagnoses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching video analyses:', error)
        return []
      }

      return (data as VideoAnalysisCache[]) || []
    } catch (err) {
      console.error('Error in getUserVideoAnalyses:', err)
      return []
    }
  }
}
