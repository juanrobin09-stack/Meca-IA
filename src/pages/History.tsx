import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { useAuth } from '@/hooks/useAuth'
import { useDevis } from '@/hooks/useDevis'
import { useVideoDiagnostics } from '@/hooks/useVideoDiagnostics'
import { useDiagnosticProSessions } from '@/hooks/useDiagnosticProSessions'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
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
  Euro,
  Stethoscope,
  Play,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { DevisAnalysis, VideoDiagnostic, DiagnosticProSession } from '@/types'
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
interface AnalysisObject {
  verdict?: { statut?: string; note?: number; recommandation?: string; commentaireExpert?: string }
  alertes?: { graves?: string[]; moyennes?: string[] }
  lignes?: Array<{ designation: string; totalTTC?: number; prixMarche?: { moyenne?: number }; ecart?: number; verdict?: string }>
  totaux?: { totalFacture?: number; totalMarche?: number }
  economiesPotentielles?: number | { montant?: number }
  recommandations?: string[]
}

function formatAnalysisObject(obj: AnalysisObject): string {
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
    const graves = obj.alertes.graves
    if (graves && graves.length > 0) {
      lines.push('# ALERTES GRAVES')
      graves.forEach((a: string) => lines.push(`❌ ${a}`))
      lines.push('')
    }
    const moyennes = obj.alertes.moyennes
    if (moyennes && moyennes.length > 0) {
      lines.push('# POINTS D\'ATTENTION')
      moyennes.forEach((a: string) => lines.push(`⚠️ ${a}`))
      lines.push('')
    }
  }

  // Lines analysis
  const lignes = obj.lignes
  if (lignes && lignes.length > 0) {
    lines.push('# ANALYSE DÉTAILLÉE')
    lignes.forEach((l) => {
      const icon = l.verdict === 'ok' ? '✅' : l.verdict === 'eleve' ? '⚠️' : '❌'
      const ecart = l.ecart ?? 0
      lines.push(`${icon} ${l.designation}: ${l.totalTTC?.toFixed(2) || 0}€ (marché: ~${l.prixMarche?.moyenne?.toFixed(2) || 0}€, écart: ${ecart > 0 ? '+' : ''}${ecart}%)`)
    })
    lines.push('')
  }

  // Totals
  if (obj.totaux) {
    lines.push('# COMPARATIF')
    lines.push(`Prix facturé: ${obj.totaux.totalFacture?.toFixed(2) || 0}€`)
    lines.push(`Prix marché: ~${obj.totaux.totalMarche?.toFixed(2) || 0}€`)
    if (obj.economiesPotentielles) {
      const diff = typeof obj.economiesPotentielles === 'number'
        ? obj.economiesPotentielles
        : (obj.economiesPotentielles.montant || 0)
      lines.push(`Différence: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}€`)
    }
  }

  return lines.join('\n')
}

