import { BarChart3, TrendingUp, TrendingDown, Car, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import Sidebar from '@/components/Sidebar'

export default function Reports() {
  // For demo purposes - in real app, check user subscription tier
  const tier = 'pro' as const

  if (tier !== 'pro') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <PageTransition>
            <div className="max-w-2xl mx-auto text-center py-16">
              <BarChart3 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Rapports mensuels</h1>
              <p className="text-muted-foreground mb-6">
                Suivi des couts, etat de la flotte, et previsions d'entretien.
              </p>
              <Badge className="bg-amber-500 mb-6">Fonctionnalite Pro</Badge>
              <br />
              <Button asChild className="mt-4">
                <Link to="/pricing">Passer Pro pour debloquer</Link>
              </Button>
            </div>
          </PageTransition>
        </main>
      </div>
    )
  }

  // Mock data
  const mockReport = {
    month: 'Janvier 2026',
    totalCost: 847,
    costChange: -12,
    diagnostics: 8,
    vehiclesCount: 5,
    upcomingMaintenance: 3,
    costByVehicle: [
      { name: 'Kangoo Pro', cost: 350 },
      { name: 'Partner', cost: 280 },
      { name: 'Clio', cost: 127 },
      { name: 'Berlingo', cost: 90 },
      { name: 'Trafic', cost: 0 },
    ],
    maintenanceAlerts: [
      { vehicle: 'Kangoo Pro', type: 'Vidange', due: '15 jours' },
      { vehicle: 'Partner', type: 'CT', due: '2 mois' },
      { vehicle: 'Trafic', type: 'Pneus', due: '5000 km' },
    ],
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        <PageTransition>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  Rapport mensuel
                </h1>
                <p className="text-muted-foreground mt-1">{mockReport.month}</p>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
            </div>

            {/* Stats principales */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Cout total</p>
                <p className="text-3xl font-bold">{mockReport.totalCost}EUR</p>
                <div
                  className={`flex items-center text-sm mt-2 ${mockReport.costChange < 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {mockReport.costChange < 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(mockReport.costChange)}% vs mois dernier
                </div>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Diagnostics</p>
                <p className="text-3xl font-bold">{mockReport.diagnostics}</p>
                <p className="text-sm text-muted-foreground mt-2">ce mois</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Vehicules</p>
                <p className="text-3xl font-bold">{mockReport.vehiclesCount}</p>
                <p className="text-sm text-muted-foreground mt-2">dans ta flotte</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Entretiens a venir</p>
                <p className="text-3xl font-bold text-amber-600">{mockReport.upcomingMaintenance}</p>
                <p className="text-sm text-muted-foreground mt-2">dans les 30 jours</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Couts par vehicule */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Couts par vehicule
                </h3>
                <div className="space-y-4">
                  {mockReport.costByVehicle.map((v, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{v.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${mockReport.totalCost > 0 ? (v.cost / mockReport.totalCost) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="font-medium w-16 text-right">{v.cost}EUR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Alertes entretien */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Entretiens a prevoir
                </h3>
                <div className="space-y-4">
                  {mockReport.maintenanceAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{alert.vehicle}</p>
                        <p className="text-sm text-muted-foreground">{alert.type}</p>
                      </div>
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        {alert.due}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
