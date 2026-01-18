import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useDevis } from '@/hooks/useDevis'
import Sidebar from '@/components/Sidebar'
import DiagnosticCard from '@/components/DiagnosticCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  MessageSquarePlus,
  AlertCircle,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Download,
  Trash2,
  Eye
} from 'lucide-react'
import type { DevisAnalysis } from '@/types'

export default function History() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const { diagnostics, loading: loadingDiagnostics } = useDiagnostics(user?.id)
  const { devisList, loading: loadingDevis, deleteDevis } = useDevis(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'diagnostics')

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

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

  // Filter devis
  const filteredDevis = useMemo(() => {
    let filtered = devisList

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
          d.analysis_result?.toLowerCase().includes(searchLower) ||
          d.garage_name?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [devisList, search, isPremium])

  const hasOlderDiagnostics = !isPremium && diagnostics.length > filteredDiagnostics.length
  const hasOlderDevis = !isPremium && devisList.length > filteredDevis.length

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Mon historique</h1>
            <div className="flex gap-2">
              <Link to="/app/chat">
                <Button>
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Diagnostic
                </Button>
              </Link>
              <Link to="/app/analyser-devis">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Analyser devis
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Diagnostics ({diagnostics.length})
              </TabsTrigger>
              <TabsTrigger value="devis" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Devis ({devisList.length})
              </TabsTrigger>
            </TabsList>

            {/* Diagnostics Tab */}
            <TabsContent value="diagnostics">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un diagnostic..."
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
              {loadingDiagnostics ? (
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
            </TabsContent>

            {/* Devis Tab */}
            <TabsContent value="devis">
              {/* Search for devis */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un devis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Warning for free users */}
              {hasOlderDevis && (
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

              {/* Devis list */}
              {loadingDevis ? (
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
              ) : filteredDevis.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    {search ? 'Aucun résultat' : 'Aucun devis analysé'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? 'Essaie de modifier ta recherche.'
                      : 'Analyse ton premier devis garage.'}
                  </p>
                  {!search && (
                    <Link to="/app/analyser-devis">
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Analyser un devis
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDevis.map((devis) => (
                    <DevisCard key={devis.id} devis={devis} onDelete={deleteDevis} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// DevisCard component
interface DevisCardProps {
  devis: DevisAnalysis
  onDelete: (id: string) => Promise<void>
}

function DevisCard({ devis, onDelete }: DevisCardProps) {
  const [showFull, setShowFull] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getVerdictStyle = () => {
    switch (devis.verdict_type) {
      case 'good':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-950',
          label: 'Bon prix'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bg: 'bg-amber-100 dark:bg-amber-950',
          label: 'Négociable'
        }
      case 'bad':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-100 dark:bg-red-950',
          label: 'Trop cher'
        }
      default:
        return {
          icon: Target,
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-950',
          label: 'Analysé'
        }
    }
  }

  const verdictStyle = getVerdictStyle()
  const VerdictIcon = verdictStyle.icon

  const handleDelete = async () => {
    if (window.confirm('Supprimer cette analyse de devis ?')) {
      setIsDeleting(true)
      try {
        await onDelete(devis.id)
      } catch (error) {
        console.error('Error deleting devis:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const exportToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analyse de Devis - MECAI</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .analysis { white-space: pre-wrap; line-height: 1.6; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>🔧 Analyse de Devis - MECAI</h1>
        <p style="color: #6b7280;">Analysé le ${new Date(devis.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="analysis">${devis.analysis_result.replace(/\n/g, '<br>')}</div>
        <div class="footer">
          <p>Ce rapport a été généré par MECAI - Votre assistant automobile intelligent.</p>
        </div>
      </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 250)
    }
  }

  // Get first few lines of analysis for preview
  const previewText = devis.analysis_result.split('\n').slice(0, 3).join('\n')

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${verdictStyle.bg} flex items-center justify-center`}>
              <VerdictIcon className={`h-5 w-5 ${verdictStyle.color}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Analyse de devis
                <Badge variant="outline" className={verdictStyle.color}>
                  {verdictStyle.label}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(devis.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          {devis.potential_savings && devis.potential_savings > 0 && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              -{devis.potential_savings}€ potentiel
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Preview or full analysis */}
          <div className="text-sm text-muted-foreground">
            {showFull ? (
              <div className="whitespace-pre-wrap">{devis.analysis_result}</div>
            ) : (
              <div className="whitespace-pre-wrap">{previewText}...</div>
            )}
          </div>

          {/* Image preview if available */}
          {devis.image_url && showFull && (
            <div className="mt-3 rounded-lg overflow-hidden border max-w-xs">
              <img src={devis.image_url} alt="Devis" className="w-full h-auto" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFull(!showFull)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showFull ? 'Réduire' : 'Voir tout'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
