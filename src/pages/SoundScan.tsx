import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import PaywallModal from '@/components/PaywallModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Mic, MicOff, StopCircle, RotateCcw, Loader2,
  AlertTriangle, CheckCircle2, Sparkles, Volume2,
  Lightbulb, Waves, Radio
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SoundDiagnosticResult {
  status: 'coming_soon' | 'success'
  message: string
  probleme?: string
  confiance?: number
  description?: string
  causes?: string[]
  urgence?: 'faible' | 'moyen' | 'élevé' | 'critique'
  coutEstime?: { min: number; max: number }
  recommandations?: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECORDING_SECONDS = 30
const WAVEFORM_BAR_COUNT = 40

const ANALYSIS_STEPS = [
  'Analyse du spectre audio...',
  'Identification des fréquences anormales...',
  'Comparaison avec la base de données...',
  'Génération du diagnostic...',
]

const RECORDING_TIPS = [
  { icon: '🔧', text: 'Moteur allumé pour les bruits moteur' },
  { icon: '🪟', text: 'Fenêtres fermées pour réduire le bruit ambiant' },
  { icon: '⏱️', text: '10-20 secondes suffisent' },
  { icon: '🔁', text: 'Reproduis le bruit pendant l\'enregistrement' },
]

// ---------------------------------------------------------------------------
// Helper: format seconds as mm:ss
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Component: WaveformVisualizer
// ---------------------------------------------------------------------------

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16 sm:h-20 px-4">
      {Array.from({ length: WAVEFORM_BAR_COUNT }).map((_, i) => {
        // Each bar gets a unique animation delay to create a wave effect
        const delay = (i / WAVEFORM_BAR_COUNT) * 0.8
        return (
          <motion.div
            key={i}
            className="w-[3px] sm:w-1 rounded-full"
            style={{
              background: `linear-gradient(to top, #8b5cf6, #06b6d4)`,
            }}
            animate={
              isActive
                ? {
                    height: [8, 24 + Math.random() * 40, 12, 32 + Math.random() * 32, 8],
                    opacity: [0.5, 1, 0.7, 1, 0.5],
                  }
                : {
                    height: [6, 10, 6],
                    opacity: [0.25, 0.4, 0.25],
                  }
            }
            transition={
              isActive
                ? {
                    duration: 0.6 + Math.random() * 0.5,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    delay,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    delay,
                    ease: 'easeInOut',
                  }
            }
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component: AnalysisLoader
// ---------------------------------------------------------------------------

function AnalysisLoader({ step, progress }: { step: string; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-background to-cyan-950/40 backdrop-blur-sm overflow-hidden">
        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Animated icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
                <Waves className="h-10 w-10 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-violet-400/40"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
            </motion.div>
          </div>

          {/* Step text with shimmer */}
          <div className="text-center">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm sm:text-base font-medium text-violet-200"
            >
              {step}
            </motion.p>
          </div>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-violet-950/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500"
                style={{ backgroundSize: '200% 100%' }}
                initial={{ width: '0%' }}
                animate={{
                  width: `${progress}%`,
                  backgroundPosition: ['0% 0%', '100% 0%'],
                }}
                transition={{
                  width: { duration: 0.5, ease: 'easeOut' },
                  backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">{Math.round(progress)}%</p>
          </div>

          {/* Steps list */}
          <div className="space-y-2 max-w-sm mx-auto">
            {ANALYSIS_STEPS.map((s, i) => {
              const currentIndex = ANALYSIS_STEPS.indexOf(step)
              const isDone = i < currentIndex
              const isCurrent = s === step
              return (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-2 text-xs sm:text-sm transition-colors ${
                    isDone
                      ? 'text-emerald-400'
                      : isCurrent
                        ? 'text-violet-300 font-medium'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span>{s}</span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Component: ResultCard
// ---------------------------------------------------------------------------

function ResultCard({
  result,
  onReset,
}: {
  result: SoundDiagnosticResult
  onReset: () => void
}) {
  if (result.status === 'coming_soon') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-background to-cyan-950/30 backdrop-blur-sm overflow-hidden">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center mb-4">
                <Radio className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Analyse terminée
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                {result.message}
              </p>
            </div>

            {/* Placeholder structure for future real results */}
            <div className="grid gap-4 max-w-lg mx-auto text-left">
              {/* Problem identified */}
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300 uppercase tracking-wider">
                    Problème identifié
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Disponible prochainement
                </p>
              </div>

              {/* Confidence level */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
                    Niveau de confiance
                  </span>
                </div>
                <div className="h-2 bg-cyan-950/60 rounded-full overflow-hidden">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">--</p>
              </div>

              {/* Causes */}
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300 uppercase tracking-wider">
                    Causes possibles
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  L'IA analysera les fréquences sonores pour identifier les causes potentielles.
                </p>
              </div>

              {/* Urgency & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-300 uppercase tracking-wider">
                      Urgence
                    </span>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                    --
                  </Badge>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">💰</span>
                    <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
                      Coût estimé
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">--</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
                    Recommandations
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Des recommandations personnalisées seront fournies avec l'analyse complète.
                </p>
              </div>
            </div>

            <Button
              onClick={onReset}
              className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Nouveau diagnostic
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Future: full result display when backend is connected
  return null
}

// ---------------------------------------------------------------------------
// Main: SoundScan page
// ---------------------------------------------------------------------------

export default function SoundScan() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const [showPaywall, setShowPaywall] = useState(false)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Description
  const [userDescription, setUserDescription] = useState('')

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [result, setResult] = useState<SoundDiagnosticResult | null>(null)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Start recording
  // ---------------------------------------------------------------------------

  const startRecording = useCallback(async () => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    try {
      setError(null)
      setResult(null)
      setHasRecording(false)
      setAudioBlob(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Set up Web Audio API analyser for visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setHasRecording(true)

        // Stop the stream
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
        }
        audioContextRef.current = null
        analyserRef.current = null
      }

      mediaRecorder.start(500)
      setIsRecording(true)
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            // Auto-stop at max
            stopRecording()
            return MAX_RECORDING_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError(
        "Impossible d'accéder au microphone. Vérifie les permissions de ton navigateur."
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium])

  // ---------------------------------------------------------------------------
  // Stop recording
  // ---------------------------------------------------------------------------

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }, [])

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const resetRecording = useCallback(() => {
    if (
      streamRef.current
    ) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    setHasRecording(false)
    setAudioBlob(null)
    setUserDescription('')
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
    setAnalysisStep('')
    setAnalysisProgress(0)
  }, [])

  // ---------------------------------------------------------------------------
  // Analyze audio (simulated for now)
  // ---------------------------------------------------------------------------

  const analyzeAudio = useCallback(async () => {
    if (!audioBlob || !user) return

    setIsAnalyzing(true)
    setError(null)

    try {
      setAnalysisStep(ANALYSIS_STEPS[0])
      setAnalysisProgress(10)
      await new Promise((r) => setTimeout(r, 1500))

      setAnalysisStep(ANALYSIS_STEPS[1])
      setAnalysisProgress(35)
      await new Promise((r) => setTimeout(r, 1500))

      setAnalysisStep(ANALYSIS_STEPS[2])
      setAnalysisProgress(65)
      await new Promise((r) => setTimeout(r, 1200))

      setAnalysisStep(ANALYSIS_STEPS[3])
      setAnalysisProgress(90)
      await new Promise((r) => setTimeout(r, 1000))

      setAnalysisProgress(100)

      // For now, show a message that the feature is coming soon
      setResult({
        status: 'coming_soon',
        message:
          "SoundScan sera bientôt disponible ! L'analyse audio IA est en cours de développement. Tu seras notifié dès que cette fonctionnalité sera active.",
      })
    } catch (err) {
      console.error('Analysis error:', err)
      setError("Une erreur est survenue lors de l'analyse.")
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioBlob, user])

  // ---------------------------------------------------------------------------
  // PREMIUM GATE
  // ---------------------------------------------------------------------------

  if (!isPremium) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
          <Sidebar />
          <main className="md:pl-64">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 md:pb-8 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-3xl"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-indigo-700 to-cyan-700" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.3),transparent_50%)]" />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white/30 rounded-full"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      }}
                      animate={{
                        y: [-10, 10, -10],
                        opacity: [0.2, 0.6, 0.2],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                <div className="relative p-8 md:p-12 text-center text-white">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mb-6"
                  >
                    <div className="w-24 h-24 mx-auto rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Mic className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>

                  <h1 className="text-3xl md:text-4xl font-bold mb-2">SoundScan</h1>
                  <p className="text-lg md:text-xl mb-8 opacity-90">
                    Ton mécanicien écoute
                  </p>

                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-lg mx-auto border border-white/10">
                    <p className="text-base mb-5">
                      Enregistre le bruit suspect de ta voiture, notre IA l'analyse et identifie le problème
                    </p>
                    <ul className="text-left space-y-3 max-w-md mx-auto">
                      {[
                        'Enregistrement audio haute qualité',
                        'Analyse spectrale par intelligence artificielle',
                        'Identification des bruits anormaux',
                        'Diagnostic instantané avec estimation',
                        'Historique de tes analyses sonores',
                      ].map((feature, i) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <CheckCircle2 className="h-5 w-5 text-emerald-300 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="bg-white text-violet-700 hover:bg-gray-100 px-8 py-6 text-lg font-bold shadow-xl shadow-black/20"
                    onClick={() => setShowPaywall(true)}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Passer à Premium (9,99€/mois)
                  </Button>
                </div>
              </motion.div>
            </div>
          </main>

          <PaywallModal
            open={showPaywall}
            onOpenChange={setShowPaywall}
            mode="diagnostic"
            title="SoundScan Premium"
            subtitle="Passe Premium pour accéder au diagnostic audio IA illimité"
          />
        </div>
      </PageTransition>
    )
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER (Premium users)
  // ---------------------------------------------------------------------------

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
        <Sidebar />

        <main className="md:pl-64">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 md:pb-8 max-w-4xl">
            {/* ---------------------------------------------------------------- */}
            {/* HEADER                                                          */}
            {/* ---------------------------------------------------------------- */}
            <motion.div
              className="mb-4 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-violet-500 flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  SoundScan
                </h1>
                <Badge variant="premium" className="text-[10px] sm:text-xs">
                  Premium
                </Badge>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Enregistre le bruit · L'IA écoute · Diagnostic instantané
              </p>
            </motion.div>

            {/* ---------------------------------------------------------------- */}
            {/* DISCLAIMER                                                      */}
            {/* ---------------------------------------------------------------- */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-amber-950/30 border border-amber-800 text-xs sm:text-sm text-amber-200 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
              <p className="break-words">
                Analyse IA à titre indicatif. Consultez un mécanicien professionnel pour confirmation du diagnostic.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* ============================================================ */}
              {/* RESULT VIEW                                                  */}
              {/* ============================================================ */}
              {result && !isAnalyzing ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ResultCard result={result} onReset={resetRecording} />
                </motion.div>
              ) : isAnalyzing ? (
                /* ============================================================ */
                /* ANALYSIS LOADING                                            */
                /* ============================================================ */
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnalysisLoader step={analysisStep} progress={analysisProgress} />
                </motion.div>
              ) : (
                /* ============================================================ */
                /* RECORDING INTERFACE                                         */
                /* ============================================================ */
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* -------------------------------------------------------- */}
                  {/* RECORD CARD                                              */}
                  {/* -------------------------------------------------------- */}
                  <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-background to-cyan-950/20 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                        Enregistrement audio
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {hasRecording
                          ? 'Enregistrement terminé. Tu peux ajouter une description ou lancer l\'analyse.'
                          : 'Appuie sur le bouton et reproduis le bruit suspect de ton véhicule.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Waveform visualization */}
                      <div className="relative rounded-2xl bg-gradient-to-b from-violet-950/40 to-cyan-950/40 border border-violet-500/10 overflow-hidden py-4">
                        <WaveformVisualizer isActive={isRecording} />

                        {/* Timer overlay */}
                        {isRecording && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-3 right-3 flex items-center gap-2"
                          >
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs sm:text-sm font-mono text-white bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                              {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}
                            </span>
                          </motion.div>
                        )}

                        {/* "Recording complete" badge */}
                        {hasRecording && !isRecording && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {formatTime(recordingTime)} enregistré
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      {/* Record button area */}
                      <div className="flex flex-col items-center gap-4">
                        {!hasRecording ? (
                          <>
                            {!isRecording ? (
                              /* ---- IDLE: Big pulsing record button ---- */
                              <motion.button
                                onClick={startRecording}
                                className="relative group focus:outline-none"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {/* Pulsing rings */}
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500"
                                  animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.4, 0, 0.4],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                  style={{
                                    width: 96,
                                    height: 96,
                                    margin: 'auto',
                                    top: 0, bottom: 0, left: 0, right: 0,
                                  }}
                                />
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500"
                                  animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.2, 0, 0.2],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.3,
                                  }}
                                  style={{
                                    width: 96,
                                    height: 96,
                                    margin: 'auto',
                                    top: 0, bottom: 0, left: 0, right: 0,
                                  }}
                                />

                                {/* Main button */}
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
                                  <Mic className="h-10 w-10 text-white" />
                                </div>
                              </motion.button>
                            ) : (
                              /* ---- RECORDING: Red stop button ---- */
                              <motion.button
                                onClick={stopRecording}
                                className="relative group focus:outline-none"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {/* Pulsing red rings */}
                                <motion.div
                                  className="absolute inset-0 rounded-full bg-red-500"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.4, 0, 0.4],
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                  style={{
                                    width: 96,
                                    height: 96,
                                    margin: 'auto',
                                    top: 0, bottom: 0, left: 0, right: 0,
                                  }}
                                />

                                {/* Main button */}
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                                  <StopCircle className="h-10 w-10 text-white" />
                                </div>
                              </motion.button>
                            )}

                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {isRecording
                                ? 'Appuie pour arrêter l\'enregistrement'
                                : 'Appuie pour enregistrer le bruit'}
                            </p>
                          </>
                        ) : (
                          /* ---- HAS RECORDING: Reset option ---- */
                          <Button
                            variant="outline"
                            onClick={resetRecording}
                            className="border-violet-500/30 hover:bg-violet-500/10"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Refaire un enregistrement
                          </Button>
                        )}
                      </div>

                      {/* Error display */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 sm:p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-2 sm:gap-3"
                        >
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-300 break-words">
                            {error}
                          </p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* -------------------------------------------------------- */}
                  {/* DESCRIPTION (only after recording)                       */}
                  {/* -------------------------------------------------------- */}
                  {hasRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="border-violet-500/20">
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                            Description (optionnel)
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Décris le bruit pour améliorer la précision du diagnostic
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            value={userDescription}
                            onChange={(e) => setUserDescription(e.target.value.slice(0, 500))}
                            placeholder="Ex: Grincement quand je tourne le volant à gauche..."
                            className="h-20 sm:h-24 resize-none text-base sm:text-sm bg-violet-950/10 border-violet-500/20 focus:border-violet-500/40 placeholder:text-muted-foreground/50"
                            maxLength={500}
                          />
                          <div className="text-[10px] sm:text-xs text-muted-foreground text-right mt-1">
                            {userDescription.length}/500
                          </div>
                        </CardContent>
                      </Card>

                      {/* Analyze button */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          size="lg"
                          className="w-full mt-4 sm:mt-6 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-700 hover:via-indigo-700 hover:to-cyan-700 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-transform"
                          onClick={analyzeAudio}
                          disabled={isAnalyzing}
                        >
                          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                          Analyser avec l'IA
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* TIPS SECTION                                             */}
                  {/* -------------------------------------------------------- */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-violet-950/20 border-violet-800/40">
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-violet-100 flex items-center gap-2 text-sm sm:text-base">
                          <Lightbulb className="h-4 w-4 text-violet-500" />
                          Conseils pour un bon enregistrement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="space-y-2.5 sm:space-y-3">
                          {RECORDING_TIPS.map((tip, i) => (
                            <motion.li
                              key={tip.text}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + i * 0.08 }}
                              className="flex items-start gap-3 text-xs sm:text-sm text-violet-200"
                            >
                              <span className="text-base leading-none mt-0.5">{tip.icon}</span>
                              <span>{tip.text}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          mode="diagnostic"
          title="SoundScan Premium"
          subtitle="Passe Premium pour accéder au diagnostic audio IA illimité"
        />
      </div>
    </PageTransition>
  )
}
