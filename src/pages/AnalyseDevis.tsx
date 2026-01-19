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
  History,
  Euro
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

// Premium Analysis Result Component - Design moderne et structuré
interface PremiumAnalysisResultProps {
  analysis: string
  imageUrl?: string
  devisId?: string | null
  onReset: () => void
}

interface ParsedPriceItem {
  name: string
  devisPrice: string
  marketPrice: string
  status: 'ok' | 'warning' | 'bad'
  difference?: string
}

interface ParsedAnalysis {
  verdict: string
  verdictType: 'good' | 'warning' | 'bad' | 'neutral'
  totalDevis: string
  totalMarket: string
  savings: string
  priceItems: ParsedPriceItem[]
  script: string
  tips: string[]
  summary: string
}

function PremiumAnalysisResult({ analysis, imageUrl, devisId, onReset }: PremiumAnalysisResultProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  // Enhanced parsing function
  const parseAnalysis = (text: string): ParsedAnalysis => {
    const result: ParsedAnalysis = {
      verdict: '',
      verdictType: 'neutral',
      totalDevis: '',
      totalMarket: '',
      savings: '',
      priceItems: [],
      script: '',
      tips: [],
      summary: ''
    }

    const lowerText = text.toLowerCase()

    // Determine verdict type
    if (lowerText.includes('excessif') || lowerText.includes('trop cher') || lowerText.includes('surfacturé')) {
      result.verdictType = 'bad'
      result.verdict = 'Ce devis est trop cher'
    } else if (lowerText.includes('négociable') || lowerText.includes('élevé') || lowerText.includes('au-dessus')) {
      result.verdictType = 'warning'
      result.verdict = 'Ce devis est négociable'
    } else if (lowerText.includes('correct') || lowerText.includes('bon prix') || lowerText.includes('raisonnable') || lowerText.includes('conforme')) {
      result.verdictType = 'good'
      result.verdict = 'Ce devis est correct'
    } else {
      result.verdict = 'Analyse effectuée'
    }

    // Extract totals
    const totalMatch = text.match(/total[^:]*:\s*(\d+(?:[.,]\d+)?)\s*€/i)
    if (totalMatch) {
      result.totalDevis = totalMatch[1] + '€'
    }

    // Extract market estimation
    const marketMatch = text.match(/(?:marché|estimation|devrait|entre)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:€|à|-)\s*(\d+(?:[.,]\d+)?)?/i)
    if (marketMatch) {
      result.totalMarket = marketMatch[2] ? `${marketMatch[1]}€ - ${marketMatch[2]}€` : `${marketMatch[1]}€`
    }

    // Extract savings
    const savingsMatch = text.match(/(?:économie|économies|économiser|potentiel)[^\d]*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?(?:\s*(?:à|-)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?)?/i)
    if (savingsMatch) {
      result.savings = savingsMatch[2] ? `${savingsMatch[1]}€ - ${savingsMatch[2]}€` : `${savingsMatch[1]}€`
    }

    // Extract price items from analysis
    const lines = text.split('\n')
    const pricePatterns = [
      /(.+?):\s*(\d+(?:[.,]\d+)?)\s*€\s*(?:→|->|vs|contre|marché[:\s]*)(\d+(?:[.,]\d+)?)\s*€/i,
      /(.+?)\s*-\s*(?:devis|facturé)[:\s]*(\d+(?:[.,]\d+)?)\s*€.*(?:marché|prix\s*normal)[:\s]*(\d+(?:[.,]\d+)?)\s*€/i
    ]

    lines.forEach(line => {
      for (const pattern of pricePatterns) {
        const match = line.match(pattern)
        if (match) {
          const name = match[1].replace(/^[-•*]\s*/, '').trim()
          const devisPrice = parseFloat(match[2].replace(',', '.'))
          const marketPrice = parseFloat(match[3].replace(',', '.'))

          let status: 'ok' | 'warning' | 'bad' = 'ok'
          const diff = ((devisPrice - marketPrice) / marketPrice) * 100

          if (diff > 30) status = 'bad'
          else if (diff > 10) status = 'warning'

          result.priceItems.push({
            name,
            devisPrice: match[2] + '€',
            marketPrice: match[3] + '€',
            status,
            difference: diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`
          })
          break
        }
      }
    })

    // Extract script de négociation
    const scriptPatterns = [
      /(?:script|phrase|dire|négocier)[^\n]*[\n"«]([^"»\n]+(?:[^"»]*[^"»\n]+)?)/i,
      /"([^"]{20,})"/,
      /«([^»]{20,})»/
    ]

    for (const pattern of scriptPatterns) {
      const match = text.match(pattern)
      if (match) {
        result.script = match[1].trim().replace(/^["«\s]+|["»\s]+$/g, '')
        break
      }
    }

    // Extract tips
    const tipKeywords = ['conseil', 'recommand', 'astuce', 'suggestion', 'demande', 'vérifie', 'compare', 'n\'hésite']
    lines.forEach(line => {
      const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim()
      if (cleanLine.length > 15 && cleanLine.length < 200) {
        const hasKeyword = tipKeywords.some(kw => cleanLine.toLowerCase().includes(kw))
        if (hasKeyword && result.tips.length < 5) {
          result.tips.push(cleanLine)
        }
      }
    })

    // Extract summary (first meaningful paragraph)
    const paragraphs = text.split('\n\n')
    for (const para of paragraphs) {
      const cleanPara = para.trim()
      if (cleanPara.length > 50 && cleanPara.length < 500 && !cleanPara.startsWith('#')) {
        result.summary = cleanPara
        break
      }
    }

    return result
  }

  const parsed = parseAnalysis(analysis)

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
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
            .section-title { font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #1e293b; display: flex; align-items: center; gap: 8px; }
            .savings-box { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px; margin-bottom: 16px; text-align: center; }
            .savings-amount { font-size: 32px; font-weight: 700; }
            .savings-label { font-size: 14px; opacity: 0.9; }
            .price-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            .price-table th, .price-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .price-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
            .status-ok { color: #10b981; }
            .status-warning { color: #f59e0b; }
            .status-bad { color: #ef4444; }
            .tip { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .tip:last-child { border-bottom: none; }
            .script-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; font-style: italic; color: #1e40af; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔧 Analyse de Devis</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <div class="verdict-badge">${parsed.verdict}</div>
          </div>

          ${parsed.savings ? `
          <div class="savings-box">
            <div class="savings-label">💰 Économie potentielle</div>
            <div class="savings-amount">${parsed.savings}</div>
          </div>
          ` : ''}

          <div class="section">
            <h2 class="section-title">📋 Analyse détaillée</h2>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #475569;">${analysis.replace(/\n/g, '<br>')}</div>
          </div>

          ${parsed.script ? `
          <div class="section">
            <h2 class="section-title">💬 Script de négociation</h2>
            <div class="script-box">"${parsed.script}"</div>
          </div>
          ` : ''}

          ${parsed.tips.length > 0 ? `
          <div class="section">
            <h2 class="section-title">💡 Conseils</h2>
            ${parsed.tips.map(tip => `<div class="tip">✓ ${tip}</div>`).join('')}
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>MECAI</strong> - Votre assistant automobile intelligent</p>
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
        setTimeout(() => printWindow.print(), 250)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getVerdictConfig = () => {
    switch (parsed.verdictType) {
      case 'good':
        return {
          gradient: 'from-emerald-500 to-green-600',
          lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2,
          iconBg: 'bg-emerald-500',
          emoji: '✅'
        }
      case 'warning':
        return {
          gradient: 'from-amber-500 to-orange-500',
          lightBg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          icon: AlertTriangle,
          iconBg: 'bg-amber-500',
          emoji: '⚠️'
        }
      case 'bad':
        return {
          gradient: 'from-red-500 to-rose-600',
          lightBg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          icon: XCircle,
          iconBg: 'bg-red-500',
          emoji: '🚨'
        }
      default:
        return {
          gradient: 'from-blue-500 to-indigo-600',
          lightBg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          icon: Target,
          iconBg: 'bg-blue-500',
          emoji: '📊'
        }
    }
  }

  const verdictConfig = getVerdictConfig()
  const VerdictIcon = verdictConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Saved confirmation */}
      {devisId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Analyse sauvegardée dans ton historique</span>
          <Link to="/app/history?tab=devis" className="ml-auto text-green-600 hover:underline font-medium">
            Voir →
          </Link>
        </motion.div>
      )}

      {/* Main Verdict Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${verdictConfig.gradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />

        <div className="relative p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <VerdictIcon className="h-8 w-8" />
              </motion.div>
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">Résultat de l'analyse</p>
                <h2 className="text-2xl font-bold tracking-tight">{parsed.verdict}</h2>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    PDF
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={onReset}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                Nouveau
              </Button>
            </div>
          </div>

          {/* Price comparison */}
          {(parsed.totalDevis || parsed.totalMarket) && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {parsed.totalDevis && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-xs font-medium mb-1">Total devis</p>
                  <p className="text-xl font-bold">{parsed.totalDevis}</p>
                </div>
              )}
              {parsed.totalMarket && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-xs font-medium mb-1">Prix marché</p>
                  <p className="text-xl font-bold">{parsed.totalMarket}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Savings Card */}
      {parsed.savings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TrendingDown className="h-7 w-7 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-emerald-100 text-sm font-medium">💰 Économie potentielle</p>
                  <p className="text-3xl font-bold tracking-tight">{parsed.savings}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Price Breakdown Table (if items found) */}
      {parsed.priceItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-blue-600" />
                </div>
                Comparatif des prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Prestation</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Devis</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Marché</th>
                      <th className="text-right py-3 px-2 font-medium text-muted-foreground">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.priceItems.map((item, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="border-b border-muted/50 last:border-0"
                      >
                        <td className="py-3 px-2 font-medium">{item.name}</td>
                        <td className="text-right py-3 px-2">{item.devisPrice}</td>
                        <td className="text-right py-3 px-2 text-muted-foreground">{item.marketPrice}</td>
                        <td className="text-right py-3 px-2">
                          <Badge
                            variant="outline"
                            className={
                              item.status === 'ok'
                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                                : item.status === 'warning'
                                ? 'text-amber-600 border-amber-200 bg-amber-50'
                                : 'text-red-600 border-red-200 bg-red-50'
                            }
                          >
                            {item.difference}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Negotiation Script */}
      {parsed.script && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                Script de négociation
              </CardTitle>
              <CardDescription>
                Utilisez cette phrase pour négocier avec le garagiste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-blue-100 dark:border-blue-900">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-xl" />
                <p className="pl-4 text-base italic text-foreground leading-relaxed">
                  « {parsed.script} »
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Full Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                Analyse détaillée
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              >
                {showFullAnalysis ? 'Réduire' : 'Voir tout'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-sm text-muted-foreground leading-relaxed ${!showFullAnalysis && 'max-h-40 overflow-hidden relative'}`}>
              {analysis.split('\n').map((line, i) => {
                const trimmedLine = line.trim()
                if (!trimmedLine) return <div key={i} className="h-3" />

                // Headers
                if (trimmedLine.startsWith('#')) {
                  return (
                    <h3 key={i} className="font-bold text-foreground text-base mt-4 mb-2 flex items-center gap-2">
                      {trimmedLine.replace(/^#+\s*/, '')}
                    </h3>
                  )
                }

                // Status lines with icons
                if (trimmedLine.includes('✅') || line.toLowerCase().includes('correct') || line.toLowerCase().includes('conforme')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 px-3 my-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-emerald-700 dark:text-emerald-300">{trimmedLine.replace(/[✅✓]/g, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('⚠️') || trimmedLine.includes('🔶') || line.toLowerCase().includes('élevé') || line.toLowerCase().includes('négociable')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 px-3 my-1 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-700 dark:text-amber-300">{trimmedLine.replace(/[⚠️🔶]/g, '').trim()}</span>
                    </div>
                  )
                }
                if (trimmedLine.includes('❌') || trimmedLine.includes('🚫') || line.toLowerCase().includes('excessif') || line.toLowerCase().includes('trop cher')) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5 px-3 my-1 rounded-lg bg-red-50 dark:bg-red-950/30">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-red-700 dark:text-red-300">{trimmedLine.replace(/[❌🚫]/g, '').trim()}</span>
                    </div>
                  )
                }

                // Bullet points
                if (trimmedLine.match(/^[-•*]\s/)) {
                  return (
                    <div key={i} className="flex items-start gap-2 py-1 ml-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{trimmedLine.replace(/^[-•*]\s/, '')}</span>
                    </div>
                  )
                }

                return <p key={i} className="my-2">{line}</p>
              })}

              {!showFullAnalysis && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      {parsed.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                Conseils pour négocier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {parsed.tips.map((tip, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-amber-900 dark:text-amber-100">{tip}</span>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                Devis original
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <img
                  src={imageUrl}
                  alt="Devis original"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
