import { motion } from 'framer-motion'
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
  Download,
  Share2,
  Lightbulb,
  Shield,
  Euro,
  Info
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
          className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-xl p-5"
        >
          <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Alertes Graves ({alertes.graves.length})
          </h3>
          <ul className="space-y-2">
            {alertes.graves.map((alerte, i) => (
              <li key={i} className="flex items-start gap-2 text-red-800 dark:text-red-300">
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
          className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-5"
        >
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Points d'Attention ({alertes.moyennes.length})
          </h3>
          <ul className="space-y-2">
            {alertes.moyennes.map((alerte, i) => (
              <li key={i} className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Analyse Détaillée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
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
        </CardContent>
      </Card>

      {/* COMPARATIF FINANCIER */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Comparatif Financier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="text-muted-foreground">Prix facturé (TTC)</span>
            <span className="font-bold text-2xl">{totaux.totalFacture.toFixed(2)}€</span>
          </div>

          <div className="flex justify-between items-center text-lg">
            <span className="text-muted-foreground">Prix marché estimé</span>
            <span className="font-bold text-2xl text-blue-600">~{totaux.totalMarche.toFixed(2)}€</span>
          </div>

          <div className="h-px bg-border my-2" />

          <div className={`flex justify-between items-center p-4 rounded-xl ${economiesPotentielles.montant > 0
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-emerald-50 dark:bg-emerald-950/30'
            }`}>
            <span className="font-semibold text-lg flex items-center gap-2">
              {economiesPotentielles.montant > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  Tu paies en trop
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-emerald-500" />
                  Prix correct
                </>
              )}
            </span>
            <div className="text-right">
              <div className={`text-3xl font-bold ${economiesPotentielles.montant > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                {Math.abs(economiesPotentielles.montant).toFixed(2)}€
              </div>
              <div className="text-sm text-muted-foreground">
                ({economiesPotentielles.pourcentage > 0 ? '+' : ''}{economiesPotentielles.pourcentage}%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONSEILS */}
      {economiesPotentielles.conseils && economiesPotentielles.conseils.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Lightbulb className="h-5 w-5" />
              Conseils pour Économiser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {economiesPotentielles.conseils.map((conseil, i) => (
                <li key={i} className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <span>{conseil}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1 h-12" variant="default">
          <Download className="h-5 w-5 mr-2" />
          Télécharger le rapport
        </Button>
        <Button className="flex-1 h-12" variant="outline">
          <Share2 className="h-5 w-5 mr-2" />
          Partager l'analyse
        </Button>
      </div>
    </div>
  )
}
