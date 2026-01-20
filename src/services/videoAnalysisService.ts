import { supabase } from '@/lib/supabase'

interface AnalysisResult {
  text: string
  confidence: number
}

class VideoAnalysisService {
  async analyzeFrame(frameBase64: string, question?: string): Promise<AnalysisResult> {
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch('/.netlify/functions/analyze-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          image: frameBase64,
          question: question || "Analyse cette image de véhicule et identifie tout problème mécanique visible. Décris ce que tu vois et donne des conseils."
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const data = await response.json()
      return {
        text: data.response || data.text || "Je ne peux pas analyser cette image pour le moment.",
        confidence: data.confidence || 0.8
      }
    } catch (error) {
      console.error('Video analysis error:', error)
      throw error
    }
  }
}

export const videoAnalysisService = new VideoAnalysisService()
