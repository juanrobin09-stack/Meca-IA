import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useTikTokTracking } from '@/hooks/useTikTokTracking'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Sparkles, MessageCircle, FileText, Microscope } from 'lucide-react'
// confetti is lazy-loaded when needed

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const limits = useUserLimits()
  const { trackSubscribe } = useTikTokTracking()
  const [checking, setChecking] = useState(true)
  const [isPremiumConfirmed, setIsPremiumConfirmed] = useState(false)
  const attemptsRef = useRef(0)
  const maxAttempts = 15
  const confettiFiredRef = useRef(false)
  const subscribeTrackedRef = useRef(false)

  // Check if it was a yearly subscription (from URL params or localStorage)
  const isYearly = searchParams.get('plan') === 'yearly' || localStorage.getItem('mecai_checkout_plan') === 'yearly'

  useEffect(() => {
    // Refresh toutes les 2 secondes pendant 30 secondes max
    const checkPremium = async () => {
      const interval = setInterval(async () => {
        await limits.refresh()
        attemptsRef.current++

        console.log(`🔄 Check premium attempt ${attemptsRef.current}/${maxAttempts}, isPremium:`, limits.isPremium)

        if (limits.isPremium && !isPremiumConfirmed) {
          console.log('✅ Premium active!')
          setIsPremiumConfirmed(true)
          clearInterval(interval)
          setChecking(false)

          // Fire confetti and track subscription
          if (!confettiFiredRef.current) {
            confettiFiredRef.current = true
            import('canvas-confetti').then(m => m.default({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            }))
          }

          // Track successful subscription for TikTok Pixel
          if (!subscribeTrackedRef.current) {
            subscribeTrackedRef.current = true
            trackSubscribe(isYearly)
            // Clean up stored plan type
            localStorage.removeItem('mecai_checkout_plan')
          }

          // Rediriger vers dashboard apres 3 secondes
          setTimeout(() => {
            navigate('/app')
          }, 3000)
        } else if (attemptsRef.current >= maxAttempts) {
          console.log('⏰ Timeout, redirecting anyway')
          clearInterval(interval)
          setChecking(false)
          // Redirect even if not confirmed (webhook might be delayed)
          setTimeout(() => {
            navigate('/app')
          }, 2000)
        }
      }, 2000)

      return () => clearInterval(interval)
    }

    checkPremium()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Also check when limits update
  useEffect(() => {
    if (limits.isPremium && !isPremiumConfirmed && !limits.loading) {
      setIsPremiumConfirmed(true)
      setChecking(false)

      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true
        import('canvas-confetti').then(m => m.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        }))
      }

      // Track successful subscription for TikTok Pixel
      if (!subscribeTrackedRef.current) {
        subscribeTrackedRef.current = true
        trackSubscribe(isYearly)
        // Clean up stored plan type
        localStorage.removeItem('mecai_checkout_plan')
      }

      setTimeout(() => {
        navigate('/app')
      }, 3000)
    }
  }, [limits.isPremium, limits.loading, isPremiumConfirmed, navigate, trackSubscribe, isYearly])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 from-green-950/20 dark:to-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 rounded-3xl shadow-2xl p-8 text-center"
      >
        {checking ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-black mb-4 text-white">
              Activation en cours...
            </h1>
            <p className="text-neutral-400 mb-6">
              Ton compte Premium est en cours d'activation. Ca prend quelques secondes !
            </p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-black mb-4 text-white"
            >
              Paiement reussi !
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-neutral-400 mb-6"
            >
              Bienvenue dans MECA IA Premium ! Tous les acces illimites sont maintenant disponibles.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-green-50 from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 mb-6 border border-green-800"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                    <Microscope className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-200">Diagnostics illimites</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-200">Chat mecanicien 24/7</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-200">Analyses de devis illimitees</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                </div>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate('/app')}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Acceder au Dashboard
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-neutral-400 mt-4"
            >
              Redirection automatique dans quelques secondes...
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  )
}
