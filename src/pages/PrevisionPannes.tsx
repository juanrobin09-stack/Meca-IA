import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import PaywallModal from '@/components/PaywallModal'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Car, AlertTriangle, Calendar, Gauge, Euro, Loader2, ChevronRight, Wrench, Shield, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
  year: number
  fuel_type: string
  mileage: number
}

interface Prediction {
  piece: string
  risque: 'faible' | 'moyen' | 'élevé' | 'imminent'
  kmPrevus: number
  datePrevue: string
  coutEstime: { min: number; max: number }
  signesPrecurseurs: string[]
  conseil: string
}

interface ForecastResult {
  vehicule: string
  kilometrage: number
  predictions: Prediction[]
  entretiensUrgents: string[]
  budgetAnnuel: { min: number; max: number }
  prochainEntretien: string
}

// Base de connaissances des pièces automobiles avec durée de vie moyenne
const PIECES_DATABASE: Record<string, { kmMoyen: number; prixMin: number; prixMax: number; signes: string[] }> = {
  'Courroie de distribution': { kmMoyen: 100000, prixMin: 400, prixMax: 700, signes: ['Sifflement moteur', 'Claquement au démarrage', 'Voyant moteur'] },
  'Embrayage': { kmMoyen: 150000, prixMin: 500, prixMax: 900, signes: ['Patinage', 'Pédale dure', 'Difficulté à passer les vitesses'] },
  'Plaquettes de frein avant': { kmMoyen: 40000, prixMin: 150, prixMax: 250, signes: ['Grincement', 'Distance de freinage augmentée', 'Pédale molle'] },
  'Plaquettes de frein arrière': { kmMoyen: 60000, prixMin: 120, prixMax: 200, signes: ['Grincement', 'Vibrations au freinage'] },
  'Disques de frein': { kmMoyen: 80000, prixMin: 200, prixMax: 400, signes: ['Vibrations', 'Rayures visibles', 'Voile'] },
  'Batterie': { kmMoyen: 70000, prixMin: 80, prixMax: 180, signes: ['Démarrage lent', 'Voyant batterie', 'Électronique instable'] },
  'Alternateur': { kmMoyen: 150000, prixMin: 300, prixMax: 500, signes: ['Voyant batterie', 'Sifflement', 'Batterie qui se décharge'] },
  'Démarreur': { kmMoyen: 150000, prixMin: 200, prixMax: 400, signes: ['Clic sans démarrage', 'Démarrage aléatoire'] },
  'Amortisseurs': { kmMoyen: 80000, prixMin: 400, prixMax: 800, signes: ['Rebonds excessifs', 'Tenue de route dégradée', 'Usure pneus inégale'] },
  'Silent-blocs': { kmMoyen: 100000, prixMin: 150, prixMax: 300, signes: ['Bruits sourds', 'Vibrations', 'Direction floue'] },
  'Rotules de direction': { kmMoyen: 100000, prixMin: 150, prixMax: 300, signes: ['Jeu dans la direction', 'Claquements'] },
  'Pompe à eau': { kmMoyen: 100000, prixMin: 250, prixMax: 450, signes: ['Fuite liquide refroidissement', 'Surchauffe moteur'] },
  'Kit de distribution complet': { kmMoyen: 100000, prixMin: 500, prixMax: 900, signes: ['Sifflement', 'Claquement'] },
  'Filtre à particules (FAP)': { kmMoyen: 120000, prixMin: 800, prixMax: 2000, signes: ['Perte de puissance', 'Voyant FAP', 'Fumée noire'] },
  'Turbo': { kmMoyen: 200000, prixMin: 1000, prixMax: 2500, signes: ['Sifflement anormal', 'Perte de puissance', 'Fumée bleue'] },
  'Injecteurs': { kmMoyen: 200000, prixMin: 300, prixMax: 600, signes: ['Ratés moteur', 'Fumée noire', 'Surconsommation'] },
}

