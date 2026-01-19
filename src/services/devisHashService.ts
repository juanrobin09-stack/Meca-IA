import { supabase } from '@/lib/supabase'
import type { DevisAnalysisResult, DevisAnalysisCache } from '@/types/devis'

export class DevisHashService {
  /**
   * Génère un hash unique du devis basé sur son contenu
   * Utilise Web Crypto API (compatible navigateur)
   */
  static async generateDevisHash(devisContent: string): Promise<string> {
    // Normaliser le contenu (supprimer espaces, accents, casse)
    const normalized = devisContent
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
      .replace(/\s+/g, '') // Supprimer espaces
      .replace(/[^\w]/g, '') // Garder seulement alphanumérique

    // Utiliser Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convertir en hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }

  /**
   * Vérifie si ce devis a déjà été analysé
   */
  static async checkExistingAnalysis(
    userId: string,
    devisHash: string
  ): Promise<DevisAnalysisCache | null> {
    try {
      const { data, error } = await supabase
        .from('devis_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('devis_hash', devisHash)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        // Table might not exist or have different schema - just skip cache
        console.warn('Cache check skipped:', error.message)
        return null
      }

      if (data) {
        // Map column names if needed
        return {
          id: data.id,
          user_id: data.user_id || data.utilisateur_id,
          devis_hash: data.devis_hash || data.devi_hash,
          ocr_text: data.ocr_text,
          analysis_result: data.analysis_result || data.analyse_resultat,
          created_at: data.created_at || data.cree_at
        }
      }

      return null
    } catch (err) {
      console.error('Error in checkExistingAnalysis:', err)
      return null
    }
  }

  /**
   * Sauvegarde l'analyse pour réutilisation future
   */
  static async saveAnalysis(
    userId: string,
    devisHash: string,
    ocrText: string,
    analysis: DevisAnalysisResult
  ): Promise<void> {
    try {
      // Utiliser upsert pour éviter les doublons
      const { error } = await supabase
        .from('devis_analyses')
        .upsert({
          user_id: userId,
          devis_hash: devisHash,
          ocr_text: ocrText,
          analysis_result: analysis,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,devis_hash'
        })

      if (error) {
        // Cache save failed - not critical, analysis still works
        console.warn('Cache save skipped:', error.message)
      }
    } catch (err) {
      // Non-blocking error
      console.warn('Error in saveAnalysis:', err)
    }
  }

  /**
   * Récupère l'historique des analyses d'un utilisateur
   */
  static async getUserAnalyses(userId: string, limit = 10): Promise<DevisAnalysisCache[]> {
    try {
      const { data, error } = await supabase
        .from('devis_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error getting user analyses:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error in getUserAnalyses:', err)
      return []
    }
  }
}
