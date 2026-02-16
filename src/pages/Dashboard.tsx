import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Car,
  Wrench,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Fuel,
  Calendar,
  FileText,
  MessageCircle,
  Video,
  Mic,
  ChevronRight,
  Crown,
  Lock,
  Plus,
  Zap,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  mileage: number
  fuel_type: string
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const AUTO_TIPS = [
  { icon: Fuel, tip: "Vérifie ton niveau d'huile tous les 1 000 km", color: 'text-amber-500' },
  { icon: Wrench, tip: 'Une vidange tous les 15 000 km prolonge la vie du moteur', color: 'text-blue-500' },
  { icon: AlertTriangle, tip: 'Des freins qui grincent = plaquettes à vérifier', color: 'text-red-500' },
  { icon: CheckCircle, tip: 'Pneus bien gonflés = économie de carburant', color: 'text-green-500' },
  { icon: Calendar, tip: 'Contrôle technique tous les 2 ans après 4 ans', color: 'text-purple-500' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
} as const

export default function Dashboard() {
  useDocumentTitle('Tableau de bord')
  const { user, profile } = useAuth()
  const { isPremium, diagnosticsRemaining } = useSubscription(profile)
  const { diagnostics } = useDiagnostics(user?.id)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tipIndex, setTipIndex] = useState(0)
  const { playNavigate, playSuccess } = useSoundEffects()

  const loadVehicles = useCallback(() => {
    if (user?.id) {
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setVehicles(data || []))
    }
  }, [user?.id])

  const handleRefresh = useCallback(async () => {
    playSuccess()
    loadVehicles()
    // Small delay to show the refresh animation
    await new Promise(resolve => setTimeout(resolve, 600))
  }, [loadVehicles, playSuccess])

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  })

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'utilisateur'

  const thisMonthDiagnostics = diagnostics.filter((d) => {
    const created = new Date(d.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  })

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % AUTO_TIPS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const currentTip = AUTO_TIPS[tipIndex]
  const primaryVehicle = vehicles[0]

  const quickActions = [
    {
      title: 'Scanner un Devis',
      description: 'Analyse tes devis garage',
      icon: FileText,
      to: '/app/analyser-devis',
      gradient: 'from-violet-600 to-violet-400',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      premiumOnly: false,
    },
    {
      title: 'Chat Mécanicien',
      description: 'Pose tes questions auto',
      icon: MessageCircle,
      to: '/app/mechanic-chat',
      gradient: 'from-cyan-600 to-cyan-400',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      premiumOnly: false,
    },
    {
      title: 'Diagnostic Vidéo',
      description: 'Montre le problème',
      icon: Video,
      to: '/app/diagnostic-video',
      gradient: 'from-violet-600 to-cyan-400',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      premiumOnly: true,
    },
    {
      title: 'SoundScan',
      description: 'Identifie un bruit',
      icon: Mic,
      to: '/app/sound-scan',
      gradient: 'from-cyan-600 to-violet-400',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      premiumOnly: true,
    },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
        <Sidebar />

        <main ref={containerRef} className="md:pl-64 pb-24 md:pb-0 overflow-y-auto" style={{ minHeight: '100vh' }}>
          {/* Pull-to-refresh indicator (mobile only) */}
          {(pullDistance > 0 || isRefreshing) && (
            <div
              className="flex items-center justify-center md:hidden overflow-hidden transition-all"
              style={{ height: isRefreshing ? 48 : pullDistance }}
            >
              <div
                className="transition-transform"
                style={{ transform: `rotate(${progress * 360}deg)` }}
              >
                <Loader2 className={`h-5 w-5 text-violet-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>
            </div>
          )}
          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {/* ========== WELCOME SECTION ========== */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {getGreeting()}{' '}
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      {displayName}
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 mt-1">
                    Que veux-tu faire aujourd'hui ?
                  </p>
                </div>

                {/* Premium Status Card */}
                {isPremium ? (
                  <motion.div
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 p-[1px]"
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div className="relative rounded-2xl bg-gradient-to-r from-violet-600/90 via-violet-500/90 to-cyan-500/90 p-4 backdrop-blur-xl">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0ySDEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                      <div className="relative flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm sm:text-base">Premium actif</h3>
                            <Crown className="h-4 w-4 text-yellow-300" />
                          </div>
                          <p className="text-xs sm:text-sm text-white/80">
                            Toutes les fonctionnalités illimitées
                          </p>
                        </div>
                        <Zap className="h-5 w-5 text-yellow-300 hidden sm:block" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-card rounded-2xl p-4">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm sm:text-base text-white">Version gratuite</h3>
                        <Link to="/app/premium">
                          <Badge variant="premium" className="text-[10px] cursor-pointer">
                            Passer Premium
                          </Badge>
                        </Link>
                      </div>
                      <p className="text-xs text-gray-400">
                        Limites mensuelles — se réinitialisent chaque mois
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <div className={`w-2 h-2 rounded-full ${diagnosticsRemaining > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-gray-400">Diagnostics :</span>
                        <span className="font-medium text-white">{diagnosticsRemaining}/2</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-gray-400">Devis :</span>
                        <span className="font-medium text-white">1/mois</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-gray-400">Chat :</span>
                        <span className="font-medium text-white">10/jour</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-gray-400">Véhicule :</span>
                        <span className="font-medium text-white">1 max</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ========== QUICK ACTIONS - 2x2 GRID ========== */}
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {quickActions.map((action, i) => (
                    <Link key={action.to} to={action.to} onClick={() => playNavigate()}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 h-full relative overflow-hidden group cursor-pointer"
                      >
                        {/* Gradient glow on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500`} />

                        {/* Premium badge */}
                        {action.premiumOnly && !isPremium && (
                          <div className="absolute top-2.5 right-2.5">
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-2 py-0.5 rounded-full">
                              <Lock className="h-2.5 w-2.5" />
                              Premium
                            </span>
                          </div>
                        )}

                        <div className="relative space-y-3">
                          {/* Icon */}
                          <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl ${action.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                            <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.iconColor}`} />
                          </div>

                          {/* Text */}
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-white transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* ========== VEHICLE CARD + STATS ROW ========== */}
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Vehicle Card */}
                  <div className="glass-card rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                          <Car className="h-4 w-4 text-violet-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">Mon véhicule</h3>
                      </div>
                      <Link to="/app/vehicules">
                        <span className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-0.5">
                          Gérer
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </Link>
                    </div>
                    {primaryVehicle ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-white text-base">
                          {primaryVehicle.brand} {primaryVehicle.model}
                        </p>
                        <p className="text-sm text-gray-400">
                          {primaryVehicle.year} &bull; {primaryVehicle.mileage?.toLocaleString() || '?'} km
                        </p>
                      </div>
                    ) : (
                      <Link to="/app/vehicules">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-700 hover:border-violet-500/50 text-gray-400 hover:text-violet-400 transition-colors text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter un véhicule
                        </motion.button>
                      </Link>
                    )}
                  </div>

                  {/* Stats Card */}
                  <div className="glass-card rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                      </div>
                      <h3 className="font-semibold text-sm text-white">Ce mois-ci</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        key={thisMonthDiagnostics.length}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"
                      >
                        {thisMonthDiagnostics.length}
                      </motion.span>
                      <span className="text-sm text-gray-400">
                        diagnostic{thisMonthDiagnostics.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ========== AUTO TIP - ROTATING CAROUSEL ========== */}
              <motion.div variants={itemVariants}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tipIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-cyan-500 rounded-l-2xl" />
                      <div className="flex items-center gap-3 pl-2">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          <currentTip.icon className={`h-5 w-5 ${currentTip.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                            Conseil auto
                          </p>
                          <p className="text-sm font-medium text-gray-200">{currentTip.tip}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-3 pl-2">
                        {AUTO_TIPS.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${
                              i === tipIndex
                                ? 'w-4 bg-gradient-to-r from-violet-400 to-cyan-400'
                                : 'w-1 bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* ========== RECENT DIAGNOSTICS ========== */}
              {diagnostics.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                      Derniers diagnostics
                    </h2>
                    <Link to="/app/history">
                      <span className="text-xs text-gray-400 hover:text-violet-400 font-medium transition-colors flex items-center gap-0.5">
                        Voir tout
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {diagnostics.slice(0, 3).map((diag, index) => (
                      <Link key={diag.id} to={`/app/chat/${diag.id}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          className="glass-card glass-card-hover rounded-xl p-3 sm:p-4 flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate group-hover:text-violet-300 transition-colors">
                              {diag.car_brand && diag.car_model
                                ? `${diag.car_brand} ${diag.car_model}`
                                : 'Véhicule non spécifié'}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {diag.problem_description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            {diag.urgency_level && (
                              <Badge
                                variant={
                                  diag.urgency_level === 'high'
                                    ? 'danger'
                                    : diag.urgency_level === 'medium'
                                    ? 'warning'
                                    : 'success'
                                }
                                className="text-[10px]"
                              >
                                {diag.urgency_level === 'high'
                                  ? 'Urgent'
                                  : diag.urgency_level === 'medium'
                                  ? 'Moyen'
                                  : 'OK'}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
