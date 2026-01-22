import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useDevis } from '@/hooks/useDevis'
import { useVideoDiagnostics } from '@/hooks/useVideoDiagnostics'
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
  Eye,
  Video,
  Wrench,
  Euro
} from 'lucide-react'
import type { DevisAnalysis, VideoDiagnostic } from '@/types'
import { jsPDF } from 'jspdf'
import { downloadPDF } from '@/lib/pdfDownload'

// Helper function to convert analysis_result to string (handles both old string format and new JSON format)
function getAnalysisText(analysisResult: string | object | null | undefined): string {
  if (!analysisResult) return ''

  // If it's already a string, return it
  if (typeof analysisResult === 'string') {
    // Try to parse as JSON in case it was stringified
    try {
      const parsed = JSON.parse(analysisResult)
      return formatAnalysisObject(parsed)
    } catch {
      return analysisResult
    }
  }

  // If it's an object, format it
  return formatAnalysisObject(analysisResult)
}

// Format the professional analysis object to readable text
function formatAnalysisObject(obj: any): string {
  if (!obj) return ''

  const lines: string[] = []

  // Verdict
  if (obj.verdict) {
    const v = obj.verdict
    lines.push(`# VERDICT: ${v.statut?.toUpperCase() || 'N/A'} (${v.note || 0}/10)`)
    if (v.recommandation) lines.push(v.recommandation)
    if (v.commentaireExpert) lines.push(`💬 ${v.commentaireExpert}`)
    lines.push('')
  }

  // Alerts
  if (obj.alertes) {
    if (obj.alertes.graves?.length > 0) {
      lines.push('# ALERTES GRAVES')
      obj.alertes.graves.forEach((a: string) => lines.push(`❌ ${a}`))
      lines.push('')
    }
    if (obj.alertes.moyennes?.length > 0) {
      lines.push('# POINTS D\'ATTENTION')
      obj.alertes.moyennes.forEach((a: string) => lines.push(`⚠️ ${a}`))
      lines.push('')
    }
  }

  // Lines analysis
  if (obj.lignes?.length > 0) {
    lines.push('# ANALYSE DÉTAILLÉE')
    obj.lignes.forEach((l: any) => {
      const icon = l.verdict === 'ok' ? '✅' : l.verdict === 'eleve' ? '⚠️' : '❌'
      lines.push(`${icon} ${l.designation}: ${l.totalTTC?.toFixed(2) || 0}€ (marché: ~${l.prixMarche?.moyenne?.toFixed(2) || 0}€, écart: ${l.ecart > 0 ? '+' : ''}${l.ecart || 0}%)`)
    })
    lines.push('')
  }

  // Totals
  if (obj.totaux) {
    lines.push('# COMPARATIF')
    lines.push(`Prix facturé: ${obj.totaux.totalFacture?.toFixed(2) || 0}€`)
    lines.push(`Prix marché: ~${obj.totaux.totalMarche?.toFixed(2) || 0}€`)
    if (obj.economiesPotentielles) {
      const diff = obj.economiesPotentielles.montant || 0
      lines.push(`Différence: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}€`)
    }
  }

  return lines.join('\n')
}

