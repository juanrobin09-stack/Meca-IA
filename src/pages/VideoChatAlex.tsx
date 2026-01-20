import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlexAvatar3D } from '@/components/AlexAvatar3D'
import { voiceService } from '@/services/voiceService'
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
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'thinking' | 'concerned'>('neutral')
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Cleanup - MUST be before any conditional return
  useEffect(() => {
    const videoElement = videoRef.current
    return () => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
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

  // Stop camera and go back
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
    voiceService.stop()
    setIsSpeaking(false)
    navigate('/app')
  }

  // Capture frame
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  }

  // Analyze frame
  const handleAnalyze = useCallback(async () => {
    const frameBase64 = captureFrame()
    if (!frameBase64) {
      setError('Aucune image capturee. Active la camera d\'abord.')
      return
    }

    setAnalyzing(true)
    setIsListening(false)
    setEmotion('thinking')
    setError(null)

    try {
      console.log('Envoi analyse...')
      const response = await fetch('/.netlify/functions/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          frameBase64,
          userQuestion: userInput || undefined,
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

      // Add user question to conversation if provided
      if (userInput.trim()) {
        setConversation(prev => [...prev, { role: 'user', text: userInput }])
      }

      // Add Alex's response
      setConversation(prev => [...prev, { role: 'assistant', text: result.text }])
      setEmotion(result.emotion || 'neutral')

      // Alex speaks
      console.log('Alex va parler:', result.text)
      voiceService.speak(
        result.text,
        () => {
          console.log('START SPEAK')
          setIsSpeaking(true)
        },
        () => {
          console.log('END SPEAK')
          setIsSpeaking(false)
          setEmotion('neutral')
        }
      )

      setUserInput('')

    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse')
      setEmotion('neutral')
    } finally {
      setAnalyzing(false)
    }
  }, [user?.id, userInput, conversation, navigate])

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
      {/* Layout type appel video FaceTime */}
      <div className="h-full flex flex-col">

        {/* Header minimal */}
        <div className="flex-shrink-0 px-4 py-3 bg-black/50 backdrop-blur-sm safe-area-top">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/app')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h1 className="text-white font-semibold text-lg">Alex</h1>
              <p className="text-white/60 text-xs">Mecanicien Expert</p>
            </div>

            <div className="w-10"></div>
          </div>
        </div>

        {/* Video principale : ALEX (grand ecran) */}
        <div className="flex-1 relative overflow-hidden">
          <AlexAvatar3D
            isSpeaking={isSpeaking}
            isListening={isListening}
            emotion={emotion}
          />

          {/* Video user (Picture-in-Picture style FaceTime) */}
          <div className="absolute top-4 right-4 w-28 h-40 md:w-36 md:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!streaming && (
              <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center gap-2">
                <button
                  onClick={startCamera}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <span className="text-white/60 text-xs">Camera</span>
              </div>
            )}

            {streaming && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/40 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-white text-xs">Live</span>
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="absolute top-4 left-4 right-36 p-3 bg-red-500/90 backdrop-blur-sm rounded-xl">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          {/* Transcription live (style sous-titres) */}
          {conversation.length > 0 && (
            <div className="absolute bottom-24 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 max-h-32 overflow-y-auto">
                <p className="text-white/40 text-xs mb-1">
                  {conversation[conversation.length - 1].role === 'user' ? 'Toi' : 'Alex'}
                </p>
                <p className="text-white text-sm leading-relaxed">
                  {conversation[conversation.length - 1].text}
                </p>
              </div>
            </div>
          )}

          {/* Indicateur analyse */}
          {analyzing && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-sm rounded-full">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-sm font-medium">Analyse en cours...</span>
              </div>
            </div>
          )}
        </div>

        {/* Controles bas (style appel video) */}
        <div className="flex-shrink-0 px-4 py-4 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent safe-area-bottom">

          {/* Input question */}
          <div className="mb-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !analyzing && !isSpeaking && streaming && handleAnalyze()}
              placeholder="Pose une question a Alex..."
              disabled={!streaming || analyzing || isSpeaking}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-center gap-6">

            {/* Bouton analyser */}
            <button
              onClick={handleAnalyze}
              disabled={!streaming || analyzing || isSpeaking}
              className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-lg"
              title="Analyser"
            >
              {analyzing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>

            {/* Bouton raccrocher */}
            <button
              onClick={stopCamera}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg"
              title="Raccrocher"
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hint */}
          {!streaming && (
            <p className="text-center text-white/40 text-xs mt-4">
              Active la camera pour commencer l'analyse
            </p>
          )}
          {streaming && !analyzing && !isSpeaking && (
            <p className="text-center text-white/40 text-xs mt-4">
              Appuie sur le bouton eclair pour analyser ta voiture
            </p>
          )}
          {isSpeaking && (
            <p className="text-center text-green-400 text-xs mt-4">
              Alex parle...
            </p>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
