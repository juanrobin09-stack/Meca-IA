class VoiceService {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private isVoiceReady: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.initPromise = this.initVoice()
    } else {
      console.warn('VoiceService: Speech synthesis non disponible')
    }
  }

  private async initVoice(): Promise<void> {
    if (!this.synth) return

    return new Promise((resolve) => {
      const loadVoices = () => {
        const voices = this.synth!.getVoices()

        console.log('VoiceService: Voix disponibles:', voices.length)
        console.log('VoiceService: Liste:', voices.map(v => `${v.name} (${v.lang})`).join(', '))

        // Chercher voix MASCULINE francaise (ordre de preference)
        this.voice =
          voices.find(v => v.lang.startsWith('fr') && v.name.includes('Thomas')) ||
          voices.find(v => v.lang.startsWith('fr') && v.name.includes('Paul')) ||
          voices.find(v => v.lang.startsWith('fr') && v.name.toLowerCase().includes('male')) ||
          voices.find(v => v.lang.startsWith('fr') && !v.name.toLowerCase().includes('female') && !v.name.includes('Hortense') && !v.name.includes('Amelie')) ||
          voices.find(v => v.lang.startsWith('fr')) ||
          voices[0]

        if (this.voice) {
          console.log('VoiceService: Voix selectionnee:', this.voice.name, this.voice.lang)
          this.isVoiceReady = true
        } else {
          console.warn('VoiceService: Aucune voix trouvee')
        }

        resolve()
      }

      // Essayer de charger immediatement
      const voices = this.synth!.getVoices()
      if (voices.length > 0) {
        loadVoices()
      } else {
        // Attendre l'evenement voiceschanged
        this.synth!.addEventListener('voiceschanged', loadVoices, { once: true })
        // Timeout de securite
        setTimeout(() => {
          if (!this.isVoiceReady) {
            loadVoices()
          }
        }, 1000)
      }
    })
  }

  async speak(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    console.log('VoiceService: ALEX PARLE:', text.substring(0, 100) + '...')

    if (!this.synth) {
      console.error('VoiceService: synth non disponible')
      onEnd?.()
      return
    }

    // Attendre que la voix soit prete
    if (this.initPromise) {
      await this.initPromise
    }

    // Arreter toute voix en cours
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (this.voice) {
      utterance.voice = this.voice
      console.log('VoiceService: Utilise voix:', this.voice.name)
    } else {
      console.warn('VoiceService: Pas de voix francaise, utilise voix par defaut')
    }

    // Config voix MASCULINE
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95    // Legerement plus lent (naturel)
    utterance.pitch = 0.75   // GRAVE (masculin)
    utterance.volume = 1.0

    utterance.onstart = () => {
      console.log('VoiceService: VOIX DEMARRE')
      onStart?.()
    }

    utterance.onend = () => {
      console.log('VoiceService: VOIX TERMINE')
      onEnd?.()
    }

    utterance.onerror = (err) => {
      console.error('VoiceService: ERREUR VOIX:', err.error, err)
      onEnd?.()
    }

    console.log('VoiceService: speak() appele')
    this.synth.speak(utterance)

    // Chrome bug workaround - resume if paused
    if (this.synth.paused) {
      console.log('VoiceService: synth etait en pause, resume')
      this.synth.resume()
    }
  }

  stop(): void {
    console.log('VoiceService: stop()')
    if (this.synth) {
      this.synth.cancel()
    }
  }

  isReady(): boolean {
    return this.isVoiceReady && !!this.synth
  }
}

const voiceServiceInstance = new VoiceService()
export { voiceServiceInstance as voiceService }
export default voiceServiceInstance
