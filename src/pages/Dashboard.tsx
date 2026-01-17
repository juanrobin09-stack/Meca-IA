import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquarePlus, History, Sparkles } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Salut {displayName} !
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur MecaIA, ton assistant diagnostic auto.
            </p>
          </div>

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
                <Link to="/app/account">
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Passer Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link to="/app/chat">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquarePlus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Nouveau diagnostic</CardTitle>
                  <CardDescription>
                    Décris ton problème de voiture et obtiens un diagnostic expert en quelques minutes.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/app/history">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Historique</CardTitle>
                  <CardDescription>
                    Retrouve tous tes diagnostics passés et reprends une conversation.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Stats (Premium) */}
          {isPremium && (
            <Card>
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
  )
}
