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
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      href: '/app/diagnostic-video',
      icon: Video,
      title: 'Diagnostic Vidéo',
      description: "Filme ton problème, l'IA analyse visuellement et auditivement.",
      badge: '🎥 IA Vision',
      color: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
    },
    {
      href: '/app/prevision-pannes',
      icon: TrendingUp,
      title: 'Prévision de Pannes',
      description: 'Anticipe les réparations et planifie ton budget auto.',
      badge: '🔮 Prédictif',
      color: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      href: '/app/mechanic-chat',
      icon: MessageCircle,
      title: 'Chat Mécanicien 24/7',
      description: 'Pose toutes tes questions auto, je suis dispo 24h/24.',
      badge: '💬 Illimité',
      color: 'bg-green-500/10',
      iconColor: 'text-green-600',
    },
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Salut {displayName} !
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur MecaIA, ton assistant diagnostic auto.
            </p>
          </motion.div>

          {/* Status Card for Free Users */}
          {!isPremium && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between p-6 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Tu es en version gratuite</h3>
                  <p className="text-sm text-muted-foreground">
                    Il te reste {diagnosticsRemaining} diagnostic{diagnosticsRemaining !== 1 ? 's' : ''} ce mois-ci.
                  </p>
                </div>
                <Link to="/pricing">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Passer Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Premium badge */}
          {isPremium && (
            <Card className="mb-8 border-amber-500/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="flex items-center p-6 gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Tu es Premium !</h3>
                  <p className="text-sm text-muted-foreground">
                    Profite de toutes les fonctionnalités sans limite.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Main */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link to="/app/chat">
              <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardHeader>
                    <motion.div
                      className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 10 }}
                    >
                      <MessageSquarePlus className="h-6 w-6 text-primary" />
                    </motion.div>
                    <CardTitle>Nouveau diagnostic</CardTitle>
                    <CardDescription>
                      Décris ton problème de voiture et obtiens un diagnostic expert en quelques minutes.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Link>

            <Link to="/app/history">
              <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardHeader>
                    <motion.div
                      className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: -10 }}
                    >
                      <History className="h-6 w-6 text-primary" />
                    </motion.div>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>
                      Retrouve tous tes diagnostics passés et reprends une conversation.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Link>
          </div>

          {/* Premium Features Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Fonctionnalités Premium</h2>
              {!isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Premium
                </Badge>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {premiumFeatures.map((feature, index) => (
                <Link key={feature.href} to={isPremium ? feature.href : '/pricing'}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card className={`h-full transition-all cursor-pointer ${
                      isPremium
                        ? 'hover:border-primary hover:shadow-lg'
                        : 'opacity-75 hover:opacity-100'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className={`h-10 w-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                          <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                        </div>
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge variant="secondary" className="text-[10px]">
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
