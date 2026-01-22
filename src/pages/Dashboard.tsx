import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquarePlus,
  History,
  Sparkles,
  Car,
  Wrench,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Fuel,
  Calendar
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  mileage: number
  fuel_type: string
}

// Conseils auto rotatifs
const AUTO_TIPS = [
  { icon: Fuel, tip: "Vérifie ton niveau d'huile tous les 1000 km", color: "text-amber-500" },
  { icon: Wrench, tip: "Une vidange tous les 15 000 km prolonge la vie du moteur", color: "text-blue-500" },
  { icon: AlertTriangle, tip: "Des freins qui grincent = plaquettes à vérifier", color: "text-red-500" },
  { icon: CheckCircle, tip: "Pneus gonflés = économie de carburant", color: "text-green-500" },
  { icon: Calendar, tip: "Contrôle technique tous les 2 ans après 4 ans", color: "text-purple-500" },
]

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { isPremium, diagnosticsRemaining } = useSubscription(profile)
  const { diagnostics } = useDiagnostics(user?.id)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tipIndex, setTipIndex] = useState(0)

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'utilisateur'

  const thisMonthDiagnostics = diagnostics.filter((d) => {
    const created = new Date(d.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  })

  // Charger les véhicules
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setVehicles(data || []))
    }
  }, [user?.id])

  // Rotation des conseils
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % AUTO_TIPS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const currentTip = AUTO_TIPS[tipIndex]
  const primaryVehicle = vehicles[0]

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-24 md:pb-0">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            {/* Welcome */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                Salut {displayName} !
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Bienvenue sur MECAI, ton assistant diagnostic auto.
              </p>
            </motion.div>

            {/* Status Card */}
            {!isPremium ? (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5">Version gratuite</h3>
                      <p className="text-xs text-muted-foreground">
                        Limites mensuelles - se réinitialisent chaque mois
                      </p>
                    </div>
                    <Link to="/pricing" className="w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Passer Premium
                      </Button>
                    </Link>
                  </div>
                  {/* Limites restantes */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                      <div className={`w-2 h-2 rounded-full ${diagnosticsRemaining > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-muted-foreground">Diagnostics:</span>
                      <span className="font-medium">{diagnosticsRemaining}/2</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Devis:</span>
                      <span className="font-medium">1/mois</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Chat:</span>
                      <span className="font-medium">10/jour</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Véhicule:</span>
                      <span className="font-medium">1 max</span>
                    </div>
                  </div>
                  {/* Lien comparatif */}
                  <Link to="/pricing" className="block mt-3">
                    <p className="text-xs text-primary hover:underline text-center">
                      Voir le comparatif Free vs Premium →
                    </p>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-indigo-500/30 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20">
                <CardContent className="flex items-center p-4 gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Premium actif</h3>
                    <p className="text-xs text-muted-foreground">
                      Toutes les fonctionnalités illimitées
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA Principal - Nouveau diagnostic */}
            <Link to="/app/chat">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mb-6"
              >
                <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <MessageSquarePlus className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-lg">Nouveau diagnostic</h2>
                      <p className="text-sm text-blue-100">
                        Décris ton problème, je t'aide à comprendre
                      </p>
                    </div>
                    <div className="hidden sm:block text-3xl">→</div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            {/* Grille 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Mon véhicule */}
              <Card>
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      Mon véhicule
                    </CardTitle>
                    <Link to="/app/vehicules">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Gérer
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {primaryVehicle ? (
                    <div>
                      <p className="font-semibold">
                        {primaryVehicle.brand} {primaryVehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {primaryVehicle.year} • {primaryVehicle.mileage?.toLocaleString() || '?'} km
                      </p>
                    </div>
                  ) : (
                    <Link to="/app/vehicules">
                      <Button variant="outline" size="sm" className="w-full">
                        + Ajouter un véhicule
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Ce mois-ci
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{thisMonthDiagnostics.length}</span>
                    <span className="text-sm text-muted-foreground">
                      diagnostic{thisMonthDiagnostics.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conseil du jour */}
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`h-10 w-10 rounded-full bg-background flex items-center justify-center shrink-0`}>
                    <currentTip.icon className={`h-5 w-5 ${currentTip.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Conseil auto</p>
                    <p className="text-sm font-medium">{currentTip.tip}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link to="/app/history">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <History className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Historique</span>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/app/garages">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <Wrench className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Trouver un garage</span>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Derniers diagnostics */}
            {diagnostics.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">Derniers diagnostics</h2>
                  <Link to="/app/history">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Voir tout
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {diagnostics.slice(0, 3).map((diag) => (
                    <Link key={diag.id} to={`/app/chat/${diag.id}`}>
                      <Card className="hover:border-primary/50 transition-colors">
                        <CardContent className="flex items-center justify-between p-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {diag.car_brand && diag.car_model
                                ? `${diag.car_brand} ${diag.car_model}`
                                : 'Véhicule non spécifié'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {diag.problem_description}
                            </p>
                          </div>
                          {diag.urgency_level && (
                            <Badge
                              variant={
                                diag.urgency_level === 'high'
                                  ? 'danger'
                                  : diag.urgency_level === 'medium'
                                  ? 'warning'
                                  : 'success'
                              }
                              className="ml-2 shrink-0 text-[10px]"
                            >
                              {diag.urgency_level === 'high'
                                ? 'Urgent'
                                : diag.urgency_level === 'medium'
                                ? 'Moyen'
                                : 'OK'}
                            </Badge>
                          )}
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
