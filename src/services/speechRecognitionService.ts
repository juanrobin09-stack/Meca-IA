type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
  resultIndex: number
}

type SpeechRecognitionErrorEvent = {
  error: string
  message: string
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

class SpeechRecognitionService {
  private recognition: ISpeechRecognition | null = null
  private isListening = false
  private finalTranscript = ''

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'fr-FR'
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onInterim?: (transcript: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Reconnaissance vocale non supportée')
      return
    }

    if (this.isListening) {
      return
    }

    this.finalTranscript = ''
    this.isListening = true

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          this.finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        onInterim?.(this.finalTranscript + interimTranscript)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        onError?.(event.error)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (this.finalTranscript.trim()) {
        onResult(this.finalTranscript.trim())
      }
    }

    try {
      this.recognition.start()
    } catch (error) {
      this.isListening = false
      onError?.('Erreur lors du démarrage')
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  getIsListening(): boolean {
    return this.isListening
  }
}

export const speechRecognitionService = new SpeechRecognitionService()
