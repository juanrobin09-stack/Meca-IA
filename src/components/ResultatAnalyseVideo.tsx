import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Euro,
  Clock,
  Download,
  MapPin,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertCircle,
  Check
} from 'lucide-react'
import type { VideoAnalysisResult } from '@/types/video'
import { Link } from 'react-router-dom'

interface Props {
  data: VideoAnalysisResult
}

export default function ResultatAnalyseVideo({ data }: Props) {
  const { frames_analyses, synthesis, verdict, confiance, prix_pieces } = data
  const [showFrameDetails, setShowFrameDetails] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Couleur selon urgence
  const getUrgenceConfig = () => {
    switch (verdict.urgence) {
      case 'critique':
        return {
          bg: 'bg-gradient-to-br from-red-50 from-red-950/50 dark:to-rose-900/30',
          border: 'border-red-500',
          text: 'text-red-400',
          icon: <XCircle className="h-10 w-10 text-red-500" />,
          label: 'Problème Critique',
          emoji: '🚨'
        }
      case 'important':
        return {
          bg: 'bg-gradient-to-br from-orange-50 from-orange-950/50 dark:to-amber-900/30',
          border: 'border-orange-500',
          text: 'text-orange-400',
          icon: <AlertTriangle className="h-10 w-10 text-orange-500" />,
          label: 'Problème Important',
          emoji: '⚠️'
        }
      case 'moyen':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 from-yellow-950/50 dark:to-amber-900/30',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          icon: <Wrench className="h-10 w-10 text-yellow-500" />,
          label: 'Problème Moyen',
          emoji: '🔧'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-emerald-50 from-emerald-950/50 dark:to-green-900/30',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
          label: 'Problème Mineur',
          emoji: '✅'
        }
    }
  }

  const urgenceConfig = getUrgenceConfig()

  // Générer rapport texte
  const generateReport = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '      RAPPORT DIAGNOSTIC VIDÉO IA - MECA-IA',
      '═══════════════════════════════════════════════════════════',
      '',
      `Date: ${new Date().toLocaleDateString('fr-FR')}`,
      `Confiance du diagnostic: ${confiance}%`,
      '',
      '───────────────────────────────────────────────────────────',
      '                    DIAGNOSTIC',
      '───────────────────────────────────────────────────────────',
      '',
      `Problème identifié: ${verdict.diagnostic}`,
      `Urgence: ${verdict.urgence.toUpperCase()}`,
      `Peut rouler: ${verdict.peut_rouler ? 'OUI' : 'NON'}`,
      '',
    ]

    if (verdict.conditions_roulage.length > 0) {
      lines.push('Conditions de roulage:')
      verdict.conditions_roulage.forEach(c => lines.push(`  • ${c}`))
      lines.push('')
    }

    if (verdict.risques.length > 0) {
      lines.push('Risques:')
      verdict.risques.forEach(r => lines.push(`  ⚠️ ${r}`))
      lines.push('')
    }

    lines.push('───────────────────────────────────────────────────────────')
    lines.push('                 CAUSES PROBABLES')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('')
    verdict.causes.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.cause} (${c.probabilite}%)`)
      c.preuves.forEach(p => lines.push(`   ✓ ${p}`))
      lines.push('')
    })

    lines.push('───────────────────────────────────────────────────────────')
    lines.push('                   ESTIMATION COÛT')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('')
    lines.push(`Pièces: ${verdict.cout_estime.pieces}€`)
    lines.push(`Main d'œuvre: ${verdict.cout_estime.main_oeuvre}€`)
    lines.push(`TOTAL: ${verdict.cout_estime.total}€`)
    lines.push('')

    if (synthesis.limitations_analyse?.length > 0) {
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('                   LIMITATIONS')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('')
      synthesis.limitations_analyse.forEach(l => lines.push(`  • ${l}`))
      lines.push('')
    }

    lines.push('───────────────────────────────────────────────────────────')
    lines.push('                 RECOMMANDATIONS')
    lines.push('───────────────────────────────────────────────────────────')
    lines.push('')
    verdict.recommandations.forEach((r, i) => lines.push(`${i + 1}. ${r}`))
    lines.push('')

    lines.push('═══════════════════════════════════════════════════════════')
    lines.push('     Rapport généré par MECA-IA - mymecai.com')
    lines.push('═══════════════════════════════════════════════════════════')

    return lines.join('\n')
  }

  const handleDownload = () => {
    try {
      const report = generateReport()
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diagnostic-video-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cache Notice */}
      {data.fromCache && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm text-emerald-200">
            <strong>Vidéo déjà analysée</strong> — Résultat identique garanti
          </span>
        </motion.div>
      )}

      {/* NIVEAU DE CONFIANCE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Niveau de Confiance
          </h2>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{confiance}%</div>
            <div className="text-sm text-muted-foreground">Fiabilité du diagnostic</div>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-4 mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confiance}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-4 rounded-full ${
              confiance >= 80 ? 'bg-emerald-500' :
              confiance >= 60 ? 'bg-blue-500' :
              confiance >= 40 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {confiance >= 80 && '✅ Diagnostic très fiable basé sur preuves visuelles claires'}
          {confiance >= 60 && confiance < 80 && '✅ Diagnostic fiable, inspection physique recommandée pour confirmation'}
          {confiance >= 40 && confiance < 60 && '⚠️ Diagnostic probable, nécessite vérification par un professionnel'}
          {confiance < 40 && '⚠️ Diagnostic incertain, qualité vidéo insuffisante ou problème non visible'}
        </p>
      </motion.div>

      {/* DIAGNOSTIC PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 sm:p-8 border-2 ${urgenceConfig.bg} ${urgenceConfig.border}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {urgenceConfig.icon}
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold ${urgenceConfig.text}`}>
                {urgenceConfig.emoji} {urgenceConfig.label}
              </h2>
              <p className="text-lg font-semibold mt-2 text-foreground">
                {verdict.diagnostic}
              </p>
            </div>
          </div>
        </div>

        {/* Peut-on rouler ? */}
        <div className={`p-4 rounded-xl ${
          verdict.peut_rouler
            ? 'bg-emerald-900/30'
            : 'bg-red-900/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{verdict.peut_rouler ? '✅' : '🛑'}</span>
            <span className="font-bold text-lg">
              {verdict.peut_rouler ? 'Tu PEUX rouler' : 'NE ROULE PAS'}
            </span>
          </div>

          {verdict.peut_rouler && verdict.conditions_roulage.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold mb-2 text-sm">Conditions à respecter :</p>
              <ul className="space-y-1">
                {verdict.conditions_roulage.map((condition, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span>•</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.risques.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold mb-2 text-sm text-red-400">
                ⚠️ Risques si tu continues :
              </p>
              <ul className="space-y-1">
                {verdict.risques.map((risque, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-400">
                    <span>•</span>
                    <span>{risque}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* PREUVES VISUELLES */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowFrameDetails(!showFrameDetails)}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preuves Visuelles Analysées ({frames_analyses.length} frames)
            </div>
            {showFrameDetails ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {showFrameDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4">
                {frames_analyses.map((frame, i) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="font-semibold text-lg mb-2">
                      Frame {i + 1} ({frame.timestamp})
                    </div>

                    {frame.pieces_visibles.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground">Pièces visibles : </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {frame.pieces_visibles.map((piece, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {piece}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {frame.observations.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground">Observations : </span>
                        <ul className="mt-1 space-y-1">
                          {frame.observations.map((obs, j) => (
                            <li key={j} className="text-sm ml-4">• {obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {frame.anomalies.length > 0 && (
                      <div>
                        <span className="text-sm text-red-400 font-semibold">
                          ⚠️ Anomalies :
                        </span>
                        <ul className="mt-1 space-y-1">
                          {frame.anomalies.map((anom, j) => (
                            <li key={j} className="text-sm text-red-400 ml-4">
                              • {anom}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {frame.etat_general && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        État : {frame.etat_general}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* CAUSES PROBABLES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Causes Probables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verdict.causes.map((cause, i) => (
            <div key={i} className="border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{cause.cause}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-blue-600">{cause.probabilite}%</div>
                  <div className="text-xs text-muted-foreground">Probabilité</div>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${cause.probabilite}%` }}
                />
              </div>

              {cause.preuves.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Preuves observées :
                  </p>
                  <ul className="space-y-1">
                    {cause.preuves.map((preuve, j) => (
                      <li key={j} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{preuve}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PIÈCES + COÛT */}
      {verdict.pieces_a_remplacer.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Pièces à Remplacer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prix_pieces.map((piece, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <div className="font-semibold">{piece.piece}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Prix moyen marché 2026
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {piece.moyenne > 0 ? `${piece.moyenne}€` : 'Prix variable'}
                  </div>
                  {piece.moyenne > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Oscaro ~{piece.oscaro}€ • Yakarouler ~{piece.yakarouler}€
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Coût total estimé */}
            <div className="mt-4 p-6 bg-blue-950/30 rounded-xl">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Coût Total Estimé
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Pièces</span>
                  <span className="font-semibold">{verdict.cout_estime.pieces}€</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Main d'œuvre
                  </span>
                  <span className="font-semibold">{verdict.cout_estime.main_oeuvre}€</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-2xl font-bold">
                  <span>TOTAL</span>
                  <span className="text-blue-600">{verdict.cout_estime.total}€</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LIMITATIONS */}
      {synthesis.limitations_analyse && synthesis.limitations_analyse.length > 0 && (
        <div className="bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-5">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Limitations de cette analyse vidéo
          </h4>
          <ul className="space-y-1 text-sm">
            {synthesis.limitations_analyse.map((limit, i) => (
              <li key={i} className="ml-4">• {limit}</li>
            ))}
          </ul>
          <p className="text-sm mt-3 font-medium">
            💡 Pour un diagnostic à 100%, une inspection physique par un mécanicien
            certifié reste recommandée.
          </p>
        </div>
      )}

      {/* RECOMMANDATIONS */}
      <Card className="bg-blue-950/30 border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-100">
            💡 Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {verdict.recommandations.map((reco, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                <span className="text-blue-600 font-bold">{i + 1}.</span>
                <span>{reco}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          className="h-12"
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
                <Check className="h-5 w-5 mr-2 text-emerald-500" />
                Téléchargé !
              </motion.div>
            ) : (
              <motion.div
                key="download"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger le rapport
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        <Link to="/app/garages" className="w-full">
          <Button variant="outline" className="h-12 w-full">
            <MapPin className="h-5 w-5 mr-2" />
            Trouver un garage
          </Button>
        </Link>
      </div>
    </div>
  )
}
