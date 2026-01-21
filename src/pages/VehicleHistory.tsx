import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import html2canvas from 'html2canvas'

interface TechnicalControl {
  date: string
  result: 'favorable' | 'defavorable' | 'contre-visite'
  mileage: number
  center: string
  defects: string[]
}

interface OwnerHistory {
  startDate: string
  endDate: string | null
  type: 'particulier' | 'professionnel'
  region: string
}

interface Accident {
  date: string
  type: string
  severity: 'leger' | 'moyen' | 'grave'
  repaired: boolean
}

interface Recall {
  date: string
  reason: string
  status: 'effectue' | 'en_attente'
  manufacturer: string
}

interface VehicleHistoryData {
  plate: string
  brand: string
  model: string
  year: number
  vin?: string
  firstRegistration: string
  administrative: {
    hasGage: boolean
    hasOpposition: boolean
    isStolenDeclared: boolean
    lastUpdate: string
  }
  technicalControls: TechnicalControl[]
  owners: OwnerHistory[]
  accidents: Accident[]
  recalls: Recall[]
  mileageHistory: { date: string; mileage: number; source: string }[]
  trustScore: number
  trustDetails: string[]
}

export default function VehicleHistory() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const reportRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<VehicleHistoryData | null>(null)
  const [exporting, setExporting] = useState(false)

  const plate = searchParams.get('plate')
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')
  const year = searchParams.get('year')

  useEffect(() => {
    if (!plate) {
      setError('Aucune plaque fournie')
      setLoading(false)
      return
    }

    fetchHistory()
  }, [plate])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/vehicle-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate,
          brand,
          model,
          year: year ? parseInt(year) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recuperation')
      }

      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    if (!isPremium) {
      navigate('/pricing')
      return
    }

    if (!reportRef.current) return

    setExporting(true)

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false
      })

      const link = document.createElement('a')
      link.download = `rapport-historique-${plate}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getTrustScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-amber-600'
    if (score >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-amber-500/50 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enquete en cours...</h2>
          <p className="text-slate-400 text-sm">Analyse du vehicule {plate}</p>
        </div>
      </div>
    )
  }

  if (error || !history) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enquete echouee</h2>
          <p className="text-slate-400 mb-6">{error || 'Impossible de recuperer l\'historique'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🕵️</span>
            <h1 className="text-lg font-bold text-amber-400">Rapport d'Enquete</h1>
          </div>

          <button
            onClick={exportPDF}
            disabled={exporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              isPremium
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isPremium ? 'Exporter' : '🔒 Premium'}
          </button>
        </div>
      </div>

      {/* Contenu du rapport */}
      <div ref={reportRef} className="max-w-4xl mx-auto p-4 pb-20">

        {/* En-tete du rapport - Style dossier confidentiel */}
        <div className="relative mb-8 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-amber-500/30 overflow-hidden">
          {/* Watermark */}
          <div className="absolute top-4 right-4 text-amber-500/10 text-6xl font-black rotate-12">
            CONFIDENTIEL
          </div>

          {/* Tampon */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 border-4 border-amber-500/20 rounded-full flex items-center justify-center rotate-12">
            <div className="text-center">
              <div className="text-amber-500/40 text-xs font-bold">VERIFIE</div>
              <div className="text-amber-500/40 text-[8px]">{new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-amber-400/60 text-xs uppercase tracking-widest mb-1">Dossier N°</div>
                <div className="font-mono text-2xl text-white font-bold tracking-wider">{history.plate}</div>
              </div>
              <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getTrustScoreGradient(history.trustScore)}`}>
                <div className="text-white/80 text-[10px] uppercase">Score de confiance</div>
                <div className="text-white text-2xl font-black">{history.trustScore}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Marque</div>
                <div className="text-white font-semibold">{history.brand}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Modele</div>
                <div className="text-white font-semibold">{history.model}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Annee</div>
                <div className="text-white font-semibold">{history.year}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">1ere Immat.</div>
                <div className="text-white font-semibold">{formatDate(history.firstRegistration)}</div>
              </div>
            </div>

            {history.vin && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-slate-500 text-xs">VIN (Numero de serie)</div>
                <div className="font-mono text-amber-400 text-sm tracking-wider">{history.vin}</div>
              </div>
            )}
          </div>
        </div>

        {/* Alertes */}
        {(history.administrative.hasGage || history.administrative.hasOpposition || history.administrative.isStolenDeclared) && (
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-red-400 font-bold">ALERTES CRITIQUES</h3>
            </div>
            <div className="space-y-2">
              {history.administrative.hasGage && (
                <div className="flex items-center gap-2 text-red-300">
                  <span>🔒</span>
                  <span>Vehicule GAGE - Restriction de vente</span>
                </div>
              )}
              {history.administrative.hasOpposition && (
                <div className="flex items-center gap-2 text-red-300">
                  <span>🚫</span>
                  <span>Opposition administrative en cours</span>
                </div>
              )}
              {history.administrative.isStolenDeclared && (
                <div className="flex items-center gap-2 text-red-300">
                  <span>🚨</span>
                  <span>VEHICULE DECLARE VOLE</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trust Details */}
        {history.trustDetails.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Resume de l'enquete</h3>
            <div className="flex flex-wrap gap-2">
              {history.trustDetails.map((detail, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    detail.includes('Excellent') || detail.includes('sans incident')
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {detail}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sections du rapport */}
        <div className="space-y-6">

          {/* Proprietaires */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">👥</span>
              <h2 className="font-bold text-white">Historique Proprietaires</h2>
              <span className="ml-auto bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">
                {history.owners.length} proprietaire(s)
              </span>
            </div>
            <div className="p-5">
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-700"></div>

                {history.owners.map((owner, i) => (
                  <div key={i} className="relative pl-10 pb-6 last:pb-0">
                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      i === history.owners.length - 1 ? 'bg-green-500' : 'bg-slate-600'
                    }`}>
                      <span className="text-xs">{i === history.owners.length - 1 ? '✓' : (i + 1)}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-medium capitalize">{owner.type}</div>
                          <div className="text-slate-400 text-sm">{owner.region}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-slate-300">{formatDate(owner.startDate)}</div>
                          <div className="text-slate-500">
                            {owner.endDate ? `→ ${formatDate(owner.endDate)}` : '→ Actuel'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Controles techniques */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">🔧</span>
              <h2 className="font-bold text-white">Controles Techniques</h2>
              <span className="ml-auto bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">
                {history.technicalControls.length} controle(s)
              </span>
            </div>
            <div className="p-5 space-y-3">
              {history.technicalControls.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-3xl block mb-2">📋</span>
                  Aucun controle technique enregistre
                </div>
              ) : (
                history.technicalControls.map((control, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          control.result === 'favorable' ? 'bg-green-500/20 text-green-400' :
                          control.result === 'contre-visite' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {control.result === 'favorable' ? '✓' : control.result === 'contre-visite' ? '!' : '✗'}
                        </div>
                        <div>
                          <div className={`font-medium capitalize ${
                            control.result === 'favorable' ? 'text-green-400' :
                            control.result === 'contre-visite' ? 'text-orange-400' :
                            'text-red-400'
                          }`}>
                            {control.result.replace('-', ' ')}
                          </div>
                          <div className="text-slate-400 text-sm">{control.center}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-slate-300">{formatDate(control.date)}</div>
                        <div className="text-slate-500">{control.mileage.toLocaleString()} km</div>
                      </div>
                    </div>
                    {control.defects.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-slate-500 text-xs mb-2">Defauts constates:</div>
                        <div className="flex flex-wrap gap-2">
                          {control.defects.map((defect, j) => (
                            <span key={j} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                              {defect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Accidents */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">💥</span>
              <h2 className="font-bold text-white">Accidents Declares</h2>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs ${
                history.accidents.length === 0 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {history.accidents.length === 0 ? 'Aucun' : `${history.accidents.length} accident(s)`}
              </span>
            </div>
            <div className="p-5">
              {history.accidents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-3xl">✓</span>
                  </div>
                  <div className="text-green-400 font-medium">Aucun accident declare</div>
                  <div className="text-slate-500 text-sm mt-1">Historique sans sinistre enregistre</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.accidents.map((accident, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        accident.severity === 'leger' ? 'bg-yellow-500/20 text-yellow-400' :
                        accident.severity === 'moyen' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <span className="text-xl">💥</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{accident.type}</div>
                        <div className="text-slate-400 text-sm">
                          {formatDate(accident.date)} - Severite: {accident.severity}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        accident.repaired ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {accident.repaired ? 'Repare' : 'Non repare'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Rappels constructeur */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">�icing</span>
              <h2 className="font-bold text-white">Rappels Constructeur</h2>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs ${
                history.recalls.every(r => r.status === 'effectue')
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {history.recalls.length === 0 ? 'Aucun' : `${history.recalls.length} rappel(s)`}
              </span>
            </div>
            <div className="p-5">
              {history.recalls.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-3xl block mb-2">✓</span>
                  Aucun rappel constructeur
                </div>
              ) : (
                <div className="space-y-3">
                  {history.recalls.map((recall, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-medium">{recall.reason}</div>
                          <div className="text-slate-400 text-sm">{recall.manufacturer} - {formatDate(recall.date)}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          recall.status === 'effectue' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {recall.status === 'effectue' ? 'Effectue' : 'En attente'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Historique kilometrique */}
          <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">📊</span>
              <h2 className="font-bold text-white">Historique Kilometrique</h2>
            </div>
            <div className="p-5">
              {/* Graph simplifie */}
              <div className="h-32 flex items-end gap-1 mb-4">
                {history.mileageHistory.slice(-10).map((entry, i, arr) => {
                  const maxMileage = Math.max(...arr.map(e => e.mileage))
                  const height = (entry.mileage / maxMileage) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-[8px] text-slate-500">{entry.date.split('-')[0]}</span>
                    </div>
                  )
                })}
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Kilometrage</th>
                      <th className="pb-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.mileageHistory.slice(-5).reverse().map((entry, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="py-2 text-slate-300">{formatDate(entry.date)}</td>
                        <td className="py-2 text-white font-mono">{entry.mileage.toLocaleString()} km</td>
                        <td className="py-2 text-slate-400">{entry.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Moyenne annuelle */}
              {history.mileageHistory.length >= 2 && (
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
                  <span className="text-slate-400">Moyenne annuelle estimee</span>
                  <span className="text-amber-400 font-bold">
                    ~{Math.round(
                      history.mileageHistory[history.mileageHistory.length - 1].mileage /
                      (new Date().getFullYear() - history.year)
                    ).toLocaleString()} km/an
                  </span>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer du rapport */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <div className="text-slate-500 text-xs">
            Rapport genere le {new Date().toLocaleDateString('fr-FR')} a {new Date().toLocaleTimeString('fr-FR')}
          </div>
          <div className="text-slate-600 text-[10px] mt-1">
            MECA-IA - Les donnees proviennent de sources publiques et peuvent etre incompletes
          </div>
        </div>
      </div>
    </div>
  )
}
