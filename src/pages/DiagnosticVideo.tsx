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
import { supabase } from '@/lib/supabase'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // 5. Save for future consistency (cache)
      setAnalysisStep('Sauvegarde...')
      await VideoHashService.saveAnalysis(user.id, videoHash, analysisResult)

      // 6. Save to history (video_diagnostics table)
      try {
        // Map urgency values to match database constraint
        const mapUrgency = (urgence: string): string => {
          const mapping: Record<string, string> = {
            'critique': 'critique',
            'important': 'élevée',
            'moyen': 'moyenne',
            'faible': 'faible'
          }
          return mapping[urgence] || 'moyenne'
        }

        const historyData = {
          user_id: user.id,
          probleme_identifie: analysisResult.verdict?.diagnostic || analysisResult.synthesis?.probleme_principal || 'Diagnostic vidéo',
          description_visuelle: analysisResult.frames_analyses?.map(f => f.observations.join(', ')).join(' | ') || '',
          causes_possibles: analysisResult.synthesis?.causes_probables?.map(c => c.cause) || [],
          urgence: mapUrgency(analysisResult.verdict?.urgence || analysisResult.synthesis?.urgence || 'moyen'),
          pieces_concernees: analysisResult.verdict?.pieces_a_remplacer || analysisResult.synthesis?.pieces_concernees || [],
          estimation_cout_min: analysisResult.verdict?.cout_estime?.pieces || 0,
          estimation_cout_max: analysisResult.verdict?.cout_estime?.total || 0,
          recommandations: analysisResult.verdict?.recommandations?.join('\n') || analysisResult.synthesis?.recommandations?.join('\n') || ''
        }

        const { error: historyError } = await supabase
          .from('video_diagnostics')
          .insert(historyData)

        if (historyError) {
          console.warn('Error saving video diagnostic to history:', historyError.message)
        } else {
          console.log('✅ Video diagnostic saved to history')
        }
      } catch (historyErr) {
        console.warn('Error saving to history:', historyErr)
      }

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
        <div className="min-h-screen gradient-mesh">
          <Sidebar />
          <main className="md:pl-64">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 md:pb-8 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 mb-6">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-primary-text">
                  Diagnostic Vidéo IA Pro
                </h1>
                <p className="text-xl mb-8 text-muted-foreground">
                  Fonctionnalité Premium Exclusive
                </p>

                <div className="glass-card rounded-2xl p-6 mb-8 max-w-lg mx-auto">
                  <p className="text-lg mb-4 font-medium">
                    Filme ton problème, notre IA analyse la vidéo image par image
                  </p>
                  <ul className="text-left space-y-3 max-w-md mx-auto">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                      <span>Analyse frame par frame avec Vision IA</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                      <span>Détection anomalies visuelles précises</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                      <span>Diagnostic expert avec prix réels 2026</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                      <span>Niveau de confiance du diagnostic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-500 flex-shrink-0" />
                      <span>Même vidéo = Même résultat garanti</span>
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-bold shadow-glow-sm transition-all duration-300 hover:shadow-glow"
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
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="md:pl-64">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 md:pb-8 max-w-4xl">
            <motion.div
              className="mb-4 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Diagnostic Vidéo IA</h1>
                <Badge className="text-[10px] sm:text-xs border-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 text-white shadow-sm">Premium</Badge>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vision IA • Détection anomalies • Résultat garanti
              </p>
            </motion.div>

            {/* Disclaimer - Glass card amber tinted */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl glass-card border-amber-300/30 dark:border-amber-700/30 text-xs sm:text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2 sm:gap-3" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.04) 100%)' }}>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-500" />
              <p className="break-words">
                Analyse IA à titre indicatif. Consultez un mécanicien pour confirmation.
              </p>
            </div>

            {!result ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Upload/Record Card */}
                <Card className="glass-card border-white/10 dark:border-white/5">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FileVideo className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                      Vidéo du problème
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Filme ou importe une vidéo (10-30 sec)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    {/* Instructions - Glass card style boxes */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center text-xs sm:text-sm">
                      <div className="p-2 sm:p-3 glass-card rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">🎥</div>
                        <div className="font-medium text-[10px] sm:text-sm">10-30s</div>
                      </div>
                      <div className="p-2 sm:p-3 glass-card rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">📍</div>
                        <div className="font-medium text-[10px] sm:text-sm">20-50cm</div>
                      </div>
                      <div className="p-2 sm:p-3 glass-card rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">💡</div>
                        <div className="font-medium text-[10px] sm:text-sm">Lumière</div>
                      </div>
                      <div className="p-2 sm:p-3 glass-card rounded-lg sm:rounded-xl">
                        <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">📱</div>
                        <div className="font-medium text-[10px] sm:text-sm">Stable</div>
                      </div>
                    </div>

                    {/* Video Area */}
                    <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden transition-shadow duration-300 ${isRecording ? 'ring-2 ring-violet-500 shadow-glow-sm' : ''}`}>
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
                              <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse shadow-glow-sm" />
                              <span className="text-white font-mono bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">
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

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-center">
                      {!recordedVideo ? (
                        <>
                          {!isRecording ? (
                            <>
                              <Button
                                size="lg"
                                onClick={startRecording}
                                className="w-full sm:w-auto text-sm sm:text-base py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white shadow-glow-sm transition-all duration-300 hover:shadow-glow"
                              >
                                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Filmer
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full sm:w-auto text-sm sm:text-base py-3 glass border-violet-200/30 dark:border-violet-700/30 hover:border-violet-400/50 dark:hover:border-violet-500/50"
                              >
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
                        <Button
                          variant="outline"
                          onClick={resetRecording}
                          className="w-full sm:w-auto glass border-violet-200/30 dark:border-violet-700/30 hover:border-violet-400/50 dark:hover:border-violet-500/50"
                        >
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
                    <Card className="glass-card border-white/10 dark:border-white/5">
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
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
                          className="h-20 sm:h-24 resize-none text-base sm:text-sm focus:ring-violet-500 focus:border-violet-500 focus-visible:ring-violet-500"
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
                      className={`w-full mt-4 sm:mt-6 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 active:scale-98 shadow-glow-sm transition-all duration-300 hover:shadow-glow ${isAnalyzing ? 'shimmer' : ''}`}
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

                {/* Tips - Violet tinted glass card */}
                <Card className="glass-card border-violet-200/30 dark:border-violet-700/20" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(124,58,237,0.03) 100%)' }}>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="text-violet-900 dark:text-violet-100 flex items-center gap-2 text-sm sm:text-base">
                      <Lightbulb className="h-4 w-4 text-violet-500" />
                      Conseils
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-violet-800 dark:text-violet-200">
                      <li className="flex items-start gap-2">
                        <span className="text-violet-500">-</span>
                        <span>Filme de près (20-50cm)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-500">-</span>
                        <span>Bonne lumière = meilleure analyse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-500">-</span>
                        <span>Capture le problème en action</span>
                      </li>
                      <li className="hidden sm:flex items-start gap-2">
                        <span className="text-violet-500">-</span>
                        <span>Montre différents angles</span>
                      </li>
                      <li className="hidden sm:flex items-start gap-2">
                        <span className="text-violet-500">-</span>
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
                  <Button
                    variant="outline"
                    onClick={resetRecording}
                    className="glass border-violet-200/30 dark:border-violet-700/30 hover:border-violet-400/50 dark:hover:border-violet-500/50 transition-all duration-300"
                  >
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