export default function History() {
  const { user } = useAuth()
  const { devisList, loading: loadingDevis, deleteDevis } = useDevis(user?.id)
  const { videoDiagnostics, loading: loadingVideo, deleteVideoDiagnostic } = useVideoDiagnostics(user?.id)
  const { sessions: diagnosticProSessions, loading: loadingDiagnosticPro, deleteSession: deleteDiagnosticProSession } = useDiagnosticProSessions(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'diagnostic-pro')

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  // Filter devis
  const filteredDevis = useMemo(() => {
    let filtered = devisList

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
  }, [devisList, search])

  // Filter video diagnostics
  const filteredVideoDiagnostics = useMemo(() => {
    let filtered = videoDiagnostics

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
  }, [videoDiagnostics, search])

  // Filter Diagnostic Pro sessions
  const filteredDiagnosticProSessions = useMemo(() => {
    let filtered = diagnosticProSessions

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(searchLower) ||
          s.diagnosis_summary?.toLowerCase().includes(searchLower) ||
          s.final_diagnosis?.problem_identified?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [diagnosticProSessions, search])


  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
      <Sidebar />

      <main className="md:pl-64 pb-32 md:pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Mon historique</h1>
            <div className="flex gap-2">
              <Link to="/app/diagnostic-pro">
                <Button>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Diagnostic Pro
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
              <TabsTrigger value="diagnostic-pro" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                <span className="hidden sm:inline">Diagnostics Pro</span> ({diagnosticProSessions.length})
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

            {/* Diagnostic Pro Tab */}
            <TabsContent value="diagnostic-pro">
              {/* Search for Diagnostic Pro */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un diagnostic pro..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Diagnostic Pro list */}
              {loadingDiagnosticPro ? (
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
              ) : filteredDiagnosticProSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Stethoscope className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    {search ? 'Aucun résultat' : 'Aucun diagnostic pro'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? 'Essaie de modifier ta recherche.'
                      : 'Fais ton premier diagnostic professionnel avec recherche web.'}
                  </p>
                  {!search && (
                    <Link to="/app/diagnostic-pro">
                      <Button>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Diagnostic Pro
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDiagnosticProSessions.map((session) => (
                    <DiagnosticProCard key={session.id} session={session} onDelete={deleteDiagnosticProSession} />
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
    </PageTransition>
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
          bg: 'bg-emerald-950/50',
          borderColor: 'border-emerald-800',
          label: 'Bon prix',
          emoji: '✅'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          gradient: 'from-amber-500 to-orange-500',
          color: 'text-amber-600',
          bg: 'bg-amber-950/50',
          borderColor: 'border-amber-800',
          label: 'Négociable',
          emoji: '⚠️'
        }
      case 'bad':
        return {
          icon: XCircle,
          gradient: 'from-red-500 to-rose-600',
          color: 'text-red-600',
          bg: 'bg-red-950/50',
          borderColor: 'border-red-800',
          label: 'Trop cher',
          emoji: '🚨'
        }
      default:
        return {
          icon: Target,
          gradient: 'from-blue-500 to-indigo-600',
          color: 'text-blue-600',
          bg: 'bg-blue-950/50',
          borderColor: 'border-blue-800',
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
          const cleanLine = trimmedLine
            .replace(/✅/g, '[OK] ')
            .replace(/⚠️/g, '[!] ')
            .replace(/🔶/g, '[!] ')
            .replace(/❌/g, '[X] ')
            .replace(/🚫/g, '[X] ')
            .replace(/💬/g, '> ')
            .replace(/[^\x20-\x7F\u00C0-\u00FF\u0100-\u017F]/g, '') // Remove other emojis (excluding control chars)

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
                      <span className="text-emerald-300">{trimmedLine.replace(/✅/gu, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('⚠️') || line.toLowerCase().includes('élevé')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-300">{trimmedLine.replace(/⚠️|🔶/gu, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('❌') || line.toLowerCase().includes('excessif')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-red-300">{trimmedLine.replace(/❌|🚫/gu, '').trim()}</span>
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
              className="text-red-500 hover:text-red-600 hover:bg-red-950/30 ml-auto"
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
          bg: 'bg-red-950',
          label: 'Critique',
          icon: '🚨'
        }
      case 'élevée':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-950',
          label: 'Élevée',
          icon: '⚠️'
        }
      case 'moyenne':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-950',
          label: 'Moyenne',
          icon: '⚡'
        }
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-950',
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
            <Badge className="bg-blue-100 bg-blue-950 dark:text-blue-400">
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

// DiagnosticProCard component
interface DiagnosticProCardProps {
  session: DiagnosticProSession
  onDelete: (id: string) => Promise<void>
}

function DiagnosticProCard({ session, onDelete }: DiagnosticProCardProps) {
  const [showFull, setShowFull] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getUrgencyStyle = () => {
    switch (session.urgency_level) {
      case 'urgent':
        return {
          color: 'text-red-600',
          bg: 'bg-red-950',
          borderColor: 'border-red-800',
          gradient: 'from-red-500 to-rose-600',
          label: 'Urgent',
          icon: '🚨'
        }
      case 'moyen':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-950',
          borderColor: 'border-amber-800',
          gradient: 'from-amber-500 to-orange-500',
          label: 'Moyen',
          icon: '⚠️'
        }
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-950',
          borderColor: 'border-green-800',
          gradient: 'from-emerald-500 to-green-600',
          label: 'Faible',
          icon: '✅'
        }
    }
  }

  const urgencyStyle = getUrgencyStyle()
  const isCompleted = session.status === 'completed'
  const finalDiag = session.final_diagnosis

  const handleDelete = async () => {
    if (window.confirm('Supprimer ce diagnostic pro ?')) {
      setIsDeleting(true)
      try {
        await onDelete(session.id)
      } catch (error) {
        console.error('Error deleting diagnostic pro session:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Impossible de supprimer: ${errorMessage}`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const exportToPDF = async () => {
    console.log('[PDF] Starting PDF export for diagnostic pro:', session.id)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = 20

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
      doc.setFillColor(147, 51, 234) // Purple for Pro
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('DIAGNOSTIC PRO', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('MECA-IA - Analyse Professionnelle', pageWidth / 2, 25, { align: 'center' })

      y = 45
      doc.setTextColor(0, 0, 0)

      // Date
      const dateStr = new Date(session.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      addText(`Date d'analyse: ${dateStr}`, 10)
      addText(`Titre: ${session.title}`, 10)

      addLine()

      // Urgency
      const urgencyLabel = session.urgency_level === 'urgent' ? 'URGENT' :
                          session.urgency_level === 'moyen' ? 'MOYEN' : 'FAIBLE'

      if (session.urgency_level === 'urgent') doc.setTextColor(239, 68, 68)
      else if (session.urgency_level === 'moyen') doc.setTextColor(245, 158, 11)
      else doc.setTextColor(22, 163, 74)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`URGENCE: ${urgencyLabel}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setTextColor(0, 0, 0)

      // Summary
      if (session.diagnosis_summary) {
        addText('RESUME DU DIAGNOSTIC', 12, 'bold')
        addText(session.diagnosis_summary, 10)
        y += 3
      }

      // Final diagnosis details
      if (finalDiag) {
        addLine()

        // Problem identified
        if (finalDiag.problem_identified) {
          addText('PROBLEME IDENTIFIE', 12, 'bold')
          addText(finalDiag.problem_identified, 10)
          y += 3
        }

        // Causes
        if (finalDiag.causes_possibles && finalDiag.causes_possibles.length > 0) {
          addText('CAUSES POSSIBLES', 12, 'bold')
          finalDiag.causes_possibles.forEach(cause => {
            const prob = cause.probabilite === 'élevée' ? '[ELEVE]' :
                        cause.probabilite === 'moyenne' ? '[MOYEN]' : '[FAIBLE]'
            addText(`${prob} ${cause.cause}`, 9)
            if (cause.explication) {
              doc.setTextColor(100, 100, 100)
              addText(`   ${cause.explication}`, 8)
              doc.setTextColor(0, 0, 0)
            }
          })
          y += 3
        }

        // Recommendations
        if (finalDiag.recommandations && finalDiag.recommandations.length > 0) {
          addText('RECOMMANDATIONS', 12, 'bold')
          finalDiag.recommandations.forEach((rec, i) => {
            addText(`${i + 1}. ${rec}`, 9)
          })
          y += 3
        }

        // Parts needed
        if (finalDiag.parts_needed && finalDiag.parts_needed.length > 0) {
          addText('PIECES NECESSAIRES', 12, 'bold')
          finalDiag.parts_needed.forEach(part => {
            addText(`- ${part.name}: ${part.price_estimate}`, 9)
          })
          y += 3
        }

        // Risks if ignored
        if (finalDiag.risks_if_ignored && finalDiag.risks_if_ignored.length > 0) {
          addText('RISQUES SI NON TRAITE', 12, 'bold')
          doc.setTextColor(239, 68, 68)
          finalDiag.risks_if_ignored.forEach(risk => {
            addText(`! ${risk}`, 9)
          })
          doc.setTextColor(0, 0, 0)
          y += 3
        }

        // TSB
        if (finalDiag.tsb_found && finalDiag.tsb_found.length > 0) {
          addText('BULLETINS TECHNIQUES (TSB)', 12, 'bold')
          finalDiag.tsb_found.forEach(tsb => {
            addText(`- ${tsb.reference}: ${tsb.description}`, 9)
          })
          y += 3
        }
      }

      // Cost estimation
      if (session.estimated_cost_min || session.estimated_cost_max) {
        addLine()
        if (y + 30 > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        doc.setFillColor(147, 51, 234)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Estimation: ${session.estimated_cost_min || 0} EUR - ${session.estimated_cost_max || 0} EUR`, pageWidth / 2, y + 12, { align: 'center' })
        y += 28
        doc.setTextColor(0, 0, 0)
      }

      // Sources
      if (session.sources_collected && session.sources_collected.length > 0) {
        addText('SOURCES', 10, 'bold')
        doc.setTextColor(100, 100, 100)
        session.sources_collected.slice(0, 5).forEach(source => {
          addText(`- ${source}`, 8)
        })
        doc.setTextColor(0, 0, 0)
      }

      // Footer
      doc.setTextColor(128, 128, 128)
      doc.setFontSize(8)
      doc.text('Rapport genere par MECA-IA - mymecai.com', pageWidth / 2, pageHeight - 10, { align: 'center' })

      const dateForFile = new Date().toISOString().split('T')[0]
      const filename = `diagnostic-pro-${dateForFile}.pdf`

      console.log('[PDF] Saving diagnostic pro PDF:', filename)
      await downloadPDF(doc, filename)
      console.log('[PDF] Diagnostic Pro PDF saved successfully')
    } catch (err) {
      console.error('[PDF] Error generating diagnostic pro PDF:', err)
      alert(`Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  return (
    <Card className={`overflow-hidden border-2 ${urgencyStyle.borderColor} hover:shadow-lg transition-shadow`}>
      {/* Gradient header bar */}
      <div className={`h-2 bg-gradient-to-r ${urgencyStyle.gradient}`} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${urgencyStyle.bg} flex items-center justify-center shadow-sm`}>
              <Stethoscope className={`h-6 w-6 ${urgencyStyle.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base line-clamp-1">{session.title || 'Diagnostic Pro'}</CardTitle>
                <Badge className={`${urgencyStyle.bg} ${urgencyStyle.color} border-0`}>
                  {urgencyStyle.icon} {urgencyStyle.label}
                </Badge>
                {isCompleted ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Terminé
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <Clock className="h-3 w-3 mr-1" />
                    En cours
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(session.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Cost badge */}
          {(session.estimated_cost_min || session.estimated_cost_max) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-semibold shadow-sm">
              <Euro className="h-3.5 w-3.5" />
              {session.estimated_cost_min}€ - {session.estimated_cost_max}€
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Summary */}
          {session.diagnosis_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {session.diagnosis_summary}
            </p>
          )}

          {/* Expanded view */}
          {showFull && finalDiag && (
            <div className="space-y-4 bg-muted/30 rounded-xl p-4">
              {/* Problem identified */}
              {finalDiag.problem_identified && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Target className="h-4 w-4 text-purple-500" />
                    Problème identifié
                  </p>
                  <p className="text-sm text-muted-foreground">{finalDiag.problem_identified}</p>
                </div>
              )}

              {/* Causes */}
              {finalDiag.causes_possibles && finalDiag.causes_possibles.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Causes possibles
                  </p>
                  <div className="space-y-2">
                    {finalDiag.causes_possibles.map((cause, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className={
                            cause.probabilite === 'élevée' ? 'text-red-600 border-red-300' :
                            cause.probabilite === 'moyenne' ? 'text-amber-600 border-amber-300' :
                            'text-green-600 border-green-300'
                          }
                        >
                          {cause.probabilite}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{cause.cause}</p>
                          {cause.explication && (
                            <p className="text-xs text-muted-foreground">{cause.explication}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {finalDiag.recommandations && finalDiag.recommandations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Recommandations
                  </p>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    {finalDiag.recommandations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Parts needed */}
              {finalDiag.parts_needed && finalDiag.parts_needed.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Wrench className="h-4 w-4 text-primary" />
                    Pièces nécessaires
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {finalDiag.parts_needed.map((part, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {part.name} ({part.price_estimate})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks if ignored */}
              {finalDiag.risks_if_ignored && finalDiag.risks_if_ignored.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    Risques si non traité
                  </p>
                  <ul className="text-sm text-red-600/80 list-disc list-inside">
                    {finalDiag.risks_if_ignored.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TSB */}
              {finalDiag.tsb_found && finalDiag.tsb_found.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Bulletins techniques (TSB)
                  </p>
                  <div className="space-y-1">
                    {finalDiag.tsb_found.map((tsb, i) => (
                      <div key={i} className="text-xs bg-blue-950/30 rounded p-2">
                        <span className="font-medium">{tsb.reference}:</span> {tsb.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {session.sources_collected && session.sources_collected.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 text-muted-foreground">
                    Sources ({session.sources_collected.length})
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5 max-h-20 overflow-y-auto">
                    {session.sources_collected.slice(0, 5).map((source, i) => (
                      <p key={i} className="truncate">{source}</p>
                    ))}
                    {session.sources_collected.length > 5 && (
                      <p className="italic">+{session.sources_collected.length - 5} autres sources...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages count */}
          {session.messages && session.messages.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {session.messages.length} message{session.messages.length > 1 ? 's' : ''} dans la conversation
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-muted/50">
            {isCompleted && finalDiag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFull(!showFull)}
                className="flex-1 sm:flex-none"
              >
                {showFull ? <ChevronUp className="h-4 w-4 mr-1.5" /> : <ChevronDown className="h-4 w-4 mr-1.5" />}
                {showFull ? 'Réduire' : 'Voir détails'}
              </Button>
            )}
            {!isCompleted && (
              <Link to={`/app/diagnostic-pro?session=${session.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Reprendre
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={!isCompleted}
            >
              <Download className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600 hover:bg-red-950/30 ml-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
