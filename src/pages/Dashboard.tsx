import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquarePlus,
  History,
  Sparkles,
  FileText,
  Video,
  TrendingUp,
  MessageCircle,
  Crown
} from 'lucide-react'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { isPremium, diagnosticsRemaining } = useSubscription(profile)
  const { diagnostics } = useDiagnostics(user?.id)

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'utilisateur'
  const thisMonthDiagnostics = diagnostics.filter((d) => {
    const created = new Date(d.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  })

  const premiumFeatures = [
    {
      href: '/app/analyser-devis',
      icon: FileText,
      title: 'Analyseur de Devis',
      description: 'Détecte les arnaques et prix excessifs sur tes devis garage.',
      badge: '🔍 Anti-arnaque',
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30',
    },
    {
      href: '/app/diagnostic-video',
      icon: Video,
      title: 'Diagnostic Vidéo',
      description: "Filme ton problème, l'IA analyse visuellement et auditivement.",
      badge: '🎥 IA Vision',
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/30',
    },
    {
      href: '/app/prevision-pannes',
      icon: TrendingUp,
      title: 'Prévision de Pannes',
      description: 'Anticipe les réparations et planifie ton budget auto.',
      badge: '🔮 Prédictif',
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/30',
    },
    {
      href: '/app/mechanic-chat',
      icon: MessageCircle,
      title: 'Chat Mécanicien 24/7',
      description: 'Pose toutes tes questions auto, je suis dispo 24h/24.',
      badge: '💬 Illimité',
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
    },
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30">
      <Sidebar />

      <main className="md:pl-64 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Welcome */}
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
              Salut <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{displayName}</span> 👋
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bienvenue sur MECAI, ton assistant diagnostic auto.
            </p>
          </motion.div>

          {/* Status Card for Free Users */}
          {!isPremium && (
            <Card className="mb-6 sm:mb-8 border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg shadow-blue-500/5">
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 gap-3 sm:gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Tu es en version gratuite</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Il te reste <span className="font-bold text-blue-600 dark:text-blue-400">{diagnosticsRemaining}</span> diagnostic{diagnosticsRemaining !== 1 ? 's' : ''} ce mois-ci.
                    </p>
                  </div>
                </div>
                <Link to="/pricing" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-10 sm:h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Passer Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Premium badge */}
          {isPremium && (
            <Card className="mb-6 sm:mb-8 border-amber-500/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="flex items-center p-4 sm:p-6 gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Tu es Premium !</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Profite de toutes les fonctionnalités sans limite.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Main */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link to="/app/chat">
              <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer h-full border border-blue-100 dark:border-blue-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="p-5 sm:p-6">
                    <motion.div
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 10 }}
                    >
                      <MessageSquarePlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </motion.div>
                    <CardTitle className="text-base sm:text-lg font-bold">Nouveau diagnostic</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Décris ton problème et obtiens un diagnostic expert.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Link>

            <Link to="/app/history">
              <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all cursor-pointer h-full border border-purple-100 dark:border-purple-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="p-5 sm:p-6">
                    <motion.div
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: -10 }}
                    >
                      <History className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </motion.div>
                    <CardTitle className="text-base sm:text-lg font-bold">Historique</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Retrouve tes diagnostics passés.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Link>
          </div>

          {/* Premium Features Grid */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold">Fonctionnalités Premium</h2>
              {!isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs">
                  Premium
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {premiumFeatures.map((feature, index) => (
                <Link key={feature.href} to={isPremium ? feature.href : '/pricing'}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className={`group h-full transition-all cursor-pointer rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden ${
                      isPremium
                        ? 'border-gray-200 dark:border-gray-800 hover:shadow-xl ' + feature.shadow
                        : 'border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100'
                    }`}>
                      <CardHeader className="p-3 sm:pb-3 sm:p-4">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform`}>
                          <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <CardTitle className="text-sm sm:text-base leading-tight font-bold">{feature.title}</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs line-clamp-2">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 p-3 sm:p-4 sm:pt-0">
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                          {feature.badge}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats (Premium) */}
          {isPremium && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Ce mois-ci</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold">{thisMonthDiagnostics.length}</div>
                    <p className="text-sm text-muted-foreground">diagnostics réalisés</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {thisMonthDiagnostics.length > 0
                        ? `~${thisMonthDiagnostics.length * 150}€`
                        : '0€'}
                    </div>
                    <p className="text-sm text-muted-foreground">potentiellement économisés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent diagnostics */}
          {diagnostics.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Derniers diagnostics</h2>
              <div className="space-y-3">
                {diagnostics.slice(0, 3).map((diag) => (
                  <Link key={diag.id} to={`/app/chat/${diag.id}`}>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">
                            {diag.car_brand && diag.car_model
                              ? `${diag.car_brand} ${diag.car_model}`
                              : 'Véhicule non spécifié'}
                            {diag.car_year && ` - ${diag.car_year}`}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {diag.problem_description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {diag.urgency_level && (
                            <Badge
                              variant={
                                diag.urgency_level === 'high'
                                  ? 'danger'
                                  : diag.urgency_level === 'medium'
                                  ? 'warning'
                                  : 'success'
                              }
                            >
                              {diag.urgency_level === 'high'
                                ? 'Urgent'
                                : diag.urgency_level === 'medium'
                                ? 'Moyen'
                                : 'Faible'}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </PageTransition>
  )
}
