import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlexAvatar3D } from '@/components/AlexAvatar3D'
import { voiceService } from '@/services/voiceService'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import Sidebar from '@/components/Sidebar'

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
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'thinking' | 'concerned'>('neutral')
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

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

  // Premium gate
  if (!isPremium) {
    return (
      <>
        <Sidebar />
        <div className="md:ml-64 min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6">🎥</div>
            <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">Feature Premium</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Le chat vidéo avec Alex est réservé aux membres Premium.
              Montre ta voiture en direct et reçois des conseils personnalisés !
            </p>
            <Link
              to="/pricing"
              className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl transition-all"
            >
              Passer à Premium
            </Link>
            <p className="mt-4 text-sm text-neutral-500">9,99€/mois - Sans engagement</p>
          </div>
        </div>
      </>
    )
  }

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
      console.error('Erreur caméra:', err)
      setError('Impossible d\'accéder à la caméra. Vérifie les permissions.')
    }
  }

  // Stop camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
    voiceService.stop()
    setIsSpeaking(false)
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

    // Get base64 without the data URL prefix
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
  }

  // Analyze frame
  const handleAnalyze = async () => {
    const frameBase64 = captureFrame()
    if (!frameBase64) {
      setError('Aucune image capturée. Active la caméra d\'abord.')
      return
    }

    setAnalyzing(true)
    setEmotion('thinking')
    setError(null)

    try {
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

      setEmotion(result.emotion)

      // Alex speaks
      voiceService.speak(
        result.text,
        () => setIsSpeaking(true),
        () => {
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
  }

  // Reset conversation
  const resetConversation = () => {
    setConversation([])
    setUserInput('')
    voiceService.stop()
    setIsSpeaking(false)
    setEmotion('neutral')
  }

  return (
    <>
      <Sidebar />

      <div className="md:ml-64 min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 pb-24 md:pb-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/app')}
              className="mb-4 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ← Retour
            </button>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                Chat Vidéo Live
              </h1>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                PREMIUM
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Montre ta voiture en direct, Alex l'analyse en temps réel 🔧
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">

            {/* AVATAR ALEX */}
            <div className="space-y-4 order-2 lg:order-1">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-xl shadow-lg">
                      🔧
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-neutral-900 dark:text-white">Alex</h2>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {isSpeaking ? '🗣️ Parle...' : analyzing ? '🤔 Analyse...' : '👋 Prêt à t\'aider'}
                      </p>
                    </div>
                  </div>
                  {conversation.length > 0 && (
                    <button
                      onClick={resetConversation}
                      className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      Nouvelle conv.
                    </button>
                  )}
                </div>

                {/* Avatar 3D */}
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                  <AlexAvatar3D isSpeaking={isSpeaking} emotion={emotion} />
                </div>
              </div>

              {/* Conversation History */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-4 h-48 lg:h-60 overflow-y-auto">
                <h3 className="font-bold mb-3 text-neutral-900 dark:text-white text-sm">Conversation</h3>
                {conversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-neutral-400 italic text-center">
                      Active la caméra et clique sur "Analyser"<br />pour commencer...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversation.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl ${
                          msg.role === 'user'
                            ? 'bg-blue-50 dark:bg-blue-950/50 ml-4'
                            : 'bg-neutral-100 dark:bg-neutral-800 mr-4'
                        }`}
                      >
                        <p className="text-xs text-neutral-500 mb-1">
                          {msg.role === 'user' ? 'Toi' : '🔧 Alex'}
                        </p>
                        <p className="text-sm text-neutral-900 dark:text-white">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={conversationEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* VIDEO USER */}
            <div className="space-y-4 order-1 lg:order-2">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-4">
                <h2 className="font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Ta Voiture</span>
                  {streaming && (
                    <span className="flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live
                    </span>
                  )}
                </h2>

                {/* Video */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {!streaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                      <button
                        onClick={startCamera}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all"
                      >
                        📹 Activer Caméra
                      </button>
                    </div>
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2 animate-pulse">🔬</div>
                        <p>Analyse en cours...</p>
                      </div>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Controls */}
                {streaming && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !analyzing && !isSpeaking) {
                          handleAnalyze()
                        }
                      }}
                      placeholder="Pose une question à Alex (optionnel)..."
                      disabled={analyzing || isSpeaking}
                      className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-base"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing || isSpeaking}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzing ? '🔄 Analyse...' : isSpeaking ? '🗣️ Alex parle...' : '🔬 Analyser'}
                      </button>

                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition-all"
                        title="Arrêter la caméra"
                      >
                        ⏹️
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 text-sm">💡 Conseils pour une bonne analyse</h3>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Bonne lumière (plein jour idéal)</li>
                  <li>• Approche-toi des zones problématiques</li>
                  <li>• Tiens le téléphone stable</li>
                  <li>• Attends qu'Alex ait fini de parler avant la prochaine analyse</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
