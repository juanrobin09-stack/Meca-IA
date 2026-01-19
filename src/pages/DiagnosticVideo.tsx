import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import PaywallModal from '@/components/PaywallModal'
import ResultatAnalyseVideo from '@/components/ResultatAnalyseVideo'
import { VideoHashService } from '@/services/videoHashService'
import type { VideoAnalysisResult } from '@/types/video'
import {
  Video,
  Camera,
  StopCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Sparkles,
  FileVideo,
  Lightbulb
} from 'lucide-react'

export default function DiagnosticVideo() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const [showPaywall, setShowPaywall] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setRecordedVideo(url)
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' })
        setVideoFile(file)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      setError(null)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording()
            return 30
          }
          return prev + 1
        })
      }, 1000)

    } catch (err) {
      console.error('Error accessing camera:', err)
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
    }
  }, [isPremium])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
  }, [])

  const resetRecording = useCallback(() => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }
    setRecordedVideo(null)
    setVideoFile(null)
    setResult(null)
    setError(null)
    setRecordingTime(0)
    setFromCache(false)
    setUserDescription('')
    setAnalysisStep('')
  }, [recordedVideo])

  const handleImportVideo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Le fichier doit être une vidéo (MP4, WebM, MOV...)')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('La vidéo est trop lourde (max 50 Mo)')
      return
    }

    const url = URL.createObjectURL(file)
    setRecordedVideo(url)
    setVideoFile(file)
    setError(null)
    setFromCache(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [isPremium])

  const extractFrames = async (blob: Blob, count: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(blob)
      video.muted = true
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = 800
        canvas.height = 600

        const frames: string[] = []
        const duration = video.duration
        const interval = duration / (count + 1)

        let frameIndex = 0

        const captureFrame = () => {
          if (frameIndex >= count) {
            URL.revokeObjectURL(video.src)
            resolve(frames)
            return
          }
          video.currentTime = interval * (frameIndex + 1)
        }

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          const base64 = dataUrl.split(',')[1]
          frames.push(base64)
          frameIndex++
          captureFrame()
        }

        video.onerror = () => {
          URL.revokeObjectURL(video.src)
          reject(new Error('Erreur de lecture vidéo'))
        }

        captureFrame()
      }

      video.onerror = () => {
        reject(new Error('Impossible de charger la vidéo'))
      }
    })
  }

  const analyzeVideo = useCallback(async () => {
    if (!videoFile || !user) return

    setIsAnalyzing(true)
    setError(null)
    setFromCache(false)
    setAnalysisStep('Préparation de la vidéo...')

    try {
      // 1. Generate hash for consistency
      setAnalysisStep('Génération de l\'empreinte vidéo...')
      const videoHash = await VideoHashService.generateVideoHash(videoFile)

      // 2. Check if already analyzed
      setAnalysisStep('Vérification du cache...')
      const existingAnalysis = await VideoHashService.checkExistingAnalysis(user.id, videoHash)

      if (existingAnalysis) {
        console.log('✅ Vidéo déjà analysée - Résultat identique garanti')
        setResult({ ...existingAnalysis.analysis_result, fromCache: true })
        setFromCache(true)
        setIsAnalyzing(false)
        setAnalysisStep('')
        return
      }

      // 3. Extract frames
      setAnalysisStep('Extraction des frames clés...')
      const frames = await extractFrames(videoFile, 5)
      console.log(`📸 ${frames.length} frames extraits`)

      // 4. Call AI analysis
      setAnalysisStep('Analyse IA en cours... (30-60 secondes)')
      const response = await fetch('/.netlify/functions/analyze-video-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames,
          vehicle: null, // TODO: add vehicle selection
          userDescription: userDescription || undefined,
          userId: user.id
        })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Service d\'analyse temporairement indisponible')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur serveur')
      }

      const analysisResult = await response.json() as VideoAnalysisResult
      setResult(analysisResult)

      // 5. Save for future consistency
      setAnalysisStep('Sauvegarde...')
      await VideoHashService.saveAnalysis(user.id, videoHash, analysisResult)

    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }, [videoFile, user, userDescription])

  // Premium gate
  if (!isPremium) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-muted/40">
          <Sidebar />
          <main className="md:pl-64 pb-20 md:pb-0">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="text-7xl mb-6">🎥</div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Diagnostic Vidéo IA Pro
                </h1>
                <p className="text-xl mb-8 opacity-90">
                  Fonctionnalité Premium Exclusive
                </p>

                <div className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-8 max-w-lg mx-auto">
                  <p className="text-lg mb-4">
                    Filme ton problème, notre IA analyse la vidéo image par image
                  </p>
                  <ul className="text-left space-y-3 max-w-md mx-auto">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                      <span>Analyse frame par frame avec Vision IA</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                      <span>Détection anomalies visuelles précises</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                      <span>Diagnostic expert avec prix réels 2026</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                      <span>Niveau de confiance du diagnostic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                      <span>Même vidéo = Même résultat garanti</span>
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-bold"
                  onClick={() => setShowPaywall(true)}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Passer à Premium (9,99€/mois)
                </Button>
              </motion.div>
            </div>
          </main>

          <PaywallModal
            open={showPaywall}
            onOpenChange={setShowPaywall}
            mode="diagnostic"
            title="Diagnostic Vidéo Premium"
            subtitle="Passe Premium pour accéder au diagnostic vidéo IA illimité"
          />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-24 md:pb-0">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
            <motion.div
              className="mb-4 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Diagnostic Vidéo IA</h1>
                <Badge variant="premium" className="text-[10px] sm:text-xs">✨ Premium</Badge>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vision IA • Détection anomalies • Résultat garanti
              </p>
            </motion.div>

            {/* Disclaimer - Compact on mobile */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
              <p className="break-words">
                Analyse IA à titre indicatif. Consultez un mécanicien pour confirmation.
              </p>
            </div>

            {!result ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Upload/Record Card */}
                <Card>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FileVideo className="h-4 w-4 sm:h-5 sm:w-5" />
                      Vidéo du problème
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Filme ou importe une vidéo (10-30 sec)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    {/* Instructions - Compact 2x2 grid on mobile */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center text-xs sm:text-sm">
                      <div className="p-2 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">🎥</div>
                        <div className="font-medium text-[10px] sm:text-sm">10-30s</div>
                      </div>
                      <div className="p-2 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">📍</div>
                        <div className="font-medium text-[10px] sm:text-sm">20-50cm</div>
                      </div>
                      <div className="p-2 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">💡</div>
                        <div className="font-medium text-[10px] sm:text-sm">Lumière</div>
                      </div>
                      <div className="p-2 sm:p-3 bg-muted rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">📱</div>
                        <div className="font-medium text-[10px] sm:text-sm">Stable</div>
                      </div>
                    </div>

                    {/* Video Area */}
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                      {!recordedVideo ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {!isRecording && !streamRef.current && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                              <div className="text-center text-white">
                                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Clique sur "Filmer" ou importe une vidéo</p>
                              </div>
                            </div>
                          )}
                          {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-white font-mono bg-black/50 px-3 py-1 rounded-lg">
                                {recordingTime}s / 30s
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <video
                          src={recordedVideo}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/*"
                      onChange={handleImportVideo}
                      className="hidden"
                    />

                    {/* Buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-center">
                      {!recordedVideo ? (
                        <>
                          {!isRecording ? (
                            <>
                              <Button size="lg" onClick={startRecording} className="w-full sm:w-auto text-sm sm:text-base py-3">
                                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Filmer
                              </Button>
                              <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto text-sm sm:text-base py-3">
                                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Importer
                              </Button>
                            </>
                          ) : (
                            <Button size="lg" variant="destructive" onClick={stopRecording} className="w-full sm:w-auto text-sm sm:text-base py-3">
                              <StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Arrêter ({30 - recordingTime}s)
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button variant="outline" onClick={resetRecording} className="w-full sm:w-auto">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Changer de vidéo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Description Card - Only show when video is ready */}
                {recordedVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                          Description (optionnel)
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Décris le problème pour une meilleure analyse
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={userDescription}
                          onChange={(e) => setUserDescription(e.target.value)}
                          placeholder="Ex: Grincement au freinage depuis 2 semaines..."
                          className="h-20 sm:h-24 resize-none text-base sm:text-sm"
                          maxLength={500}
                        />
                        <div className="text-[10px] sm:text-xs text-muted-foreground text-right mt-1">
                          {userDescription.length}/500
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analyze Button */}
                    <Button
                      size="lg"
                      className="w-full mt-4 sm:mt-6 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-98"
                      onClick={analyzeVideo}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                          <div className="text-left">
                            <div className="text-sm sm:text-base">Analyse...</div>
                            {analysisStep && (
                              <div className="text-xs sm:text-sm opacity-75 truncate max-w-[200px]">{analysisStep}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                          Analyser avec l'IA
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Tips - Collapsed on mobile */}
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2 text-sm sm:text-base">
                      💡 Conseils
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>Filme de près (20-50cm)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>Bonne lumière = meilleure analyse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>Capture le problème en action</span>
                      </li>
                      <li className="hidden sm:flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>Montre différents angles</span>
                      </li>
                      <li className="hidden sm:flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>Active le son pour les bruits</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <ResultatAnalyseVideo data={{ ...result, fromCache }} />

                <div className="flex justify-center">
                  <Button variant="outline" onClick={resetRecording}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Nouveau diagnostic vidéo
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </main>

        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          mode="diagnostic"
          title="Diagnostic Vidéo Premium"
          subtitle="Passe Premium pour accéder au diagnostic vidéo IA illimité"
        />
      </div>
    </PageTransition>
  )
}
