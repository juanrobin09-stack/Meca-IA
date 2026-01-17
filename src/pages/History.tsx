import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import Sidebar from '@/components/Sidebar'
import DiagnosticCard from '@/components/DiagnosticCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MessageSquarePlus, AlertCircle, Sparkles } from 'lucide-react'

export default function History() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const { diagnostics, loading } = useDiagnostics(user?.id)

  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')

  // Filter diagnostics based on search and urgency
  const filteredDiagnostics = useMemo(() => {
    let filtered = diagnostics

    // Filter by time for free users (30 days)
    if (!isPremium) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      filtered = filtered.filter((d) => new Date(d.created_at) > thirtyDaysAgo)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.problem_description?.toLowerCase().includes(searchLower) ||
          d.car_brand?.toLowerCase().includes(searchLower) ||
          d.car_model?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by urgency
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter((d) => d.urgency_level === urgencyFilter)
    }

    return filtered
  }, [diagnostics, search, urgencyFilter, isPremium])

  const hasOlderDiagnostics = !isPremium && diagnostics.length > filteredDiagnostics.length

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Mes diagnostics</h1>
            <Link to="/app/chat">
              <Button>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Nouveau diagnostic
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'high', label: 'Urgent' },
                { value: 'medium', label: 'Moyen' },
                { value: 'low', label: 'Faible' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={urgencyFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUrgencyFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Warning for free users */}
          {hasOlderDiagnostics && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Historique limité à 30 jours</p>
                    <p className="text-sm text-amber-700">
                      Passe Premium pour accéder à tout ton historique.
                    </p>
                  </div>
                </div>
                <Link to="/app/account">
                  <Button size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Passer Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Diagnostics list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDiagnostics.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {search || urgencyFilter !== 'all'
                  ? 'Aucun résultat'
                  : 'Aucun diagnostic'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {search || urgencyFilter !== 'all'
                  ? 'Essaie de modifier tes filtres.'
                  : 'Commence par faire ton premier diagnostic.'}
              </p>
              {!search && urgencyFilter === 'all' && (
                <Link to="/app/chat">
                  <Button>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Faire un diagnostic
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDiagnostics.map((diagnostic) => (
                <DiagnosticCard key={diagnostic.id} diagnostic={diagnostic} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
