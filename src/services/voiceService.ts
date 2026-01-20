class VoiceService {
  private synth: SpeechSynthesis | null = null
  private utterance: SpeechSynthesisUtterance | null = null
  private isSpeaking = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
    }
  }

  async speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      this.stop()

      this.utterance = new SpeechSynthesisUtterance(text)

      // Configure voice settings
      this.utterance.lang = 'fr-FR'
      this.utterance.rate = 1.0
      this.utterance.pitch = 1.0
      this.utterance.volume = 1.0

      // Try to find a French male voice
      const voices = this.synth.getVoices()
      const frenchVoice = voices.find(
        voice => voice.lang.startsWith('fr') && voice.name.toLowerCase().includes('male')
      ) || voices.find(
        voice => voice.lang.startsWith('fr')
      )

      if (frenchVoice) {
        this.utterance.voice = frenchVoice
      }

      this.utterance.onstart = () => {
        this.isSpeaking = true
        onStart?.()
      }

      this.utterance.onend = () => {
        this.isSpeaking = false
        onEnd?.()
        resolve()
      }

      this.utterance.onerror = (event) => {
        this.isSpeaking = false
        onEnd?.()
        // Don't reject on interruptions
        if (event.error !== 'interrupted') {
          reject(new Error(event.error))
        } else {
          resolve()
        }
      }

      this.synth.speak(this.utterance)
    })
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
      this.isSpeaking = false
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking
  }
}

export const voiceService = new VoiceService()
