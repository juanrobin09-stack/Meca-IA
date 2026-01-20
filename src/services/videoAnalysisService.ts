interface AnalysisResult {
  text: string
  error?: string
}

class VideoAnalysisService {
  async analyzeFrame(frameBase64: string, question?: string): Promise<AnalysisResult> {
    console.log('VideoAnalysisService: Analyse en cours...')

    try {
      const response = await fetch('/.netlify/functions/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameBase64,
          userQuestion: question || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('VideoAnalysisService: Erreur API:', result)
        throw new Error(result.error || 'Erreur lors de l\'analyse')
      }

      console.log('VideoAnalysisService: Resultat:', result.text?.substring(0, 100))

      return {
        text: result.text || 'Aucune analyse disponible'
      }
    } catch (error) {
      console.error('VideoAnalysisService: Erreur:', error)
      throw error
    }
  }
}

// Export simple compatible
const videoAnalysisService = new VideoAnalysisService()
export default videoAnalysisService
