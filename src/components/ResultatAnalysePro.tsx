import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Store,
  Share2,
  Lightbulb,
  Shield,
  Euro,
  Info,
  Check,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface DevisLine {
  designation: string
  quantite: number
  prixUnitaire: number
  totalTTC: number
  prixMarche: {
    oscaro: number | null
    yakarouler: number | null
    misterAuto: number | null
    moyenne: number
  }
  ecart: number
  verdict: 'ok' | 'eleve' | 'arnaque'
  sourceEstimation?: string
}

interface Props {
  data: {
    garage: { nom: string; adresse?: string; siret?: string }
    lignes: DevisLine[]
    garageInfo: {
      nom: string
      noteGoogle: number | null
      nombreAvis: number
      avisNegatifs: number
      signalements: number
      observation?: string
    } | null
    alertes: { graves: string[]; moyennes: string[]; info: string[] }
    verdict: {
      note: number
      statut: 'honnete' | 'reserve' | 'arnaque'
      recommandation: string
      commentaireExpert?: string
      lignesOk: number
      lignesElevees: number
      lignesArnaques: number
    }
    totaux: { totalFacture: number; totalMarche: number }
    economiesPotentielles: { montant: number; pourcentage: number; conseils?: string[] }
    fromCache?: boolean
  }
}

