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
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🎥</div>
          <h2 className="text-2xl font-bold mb-3 text-white">Feature Premium</h2>
          <p className="text-white/60 mb-6">
            Le chat video avec Alex est reserve aux membres Premium.
          </p>
          <Link
            to="/pricing"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-transform"
          >
            Passer a Premium
          </Link>
          <button
            onClick={() => navigate('/app')}
            className="block mx-auto mt-6 text-white/60 hover:text-white text-sm"
          >
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">

      {/* VIDEO PRINCIPALE (FULL SCREEN) */}
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
          <div className="w-full h-full flex items-center justify-center">
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            >
              Activer Camera
            </button>
          </div>
        )}
      </div>

      {/* OVERLAY GRADIENT TOP */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>

      {/* OVERLAY GRADIENT BOTTOM */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none"></div>

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-20 safe-area-top">
        <button
          onClick={() => navigate('/app')}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-white font-bold text-xl drop-shadow-lg">Alex</h1>
          <p className="text-white/80 text-sm font-medium drop-shadow">Mecanicien Expert</p>
        </div>

        <div className="w-12"></div>
      </div>

      {/* ERREUR */}
      {error && (
        <div className="absolute top-20 left-6 right-6 z-30 p-4 bg-red-500/90 backdrop-blur-xl rounded-2xl border border-red-400/30">
          <p className="text-white text-sm font-medium">{error}</p>
        </div>
      )}

      {/* AVATAR ALEX - BAS DROITE (COMME COACH) */}
      <div className="absolute bottom-32 right-4 w-64 h-80 md:w-72 md:h-96 z-10">
        <AlexAvatar3D
          isSpeaking={isSpeaking}
          isListening={isListening || analyzing}
        />
      </div>

      {/* TRANSCRIPTION LIVE (BAS GAUCHE) */}
      {(conversation.length > 0 || currentTranscript) && (
        <div className="absolute bottom-32 left-4 right-72 md:right-80 z-10 max-w-lg">
          <div className="bg-black/70 backdrop-blur-2xl rounded-2xl p-4 border border-white/20 shadow-2xl">
            {currentTranscript && (
              <p className="text-blue-400 text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                Toi: {currentTranscript}
              </p>
            )}

            {conversation.length > 0 && (
              <p className="text-white text-sm leading-relaxed">
                <span className="text-green-400 font-semibold">Alex: </span>
                {conversation[conversation.length - 1].text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* INDICATEUR ANALYSE */}
      {analyzing && !conversation.length && (
        <div className="absolute bottom-32 left-4 z-10">
          <div className="flex items-center gap-3 px-5 py-3 bg-purple-500/90 backdrop-blur-xl rounded-full">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-sm font-semibold">Analyse en cours...</span>
          </div>
        </div>
      )}

      {/* CONTROLES - BAS CENTER */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 safe-area-bottom">
        <div className="flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">

          {/* Micro */}
          <button
            onClick={handleVoiceInput}
            disabled={analyzing || isSpeaking || !streaming}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse scale-110'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-110'
            } disabled:bg-gray-600 disabled:cursor-not-allowed active:scale-95`}
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Analyser */}
          <button
            onClick={() => handleAnalyze()}
            disabled={!streaming || analyzing || isSpeaking}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:scale-110 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            {analyzing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>

          {/* Quitter */}
          <button
            onClick={stopCamera}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:scale-110 flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Labels */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="w-14 md:w-16 text-center text-white/80 text-xs font-semibold drop-shadow">
            {isListening ? 'Ecoute...' : 'Parler'}
          </span>
          <span className="w-14 md:w-16 text-center text-white/80 text-xs font-semibold drop-shadow">Analyser</span>
          <span className="w-14 md:w-16 text-center text-white/80 text-xs font-semibold drop-shadow">Quitter</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
