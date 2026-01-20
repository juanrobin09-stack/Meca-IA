// Type declaration for SpeechRecognition
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
        confidence: number
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

class SpeechRecognitionService {
  private recognition: any = null
  private isCurrentlyListening: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.lang = 'fr-FR'
        this.recognition.continuous = false
        this.recognition.interimResults = false
        this.recognition.maxAlternatives = 1

        console.log('SpeechRecognition: Service initialise')
      } else {
        console.warn('SpeechRecognition: Non supporte sur ce navigateur')
      }
    }
  }

  startListening(onResult: (text: string) => void, onError?: (error: string) => void): void {
    if (!this.recognition) {
      console.error('SpeechRecognition: Non disponible')
      onError?.('Speech Recognition non supporte sur ce navigateur')
      return
    }

    if (this.isCurrentlyListening) {
      console.log('SpeechRecognition: Deja en ecoute')
      return
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      console.log('SpeechRecognition: Transcription:', transcript, '(confiance:', confidence, ')')
      this.isCurrentlyListening = false
      onResult(transcript)
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('SpeechRecognition: Erreur:', event.error)
      this.isCurrentlyListening = false

      // Traduire les erreurs courantes
      let errorMessage = event.error
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucune parole detectee'
          break
        case 'audio-capture':
          errorMessage = 'Microphone non disponible'
          break
        case 'not-allowed':
          errorMessage = 'Permission microphone refusee'
          break
        case 'network':
          errorMessage = 'Erreur reseau'
          break
        case 'aborted':
          errorMessage = 'Ecoute annulee'
          break
      }

      onError?.(errorMessage)
    }

    this.recognition.onend = () => {
      console.log('SpeechRecognition: Ecoute terminee')
      this.isCurrentlyListening = false
    }

    this.recognition.onstart = () => {
      console.log('SpeechRecognition: Ecoute demarree')
    }

    console.log('SpeechRecognition: Demarrage ecoute...')
    try {
      this.recognition.start()
      this.isCurrentlyListening = true
    } catch (err) {
      console.error('SpeechRecognition: Erreur au demarrage:', err)
      onError?.('Erreur au demarrage de la reconnaissance vocale')
    }
  }

  stopListening(): void {
    if (this.recognition && this.isCurrentlyListening) {
      console.log('SpeechRecognition: Arret ecoute')
      try {
        this.recognition.stop()
      } catch (err) {
        console.error('SpeechRecognition: Erreur arret:', err)
      }
      this.isCurrentlyListening = false
    }
  }

  isListening(): boolean {
    return this.isCurrentlyListening
  }

  isAvailable(): boolean {
    return !!this.recognition
  }
}

// Export simple compatible
const speechRecognitionService = new SpeechRecognitionService()
export default speechRecognitionService
