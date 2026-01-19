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
        .from('video_diagnostic')
        .select('*')
        .eq('utilisateur_id', userId)
        .eq('video_hash', videoHash)
        .order('cree_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('Video cache check skipped:', error.message)
        return null
      }

      if (data) {
        // Map French column names to English interface
        return {
          id: data.id,
          user_id: data.utilisateur_id,
          video_hash: data.video_hash,
          video_url: data.video_url,
          analysis_result: data.analyse_resultat,
          confidence_score: data.confiance_score,
          created_at: data.cree_at
        } as VideoAnalysisCache
      }

      return null
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
        .from('video_diagnostic')
        .upsert({
          utilisateur_id: userId,
          video_hash: videoHash,
          video_url: videoUrl,
          analyse_resultat: analysisResult,
          confiance_score: analysisResult.confiance,
          cree_at: new Date().toISOString()
        }, {
          onConflict: 'utilisateur_id,video_hash'
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
        .from('video_diagnostic')
        .select('*')
        .eq('utilisateur_id', userId)
        .order('cree_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching video analyses:', error)
        return []
      }

      // Map French column names to English interface
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.utilisateur_id,
        video_hash: item.video_hash,
        video_url: item.video_url,
        analysis_result: item.analyse_resultat,
        confidence_score: item.confiance_score,
        created_at: item.cree_at
      })) as VideoAnalysisCache[]
    } catch (err) {
      console.error('Error in getUserVideoAnalyses:', err)
      return []
    }
  }
}
