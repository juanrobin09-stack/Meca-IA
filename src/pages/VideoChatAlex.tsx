import { useState, useRef, useEffect } from 'react'
import { AlexAvatar3D } from '../components/AlexAvatar3D'
import videoAnalysisService from '../services/videoAnalysisService'
import voiceService from '../services/voiceService'
import speechRecognitionService from '../services/speechRecognitionService'

export default function VideoChatAlex() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [streaming, setStreaming] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Array<{role: string, text: string}>>([])
  const [currentTranscript, setCurrentTranscript] = useState('')

  const startCamera = async () => {
    console.log('📹 Démarrage caméra...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      console.log('✅ Stream obtenu:', stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)
        console.log('✅ Vidéo active')
      }
    } catch (err) {
      console.error('❌ Erreur caméra:', err)
      alert(`Erreur caméra: ${err}`)
    }
  }

  const stopCamera = () => {
    console.log('⏹️ Arrêt caméra')

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => {
        console.log('Stop track:', track.label)
        track.stop()
      })
      videoRef.current.srcObject = null
    }

    setStreaming(false)
    voiceService.stop()
    speechRecognitionService.stopListening()
  }

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video ou canvas manquant')
      return null
    }

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    console.log('📸 Frame capturée:', dataUrl.substring(0, 50) + '...')

    return dataUrl.split(',')[1]
  }

  const handleVoiceInput = () => {
    if (isListening) {
      speechRecognitionService.stopListening()
      setIsListening(false)
      return
    }

    setIsListening(true)

    speechRecognitionService.startListening(
      (transcript) => {
        console.log('🎤 Transcrit:', transcript)
        setCurrentTranscript(transcript)
        setIsListening(false)
        handleAnalyze(transcript)
      },
      (error) => {
        console.error('❌ Erreur micro:', error)
        setIsListening(false)
        alert(`Erreur: ${error}`)
      }
    )
  }

  const handleAnalyze = async (question?: string) => {
    console.log('🔬 Début analyse, question:', question)

    if (!streaming) {
      alert('Active la caméra d\'abord')
      return
    }

    const frameBase64 = captureFrame()
    if (!frameBase64) {
      alert('Impossible de capturer l\'image')
      return
    }

    setAnalyzing(true)

    try {
      const result = await videoAnalysisService.analyzeFrame(frameBase64, question)
      console.log('✅ Résultat:', result)

      setConversation(prev => [...prev, { role: 'assistant', text: result.text }])

      console.log('🗣️ Alex va parler:', result.text)

      await voiceService.speak(
        result.text,
        () => {
          console.log('▶️ Parle')
          setIsSpeaking(true)
        },
        () => {
          console.log('⏸️ Fin')
          setIsSpeaking(false)
        }
      )

      setCurrentTranscript('')
      setAnalyzing(false)

    } catch (error) {
      console.error('❌ Erreur analyse:', error)
      alert('Erreur lors de l\'analyse')
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    console.log('🎬 Composant monté')

    return () => {
      console.log('🧹 Cleanup')
      stopCamera()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black flex flex-col">

      {/* HEADER */}
      <div className="flex-shrink-0 px-4 py-4 bg-black/90 z-30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              stopCamera()
              window.history.back()
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-white font-bold">Alex</h1>
            <p className="text-white/60 text-xs">Mécanicien Expert</p>
          </div>

          <div className="w-10"></div>
        </div>
      </div>

      {/* ZONE PRINCIPALE */}
      <div className="flex-1 relative overflow-hidden">

        {!streaming ? (
          /* BOUTON ACTIVER CAMÉRA */
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform"
            >
              📹 Activer Camera
            </button>
          </div>
        ) : (
          /* VIDÉO + AVATAR */
          <>
            {/* Vidéo user FULL SCREEN */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Avatar BAS DROITE */}
            <div className="absolute bottom-24 right-4 w-72 h-80 z-10">
              <AlexAvatar3D
                isSpeaking={isSpeaking}
                isListening={isListening || analyzing}
              />
            </div>

            {/* Transcription BAS GAUCHE */}
            {(conversation.length > 0 || currentTranscript) && (
              <div className="absolute bottom-24 left-4 right-80 z-10">
                <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20">

                  {currentTranscript && (
                    <div className="mb-2 flex items-start gap-2">
                      <div className="w-2 h-2 mt-1 bg-blue-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-blue-400 text-xs font-bold mb-1">Toi</p>
                        <p className="text-white text-sm">{currentTranscript}</p>
                      </div>
                    </div>
                  )}

                  {conversation.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-1 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-green-400 text-xs font-bold mb-1">Alex</p>
                        <p className="text-white text-sm">{conversation[conversation.length - 1].text}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CONTRÔLES */}
      {streaming && (
        <div className="flex-shrink-0 px-6 py-6 bg-black/90 z-30">
          <div className="flex items-center justify-center gap-6">

            {/* MICRO */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleVoiceInput}
                disabled={analyzing || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-95 ${
                  isListening
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-blue-500'
                } disabled:bg-gray-700`}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <span className="text-white text-xs">{isListening ? 'Écoute' : 'Parler'}</span>
            </div>

            {/* ANALYSER */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleAnalyze()}
                disabled={analyzing || isSpeaking}
                className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center shadow-xl active:scale-95 disabled:bg-gray-700"
              >
                {analyzing ? (
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
              <span className="text-white text-xs">Analyser</span>
            </div>

            {/* QUITTER */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  stopCamera()
                  window.history.back()
                }}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl active:scale-95"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-white text-xs">Quitter</span>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
