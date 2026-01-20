import { useState, useRef, useEffect } from 'react'
import { AlexAvatar3D } from '../components/AlexAvatar3D'
import { videoAnalysisService } from '../services/videoAnalysisService'
import { voiceService } from '../services/voiceService'
import { speechRecognitionService } from '../services/speechRecognitionService'

export default function VideoChatAlex() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [streaming, setStreaming] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Array<{ role: string; text: string }>>([])
  const [currentTranscript, setCurrentTranscript] = useState('')

  const startCamera = async () => {
    try {
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
      console.error('Camera error:', err)
      alert('Erreur caméra - Vérifiez les permissions')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setStreaming(false)
    window.history.back()
  }

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
  }

  const handleVoiceInput = () => {
    if (isListening) {
      speechRecognitionService.stopListening()
      setIsListening(false)
      return
    }

    if (!speechRecognitionService.isSupported()) {
      alert('Reconnaissance vocale non supportée sur ce navigateur')
      return
    }

    setIsListening(true)

    speechRecognitionService.startListening(
      (transcript) => {
        setCurrentTranscript(transcript)
        setIsListening(false)
        handleAnalyze(transcript)
      },
      () => {
        setIsListening(false)
      },
      (interim) => {
        setCurrentTranscript(interim)
      }
    )
  }

  const handleAnalyze = async (question?: string) => {
    const frameBase64 = captureFrame()
    if (!frameBase64) {
      alert("Active la caméra d'abord")
      return
    }

    setAnalyzing(true)

    try {
      const result = await videoAnalysisService.analyzeFrame(frameBase64, question)

      setConversation(prev => [...prev, { role: 'assistant', text: result.text }])

      await voiceService.speak(
        result.text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      )

      setCurrentTranscript('')
      setAnalyzing(false)
    } catch (error) {
      console.error('Analysis error:', error)
      alert("Erreur lors de l'analyse")
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      voiceService.stop()
      speechRecognitionService.stopListening()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* === HEADER MINIMAL === */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={stopCamera}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-white font-bold text-lg">Alex</h1>
            <p className="text-white/60 text-xs">Mécanicien Expert</p>
          </div>

          <div className="w-10"></div>
        </div>
      </div>

      {/* === ZONE PRINCIPALE === */}
      <div className="flex-1 relative">
        {/* VIDÉO USER (Full screen ou placeholder) */}
        {streaming ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <button
              onClick={startCamera}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Activer la Caméra
            </button>
          </div>
        )}

        {/* AVATAR ALEX - BAS DROITE (FIXÉ) */}
        {streaming && (
          <div className="absolute bottom-28 right-4 w-72 h-80 md:w-80 md:h-96 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
            <AlexAvatar3D isSpeaking={isSpeaking} isListening={isListening || analyzing} />
          </div>
        )}

        {/* TRANSCRIPTION - BAS GAUCHE */}
        {streaming && (conversation.length > 0 || currentTranscript) && (
          <div className="absolute bottom-28 left-4 right-80 md:right-[22rem] max-w-2xl">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
              {currentTranscript && (
                <div className="mb-3 flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                  <div>
                    <p className="text-blue-400 text-xs font-semibold mb-1">Toi</p>
                    <p className="text-white text-sm">{currentTranscript}</p>
                  </div>
                </div>
              )}

              {conversation.length > 0 && (
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                      isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-green-400/50'
                    }`}
                  ></div>
                  <div>
                    <p className="text-green-400 text-xs font-semibold mb-1">Alex</p>
                    <p className="text-white text-sm leading-relaxed">
                      {conversation[conversation.length - 1].text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* === CONTRÔLES BAS === */}
      {streaming && (
        <div className="flex-shrink-0 px-6 py-6 bg-gradient-to-t from-black via-black/95 to-transparent z-20">
          <div className="flex items-center justify-center gap-6">
            {/* MICRO */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleVoiceInput}
                disabled={analyzing || isSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isListening
                    ? 'bg-gradient-to-br from-red-500 to-pink-600 scale-110 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-105'
                } disabled:bg-gray-700 disabled:cursor-not-allowed active:scale-95`}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              <span className="text-white/80 text-xs font-semibold">
                {isListening ? 'Écoute...' : 'Parler'}
              </span>
            </div>

            {/* ANALYSER */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleAnalyze()}
                disabled={analyzing || isSpeaking}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xl active:scale-95"
              >
                {analyzing ? (
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
              <span className="text-white/80 text-xs font-semibold">{analyzing ? 'Analyse...' : 'Analyser'}</span>
            </div>

            {/* QUITTER */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={stopCamera}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:scale-105 flex items-center justify-center transition-all shadow-xl active:scale-95"
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-white/80 text-xs font-semibold">Quitter</span>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
