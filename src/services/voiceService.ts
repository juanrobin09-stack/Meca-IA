class VoiceService {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private initialized = false

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.initVoice()
      console.log('VoiceService: Initialise')
    } else {
      console.warn('VoiceService: Speech synthesis non disponible')
    }
  }

  private initVoice(): void {
    if (!this.synth) return

    const loadVoices = (): void => {
      const voices = this.synth!.getVoices()
      console.log('VoiceService: Voix disponibles:', voices.length)

      // Preference voix francaise masculine
      this.voice = voices.find(v =>
        v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Paul'))
      ) || voices.find(v =>
        v.lang.startsWith('fr') && !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('amelie')
      ) || voices.find(v =>
        v.lang.startsWith('fr')
      ) || voices[0]

      if (this.voice) {
        console.log('VoiceService: Voix selectionnee:', this.voice.name, this.voice.lang)
        this.initialized = true
      } else {
        console.warn('VoiceService: Aucune voix trouvee')
      }
    }

    // Load voices immediately if available
    if (this.synth.getVoices().length > 0) {
      loadVoices()
    }

    // Also listen for voices changed event (needed for some browsers)
    this.synth.addEventListener('voiceschanged', loadVoices)
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    console.log('VoiceService.speak() appele avec:', text.substring(0, 50) + '...')

    if (!this.synth) {
      console.error('VoiceService: synth est null!')
      onEnd?.()
      return
    }

    // Arrete toute voix en cours
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (this.voice) {
      utterance.voice = this.voice
      console.log('VoiceService: Utilise voix:', this.voice.name)
    } else {
      console.warn('VoiceService: Pas de voix selectionnee, utilise defaut')
    }

    utterance.lang = 'fr-FR'
    utterance.rate = 1.0
    utterance.pitch = 0.85
    utterance.volume = 1.0

    utterance.onstart = (): void => {
      console.log('VoiceService: DEBUT parole')
      onStart?.()
    }

    utterance.onend = (): void => {
      console.log('VoiceService: FIN parole')
      onEnd?.()
    }

    utterance.onerror = (err): void => {
      console.error('VoiceService: ERREUR:', err.error, err)
      onEnd?.()
    }

    console.log('VoiceService: Appel synth.speak()')
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
    return this.initialized && !!this.synth
  }
}

const voiceServiceInstance = new VoiceService()
export { voiceServiceInstance as voiceService }
export default voiceServiceInstance
