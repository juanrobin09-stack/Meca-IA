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
    '',
  ]

  if (scan.faultCodes.length > 0) {
    lines.push(`=== CODES DÉFAUTS DÉTECTÉS (${scan.faultCodes.length}) ===`)
    for (const dtc of scan.faultCodes) {
      lines.push(`• ${dtc.code} [${dtc.severity === 'high' ? 'URGENT' : dtc.severity === 'medium' ? 'MOYEN' : 'FAIBLE'}] — ${dtc.description}`)
    }
  } else {
    lines.push('=== CODES DÉFAUTS === Aucun code défaut détecté')
  }

  const validParams = scan.parameters.filter((p) => p.value !== null)
  if (validParams.length > 0) {
    lines.push('')
    lines.push('=== PARAMÈTRES TEMPS RÉEL ===')
    for (const p of validParams) {
      const v = typeof p.value === 'number' ? p.value.toFixed(1) : p.value
      lines.push(`• ${p.name} : ${v} ${p.unit}`)
    }
  }

  lines.push('')
  const motorLine = vehicle.moteur ? ` motorisé ${vehicle.moteur}` : ''
  lines.push(
    `Tu es un expert mécanicien spécialisé sur les véhicules ${vehicle.marque} ${vehicle.modele} (${vehicle.annee})${motorLine} avec ${vehicle.kilometrage} km au compteur.` +
    ` Connais parfaitement les défauts récurrents, les problèmes connus du constructeur, et les spécificités techniques de ce moteur.` +
    ` Analyse ces données OBD et donne un diagnostic complet et précis :` +
    ` 1) causes probables spécifiques à ce modèle/moteur,` +
    ` 2) défauts connus ou rappels constructeur associés,` +
    ` 3) pièces et composants à vérifier en priorité,` +
    ` 4) urgence d'intervention (peut-on rouler ?),` +
    ` 5) coût estimé de réparation chez un garagiste.`
  )
  return lines.join('\n')
}

function ScanSummary({ scan, expanded, onToggle }: { scan: OBDScanResult; expanded: boolean; onToggle: () => void }) {
  const urgent = scan.faultCodes.filter((c) => c.severity === 'high').length
  const medium = scan.faultCodes.filter((c) => c.severity === 'medium').length
  const total = scan.faultCodes.length

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
              <div className="mt-4 space-y-2 border-t pt-4">
                {scan.faultCodes.map((dtc) => (
                  <div key={dtc.code} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-sm">{dtc.code}</span>
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
                {scan.faultCodes.length === 0 && (
                  <p className="text-sm text-green-600">Aucun code défaut enregistré dans la mémoire du calculateur.</p>
                )}
                <div className="border-t pt-3 mt-3 grid grid-cols-2 gap-2">
                  {scan.parameters
                    .filter((p) => p.value !== null)
                    .map((p) => (
                      <div key={p.pid} className="text-xs">
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="ml-1 font-semibold">
                          {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.unit}
                        </span>
                      </div>
                    ))}
                </div>
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
  onSubmit,
}: {
  value: VehicleInfo
  onChange: (v: VehicleInfo) => void
  onSubmit: () => void
}) {
  const isValid = value.marque.trim() && value.modele.trim() && value.annee.trim()

  function set(field: keyof VehicleInfo, v: string) {
    onChange({ ...value, [field]: v })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Votre véhicule
        </CardTitle>
        <CardDescription>
          Ces informations permettent à l'IA de faire un diagnostic précis adapté à votre véhicule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="marque">Marque *</Label>
            <Input
              id="marque"
              placeholder="ex: Renault"
              value={value.marque}
              onChange={(e) => set('marque', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modele">Modèle *</Label>
            <Input
              id="modele"
              placeholder="ex: Clio 4"
              value={value.modele}
              onChange={(e) => set('modele', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="annee">Année *</Label>
            <Input
              id="annee"
              placeholder="ex: 2018"
              type="number"
              min="1990"
              max="2030"
              value={value.annee}
              onChange={(e) => set('annee', e.target.value)}
            />
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
            <Input
              id="moteur"
              placeholder="ex: 1.5 dCi 90ch, 1.2 TCe 120ch, 2.0 TDI 150ch…"
              value={value.moteur}
              onChange={(e) => set('moteur', e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onSubmit}
          disabled={!isValid}
        >
          <Cpu className="h-5 w-5" />
          Analyser avec l'IA MecaIA
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Les codes défauts et paramètres seront envoyés à l'IA pour un diagnostic complet.
        </p>
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
  const [diagStarted, setDiagStarted] = useState(false)
  const [diagId, setDiagId] = useState<string | null>(null)
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

            {/* How it works */}
            {!scan && (
              <motion.div
                className="mb-6 grid grid-cols-3 gap-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {[
                  { step: '1', text: 'Branche ta valise sur le port OBD-II' },
                  { step: '2', text: 'Indique ton véhicule (marque, année…)' },
                  { step: '3', text: 'L\'IA analyse tes codes défauts' },
                ].map((s) => (
                  <div key={s.step} className="rounded-lg bg-card border p-3">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mx-auto mb-2">
                      {s.step}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* OBD Scanner UI */}
            {!diagStarted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Connexion à la valise</CardTitle>
                    <CardDescription>
                      Port OBD-II situé sous le tableau de bord côté conducteur
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

            {/* Scan result + vehicle form + Send to AI */}
            <AnimatePresence>
              {scan && !diagStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <ScanSummary scan={scan} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

                  <VehicleForm
                    value={vehicleInfo}
                    onChange={setVehicleInfo}
                    onSubmit={handleSendToAI}
                  />
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
                        <Cpu className="h-4 w-4 text-primary" />
                        Analyse IA en cours…
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isLoading && !streamingContent && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyse des codes OBD…
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
