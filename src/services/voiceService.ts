class VoiceService {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.initVoice()
    }
  }

  private initVoice(): void {
    if (!this.synth) return

    const loadVoices = (): void => {
      const voices = this.synth!.getVoices()

      // Préférence voix française masculine
      this.voice = voices.find(v =>
        v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Paul'))
      ) || voices.find(v =>
        v.lang.startsWith('fr') && !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('amelie')
      ) || voices.find(v =>
        v.lang.startsWith('fr')
      ) || voices[0]

      if (this.voice) {
        console.log('Voix Alex:', this.voice.name)
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
    utterance.rate = 1.0
    utterance.pitch = 0.85 // Voix plus grave
    utterance.volume = 1.0

    utterance.onstart = (): void => {
      console.log('Alex parle...')
      onStart?.()
    }

    utterance.onend = (): void => {
      console.log('Alex a fini')
      onEnd?.()
    }

    utterance.onerror = (err): void => {
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
}

const voiceServiceInstance = new VoiceService()
export { voiceServiceInstance as voiceService }
export default voiceServiceInstance