export default function History() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const { diagnostics, loading: loadingDiagnostics, deleteDiagnostic } = useDiagnostics(user?.id)
  const { devisList, loading: loadingDevis, deleteDevis } = useDevis(user?.id)
  const { videoDiagnostics, loading: loadingVideo, deleteVideoDiagnostic } = useVideoDiagnostics(user?.id)
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
          getAnalysisText(d.analysis_result)?.toLowerCase().includes(searchLower) ||
          d.garage_name?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [devisList, search, isPremium])

  // Filter video diagnostics
  const filteredVideoDiagnostics = useMemo(() => {
    let filtered = videoDiagnostics

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
          d.probleme_identifie?.toLowerCase().includes(searchLower) ||
          d.description_visuelle?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [videoDiagnostics, search, isPremium])

  const hasOlderDiagnostics = !isPremium && diagnostics.length > filteredDiagnostics.length
  const hasOlderDevis = !isPremium && devisList.length > filteredDevis.length
  const hasOlderVideo = !isPremium && videoDiagnostics.length > filteredVideoDiagnostics.length

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-32 md:pb-8">
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
            <TabsList className="grid w-full max-w-xl grid-cols-3">
              <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Diagnostics</span> ({diagnostics.length})
              </TabsTrigger>
              <TabsTrigger value="devis" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Devis</span> ({devisList.length})
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Vidéo</span> ({videoDiagnostics.length})
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
                    <DiagnosticCard key={diagnostic.id} diagnostic={diagnostic} onDelete={deleteDiagnostic} />
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

            {/* Video Tab */}
            <TabsContent value="video">
              {/* Search for video */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un diagnostic vidéo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Warning for free users */}
              {hasOlderVideo && (
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

              {/* Video list */}
              {loadingVideo ? (
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
              ) : filteredVideoDiagnostics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    {search ? 'Aucun résultat' : 'Aucun diagnostic vidéo'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? 'Essaie de modifier ta recherche.'
                      : 'Filme un problème pour ton premier diagnostic vidéo.'}
                  </p>
                  {!search && (
                    <Link to="/app/diagnostic-video">
                      <Button>
                        <Video className="h-4 w-4 mr-2" />
                        Diagnostic vidéo
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVideoDiagnostics.map((video) => (
                    <VideoDiagnosticCard key={video.id} video={video} onDelete={deleteVideoDiagnostic} />
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

// DevisCard component - Design moderne
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
          gradient: 'from-emerald-500 to-green-600',
          color: 'text-emerald-600',
          bg: 'bg-emerald-100 dark:bg-emerald-950/50',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          label: 'Bon prix',
          emoji: '✅'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          gradient: 'from-amber-500 to-orange-500',
          color: 'text-amber-600',
          bg: 'bg-amber-100 dark:bg-amber-950/50',
          borderColor: 'border-amber-200 dark:border-amber-800',
          label: 'Négociable',
          emoji: '⚠️'
        }
      case 'bad':
        return {
          icon: XCircle,
          gradient: 'from-red-500 to-rose-600',
          color: 'text-red-600',
          bg: 'bg-red-100 dark:bg-red-950/50',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Trop cher',
          emoji: '🚨'
        }
      default:
        return {
          icon: Target,
          gradient: 'from-blue-500 to-indigo-600',
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-950/50',
          borderColor: 'border-blue-200 dark:border-blue-800',
          label: 'Analysé',
          emoji: '📊'
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
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Impossible de supprimer le devis: ${errorMessage}\n\nAssurez-vous que la migration RLS a été appliquée dans Supabase.`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const exportToPDF = async () => {
    console.log('[PDF] Starting PDF export for devis:', devis.id)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = 20

      // Helper function to add text with word wrap and page breaks
      const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
        if (!text) return
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
        const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2)

        // Check if we need a new page
        const lineHeight = size * 0.5
        if (y + lines.length * lineHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        doc.text(lines, margin, y)
        y += lines.length * lineHeight + 3
      }

      const addLine = () => {
        y += 2
        if (y > pageHeight - 30) {
          doc.addPage()
          y = 20
        }
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 5
      }

      // Header
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('ANALYSE DE DEVIS', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('MECA-IA - Assistant Automobile', pageWidth / 2, 25, { align: 'center' })

      y = 45
      doc.setTextColor(0, 0, 0)

      // Date
      const dateStr = new Date(devis.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      addText(`Date d'analyse: ${dateStr}`, 10)

      addLine()

      // Verdict
      const verdictText = devis.verdict_type === 'good' ? 'BON PRIX' :
                         devis.verdict_type === 'warning' ? 'NEGOCIABLE' :
                         devis.verdict_type === 'bad' ? 'TROP CHER' : 'ANALYSE'

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')

      if (devis.verdict_type === 'good') doc.setTextColor(16, 185, 129)
      else if (devis.verdict_type === 'warning') doc.setTextColor(245, 158, 11)
      else if (devis.verdict_type === 'bad') doc.setTextColor(239, 68, 68)
      else doc.setTextColor(59, 130, 246)

      doc.text(`VERDICT: ${verdictText}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setTextColor(0, 0, 0)

      // Potential savings
      if (devis.potential_savings && devis.potential_savings > 0) {
        if (y + 30 > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        doc.setFillColor(16, 185, 129) // Green for savings
        doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Economie potentielle: ${devis.potential_savings} EUR`, pageWidth / 2, y + 12, { align: 'center' })
        y += 28
        doc.setTextColor(0, 0, 0)
      }

      addLine()

      // Analysis content
      addText('DETAILS DE L\'ANALYSE', 12, 'bold')
      y += 3

      const analysisText = getAnalysisText(devis.analysis_result)
      if (analysisText) {
        const lines = analysisText.split('\n')

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) {
            y += 3
            continue
          }

          // Clean emojis for PDF (replace with text markers)
          let cleanLine = trimmedLine
            .replace(/✅/g, '[OK] ')
            .replace(/⚠️/g, '[!] ')
            .replace(/🔶/g, '[!] ')
            .replace(/❌/g, '[X] ')
            .replace(/🚫/g, '[X] ')
            .replace(/💬/g, '> ')
            .replace(/[^\x00-\x7F\u00C0-\u00FF\u0100-\u017F]/g, '') // Remove other emojis

          if (cleanLine.startsWith('#')) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            addText(cleanLine.replace(/^#+\s*/, ''), 11, 'bold')
          } else if (cleanLine.includes('[OK]') || cleanLine.toLowerCase().includes('correct')) {
            doc.setTextColor(16, 185, 129)
            addText(cleanLine, 9)
            doc.setTextColor(0, 0, 0)
          } else if (cleanLine.includes('[!]') || cleanLine.toLowerCase().includes('eleve')) {
            doc.setTextColor(245, 158, 11)
            addText(cleanLine, 9)
            doc.setTextColor(0, 0, 0)
          } else if (cleanLine.includes('[X]') || cleanLine.toLowerCase().includes('excessif')) {
            doc.setTextColor(239, 68, 68)
            addText(cleanLine, 9)
            doc.setTextColor(0, 0, 0)
          } else {
            doc.setTextColor(60, 60, 60)
            addText(cleanLine, 9)
            doc.setTextColor(0, 0, 0)
          }
        }
      }

      // Footer on last page
      doc.setTextColor(128, 128, 128)
      doc.setFontSize(8)
      doc.text('Rapport genere par MECA-IA - mymecai.com', pageWidth / 2, pageHeight - 10, { align: 'center' })

      // Generate filename with safe characters
      const dateForFile = new Date().toISOString().split('T')[0]
      const filename = `analyse-devis-${dateForFile}.pdf`

      console.log('[PDF] Saving PDF:', filename)

      // Use the shared download utility for proper mobile support
      await downloadPDF(doc, filename)

      console.log('[PDF] PDF saved successfully')
    } catch (err) {
      console.error('[PDF] Error generating PDF:', err)
      alert(`Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  // Extract key info from analysis
  const extractPreview = () => {
    const analysisText = getAnalysisText(devis.analysis_result)
    const lines = analysisText.split('\n').filter(l => l.trim())
    // Get meaningful preview lines (skip headers)
    const meaningfulLines = lines.filter(l => !l.startsWith('#') && l.length > 20).slice(0, 2)
    return meaningfulLines.join(' ').substring(0, 150)
  }

  return (
    <Card className={`overflow-hidden border-2 ${verdictStyle.borderColor} hover:shadow-lg transition-shadow`}>
      {/* Gradient header bar */}
      <div className={`h-2 bg-gradient-to-r ${verdictStyle.gradient}`} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${verdictStyle.bg} flex items-center justify-center shadow-sm`}>
              <VerdictIcon className={`h-6 w-6 ${verdictStyle.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">Analyse de devis</CardTitle>
                <Badge className={`${verdictStyle.bg} ${verdictStyle.color} border-0`}>
                  {verdictStyle.emoji} {verdictStyle.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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

          {/* Savings badge */}
          {devis.potential_savings && devis.potential_savings > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-sm">
              <Euro className="h-3.5 w-3.5" />
              -{devis.potential_savings}€
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Preview or full analysis */}
          {showFull ? (
            <div id={`devis-analysis-${devis.id}`} className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              {getAnalysisText(devis.analysis_result).split('\n').map((line, i) => {
                const trimmedLine = line.trim()
                if (!trimmedLine) return <div key={i} className="h-2" />

                if (trimmedLine.startsWith('#')) {
                  return (
                    <h4 key={i} className="font-semibold text-foreground mt-3 mb-1">
                      {trimmedLine.replace(/^#+\s*/, '')}
                    </h4>
                  )
                }

                if (trimmedLine.includes('✅') || line.toLowerCase().includes('correct')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-emerald-700 dark:text-emerald-300">{trimmedLine.replace(/[✅]/g, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('⚠️') || line.toLowerCase().includes('élevé')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-700 dark:text-amber-300">{trimmedLine.replace(/[⚠️🔶]/g, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('❌') || line.toLowerCase().includes('excessif')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-red-700 dark:text-red-300">{trimmedLine.replace(/[❌🚫]/g, '').trim()}</span>
                    </div>
                  )
                }

                return <p key={i} className="my-1">{line}</p>
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {extractPreview()}...
            </p>
          )}

          {/* Image preview if available */}
          {devis.image_url && showFull && (
            <div className="rounded-xl overflow-hidden border-2 border-dashed border-muted bg-muted/20">
              <img src={devis.image_url} alt="Devis" className="w-full max-h-48 object-contain" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-muted/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFull(!showFull)}
              className="flex-1 sm:flex-none"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              {showFull ? 'Réduire' : 'Voir détails'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// VideoDiagnosticCard component
interface VideoDiagnosticCardProps {
  video: VideoDiagnostic
  onDelete: (id: string) => Promise<void>
}

function VideoDiagnosticCard({ video, onDelete }: VideoDiagnosticCardProps) {
  const [showFull, setShowFull] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getUrgencyStyle = () => {
    switch (video.urgence) {
      case 'critique':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100 dark:bg-red-950',
          label: 'Critique',
          icon: '🚨'
        }
      case 'élevée':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100 dark:bg-orange-950',
          label: 'Élevée',
          icon: '⚠️'
        }
      case 'moyenne':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-100 dark:bg-amber-950',
          label: 'Moyenne',
          icon: '⚡'
        }
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-950',
          label: 'Faible',
          icon: '✅'
        }
    }
  }

  const urgencyStyle = getUrgencyStyle()

  const handleDelete = async () => {
    if (window.confirm('Supprimer ce diagnostic vidéo ?')) {
      setIsDeleting(true)
      try {
        await onDelete(video.id)
      } catch (error) {
        console.error('Error deleting video diagnostic:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Impossible de supprimer le diagnostic vidéo: ${errorMessage}\n\nAssurez-vous que la migration RLS a été appliquée dans Supabase.`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const exportToPDF = async () => {
    console.log('[PDF] Starting PDF export for video diagnostic:', video.id)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = 20

      // Helper function to add text with word wrap and page breaks
      const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
        if (!text) return
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
        const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2)

        const lineHeight = size * 0.5
        if (y + lines.length * lineHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        doc.text(lines, margin, y)
        y += lines.length * lineHeight + 3
      }

      const addLine = () => {
        y += 2
        if (y > pageHeight - 30) {
          doc.addPage()
          y = 20
        }
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 5
      }

      // Header
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('DIAGNOSTIC VIDEO', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('MECA-IA - Assistant Automobile', pageWidth / 2, 25, { align: 'center' })

      y = 45
      doc.setTextColor(0, 0, 0)

      // Date
      const dateStr = new Date(video.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      addText(`Date d'analyse: ${dateStr}`, 10)

      addLine()

      // Urgency
      const urgencyLabel = video.urgence === 'critique' ? 'CRITIQUE' :
                          video.urgence === 'élevée' ? 'ELEVEE' :
                          video.urgence === 'moyenne' ? 'MOYENNE' : 'FAIBLE'

      if (video.urgence === 'critique') doc.setTextColor(239, 68, 68)
      else if (video.urgence === 'élevée') doc.setTextColor(234, 88, 12)
      else if (video.urgence === 'moyenne') doc.setTextColor(202, 138, 4)
      else doc.setTextColor(22, 163, 74)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`URGENCE: ${urgencyLabel}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setTextColor(0, 0, 0)

      // Problem identified
      addText('PROBLEME IDENTIFIE', 12, 'bold')
      addText(video.probleme_identifie || 'Non spécifié', 11)
      y += 3

      // Description
      addText('Description visuelle:', 10, 'bold')
      addText(video.description_visuelle || 'Non spécifiée', 9)

      addLine()

      // Causes
      addText('CAUSES POSSIBLES', 12, 'bold')
      if (video.causes_possibles && video.causes_possibles.length > 0) {
        video.causes_possibles.forEach(cause => {
          addText(`• ${cause}`, 9)
        })
      } else {
        addText('Non spécifiées', 9)
      }

      y += 3

      // Parts
      addText('PIECES CONCERNEES', 12, 'bold')
      if (video.pieces_concernees && video.pieces_concernees.length > 0) {
        video.pieces_concernees.forEach(piece => {
          addText(`• ${piece}`, 9)
        })
      } else {
        addText('Non spécifiées', 9)
      }

      addLine()

      // Cost estimation
      if (y + 30 > pageHeight - 20) {
        doc.addPage()
        y = 20
      }
      doc.setFillColor(59, 130, 246)
      doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Estimation: ${video.estimation_cout_min || 0} EUR - ${video.estimation_cout_max || 0} EUR`, pageWidth / 2, y + 12, { align: 'center' })
      y += 28
      doc.setTextColor(0, 0, 0)

      // Recommendations
      addText('RECOMMANDATIONS', 12, 'bold')
      addText(video.recommandations || 'Non spécifiées', 9)

      // Footer on last page
      doc.setTextColor(128, 128, 128)
      doc.setFontSize(8)
      doc.text('Rapport genere par MECA-IA - mymecai.com', pageWidth / 2, pageHeight - 10, { align: 'center' })

      // Generate filename with safe characters
      const dateForFile = new Date().toISOString().split('T')[0]
      const filename = `diagnostic-video-${dateForFile}.pdf`

      console.log('[PDF] Saving video PDF:', filename)

      // Use the shared download utility for proper mobile support
      await downloadPDF(doc, filename)

      console.log('[PDF] Video PDF saved successfully')
    } catch (err) {
      console.error('[PDF] Error generating video PDF:', err)
      alert(`Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${urgencyStyle.bg} flex items-center justify-center`}>
              <span className="text-xl">{urgencyStyle.icon}</span>
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {video.probleme_identifie}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(video.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={urgencyStyle.color}>
              {urgencyStyle.label}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              {video.estimation_cout_min}€ - {video.estimation_cout_max}€
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{video.description_visuelle}</p>

          {showFull && (
            <>
              {/* Causes */}
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Causes possibles
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {video.causes_possibles.map((cause, i) => (
                    <li key={i}>{cause}</li>
                  ))}
                </ul>
              </div>

              {/* Parts */}
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <Wrench className="h-4 w-4 text-primary" />
                  Pièces concernées
                </p>
                <div className="flex flex-wrap gap-1">
                  {video.pieces_concernees.map((piece, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {piece}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Recommandations
                </p>
                <p className="text-sm text-muted-foreground">{video.recommandations}</p>
              </div>

              {/* Thumbnail */}
              {video.thumbnail_url && (
                <div className="mt-3 rounded-lg overflow-hidden border max-w-xs">
                  <img src={video.thumbnail_url} alt="Capture vidéo" className="w-full h-auto" />
                </div>
              )}
            </>
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
