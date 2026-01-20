import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
      setError('Impossible d\'acceder a la camera')
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

      // ALEX PARLE
      await voiceService.speak(
        result.text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      )

      setCurrentTranscript('')

    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur analyse')
    } finally {
      setAnalyzing(false)
    }
  }, [user?.id, conversation, navigate])

  // Conversation vocale
  const handleVoiceInput = () => {
    if (!speechRecognitionService.isAvailable()) {
      setError('Reconnaissance vocale non supportee')
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
        setCurrentTranscript(transcript)
        setIsListening(false)
        handleAnalyze(transcript)
      },
      (errorMsg) => {
        setError(`Erreur micro: ${errorMsg}`)
        setIsListening(false)
      }
    )
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Feature Premium</h2>
          <p className="text-white/60 mb-8 text-sm">
            Le chat video avec Alex est reserve aux membres Premium.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-lg hover:bg-white/90 transition-colors"
          >
            Passer Premium
          </button>
          <button
            onClick={() => navigate('/app')}
            className="w-full mt-4 py-3 text-white/60 hover:text-white text-sm transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">

      {/* VIDEO FULLSCREEN */}
      <div className="absolute inset-0">
        {streaming ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-white text-black rounded-2xl font-semibold text-lg hover:bg-white/90 transition-colors"
            >
              Activer Camera
            </button>
          </div>
        )}
      </div>

      {/* GRADIENT OVERLAYS */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* HEADER MINIMAL */}
      <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-20 safe-area-top">
        <button
          onClick={() => navigate('/app')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-white font-semibold text-base">Alex</h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isSpeaking ? 'bg-green-400' : isListening ? 'bg-blue-400' : 'bg-white/40'
            }`} />
            <span className="text-white/60 text-xs">
              {isSpeaking ? 'Parle' : isListening ? 'Ecoute' : 'En ligne'}
            </span>
          </div>
        </div>

        <div className="w-10" />
      </div>

      {/* ERREUR */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-30 p-3 bg-red-500/90 backdrop-blur-xl rounded-xl">
          <p className="text-white text-sm">{error}</p>
        </div>
      )}

      {/* AVATAR ALEX - BAS DROITE */}
      <div className="absolute bottom-36 right-3 w-80 h-96 z-10 rounded-3xl overflow-hidden shadow-2xl">
        <AlexAvatar3D
          isSpeaking={isSpeaking}
          isListening={isListening || analyzing}
        />
      </div>

      {/* TRANSCRIPTION - BAS GAUCHE */}
      {(conversation.length > 0 || currentTranscript) && (
        <div className="absolute bottom-36 left-3 right-[340px] z-10">
          <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-4 max-h-40 overflow-y-auto">
            {currentTranscript && (
              <p className="text-blue-400 text-sm mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                {currentTranscript}
              </p>
            )}

            {conversation.length > 0 && (
              <p className="text-white text-sm leading-relaxed">
                <span className="text-green-400 font-medium">Alex: </span>
                {conversation[conversation.length - 1].text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* INDICATEUR ANALYSE */}
      {analyzing && !conversation.length && (
        <div className="absolute bottom-36 left-3 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/80 backdrop-blur-xl rounded-full">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Analyse...</span>
          </div>
        </div>
      )}

      {/* CONTROLES - BAS CENTER */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 safe-area-bottom">
        <div className="flex items-center gap-6">

          {/* Micro */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleVoiceInput}
              disabled={analyzing || isSpeaking || !streaming}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? 'bg-red-500 scale-110'
                  : 'bg-white/20 backdrop-blur-xl hover:bg-white/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <span className="text-white/70 text-xs">
              {isListening ? 'Ecoute...' : 'Parler'}
            </span>
          </div>

          {/* Analyser */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleAnalyze()}
              disabled={!streaming || analyzing || isSpeaking}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
            <span className="text-white/70 text-xs">Analyser</span>
          </div>

          {/* Quitter */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={stopCamera}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center transition-all shadow-xl hover:scale-105"
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-white/70 text-xs">Quitter</span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
