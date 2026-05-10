import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useOBDScanner } from '@/hooks/useOBDScanner'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useChat } from '@/hooks/useChat'
import Sidebar from '@/components/Sidebar'
import OBDScanner from '@/components/OBDScanner'
import PageTransition from '@/components/PageTransition'
import ChatMessage from '@/components/ChatMessage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getBrand,
  getBrandNames,
  getEngineOptions,
  getFuelForEngine,
  getModel,
  getModels,
  getYears,
  MANUAL_OPTION,
  UNKNOWN_ENGINE,
} from '@/data/vehicleCatalog'
import {
  Cpu,
  ArrowRight,
  Loader2,
  TriangleAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Car,
} from 'lucide-react'
import type { OBDScanResult } from '@/types/obd'

interface VehicleInfo {
  marque: string
  modele: string
  annee: string
  moteur: string
  kilometrage: string
}

function buildOBDPrompt(scan: OBDScanResult, vehicle: VehicleInfo): string {
  const lines: string[] = [
    `[SCAN OBD — ${new Date(scan.timestamp).toLocaleString('fr-FR')}]`,
    '',
    '=== VÉHICULE ===',
    `Marque : ${vehicle.marque}`,
    `Modèle : ${vehicle.modele}`,
    `Année : ${vehicle.annee}`,
    `Motorisation : ${vehicle.moteur || 'non renseignée'}`,
    `Kilométrage : ${vehicle.kilometrage} km`,
    `Connexion : ${scan.connectionType.toUpperCase()}${scan.deviceName ? ` (${scan.deviceName})` : ''}`,
  ]

  if (scan.vin) lines.push(`VIN : ${scan.vin}`)
  if (scan.milOn !== undefined) lines.push(`Voyant moteur (MIL) : ${scan.milOn ? '🔴 ALLUMÉ' : '🟢 éteint'}${scan.dtcCount ? ` — ${scan.dtcCount} code(s) dans ECM` : ''}`)
  lines.push('')

  // DTCs par module
  if (scan.faultCodes.length > 0) {
    lines.push(`=== CODES DÉFAUTS (${scan.faultCodes.length}) ===`)
    // Group by module
    const byModule = new Map<string, typeof scan.faultCodes>()
    for (const dtc of scan.faultCodes) {
      const key = dtc.module ?? 'Moteur (ECM)'
      if (!byModule.has(key)) byModule.set(key, [])
      byModule.get(key)!.push(dtc)
    }
    for (const [module, codes] of byModule) {
      lines.push(`\n[${module}]`)
      for (const dtc of codes) {
        const urgency = dtc.severity === 'high' ? 'URGENT' : dtc.severity === 'medium' ? 'MOYEN' : 'FAIBLE'
        const pending = dtc.pending ? ' (en attente)' : ''
        lines.push(`• ${dtc.code}${pending} [${urgency}] — ${dtc.description}`)
      }
    }
  } else {
    lines.push('=== CODES DÉFAUTS === Aucun code défaut détecté')
  }

  // Paramètres par groupe
  const groupLabels: Record<string, string> = {
    engine: 'MOTEUR',
    fuel: 'CARBURANT',
    electric: 'ÉLECTRIQUE',
    exhaust: 'ÉCHAPPEMENT',
    diag: 'DIAGNOSTIC',
  }

  const byGroup = new Map<string, typeof scan.parameters>()
  for (const p of scan.parameters.filter(p => p.value !== null)) {
    if (!byGroup.has(p.group)) byGroup.set(p.group, [])
    byGroup.get(p.group)!.push(p)
  }

  if (byGroup.size > 0) {
    lines.push('\n=== PARAMÈTRES TEMPS RÉEL ===')
    for (const [group, params] of byGroup) {
      lines.push(`\n[${groupLabels[group] ?? group.toUpperCase()}]`)
      for (const p of params) {
        const v = typeof p.value === 'number' ? p.value.toFixed(1) : p.value
        // Flag anomalies
        let flag = ''
        if (p.pid === '0106' || p.pid === '0107' || p.pid === '0108' || p.pid === '0109') {
          const n = Number(p.value)
          if (Math.abs(n) > 10) flag = n > 0 ? ' ⚠️ MÉLANGE PAUVRE' : ' ⚠️ MÉLANGE RICHE'
        }
        if (p.pid === '0142' && Number(p.value) < 12.0) flag = ' ⚠️ BATTERIE FAIBLE'
        if (p.pid === '0105' && Number(p.value) > 105) flag = ' ⚠️ SURCHAUFFE'
        if (p.pid === '015C' && Number(p.value) > 130) flag = ' ⚠️ HUILE TROP CHAUDE'
        lines.push(`• ${p.name} : ${v} ${p.unit}${flag}`)
      }
    }
  }

  // Readiness monitors
  if (scan.readiness && scan.readiness.length > 0) {
    lines.push('\n=== MONITEURS CT (CONTRÔLE TECHNIQUE) ===')
    for (const m of scan.readiness) {
      lines.push(`• ${m.name} : ${m.ready ? '✅ Prêt' : '❌ Non prêt'}`)
    }
    const notReady = scan.readiness.filter(m => !m.ready)
    if (notReady.length > 0) {
      lines.push(`→ ${notReady.length} moniteur(s) non prêt(s) — CT refusé si présenté maintenant`)
    }
  }

  lines.push('')
  const motorLine = vehicle.moteur ? ` motorisé ${vehicle.moteur}` : ''
  lines.push(
    `Tu es un expert mécanicien spécialisé sur les ${vehicle.marque} ${vehicle.modele} (${vehicle.annee})${motorLine} avec ${vehicle.kilometrage} km.` +
    ` Connais les défauts récurrents et spécificités techniques de ce moteur.` +
    ` Analyse toutes ces données OBD de manière croisée et donne un diagnostic complet :` +
    ` 1) Diagnostic probable par ordre de priorité (codes + paramètres corrélés),` +
    ` 2) Interprétation des corrections carburant STFT/LTFT si présentes,` +
    ` 3) État des moniteurs CT et si le véhicule est présentable au contrôle technique,` +
    ` 4) Pièces à vérifier / remplacer avec références si possible,` +
    ` 5) Urgence d'intervention (peut-on rouler ?),` +
    ` 6) Coût estimé pièces + main d'œuvre garage indépendant France 2025.`
  )
  return lines.join('\n')
}

