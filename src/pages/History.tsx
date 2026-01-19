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

export default function History() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const { diagnostics, loading: loadingDiagnostics } = useDiagnostics(user?.id)
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
          d.analysis_result?.toLowerCase().includes(searchLower) ||
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
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #fff; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; }
          .header h1 { margin: 0 0 8px 0; font-size: 24px; }
          .header p { margin: 0; opacity: 0.9; font-size: 14px; }
          .verdict-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; font-weight: 600; margin-top: 12px; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
          .analysis { white-space: pre-wrap; line-height: 1.8; color: #475569; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔧 Analyse de Devis</h1>
          <p>Analysé le ${new Date(devis.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <div class="verdict-badge">${verdictStyle.emoji} ${verdictStyle.label}</div>
        </div>
        ${devis.potential_savings ? `<div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 20px; border-radius: 12px; margin-bottom: 16px; text-align: center;"><div style="font-size: 14px; opacity: 0.9;">💰 Économie potentielle</div><div style="font-size: 28px; font-weight: 700;">${devis.potential_savings}€</div></div>` : ''}
        <div class="section">
          <div class="analysis">${devis.analysis_result.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="footer">
          <p><strong>MECAI</strong> - Votre assistant automobile intelligent</p>
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

  // Extract key info from analysis
  const extractPreview = () => {
    const lines = devis.analysis_result.split('\n').filter(l => l.trim())
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
            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4 max-h-96 overflow-y-auto">
              {devis.analysis_result.split('\n').map((line, i) => {
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
        <title>Diagnostic Vidéo - MECAI</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #1f2937; margin-top: 20px; }
          .urgency { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
          .urgency-critique { background: #fecaca; color: #dc2626; }
          .urgency-elevee { background: #fed7aa; color: #ea580c; }
          .urgency-moyenne { background: #fef08a; color: #ca8a04; }
          .urgency-faible { background: #bbf7d0; color: #16a34a; }
          ul { line-height: 1.8; }
          .cost { font-size: 24px; color: #3b82f6; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>🎥 Diagnostic Vidéo - MECAI</h1>
        <p style="color: #6b7280;">Analysé le ${new Date(video.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <h2>${urgencyStyle.icon} ${video.probleme_identifie}</h2>
        <p><span class="urgency urgency-${video.urgence}">Urgence: ${video.urgence}</span></p>
        <p>${video.description_visuelle}</p>

        <h2>⚠️ Causes possibles</h2>
        <ul>
          ${video.causes_possibles.map(c => `<li>${c}</li>`).join('')}
        </ul>

        <h2>🔧 Pièces concernées</h2>
        <ul>
          ${video.pieces_concernees.map(p => `<li>${p}</li>`).join('')}
        </ul>

        <h2>💰 Estimation coût</h2>
        <p class="cost">${video.estimation_cout_min}€ - ${video.estimation_cout_max}€</p>

        <h2>📋 Recommandations</h2>
        <p>${video.recommandations}</p>

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