export default function ResultatAnalysePro({ data }: Props) {
  const { verdict, lignes, alertes, totaux, economiesPotentielles, garageInfo } = data
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedLines, setExpandedLines] = useState<number[]>([])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleLine = (index: number) => {
    setExpandedLines(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  // Télécharger le rapport en PDF
  const handleDownload = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Helper function to add text with word wrap
      const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2)

        // Check if we need a new page
        if (y + lines.length * (size * 0.5) > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage()
          y = 20
        }

        doc.text(lines, margin, y)
        y += lines.length * (size * 0.5) + 3
      }

      const addLine = () => {
        y += 2
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 5
      }

      // Header
      doc.setFillColor(37, 99, 235) // Blue
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('RAPPORT D\'ANALYSE DE DEVIS', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('MECA-IA - Analyse Professionnelle', pageWidth / 2, 25, { align: 'center' })

      y = 45
      doc.setTextColor(0, 0, 0)

      // Date and Garage
      addText(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 10)
      addText(`Garage: ${data.garage.nom}`, 12, 'bold')
      if (data.garage.adresse) addText(`Adresse: ${data.garage.adresse}`, 10)

      addLine()

      // Verdict
      const verdictEmoji = verdict.statut === 'honnete' ? '[OK]' : verdict.statut === 'reserve' ? '[!]' : '[X]'
      const verdictText = verdict.statut === 'honnete' ? 'HONNETE' : verdict.statut === 'reserve' ? 'AVEC RESERVES' : 'ARNAQUE DETECTEE'

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')

      if (verdict.statut === 'honnete') doc.setTextColor(16, 185, 129)
      else if (verdict.statut === 'reserve') doc.setTextColor(245, 158, 11)
      else doc.setTextColor(239, 68, 68)

      doc.text(`${verdictEmoji} ${verdictText}`, pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(24)
      doc.text(`Note: ${verdict.note}/10`, pageWidth / 2, y, { align: 'center' })
      y += 12

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      addText(`Recommandation: ${verdict.recommandation}`, 10)

      if (verdict.commentaireExpert) {
        addText(`Commentaire expert: "${verdict.commentaireExpert}"`, 9)
      }

      y += 3
      addText(`Prix corrects: ${verdict.lignesOk} | Prix eleves: ${verdict.lignesElevees} | Surfactures: ${verdict.lignesArnaques}`, 10)

      addLine()

      // Alertes graves
      if (alertes.graves.length > 0) {
        doc.setTextColor(239, 68, 68)
        addText('ALERTES GRAVES', 12, 'bold')
        doc.setTextColor(0, 0, 0)
        alertes.graves.forEach(a => addText(`• ${a}`, 10))
        y += 5
      }

      // Alertes moyennes
      if (alertes.moyennes.length > 0) {
        doc.setTextColor(245, 158, 11)
        addText('POINTS D\'ATTENTION', 12, 'bold')
        doc.setTextColor(0, 0, 0)
        alertes.moyennes.forEach(a => addText(`• ${a}`, 10))
        y += 5
      }

      addLine()

      // Analyse détaillée
      addText('ANALYSE DETAILLEE', 12, 'bold')
      y += 3

      lignes.forEach(l => {
        const verdictIcon = l.verdict === 'ok' ? '[OK]' : l.verdict === 'eleve' ? '[!]' : '[X]'

        if (l.verdict === 'ok') doc.setTextColor(16, 185, 129)
        else if (l.verdict === 'eleve') doc.setTextColor(245, 158, 11)
        else doc.setTextColor(239, 68, 68)

        doc.setFont('helvetica', 'bold')
        addText(`${verdictIcon} ${l.designation}`, 10, 'bold')

        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        addText(`   Facture: ${l.totalTTC.toFixed(2)}EUR | Marche: ~${l.prixMarche.moyenne.toFixed(2)}EUR | Ecart: ${l.ecart > 0 ? '+' : ''}${l.ecart}%`, 9)
      })

      addLine()

      // Comparatif financier
      addText('COMPARATIF FINANCIER', 12, 'bold')
      y += 3
      addText(`Prix facture (TTC): ${totaux.totalFacture.toFixed(2)} EUR`, 11, 'bold')
      addText(`Prix marche estime: ~${totaux.totalMarche.toFixed(2)} EUR`, 11)

      const diff = economiesPotentielles.montant
      if (diff > 0) {
        doc.setTextColor(239, 68, 68)
        addText(`Surfacturation: +${diff.toFixed(2)} EUR (${economiesPotentielles.pourcentage}%)`, 12, 'bold')
      } else {
        doc.setTextColor(16, 185, 129)
        addText(`Prix correct: ${Math.abs(diff).toFixed(2)} EUR en dessous du marche`, 12, 'bold')
      }

      // Footer
      doc.setTextColor(128, 128, 128)
      doc.setFontSize(8)
      doc.text('Rapport genere par MECA-IA - mymecai.com', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

      // Save
      doc.save(`rapport-devis-${new Date().toISOString().split('T')[0]}.pdf`)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // Partager l'analyse
  const handleShare = async () => {
    const shareText = `🔍 Analyse de devis MECA-IA\n\n` +
      `Note: ${verdict.note}/10 - ${verdict.statut === 'honnete' ? '✅ Honnête' : verdict.statut === 'reserve' ? '⚠️ Réserves' : '🚨 Arnaque'}\n` +
      `Prix facturé: ${totaux.totalFacture.toFixed(2)}€\n` +
      `Prix marché: ~${totaux.totalMarche.toFixed(2)}€\n` +
      (economiesPotentielles.montant > 0 ? `💸 Surfacturation: +${economiesPotentielles.montant.toFixed(2)}€\n` : '') +
      `\n📱 Analyse ton devis sur mymecai.com`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Analyse de devis MECA-IA',
          text: shareText
        })
      } catch (err) {
        // User cancelled or error - copy to clipboard as fallback
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText)
          setShareSuccess(true)
          setTimeout(() => setShareSuccess(false), 2000)
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    }
  }

  const getVerdictColors = () => {
    switch (verdict.statut) {
      case 'honnete':
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/30',
          border: 'border-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
          badge: 'bg-emerald-500'
        }
      case 'reserve':
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/50 dark:to-orange-900/30',
          border: 'border-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
          icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
          badge: 'bg-amber-500'
        }
      case 'arnaque':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-900/30',
          border: 'border-red-500',
          text: 'text-red-700 dark:text-red-400',
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          badge: 'bg-red-500'
        }
    }
  }

  const colors = getVerdictColors()

  return (
    <div className="space-y-6">
      {/* Cache Notice */}
      {data.fromCache && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm text-emerald-800 dark:text-emerald-200">
            <strong>Devis déjà analysé</strong> — Résultat identique garanti
          </span>
        </motion.div>
      )}

      {/* VERDICT GLOBAL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 sm:p-8 border-2 ${colors.bg} ${colors.border}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {colors.icon}
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>
                {verdict.statut === 'honnete' && 'Devis Honnête'}
                {verdict.statut === 'reserve' && 'Devis avec Réserves'}
                {verdict.statut === 'arnaque' && 'Arnaque Détectée'}
              </h2>
              <p className="text-base sm:text-lg font-medium mt-1 text-foreground">
                {verdict.recommandation}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className={`text-5xl sm:text-6xl font-bold ${colors.text}`}>
              {verdict.note}/10
            </div>
            <div className="text-sm text-muted-foreground mt-1">Score de confiance</div>
          </div>
        </div>

        {/* Expert comment */}
        {verdict.commentaireExpert && (
          <div className="p-4 rounded-xl bg-white/60 dark:bg-black/20 mb-6">
            <p className="text-sm italic text-muted-foreground">
              💬 "{verdict.commentaireExpert}"
            </p>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{verdict.lignesOk}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Prix corrects</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{verdict.lignesElevees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Prix élevés</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{verdict.lignesArnaques}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Surfacturés</div>
          </div>
        </div>
      </motion.div>

      {/* ALERTES GRAVES */}
      {alertes.graves.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-xl p-3 sm:p-5"
        >
          <h3 className="text-sm sm:text-lg font-bold text-red-900 dark:text-red-200 mb-2 sm:mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Alertes Graves ({alertes.graves.length})
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {alertes.graves.map((alerte, i) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-red-800 dark:text-red-300">
                <span className="font-bold mt-0.5">•</span>
                <span>{alerte}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* ALERTES MOYENNES */}
      {alertes.moyennes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-3 sm:p-5"
        >
          <h3 className="text-sm sm:text-lg font-bold text-amber-900 dark:text-amber-200 mb-2 sm:mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Points d'Attention ({alertes.moyennes.length})
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {alertes.moyennes.map((alerte, i) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <span className="font-bold mt-0.5">•</span>
                <span>{alerte}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* INFO GARAGE */}
      {garageInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informations Garage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-semibold">{garageInfo.nom}</span>
            </div>
            {garageInfo.observation && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <Info className="h-4 w-4 inline mr-1" />
                  {garageInfo.observation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ANALYSE LIGNE PAR LIGNE */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Analyse Détaillée
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Mobile: Card view */}
          {isMobile ? (
            <div className="space-y-3">
              {lignes.map((ligne, i) => {
                const isExpanded = expandedLines.includes(i)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border-2 overflow-hidden ${
                      ligne.verdict === 'arnaque'
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        : ligne.verdict === 'eleve'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {/* Header - Always visible */}
                    <button
                      onClick={() => toggleLine(i)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ligne.verdict === 'ok' && (
                            <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0">OK</Badge>
                          )}
                          {ligne.verdict === 'eleve' && (
                            <Badge className="bg-amber-500 text-[10px] px-1.5 py-0">Élevé</Badge>
                          )}
                          {ligne.verdict === 'arnaque' && (
                            <Badge className="bg-red-500 text-[10px] px-1.5 py-0">Arnaque</Badge>
                          )}
                          <span className={`text-xs font-bold ${
                            ligne.ecart > 40 ? 'text-red-600' :
                            ligne.ecart > 15 ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {ligne.ecart > 0 ? '+' : ''}{ligne.ecart}%
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate pr-2">{ligne.designation}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ligne.totalTTC.toFixed(0)}€</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Details - Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-0 border-t border-current/10">
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                                <p className="text-muted-foreground">Prix facturé</p>
                                <p className="font-bold text-sm">{ligne.totalTTC.toFixed(2)}€</p>
                              </div>
                              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                                <p className="text-muted-foreground">Prix marché</p>
                                <p className="font-bold text-sm text-blue-600">~{ligne.prixMarche.moyenne.toFixed(2)}€</p>
                              </div>
                            </div>
                            {ligne.sourceEstimation && (
                              <p className="text-[10px] text-muted-foreground mt-2 italic">
                                {ligne.sourceEstimation}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* Desktop: Table view */
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-2 font-semibold">Désignation</th>
                    <th className="text-right py-3 px-2 font-semibold">Facturé</th>
                    <th className="text-right py-3 px-2 font-semibold">Prix marché</th>
                    <th className="text-right py-3 px-2 font-semibold">Écart</th>
                    <th className="text-center py-3 px-2 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne, i) => (
                    <tr
                      key={i}
                      className={`border-b transition-colors ${ligne.verdict === 'arnaque'
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : ligne.verdict === 'eleve'
                            ? 'bg-amber-50 dark:bg-amber-950/20'
                            : 'bg-emerald-50/50 dark:bg-emerald-950/10'
                        }`}
                    >
                      <td className="py-4 px-2">
                        <div className="font-medium">{ligne.designation}</div>
                        {ligne.sourceEstimation && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {ligne.sourceEstimation}
                          </div>
                        )}
                      </td>
                      <td className="text-right py-4 px-2 font-semibold">
                        {ligne.totalTTC.toFixed(2)}€
                      </td>
                      <td className="text-right py-4 px-2 text-blue-600 dark:text-blue-400">
                        ~{ligne.prixMarche.moyenne.toFixed(2)}€
                      </td>
                      <td className="text-right py-4 px-2">
                        <span className={`font-bold ${ligne.ecart > 40 ? 'text-red-600' :
                            ligne.ecart > 15 ? 'text-amber-600' :
                              'text-emerald-600'
                          }`}>
                          {ligne.ecart > 0 ? '+' : ''}{ligne.ecart}%
                        </span>
                      </td>
                      <td className="text-center py-4 px-2">
                        {ligne.verdict === 'ok' && (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                        {ligne.verdict === 'eleve' && (
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Élevé
                          </Badge>
                        )}
                        {ligne.verdict === 'arnaque' && (
                          <Badge className="bg-red-500 hover:bg-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Arnaque
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* COMPARATIF FINANCIER */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Euro className="h-4 w-4 sm:h-5 sm:w-5" />
            Comparatif Financier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Prix facturé</span>
            <span className="font-bold text-lg sm:text-2xl">{totaux.totalFacture.toFixed(2)}€</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Prix marché</span>
            <span className="font-bold text-lg sm:text-2xl text-blue-600">~{totaux.totalMarche.toFixed(2)}€</span>
          </div>

          <div className="h-px bg-border" />

          <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 rounded-xl gap-2 ${economiesPotentielles.montant > 0
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-emerald-50 dark:bg-emerald-950/30'
            }`}>
            <span className="font-semibold text-sm sm:text-lg flex items-center gap-2">
              {economiesPotentielles.montant > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Tu paies en trop
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  Prix correct
                </>
              )}
            </span>
            <div className="text-left sm:text-right flex items-baseline gap-2 sm:block">
              <div className={`text-2xl sm:text-3xl font-bold ${economiesPotentielles.montant > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                {Math.abs(economiesPotentielles.montant).toFixed(2)}€
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                ({economiesPotentielles.pourcentage > 0 ? '+' : ''}{economiesPotentielles.pourcentage}%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONSEILS */}
      {economiesPotentielles.conseils && economiesPotentielles.conseils.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-blue-900 dark:text-blue-100">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
              Conseils pour Économiser
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <ul className="space-y-1.5 sm:space-y-2">
              {economiesPotentielles.conseils.map((conseil, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">💡</span>
                  <span>{conseil}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ACTIONS - Fixed at bottom on mobile */}
      <div className="flex gap-2 sm:gap-3 sticky bottom-4 sm:static bg-background/80 backdrop-blur-sm p-2 -mx-2 sm:mx-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none rounded-xl">
        <Button
          className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
          variant={downloadSuccess ? "outline" : "default"}
          onClick={handleDownload}
        >
          <AnimatePresence mode="wait">
            {downloadSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-emerald-500" />
                <span className="hidden sm:inline">Téléchargé !</span>
                <span className="sm:hidden">OK</span>
              </motion.div>
            ) : (
              <motion.div
                key="download"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Télécharger le PDF</span>
                <span className="sm:hidden">PDF</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        <Button
          className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
          variant="outline"
          onClick={handleShare}
        >
          <AnimatePresence mode="wait">
            {shareSuccess ? (
              <motion.div
                key="copied"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-emerald-500" />
                <span className="hidden sm:inline">Copié !</span>
                <span className="sm:hidden">OK</span>
              </motion.div>
            ) : (
              <motion.div
                key="share"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Partager l'analyse</span>
                <span className="sm:hidden">Partager</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )
}
