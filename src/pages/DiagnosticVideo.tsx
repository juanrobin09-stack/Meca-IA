import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import PaywallModal from '@/components/PaywallModal'
import { Video, Camera, StopCircle, RotateCcw, Loader2, AlertTriangle, CheckCircle2, Wrench, Euro, Clock, Search, MapPin, Upload, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface DiagnosticResult {
  description_visuelle: string
  probleme_identifie: string
  causes_possibles: string[]
  urgence: 'faible' | 'moyenne' | 'élevée' | 'critique'
  pieces_concernees: string[]
  estimation_cout: { min: number; max: number }
  recommandations: string
}

export default function DiagnosticVideo() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const [showPaywall, setShowPaywall] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
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
        setVideoBlob(blob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      setError(null)

      // Timer
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
    setVideoBlob(null)
    setResult(null)
    setError(null)
    setRecordingTime(0)
    setSaved(false)
  }, [recordedVideo])

  const handleImportVideo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Le fichier doit être une vidéo (MP4, WebM, MOV...)')
      return
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('La vidéo est trop lourde (max 50 Mo)')
      return
    }

    const url = URL.createObjectURL(file)
    setRecordedVideo(url)
    setVideoBlob(file)
    setError(null)
    setSaved(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [isPremium])

  const saveToHistory = useCallback(async () => {
    if (!user || !result) return

    setIsSaving(true)
    try {
      // Generate thumbnail from first frame
      let thumbnailBase64 = null
      if (videoBlob) {
        try {
          const frames = await extractFrames(videoBlob, 1)
          thumbnailBase64 = frames[0] || null
        } catch {
          // Ignore thumbnail errors
        }
      }

      const { error: dbError } = await supabase
        .from('video_diagnostics')
        .insert({
          user_id: user.id,
          probleme_identifie: result.probleme_identifie,
          description_visuelle: result.description_visuelle,
          causes_possibles: result.causes_possibles,
          urgence: result.urgence,
          pieces_concernees: result.pieces_concernees,
          estimation_cout_min: result.estimation_cout.min,
          estimation_cout_max: result.estimation_cout.max,
          recommandations: result.recommandations,
          thumbnail_url: thumbnailBase64 ? `data:image/jpeg;base64,${thumbnailBase64}` : null,
        })

      if (dbError) {
        console.error('Error saving video diagnostic:', dbError)
        setError('Erreur lors de la sauvegarde')
        return
      }

      setSaved(true)
    } catch (err) {
      console.error('Save error:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [user, result, videoBlob])

  const analyzeVideo = useCallback(async () => {
    if (!recordedVideo) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Fetch the blob from URL
      const response = await fetch(recordedVideo)
      const blob = await response.blob()

      // Extract frames from video (we'll send as images)
      const frames = await extractFrames(blob, 5)

      // Send to API
      const apiResponse = await fetch('/.netlify/functions/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        },
        body: JSON.stringify({ frames })
      })

      if (!apiResponse.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const data = await apiResponse.json()
      setResult(data)
    } catch (err) {
      console.error('Analysis error:', err)
      setError("Erreur lors de l'analyse de la vidéo. Veuillez réessayer.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [recordedVideo])

  const extractFrames = async (blob: Blob, count: number): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(blob)
      video.muted = true

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = 640
        canvas.height = 480

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          const base64 = dataUrl.split(',')[1]
          frames.push(base64)
          frameIndex++
          captureFrame()
        }

        captureFrame()
      }
    })
  }

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'critique': return 'bg-red-600 text-white'
      case 'élevée': return 'bg-orange-500 text-white'
      case 'moyenne': return 'bg-yellow-500 text-white'
      case 'faible': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getUrgencyIcon = (urgence: string) => {
    switch (urgence) {
      case 'critique': return '🚨'
      case 'élevée': return '⚠️'
      case 'moyenne': return '⚡'
      case 'faible': return '✅'
      default: return '❓'
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Video className="h-8 w-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">Diagnostic Vidéo IA</h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">Premium</Badge>
              </div>
              <p className="text-muted-foreground">
                Filmez le problème (bruit, fumée, voyant...) et notre IA l'analyse
              </p>
            </motion.div>

            {/* Disclaimer */}
            <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                L'analyse vidéo est basée sur l'IA et peut ne pas détecter tous les problèmes.
                En cas de doute, faites vérifier par un professionnel certifié.
              </p>
            </div>

            {!result ? (
              <Card>
                <CardHeader>
                  <CardTitle>Comment ça marche ?</CardTitle>
                  <CardDescription>
                    Filmez votre problème pendant 15 à 30 secondes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Instructions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">🎥</div>
                      <div className="font-medium">15-30 sec</div>
                      <div className="text-muted-foreground text-xs">Durée idéale</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">🔊</div>
                      <div className="font-medium">Capturez le son</div>
                      <div className="text-muted-foreground text-xs">Bruits importants</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">💡</div>
                      <div className="font-medium">Bonne lumière</div>
                      <div className="text-muted-foreground text-xs">Si possible</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">📱</div>
                      <div className="font-medium">Stabilité</div>
                      <div className="text-muted-foreground text-xs">Tenez fermement</div>
                    </div>
                  </div>

                  {/* Video Area */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
                              <p>Cliquez sur "Commencer" pour activer la caméra</p>
                            </div>
                          </div>
                        )}
                        {isRecording && (
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white font-mono bg-black/50 px-2 py-1 rounded">
                              {recordingTime}s / 30s
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <video
                        src={recordedVideo}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <p className="text-red-700 dark:text-red-300">{error}</p>
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
                  <div className="flex flex-wrap gap-3 justify-center">
                    {!recordedVideo ? (
                      <>
                        {!isRecording ? (
                          <>
                            <Button size="lg" onClick={startRecording}>
                              <Camera className="h-5 w-5 mr-2" />
                              Filmer en direct
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="h-5 w-5 mr-2" />
                              Importer une vidéo
                            </Button>
                          </>
                        ) : (
                          <Button size="lg" variant="destructive" onClick={stopRecording}>
                            <StopCircle className="h-5 w-5 mr-2" />
                            Arrêter ({30 - recordingTime}s restantes)
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={resetRecording}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Refaire
                        </Button>
                        <Button size="lg" onClick={analyzeVideo} disabled={isAnalyzing}>
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Analyse en cours...
                            </>
                          ) : (
                            <>
                              <Search className="h-5 w-5 mr-2" />
                              Analyser la vidéo
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Urgency Header */}
                <Card className="border-2 border-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{getUrgencyIcon(result.urgence)}</span>
                        <div>
                          <h2 className="text-xl font-bold">{result.probleme_identifie}</h2>
                          <p className="text-muted-foreground">{result.description_visuelle}</p>
                        </div>
                      </div>
                      <Badge className={getUrgencyColor(result.urgence)}>
                        Urgence : {result.urgence}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Causes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Causes possibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.causes_possibles.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Parts & Cost */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        Pièces concernées
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.pieces_concernees.map((piece, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <span>{piece}</span>
                            <Link to={`/app/pieces?q=${encodeURIComponent(piece)}`}>
                              <Button size="sm" variant="outline">
                                <Search className="h-4 w-4 mr-1" />
                                Rechercher
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Euro className="h-5 w-5 text-green-600" />
                        Estimation coût
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-primary">
                          {result.estimation_cout.min}€ - {result.estimation_cout.max}€
                        </div>
                        <p className="text-muted-foreground mt-2">
                          Pièces + main d'œuvre estimés
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Recommandations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-800 dark:text-blue-200">{result.recommandations}</p>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" onClick={resetRecording}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Nouveau diagnostic
                  </Button>
                  {!saved ? (
                    <Button variant="secondary" onClick={saveToHistory} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <History className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link to="/app/history">
                      <Button variant="secondary">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Voir l'historique
                      </Button>
                    </Link>
                  )}
                  <Link to="/app/garages">
                    <Button>
                      <MapPin className="h-4 w-4 mr-2" />
                      Trouver un garage
                    </Button>
                  </Link>
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