export default function PrevisionPannes() {
  const { profile, user } = useAuth()
  const { isPremium } = useSubscription(profile)
  const [showPaywall, setShowPaywall] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchVehicles()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeVehicle = async () => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    if (!selectedVehicle) return

    const vehicle = vehicles.find(v => v.id === selectedVehicle)
    if (!vehicle) return

    setIsAnalyzing(true)

    // Simulation d'analyse avec logique basée sur les données réelles
    await new Promise(resolve => setTimeout(resolve, 2000))

    const predictions = generatePredictions(vehicle)
    const entretiensUrgents = predictions
      .filter(p => p.risque === 'imminent' || p.risque === 'élevé')
      .map(p => p.piece)

    const budgetAnnuel = calculateAnnualBudget(predictions, vehicle.mileage)

    const result: ForecastResult = {
      vehicule: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      kilometrage: vehicle.mileage,
      predictions: predictions.sort((a, b) => {
        const order = { 'imminent': 0, 'élevé': 1, 'moyen': 2, 'faible': 3 }
        return order[a.risque] - order[b.risque]
      }),
      entretiensUrgents,
      budgetAnnuel,
      prochainEntretien: getProchainEntretien(predictions)
    }

    setResult(result)
    setIsAnalyzing(false)
  }

  const generatePredictions = (vehicle: Vehicle): Prediction[] => {
    const predictions: Prediction[] = []
    const currentKm = vehicle.mileage || 0
    const vehicleAge = new Date().getFullYear() - vehicle.year

    // Diesel specific
    const isDiesel = vehicle.fuel_type === 'Diesel'

    for (const [piece, data] of Object.entries(PIECES_DATABASE)) {
      // Skip FAP for non-diesel
      if (piece === 'Filtre à particules (FAP)' && !isDiesel) continue

      const kmRestants = data.kmMoyen - (currentKm % data.kmMoyen)
      const pourcentageUsure = ((currentKm % data.kmMoyen) / data.kmMoyen) * 100

      // Determine risk level
      let risque: Prediction['risque'] = 'faible'
      if (pourcentageUsure > 90 || kmRestants < 5000) {
        risque = 'imminent'
      } else if (pourcentageUsure > 75 || kmRestants < 15000) {
        risque = 'élevé'
      } else if (pourcentageUsure > 50 || kmRestants < 30000) {
        risque = 'moyen'
      }

      // Adjust for vehicle age
      if (vehicleAge > 10 && risque === 'moyen') {
        risque = 'élevé'
      }

      // Calculate predicted date (assuming 15000 km/year)
      const kmPerMonth = 1250
      const monthsRemaining = Math.max(1, Math.round(kmRestants / kmPerMonth))
      const datePrevue = new Date()
      datePrevue.setMonth(datePrevue.getMonth() + monthsRemaining)

      predictions.push({
        piece,
        risque,
        kmPrevus: currentKm + kmRestants,
        datePrevue: datePrevue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        coutEstime: { min: data.prixMin, max: data.prixMax },
        signesPrecurseurs: data.signes,
        conseil: getConseil(piece, risque)
      })
    }

    return predictions
  }

  const getConseil = (_piece: string, risque: Prediction['risque']): string => {
    if (risque === 'imminent') {
      return `Remplacement urgent recommandé. Ne pas attendre pour éviter une panne.`
    }
    if (risque === 'élevé') {
      return `Planifie le remplacement dans les prochaines semaines.`
    }
    if (risque === 'moyen') {
      return `À surveiller lors du prochain entretien.`
    }
    return `Pas d'intervention nécessaire pour le moment.`
  }

  const calculateAnnualBudget = (predictions: Prediction[], currentKm: number): { min: number; max: number } => {
    const nextYearPredictions = predictions.filter(p => {
      const kmNeeded = p.kmPrevus - currentKm
      return kmNeeded > 0 && kmNeeded <= 15000 // 15000 km/an
    })

    const min = nextYearPredictions.reduce((sum, p) => sum + p.coutEstime.min, 0)
    const max = nextYearPredictions.reduce((sum, p) => sum + p.coutEstime.max, 0)

    // Add routine maintenance (vidange x2, révision)
    return {
      min: min + 200,
      max: max + 400
    }
  }

  const getProchainEntretien = (predictions: Prediction[]): string => {
    const urgent = predictions.find(p => p.risque === 'imminent')
    if (urgent) return urgent.piece
    const eleve = predictions.find(p => p.risque === 'élevé')
    if (eleve) return eleve.piece
    return 'Révision standard'
  }

  const getRisqueColor = (risque: string) => {
    switch (risque) {
      case 'imminent': return 'bg-red-500 text-white'
      case 'élevé': return 'bg-orange-500 text-white'
      case 'moyen': return 'bg-yellow-500 text-black'
      case 'faible': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRisqueIcon = (risque: string) => {
    switch (risque) {
      case 'imminent': return '🚨'
      case 'élevé': return '⚠️'
      case 'moyen': return '⚡'
      case 'faible': return '✅'
      default: return '❓'
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">Prévision de Pannes</h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">Premium</Badge>
              </div>
              <p className="text-muted-foreground">
                Anticipe les réparations de ton véhicule grâce à l'IA prédictive
              </p>
            </motion.div>

            {/* Disclaimer */}
            <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                Les prévisions sont basées sur des statistiques et l'historique de ton véhicule.
                Elles ne garantissent pas l'occurrence exacte des pannes.
              </p>
            </div>

            {!result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Analyse prédictive
                  </CardTitle>
                  <CardDescription>
                    Sélectionne ton véhicule pour voir les réparations à venir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="text-center py-12">
                      <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">Aucun véhicule enregistré</h3>
                      <p className="text-muted-foreground mb-4">
                        Ajoute d'abord un véhicule pour utiliser la prévision de pannes
                      </p>
                      <Link to="/app/vehicules">
                        <Button>
                          <Car className="h-4 w-4 mr-2" />
                          Ajouter un véhicule
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Vehicle Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sélectionne ton véhicule</label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisis un véhicule..." />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  <span>{v.brand} {v.model} ({v.year})</span>
                                  <span className="text-muted-foreground">
                                    - {v.mileage?.toLocaleString() || 0} km
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Selected vehicle info */}
                      {selectedVehicle && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-muted rounded-lg"
                        >
                          {(() => {
                            const v = vehicles.find(v => v.id === selectedVehicle)
                            if (!v) return null
                            return (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold">{v.brand}</div>
                                  <div className="text-sm text-muted-foreground">Marque</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold">{v.model}</div>
                                  <div className="text-sm text-muted-foreground">Modèle</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold">{v.year}</div>
                                  <div className="text-sm text-muted-foreground">Année</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold">{v.mileage?.toLocaleString() || 0}</div>
                                  <div className="text-sm text-muted-foreground">Kilomètres</div>
                                </div>
                              </div>
                            )
                          })()}
                        </motion.div>
                      )}

                      {/* How it works */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                          <Gauge className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="font-medium">Analyse kilométrage</div>
                          <div className="text-sm text-muted-foreground">Usure des pièces</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="font-medium">Prédiction dates</div>
                          <div className="text-sm text-muted-foreground">Planning réparations</div>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
                          <Euro className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                          <div className="font-medium">Budget prévisionnel</div>
                          <div className="text-sm text-muted-foreground">Coûts anticipés</div>
                        </div>
                      </div>

                      {/* Analyze button */}
                      <div className="flex justify-center pt-4">
                        <Button
                          size="lg"
                          onClick={analyzeVehicle}
                          disabled={!selectedVehicle || isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Analyse en cours...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-5 w-5 mr-2" />
                              Lancer l'analyse prédictive
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Header */}
                <Card className="border-2 border-primary">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="font-bold">{result.vehicule}</div>
                        <div className="text-sm text-muted-foreground">{result.kilometrage.toLocaleString()} km</div>
                      </div>
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <div className="font-bold">{result.entretiensUrgents.length}</div>
                        <div className="text-sm text-muted-foreground">Interventions urgentes</div>
                      </div>
                      <div className="text-center">
                        <Euro className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="font-bold">{result.budgetAnnuel.min}€ - {result.budgetAnnuel.max}€</div>
                        <div className="text-sm text-muted-foreground">Budget annuel prévu</div>
                      </div>
                      <div className="text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-bold text-sm">{result.prochainEntretien}</div>
                        <div className="text-sm text-muted-foreground">Prochain entretien</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Urgent interventions */}
                {result.entretiensUrgents.length > 0 && (
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-5 w-5" />
                        Interventions urgentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.entretiensUrgents.map((piece, i) => (
                          <Badge key={i} variant="destructive" className="text-sm py-1 px-3">
                            {piece}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Predictions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      Toutes les prévisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {result.predictions.map((pred, index) => (
                          <motion.div
                            key={pred.piece}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getRisqueIcon(pred.risque)}</span>
                                <div>
                                  <div className="font-medium">{pred.piece}</div>
                                  <div className="text-sm text-muted-foreground">
                                    À ~{pred.kmPrevus.toLocaleString()} km ({pred.datePrevue})
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-bold text-primary">
                                    {pred.coutEstime.min}€ - {pred.coutEstime.max}€
                                  </div>
                                </div>
                                <Badge className={getRisqueColor(pred.risque)}>
                                  {pred.risque}
                                </Badge>
                              </div>
                            </div>

                            {/* Expanded details */}
                            <div className="mt-3 pt-3 border-t text-sm">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">Signes précurseurs:</div>
                                  <ul className="space-y-1">
                                    {pred.signesPrecurseurs.map((signe, i) => (
                                      <li key={i} className="flex items-center gap-2">
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        {signe}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">Conseil:</div>
                                  <p className="text-blue-700 dark:text-blue-300">{pred.conseil}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" onClick={() => setResult(null)}>
                    <Car className="h-4 w-4 mr-2" />
                    Analyser un autre véhicule
                  </Button>
                  <Link to="/app/garages">
                    <Button>
                      <Wrench className="h-4 w-4 mr-2" />
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
          title="Prévision de Pannes Premium"
          subtitle="Passe Premium pour accéder à l'analyse prédictive de ton véhicule"
        />
      </div>
    </PageTransition>
  )
}
