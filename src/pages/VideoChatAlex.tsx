import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlexAvatar3D } from '@/components/AlexAvatar3D'
import { voiceService } from '@/services/voiceService'
import { speechRecognitionService } from '@/services/speechRecognitionService'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'

interface ConversationMessage {
  role: 'user' | 'assistant'
  text: string
}

export default function VideoChatAlex() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [streaming, setStreaming] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Cleanup - MUST be before any conditional return
  useEffect(() => {
    const videoElement = videoRef.current
    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      voiceService.stop()
      speechRecognitionService.stopListening()
    }
  }, [])

  // Demarrer camera
  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
    } catch (err) {
      console.error('Erreur camera:', err)
      setError('Impossible d\'acceder a la camera. Verifie les permissions.')
    }
  }

  // Arreter camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setStreaming(false)
    voiceService.stop()
    speechRecognitionService.stopListening()
    setIsSpeaking(false)
    setIsListening(false)
    navigate('/app')
  }

  // Capturer frame
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  }

  // Analyser + repondre vocalement
  const handleAnalyze = useCallback(async (question?: string) => {
    const frameBase64 = captureFrame()
    if (!frameBase64) {
      setError('Active la camera d\'abord')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      console.log('Envoi analyse...')
      const response = await fetch('/.netlify/functions/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          frameBase64,
          userQuestion: question || undefined,
          conversationHistory: conversation.slice(-10)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'PREMIUM_REQUIRED') {
          navigate('/pricing')
          return
        }
        throw new Error(result.error || 'Erreur analyse')
      }

      // Ajouter question utilisateur si fournie
      if (question) {
        setConversation(prev => [...prev, { role: 'user', text: question }])
      }

      // Ajouter reponse Alex
      setConversation(prev => [...prev, { role: 'assistant', text: result.text }])

      // ALEX PARLE VRAIMENT
      console.log('Alex va parler:', result.text)

      await voiceService.speak(
        result.text,
        () => {
          console.log('START SPEAK')
          setIsSpeaking(true)
        },
        () => {
          console.log('END SPEAK')
          setIsSpeaking(false)
        }
      )

      setCurrentTranscript('')

    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse')
    } finally {
      setAnalyzing(false)
    }
  }, [user?.id, conversation, navigate])

  // Conversation vocale
  const handleVoiceInput = () => {
    if (!speechRecognitionService.isAvailable()) {
      setError('Reconnaissance vocale non supportee sur ce navigateur')
      return
    }

    if (isListening) {
      speechRecognitionService.stopListening()
      setIsListening(false)
      return
    }

    setIsListening(true)
    setError(null)

    speechRecognitionService.startListening(
      (transcript) => {
        console.log('Tu as dit:', transcript)
        setCurrentTranscript(transcript)
        setIsListening(false)

        // Analyser avec cette question
        handleAnalyze(transcript)
      },
      (errorMsg) => {
        console.error('Erreur reconnaissance:', errorMsg)
        setError(`Erreur micro: ${errorMsg}`)
        setIsListening(false)
      }
    )
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🎥</div>
          <h2 className="text-2xl font-bold mb-3 text-white">Feature Premium</h2>
          <p className="text-white/60 mb-6">
            Le chat video avec Alex est reserve aux membres Premium.
            Montre ta voiture en direct et recois des conseils personnalises !
          </p>
          <Link
            to="/pricing"
            className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all"
          >
            Passer a Premium
          </Link>
          <p className="mt-4 text-sm text-white/40">9,99€/mois - Sans engagement</p>
          <button
            onClick={() => navigate('/app')}
            className="mt-6 text-white/60 hover:text-white text-sm"
          >
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div className="h-full flex flex-col">

        {/* Header AAA */}
        <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm safe-area-top">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/app')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h1 className="text-white font-bold text-xl">Alex</h1>
              <p className="text-white/60 text-sm font-medium">Mecanicien Expert</p>
            </div>

            <div className="w-10"></div>
          </div>
        </div>

        {/* Main : ALEX grand ecran */}
        <div className="flex-1 relative overflow-hidden">
          <AlexAvatar3D
            isSpeaking={isSpeaking}
            isListening={isListening || analyzing}
          />

          {/* Video user (PiP style FaceTime) */}
          <div className="absolute top-6 right-6 w-32 h-44 md:w-36 md:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-sm bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!streaming && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={startCamera}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center active:scale-95 transition-all"
                >
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <p className="text-xs text-white/60 font-medium">Camera</p>
              </div>
            )}

            {streaming && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-white text-xs">Live</span>
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="absolute top-6 left-6 right-44 p-3 bg-red-500/90 backdrop-blur-sm rounded-xl">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          {/* Transcription live (sous-titres AAA) */}
          {(conversation.length > 0 || currentTranscript) && (
            <div className="absolute bottom-28 left-6 right-6">
              <div className="bg-black/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/10 shadow-2xl max-h-40 overflow-y-auto">
                {currentTranscript && (
                  <p className="text-blue-400 text-sm font-medium mb-2">
                    Toi: {currentTranscript}
                  </p>
                )}

                {conversation.length > 0 && (
                  <p className="text-white text-base leading-relaxed">
                    <span className="text-white/60 font-medium">Alex: </span>
                    {conversation[conversation.length - 1].text}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Indicateur analyse */}
          {analyzing && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/90 backdrop-blur-sm rounded-full">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-sm font-medium">Analyse en cours...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controles AAA */}
        <div className="flex-shrink-0 px-6 py-6 pb-10 bg-gradient-to-t from-black via-black/95 to-transparent safe-area-bottom">
          <div className="flex items-center justify-center gap-4">

            {/* Bouton PARLER (microphone) */}
            <button
              onClick={handleVoiceInput}
              disabled={analyzing || isSpeaking || !streaming}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:bg-gray-600 disabled:cursor-not-allowed`}
              title={isListening ? 'Ecoute en cours...' : 'Parler a Alex'}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Bouton ANALYSER (sans parler) */}
            <button
              onClick={() => handleAnalyze()}
              disabled={!streaming || analyzing || isSpeaking}
              className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg active:scale-95"
              title="Analyser l'image"
            >
              {analyzing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>

            {/* Bouton RACCROCHER */}
            <button
              onClick={stopCamera}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg active:scale-95"
              title="Quitter"
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Labels boutons */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="w-16 text-center text-white/60 text-xs font-medium">
              {isListening ? 'Ecoute...' : 'Parler'}
            </span>
            <span className="w-16 text-center text-white/60 text-xs font-medium">Analyser</span>
            <span className="w-16 text-center text-white/60 text-xs font-medium">Quitter</span>
          </div>

          {/* Hints */}
          {!streaming && (
            <p className="text-center text-white/40 text-xs mt-4">
              Active la camera pour commencer
            </p>
          )}
          {streaming && !analyzing && !isSpeaking && !isListening && (
            <p className="text-center text-white/40 text-xs mt-4">
              Parle ou analyse ta voiture
            </p>
          )}
          {isSpeaking && (
            <p className="text-center text-green-400 text-xs mt-4 animate-pulse">
              Alex parle...
            </p>
          )}
          {isListening && (
            <p className="text-center text-blue-400 text-xs mt-4 animate-pulse">
              Je t'ecoute...
            </p>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
