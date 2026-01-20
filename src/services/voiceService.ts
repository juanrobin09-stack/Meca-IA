class VoiceService {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private initialized = false

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.initVoice()
    }
  }

  private initVoice() {
    if (!this.synth) return

    const loadVoices = () => {
      const voices = this.synth!.getVoices()

      // Préférence voix française masculine
      this.voice = voices.find(v =>
        v.lang.startsWith('fr') && v.name.toLowerCase().includes('thomas')
      ) || voices.find(v =>
        v.lang.startsWith('fr') && !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('amelie')
      ) || voices.find(v =>
        v.lang.startsWith('fr')
      ) || voices[0]

      if (this.voice) {
        console.log('Voix sélectionnée:', this.voice.name)
        this.initialized = true
      }
    }

    // Load voices immediately if available
    loadVoices()

    // Also listen for voices changed event (needed for some browsers)
    this.synth.onvoiceschanged = loadVoices
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('Speech synthesis not available')
      onEnd?.()
      return
    }

    // Arrêter toute voix en cours
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (this.voice) {
      utterance.voice = this.voice
    }

    utterance.lang = 'fr-FR'
    utterance.rate = 1.0  // Vitesse normale
    utterance.pitch = 0.9 // Légèrement grave (mécanicien)
    utterance.volume = 1.0

    utterance.onstart = () => {
      console.log('Alex parle...')
      onStart?.()
    }

    utterance.onend = () => {
      console.log('Alex a fini')
      onEnd?.()
    }

    utterance.onerror = (err) => {
      console.error('Erreur voix:', err)
      onEnd?.()
    }

    this.synth.speak(utterance)
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  isAvailable(): boolean {
    return !!this.synth && this.initialized
  }
}

export const voiceService = new VoiceService()