const GROUP_LABELS: Record<string, string> = {
  engine: 'Moteur',
  fuel: 'Carburant',
  electric: 'Électrique',
  exhaust: 'Échappement',
  diag: 'Diagnostic',
}

function ScanSummary({ scan, expanded, onToggle }: { scan: OBDScanResult; expanded: boolean; onToggle: () => void }) {
  const urgent = scan.faultCodes.filter((c) => c.severity === 'high').length
  const medium = scan.faultCodes.filter((c) => c.severity === 'medium').length
  const total = scan.faultCodes.length

  // Group DTCs by module
  const dtcByModule = new Map<string, typeof scan.faultCodes>()
  for (const dtc of scan.faultCodes) {
    const key = dtc.module ?? 'Moteur (ECM)'
    if (!dtcByModule.has(key)) dtcByModule.set(key, [])
    dtcByModule.get(key)!.push(dtc)
  }

  // Group parameters by group
  const paramByGroup = new Map<string, typeof scan.parameters>()
  for (const p of scan.parameters.filter(p => p.value !== null)) {
    if (!paramByGroup.has(p.group)) paramByGroup.set(p.group, [])
    paramByGroup.get(p.group)!.push(p)
  }

  const notReadyMonitors = scan.readiness?.filter(m => !m.ready) ?? []

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        urgent > 0
          ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900'
          : total > 0
          ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900'
          : 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {urgent > 0 ? (
              <TriangleAlert className="h-5 w-5 text-red-500 shrink-0" />
            ) : total > 0 ? (
              <TriangleAlert className="h-5 w-5 text-yellow-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {total === 0
                  ? 'Aucun code défaut détecté'
                  : `${total} code${total > 1 ? 's' : ''} défaut${total > 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {urgent > 0 && <Badge variant="danger">{urgent} urgent{urgent > 1 ? 's' : ''}</Badge>}
                {medium > 0 && <Badge variant="warning">{medium} moyen{medium > 1 ? 's' : ''}</Badge>}
                {scan.parameters.filter((p) => p.value !== null).length > 0 && (
                  <Badge variant="secondary">
                    {scan.parameters.filter((p) => p.value !== null).length} paramètres
                  </Badge>
                )}
                {notReadyMonitors.length > 0 && (
                  <Badge variant="warning">{notReadyMonitors.length} moniteur{notReadyMonitors.length > 1 ? 's' : ''} non prêt{notReadyMonitors.length > 1 ? 's' : ''}</Badge>
                )}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 border-t pt-4">
                {/* MIL status + VIN */}
                {(scan.milOn !== undefined || scan.vin) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {scan.milOn !== undefined && (
                      <span className={`flex items-center gap-1 font-medium ${scan.milOn ? 'text-red-600' : 'text-green-600'}`}>
                        {scan.milOn ? '🔴 Voyant MIL allumé' : '🟢 Voyant MIL éteint'}
                        {scan.dtcCount ? ` (${scan.dtcCount} code${scan.dtcCount > 1 ? 's' : ''})` : ''}
                      </span>
                    )}
                    {scan.vin && (
                      <span className="font-mono text-xs text-muted-foreground">VIN: {scan.vin}</span>
                    )}
                  </div>
                )}

                {/* DTCs grouped by module */}
                {scan.faultCodes.length > 0 ? (
                  <div className="space-y-3">
                    {Array.from(dtcByModule.entries()).map(([module, codes]) => (
                      <div key={module}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{module}</p>
                        <div className="space-y-1.5">
                          {codes.map((dtc) => (
                            <div key={dtc.code + (dtc.module ?? '')} className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono font-bold text-sm">{dtc.code}</span>
                                {dtc.pending && <span className="ml-1 text-xs text-muted-foreground">(en attente)</span>}
                                <p className="text-xs text-muted-foreground">{dtc.description}</p>
                              </div>
                              <Badge
                                variant={
                                  dtc.severity === 'high' ? 'danger' : dtc.severity === 'medium' ? 'warning' : 'success'
                                }
                              >
                                {dtc.severity === 'high' ? 'Urgent' : dtc.severity === 'medium' ? 'Moyen' : 'Faible'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600">Aucun code défaut enregistré dans la mémoire du calculateur.</p>
                )}

                {/* Readiness monitors */}
                {scan.readiness && scan.readiness.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Moniteurs CT</p>
                    <div className="grid grid-cols-2 gap-1">
                      {scan.readiness.map((m) => (
                        <div key={m.name} className="text-xs flex items-center gap-1">
                          <span>{m.ready ? '✅' : '❌'}</span>
                          <span className={m.ready ? 'text-muted-foreground' : 'font-medium text-orange-600'}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                    {notReadyMonitors.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        → {notReadyMonitors.length} moniteur{notReadyMonitors.length > 1 ? 's' : ''} non prêt{notReadyMonitors.length > 1 ? 's' : ''} — CT refusé si présenté maintenant
                      </p>
                    )}
                  </div>
                )}

                {/* Parameters grouped by group */}
                {paramByGroup.size > 0 && (
                  <div className="border-t pt-3 space-y-3">
                    {Array.from(paramByGroup.entries()).map(([group, params]) => (
                      <div key={group}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{GROUP_LABELS[group] ?? group}</p>
                        <div className="grid grid-cols-2 gap-1">
                          {params.map((p) => (
                            <div key={p.pid} className="text-xs">
                              <span className="text-muted-foreground">{p.name}</span>
                              <span className="ml-1 font-semibold">
                                {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

function VehicleForm({
  value,
  onChange,
  onConfirm,
  confirmLabel = 'Continuer vers le scan',
}: {
  value: VehicleInfo
  onChange: (v: VehicleInfo) => void
  onConfirm: () => void
  confirmLabel?: string
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [manualBrand, setManualBrand] = useState(false)
  const [manualModel, setManualModel] = useState(false)
  const [manualEngine, setManualEngine] = useState(false)
  const brandOptions = getBrandNames()
  const modelOptions = getModels(value.marque)
  const engineOptions = getEngineOptions(value.marque, value.modele)
  const yearOptions = getYears(value.marque, value.modele, value.moteur)

  function set(field: keyof VehicleInfo, v: string) {
    onChange({ ...value, [field]: v })
    setFormError(null)
  }

  function selectBrand(brand: string) {
    setFormError(null)
    if (brand === MANUAL_OPTION) {
      setManualBrand(true)
      setManualModel(true)
      setManualEngine(true)
      onChange({ ...value, marque: '', modele: '', moteur: '', annee: '' })
      return
    }

    const firstModel = getModels(brand).find((model) => model !== MANUAL_OPTION) ?? ''
    const firstEngine = getEngineOptions(brand, firstModel).find((engine) => engine !== UNKNOWN_ENGINE && engine !== MANUAL_OPTION) ?? ''
    const firstYear = getYears(brand, firstModel, firstEngine)[0]?.toString() ?? ''
    setManualBrand(false)
    setManualModel(false)
    setManualEngine(false)
    onChange({ ...value, marque: brand, modele: firstModel, moteur: firstEngine, annee: firstYear })
  }

  function selectModel(model: string) {
    setFormError(null)
    if (model === MANUAL_OPTION) {
      setManualModel(true)
      setManualEngine(true)
      onChange({ ...value, modele: '', moteur: '', annee: '' })
      return
    }

    const firstEngine = getEngineOptions(value.marque, model).find((engine) => engine !== UNKNOWN_ENGINE && engine !== MANUAL_OPTION) ?? ''
    const firstYear = getYears(value.marque, model, firstEngine)[0]?.toString() ?? ''
    setManualModel(false)
    setManualEngine(false)
    onChange({ ...value, modele: model, moteur: firstEngine, annee: firstYear })
  }

  function selectEngine(engine: string) {
    setFormError(null)
    if (engine === MANUAL_OPTION) {
      setManualEngine(true)
      onChange({ ...value, moteur: '', annee: getYears(value.marque, value.modele)[0]?.toString() ?? '' })
      return
    }

    const nextEngine = engine === UNKNOWN_ENGINE ? '' : engine
    const firstYear = getYears(value.marque, value.modele, nextEngine)[0]?.toString() ?? ''
    setManualEngine(false)
    onChange({ ...value, moteur: nextEngine, annee: firstYear })
  }

  function handleConfirmClick() {
    if (!value.marque.trim()) {
      setFormError('Choisis ou renseigne la marque du vehicule.')
      return
    }
    if (!value.modele.trim()) {
      setFormError('Choisis ou renseigne le modele du vehicule.')
      return
    }
    if (!value.annee.trim()) {
      setFormError('Choisis ou renseigne l annee du vehicule.')
      return
    }
    setFormError(null)
    onConfirm()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Votre véhicule
        </CardTitle>
        <CardDescription>
          Renseigne ton véhicule pour que l'IA fasse un diagnostic précis adapté à ton modèle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="marque">Marque *</Label>
            <select
              id="marque"
              value={manualBrand ? MANUAL_OPTION : value.marque}
              onChange={(e) => selectBrand(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selectionner</option>
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            {manualBrand && (
              <Input
                placeholder="ex: Seat"
                value={value.marque}
                onChange={(e) => set('marque', e.target.value)}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modele">Modèle *</Label>
            <select
              id="modele"
              value={manualModel ? MANUAL_OPTION : value.modele}
              onChange={(e) => selectModel(e.target.value)}
              disabled={!getBrand(value.marque)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Selectionner</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {(manualBrand || manualModel) && (
              <Input
                placeholder="ex: Ibiza, Clio 4..."
                value={value.modele}
                onChange={(e) => set('modele', e.target.value)}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="annee">Année *</Label>
            {getModel(value.marque, value.modele) ? (
              <select
                id="annee"
                value={value.annee}
                onChange={(e) => set('annee', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            ) : (
              <Input
                id="annee"
                placeholder="ex: 2018"
                type="number"
                min="1990"
                max="2030"
                value={value.annee}
                onChange={(e) => set('annee', e.target.value)}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="km">Kilométrage</Label>
            <Input
              id="km"
              placeholder="ex: 95000"
              type="number"
              min="0"
              value={value.kilometrage}
              onChange={(e) => set('kilometrage', e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="moteur">Motorisation</Label>
            {getBrand(value.marque) && getModel(value.marque, value.modele) && (
              <select
                value={manualEngine ? MANUAL_OPTION : value.moteur || UNKNOWN_ENGINE}
                onChange={(e) => selectEngine(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {engineOptions.map((engine) => {
                  const fuel = getFuelForEngine(value.marque, value.modele, engine)
                  return (
                    <option key={engine} value={engine}>
                      {fuel ? `${engine} - ${fuel}` : engine}
                    </option>
                  )
                })}
              </select>
            )}
            <Input
              id="moteur"
              className={getModel(value.marque, value.modele) && !manualEngine ? 'hidden' : undefined}
              placeholder="ex: 1.5 dCi 90ch, 1.2 TCe 120ch, 2.0 TDI 150ch…"
              value={value.moteur}
              onChange={(e) => set('moteur', e.target.value)}
            />
          </div>
        </div>

        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {formError}
          </div>
        )}

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleConfirmClick}
        >
          <ArrowRight className="h-4 w-4" />
          {confirmLabel}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DiagnosticOBD() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { state, connectUSB, connectBluetooth, connectWifi, connectDemo, disconnect } = useOBDScanner()
  const { createDiagnostic, addMessage } = useDiagnostics(user?.id)
  const { messages, isLoading, streamingContent, sendMessage } = useChat()

  const [expanded, setExpanded] = useState(true)
  const [vehicleConfirmed, setVehicleConfirmed] = useState(false)
  const [diagStarted, setDiagStarted] = useState(false)
  const [diagId, setDiagId] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    marque: '',
    modele: '',
    annee: '',
    moteur: '',
    kilometrage: '',
  })

  const scan = state.scanResult

  async function handleSendToAI() {
    if (!scan || !user) return
    setDiagStarted(true)
    setAiError(null)

    const km = vehicleInfo.kilometrage.trim() || 'non renseigné'
    const vehicle: VehicleInfo = { ...vehicleInfo, kilometrage: km }
    const prompt = buildOBDPrompt(scan, vehicle)

    try {
      const title = `OBD — ${vehicleInfo.marque} ${vehicleInfo.modele} ${vehicleInfo.annee} (${scan.faultCodes.length} code(s))`
      const diag = await createDiagnostic(title)
      setDiagId(diag.id)

      const userMsg = { role: 'user' as const, content: prompt, timestamp: new Date().toISOString() }
      await addMessage(diag.id, userMsg)

      const aiMsg = await sendMessage(prompt)

      if (aiMsg) {
        await addMessage(diag.id, aiMsg)
      }
    } catch (err) {
      console.error('Erreur envoi OBD vers IA:', err)
      setAiError(err instanceof Error ? err.message : 'Impossible d envoyer le scan a l IA.')
    }
  }

  function handleGoToChat() {
    if (diagId) navigate(`/app/chat/${diagId}`)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Header */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Valise Diagnostic OBD</h1>
                  <p className="text-sm text-muted-foreground">
                    Connecte ta valise OBD et envoie les données à l'IA pour un diagnostic complet
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ÉTAPE 1 : Formulaire véhicule */}
            <AnimatePresence mode="wait">
              {!vehicleConfirmed && !diagStarted && (
                <motion.div
                  key="vehicle-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <motion.div
                    className="mb-4 grid grid-cols-3 gap-3 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {[
                      { step: '1', text: 'Renseigne ton véhicule', active: true },
                      { step: '2', text: 'Connecte ta valise OBD-II', active: false },
                      { step: '3', text: 'L\'IA analyse les codes défauts', active: false },
                    ].map((s) => (
                      <div key={s.step} className={`rounded-lg border p-3 ${s.active ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
                        <div className={`h-7 w-7 rounded-full text-sm font-bold flex items-center justify-center mx-auto mb-2 ${s.active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                          {s.step}
                        </div>
                        <p className={`text-xs ${s.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.text}</p>
                      </div>
                    ))}
                  </motion.div>

                  <VehicleForm
                    value={vehicleInfo}
                    onChange={setVehicleInfo}
                    onConfirm={() => setVehicleConfirmed(true)}
                    confirmLabel="Continuer vers le scan OBD"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ÉTAPE 2 : Connexion OBD */}
            <AnimatePresence mode="wait">
              {vehicleConfirmed && !scan && !diagStarted && (
                <motion.div
                  key="obd-scanner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <motion.div
                    className="mb-4 grid grid-cols-3 gap-3 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[
                      { step: '1', text: 'Véhicule renseigné', done: true },
                      { step: '2', text: 'Connecte ta valise OBD-II', active: true },
                      { step: '3', text: 'L\'IA analyse les codes défauts', active: false },
                    ].map((s) => (
                      <div key={s.step} className={`rounded-lg border p-3 ${'done' in s && s.done ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20' : 'active' in s && s.active ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
                        <div className={`h-7 w-7 rounded-full text-sm font-bold flex items-center justify-center mx-auto mb-2 ${'done' in s && s.done ? 'bg-green-500 text-white' : 'active' in s && s.active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                          {'done' in s && s.done ? '✓' : s.step}
                        </div>
                        <p className={`text-xs ${'done' in s && s.done ? 'text-green-700 dark:text-green-400' : 'active' in s && s.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.text}</p>
                      </div>
                    ))}
                  </motion.div>

                  {/* Badge véhicule sélectionné */}
                  <div className="flex items-center gap-2 text-sm px-1 py-2 rounded-lg bg-card border">
                    <Car className="h-4 w-4 text-primary shrink-0 ml-2" />
                    <span className="font-medium">{vehicleInfo.marque} {vehicleInfo.modele} {vehicleInfo.annee}</span>
                    {vehicleInfo.moteur && <span className="text-muted-foreground">— {vehicleInfo.moteur}</span>}
                    {vehicleInfo.kilometrage && <span className="text-muted-foreground">— {vehicleInfo.kilometrage} km</span>}
                    <button
                      onClick={() => { setVehicleConfirmed(false); disconnect() }}
                      className="ml-auto mr-2 text-xs text-muted-foreground underline"
                    >
                      Modifier
                    </button>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {state.isScanning
                          ? <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Scan en cours…</>
                          : 'Connexion à la valise'
                        }
                      </CardTitle>
                      <CardDescription>
                        {state.scanStep ?? 'Port OBD-II situé sous le tableau de bord côté conducteur'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <OBDScanner
                        state={state}
                        onConnectUSB={connectUSB}
                        onConnectBluetooth={connectBluetooth}
                        onConnectWifi={connectWifi}
                        onDisconnect={disconnect}
                        onDemo={connectDemo}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ÉTAPE 3 : Résultats scan + Analyser */}
            <AnimatePresence>
              {scan && !diagStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <ScanSummary scan={scan} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

                  <Button className="w-full gap-2" size="lg" onClick={handleSendToAI}>
                    <Cpu className="h-5 w-5" />
                    Analyser avec l'IA MecaIA
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Les codes défauts et paramètres seront envoyés à l'IA pour un diagnostic complet.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Response */}
            <AnimatePresence>
              {diagStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {scan && (
                    <ScanSummary scan={scan} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
                  )}

                  {vehicleInfo.marque && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                      <Car className="h-4 w-4" />
                      <span>
                        {vehicleInfo.marque} {vehicleInfo.modele} — {vehicleInfo.annee}
                        {vehicleInfo.moteur ? ` — ${vehicleInfo.moteur}` : ''}
                        {vehicleInfo.kilometrage ? ` — ${vehicleInfo.kilometrage} km` : ''}
                      </span>
                    </div>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {isLoading
                          ? <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          : <Cpu className="h-4 w-4 text-primary" />
                        }
                        {isLoading && !streamingContent
                          ? 'Connexion à l\'IA…'
                          : isLoading
                          ? 'Analyse en cours…'
                          : 'Analyse terminée'
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {aiError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          {aiError}
                        </div>
                      )}

                      {isLoading && !streamingContent && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyse des codes OBD et paramètres…
                        </div>
                      )}

                      {(streamingContent || messages.length > 0) && (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {messages
                            .filter((m) => m.role === 'assistant')
                            .map((m, i) => (
                              <ChatMessage key={i} message={m} />
                            ))}
                          {streamingContent && (
                            <ChatMessage
                              message={{
                                role: 'assistant',
                                content: streamingContent,
                                timestamp: new Date().toISOString(),
                              }}
                            />
                          )}
                        </div>
                      )}

                      {!isLoading && messages.some((m) => m.role === 'assistant') && (
                        <Button className="w-full" onClick={handleGoToChat}>
                          Continuer la conversation
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
