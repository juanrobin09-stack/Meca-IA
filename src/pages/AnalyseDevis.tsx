import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDevis } from '@/hooks/useDevis'
import { analyzeQuote as analyzeQuoteAPI } from '@/lib/anthropic'
import { useConfetti } from '@/hooks/useConfetti'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  Info,
  AlertTriangle,
  TrendingDown,
  MessageSquare,
  Lightbulb,
  XCircle,
  ChevronRight,
  Target,
  Download,
  History
} from 'lucide-react'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import { Link } from 'react-router-dom'

export default function AnalyseDevis() {
  const { user, profile } = useAuth()
  const { isPremium, devisRemaining, checkDevisLimit, incrementDevisCount } = useSubscription(profile)
  const { saveDevis, devisList } = useDevis(user?.id)
  const { celebrateSuccess } = useConfetti()

  const [selectedFile, setSelectedFile] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [savedDevisId, setSavedDevisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [currentRemaining, setCurrentRemaining] = useState<number>(devisRemaining as number)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check limit on page load
  useEffect(() => {
    async function checkLimit() {
      if (!isPremium) {
        const status = await checkDevisLimit()
        if (!status.canAnalyze) {
          setShowPaywall(true)
        }
        setCurrentRemaining(status.remaining as number)
      }
    }
    checkLimit()
  }, [isPremium, checkDevisLimit])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    setAnalysis(null)

    // Validate
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    try {
      const compressed = await compressImage(file)
      setSelectedFile({
        dataUrl: compressed.dataUrl,
        base64: compressed.base64,
      })
    } catch {
      setError("Erreur lors du traitement de l'image")
    }
  }

  async function handleAnalyzeQuote() {
    if (!selectedFile || !user) return

    // Check limits for free users
    if (!isPremium) {
      const limitStatus = await checkDevisLimit()
      if (!limitStatus.canAnalyze) {
        setShowPaywall(true)
        return
      }
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzeQuoteAPI(selectedFile.base64)
      setAnalysis(result)
      celebrateSuccess() // Confetti on success!

      // Determine verdict type from analysis
      let verdictType: 'good' | 'warning' | 'bad' | 'neutral' = 'neutral'
      const lowerResult = result.toLowerCase()
      if (lowerResult.includes('négociable') || lowerResult.includes('élevé')) {
        verdictType = 'warning'
      } else if (lowerResult.includes('correct') || lowerResult.includes('bon prix')) {
        verdictType = 'good'
      } else if (lowerResult.includes('excessif') || lowerResult.includes('trop cher')) {
        verdictType = 'bad'
      }

      // Extract potential savings if mentioned
      const savingsMatch = result.match(/(?:économie|économies|potentiel)[^\n]*?(\d+)/i)
      const potentialSavings = savingsMatch ? parseInt(savingsMatch[1]) : undefined

      // Save to database
      const saved = await saveDevis({
        analysis_result: result,
        image_url: selectedFile.dataUrl,
        verdict_type: verdictType,
        potential_savings: potentialSavings,
        is_fair_price: verdictType === 'good',
      })
      setSavedDevisId(saved.id)

      // Increment counter after successful analysis (for free users)
      if (!isPremium) {
        await incrementDevisCount()
        setCurrentRemaining(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError("Erreur lors de l'analyse. Réessaie.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function reset() {
    setSelectedFile(null)
    setAnalysis(null)
    setSavedDevisId(null)
    setError(null)
  }

  // Display remaining from fresh check if available
  const displayRemaining = currentRemaining

  return (
    <PageTransition>
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <motion.div whileHover={{ rotate: 10 }}>
                  <FileText className="h-8 w-8 text-primary" />
                </motion.div>
                Analyse ton devis garage
              </h1>
              <div className="flex items-center gap-2">
                {devisList.length > 0 && (
                  <Link to="/app/history?tab=devis">
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Historique ({devisList.length})
                    </Button>
                  </Link>
                )}
                {!isPremium && (
                  <Badge variant="secondary" className="text-sm">
                    {displayRemaining}/1 analyse gratuite
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Upload ton devis, l'IA te dit si c'est le bon prix et comment négocier.
            </p>
          </motion.div>

          {/* Disclaimer */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <p>
              Notre analyse compare aux prix du marché français. Les tarifs peuvent varier
              selon votre région et le garage. Cette analyse est indicative.
            </p>
          </div>

          {/* Analysis Result - Premium Design */}
          {analysis && (
            <PremiumAnalysisResult
              analysis={analysis}
              imageUrl={selectedFile?.dataUrl}
              devisId={savedDevisId}
              onReset={reset}
            />
          )}

          {!analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Upload ton devis</CardTitle>
                <CardDescription>
                  Photo ou scan de ton devis garage (JPG, PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload zone */}
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-4">
                      <img
                        src={selectedFile.dataUrl}
                        alt="Devis"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Clique pour changer d'image
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Clique ou glisse ton devis ici</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG (max 10MB)</p>
                    </>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAnalyzeQuote}
                  disabled={!selectedFile || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyser le devis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Conseils pour un bon devis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Demande toujours un devis écrit détaillé avant intervention
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Compare au moins 2-3 garages pour les grosses réparations
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  N'hésite pas à négocier, surtout sur la main d'œuvre
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} mode="devis" />
    </div>
    </PageTransition>
  )
}

// Premium Analysis Result Component
interface PremiumAnalysisResultProps {
  analysis: string
  imageUrl?: string
  devisId?: string | null
  onReset: () => void
}

function PremiumAnalysisResult({ analysis, imageUrl, devisId: _devisId, onReset }: PremiumAnalysisResultProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Create a simple printable version
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analyse de Devis - MECAI</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #1f2937; margin-top: 20px; }
            .verdict { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .analysis { white-space: pre-wrap; line-height: 1.6; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>🔧 Analyse de Devis - MECAI</h1>
          <p style="color: #6b7280;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div class="analysis">${analysis.replace(/\n/g, '<br>')}</div>

          <div class="footer">
            <p>Ce rapport a été généré par MECAI - Votre assistant automobile intelligent.</p>
            <p>Les informations fournies sont indicatives et basées sur les prix du marché français.</p>
          </div>
        </body>
        </html>
      `

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }
  // Parse the analysis to extract sections
  const parseAnalysis = (text: string) => {
    const sections = {
      verdict: '',
      verdictType: 'neutral' as 'good' | 'warning' | 'bad' | 'neutral',
      items: [] as Array<{ name: string; price: string; marketPrice: string; status: 'ok' | 'warning' | 'bad' }>,
      savings: '',
      script: '',
      tips: [] as string[]
    }

    // Extract verdict
    const verdictMatch = text.match(/(?:VERDICT|verdict)[^\n]*[:\s]*([^\n]+)/i)
    if (verdictMatch) {
      sections.verdict = verdictMatch[1].trim()
      if (text.toLowerCase().includes('négociable') || text.toLowerCase().includes('élevé')) {
        sections.verdictType = 'warning'
      } else if (text.toLowerCase().includes('correct') || text.toLowerCase().includes('bon prix')) {
        sections.verdictType = 'good'
      } else if (text.toLowerCase().includes('excessif') || text.toLowerCase().includes('trop cher')) {
        sections.verdictType = 'bad'
      }
    }

    // Extract savings
    const savingsMatch = text.match(/(?:économie|économies|potentiel)[^\n]*?(\d+[€\s]*(?:à|-)?\s*\d*\s*€?)/i)
    if (savingsMatch) {
      sections.savings = savingsMatch[1].trim()
    }

    // Extract script
    const scriptMatch = text.match(/(?:script|négociation)[^\n]*[\n"«]([^"»]+)/i)
    if (scriptMatch) {
      sections.script = scriptMatch[1].trim().replace(/^["«\s]+|["»\s]+$/g, '')
    }

    // Extract tips/conseils
    const tipsSection = text.match(/(?:conseils?|recommandations?)[^\n]*\n([\s\S]*?)(?:\n\n|$)/i)
    if (tipsSection) {
      const tipsText = tipsSection[1]
      const tipLines = tipsText.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      sections.tips = tipLines.map(t => t.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
    }

    // If no tips found, try to extract from the whole text
    if (sections.tips.length === 0) {
      const lines = text.split('\n')
      lines.forEach(line => {
        if ((line.includes('Demande') || line.includes('Vérifie') || line.includes('Compare')) && line.length < 150) {
          sections.tips.push(line.replace(/^[-•]\s*/, '').trim())
        }
      })
    }

    return sections
  }

  const parsed = parseAnalysis(analysis)

  const getVerdictStyle = () => {
    switch (parsed.verdictType) {
      case 'good':
        return {
          bg: 'from-green-500 to-emerald-600',
          icon: CheckCircle2,
          iconColor: 'text-white',
          label: 'Bon prix'
        }
      case 'warning':
        return {
          bg: 'from-amber-500 to-orange-600',
          icon: AlertTriangle,
          iconColor: 'text-white',
          label: 'Négociable'
        }
      case 'bad':
        return {
          bg: 'from-red-500 to-rose-600',
          icon: XCircle,
          iconColor: 'text-white',
          label: 'Trop cher'
        }
      default:
        return {
          bg: 'from-blue-500 to-indigo-600',
          icon: Target,
          iconColor: 'text-white',
          label: 'Analysé'
        }
    }
  }

  const verdictStyle = getVerdictStyle()
  const VerdictIcon = verdictStyle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${verdictStyle.bg} opacity-90`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <VerdictIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Analyse terminée</p>
                <h2 className="text-xl font-bold">{verdictStyle.label}</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onReset}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur"
              >
                Nouveau devis
              </Button>
            </div>
          </div>

          {parsed.verdict && (
            <p className="text-white/90 text-sm leading-relaxed">
              {parsed.verdict}
            </p>
          )}
        </div>
      </div>

      {/* Savings Card */}
      {parsed.savings && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <TrendingDown className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Économie potentielle</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{parsed.savings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Detailed Analysis Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              Analyse détaillée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {analysis.split('\n').map((line, i) => {
                  // Style different types of lines
                  if (line.includes('✅') || line.includes('OK') || line.toLowerCase().includes('correct')) {
                    return (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{line.replace(/[✅]/g, '').trim()}</span>
                      </div>
                    )
                  }
                  if (line.includes('⚠️') || line.includes('🔶') || line.toLowerCase().includes('élevé')) {
                    return (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{line.replace(/[⚠️🔶]/g, '').trim()}</span>
                      </div>
                    )
                  }
                  if (line.includes('❌') || line.includes('🚫') || line.toLowerCase().includes('excessif')) {
                    return (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{line.replace(/[❌🚫]/g, '').trim()}</span>
                      </div>
                    )
                  }
                  if (line.trim().startsWith('#') || line.trim().startsWith('##')) {
                    return (
                      <h3 key={i} className="font-semibold text-foreground mt-4 mb-2 flex items-center gap-2">
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    )
                  }
                  if (line.trim()) {
                    return <p key={i} className="my-1">{line}</p>
                  }
                  return <div key={i} className="h-2" />
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Negotiation Script */}
      {parsed.script && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                Script de négociation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
                <blockquote className="pl-4 italic text-sm text-foreground/80 leading-relaxed">
                  "{parsed.script}"
                </blockquote>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tips */}
      {parsed.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {parsed.tips.slice(0, 5).map((tip, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Original Quote Preview */}
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                Devis original
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Devis original"
                  className="w-full max-h-48 object-contain bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
