import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Bluetooth, Usb, Plug, PlugZap, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Info, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OBDScanResult, OBDFaultCode, OBDParameter } from '@/types/obd'
import type { OBDConnectionType } from '@/types/obd'

interface OBDScannerProps {
  state: {
    status: string
    connectionType: OBDConnectionType | null
    deviceName: string | null
    error: string | null
    scanResult: OBDScanResult | null
    isScanning: boolean
  }
  onConnectUSB: () => void
  onConnectBluetooth: () => void
  onConnectWifi: (ip: string, port: number) => void
  onDisconnect: () => void
  onDemo?: () => void
}

const CONNECTION_MODES = [
  {
    type: 'wifi' as OBDConnectionType,
    icon: Wifi,
    label: 'WiFi',
    description: 'ELM327 WiFi / OBDLink LX',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    type: 'bluetooth' as OBDConnectionType,
    icon: Bluetooth,
    label: 'Bluetooth',
    description: 'Vgate iCar Pro / Konnwei',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
  },
  {
    type: 'usb' as OBDConnectionType,
    icon: Usb,
    label: 'USB',
    description: 'ELM327 USB / câble OBD',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
]

const SEVERITY_CONFIG = {
  high:   { label: 'Urgent',  color: 'danger'  as const },
  medium: { label: 'Moyen',   color: 'warning' as const },
  low:    { label: 'Faible',  color: 'success' as const },
}

function SeverityBadge({ severity }: { severity: OBDFaultCode['severity'] }) {
  const cfg = SEVERITY_CONFIG[severity]
  return <Badge variant={cfg.color}>{cfg.label}</Badge>
}

function ParameterRow({ param }: { param: OBDParameter }) {
  if (param.value === null) return null
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{param.name}</span>
      <span className="font-semibold tabular-nums">
        {typeof param.value === 'number' ? param.value.toFixed(1) : param.value}
        <span className="text-xs text-muted-foreground ml-1">{param.unit}</span>
      </span>
    </div>
  )
}

function WifiForm({ onConnect }: { onConnect: (ip: string, port: number) => void }) {
  const [ip, setIp] = useState('192.168.0.10')
  const [port, setPort] = useState('35000')

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs text-muted-foreground">
        Connecte-toi d'abord au réseau WiFi de ta valise OBD, puis saisis ses paramètres :
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Adresse IP</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="192.168.0.10"
          />
        </div>
        <div className="w-24">
          <label className="text-xs text-muted-foreground mb-1 block">Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="35000"
          />
        </div>
      </div>
      <Button className="w-full" onClick={() => onConnect(ip, parseInt(port))}>
        <Wifi className="h-4 w-4 mr-2" />
        Se connecter en WiFi
      </Button>
    </div>
  )
}

export default function OBDScanner({
  state,
  onConnectUSB,
  onConnectBluetooth,
  onConnectWifi,
  onDisconnect,
  onDemo,
}: OBDScannerProps) {
  const [selectedMode, setSelectedMode] = useState<OBDConnectionType | null>(null)

  const isConnected = state.status === 'connected'
  const isConnecting = state.status === 'connecting'
  const hasError = state.status === 'error'
  const hasResult = !!state.scanResult

  // ── Connected state ─────────────────────────────────────────────────────────
  if (isConnected || isConnecting || state.isScanning) {
    return (
      <div className="space-y-4">
        {/* Connection status bar */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {isConnecting || state.isScanning ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {isConnecting ? 'Connexion en cours...' : state.isScanning ? 'Scan OBD en cours...' : `Connecté — ${state.deviceName}`}
                </p>
                {state.connectionType && (
                  <p className="text-xs text-muted-foreground capitalize">{state.connectionType}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              Déconnecter
            </Button>
          </CardContent>
        </Card>

        {/* Scan results */}
        <AnimatePresence>
          {hasResult && state.scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Fault codes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Codes défauts (DTC)
                    <Badge variant="secondary">{state.scanResult.faultCodes.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.scanResult.faultCodes.length === 0 ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Aucun code défaut détecté
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {state.scanResult.faultCodes.map((dtc) => (
                        <div key={dtc.code} className="flex items-start justify-between gap-2 py-2 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <span className="font-mono font-bold text-sm">{dtc.code}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{dtc.description}</p>
                          </div>
                          <SeverityBadge severity={dtc.severity} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live parameters */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Paramètres temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  {state.scanResult.parameters.filter((p) => p.value !== null).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun paramètre disponible</p>
                  ) : (
                    state.scanResult.parameters.map((p) => <ParameterRow key={p.pid} param={p} />)
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-center">
                Scan effectué le {new Date(state.scanResult.timestamp).toLocaleString('fr-FR')}
                {state.scanResult.protocolUsed && ` — Protocole : ${state.scanResult.protocolUsed}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div className="space-y-3">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-semibold text-sm">Erreur de connexion</p>
            </div>
            <p className="text-sm text-muted-foreground">{state.error}</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setSelectedMode(null)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
              {onDemo && (
                <Button variant="ghost" size="sm" onClick={onDemo} className="gap-2 text-muted-foreground">
                  <FlaskConical className="h-4 w-4" />
                  Tester avec données démo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <CompatibilityNote />
      </div>
    )
  }

  // ── Idle / select mode ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {CONNECTION_MODES.map((mode) => {
          const Icon = mode.icon
          const isSelected = selectedMode === mode.type
          return (
            <motion.button
              key={mode.type}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedMode(isSelected ? null : mode.type)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className={`rounded-full p-2 ${mode.bg}`}>
                <Icon className={`h-5 w-5 ${mode.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{mode.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{mode.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedMode === 'usb' && (
          <motion.div key="usb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Usb className="h-4 w-4 text-orange-500" />
                  USB / Port série (COM)
                </CardTitle>
                <CardDescription className="text-xs">
                  Fonctionne avec Chrome ou Edge uniquement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-3 py-2 space-y-1.5">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Fonctionne aussi avec les valises Bluetooth !
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Sur Windows : associe ta valise Bluetooth dans les paramètres → un port COM apparaît → sélectionne-le ici.
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-400 list-decimal list-inside space-y-0.5">
                    <li>Paramètres Windows → Bluetooth → associer la valise</li>
                    <li>Elle crée un port COM (ex: COM3, COM4…)</li>
                    <li>Clique ci-dessous et sélectionne ce port COM</li>
                  </ol>
                </div>
                <Button className="w-full" onClick={onConnectUSB}>
                  <PlugZap className="h-4 w-4 mr-2" />
                  Ouvrir la sélection de port
                </Button>
                {onDemo && (
                  <Button variant="outline" className="w-full" onClick={onDemo}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Tester sans valise (données démo)
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedMode === 'bluetooth' && (
          <motion.div key="bt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bluetooth className="h-4 w-4 text-indigo-500" />
                  Connexion Bluetooth BLE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
                    <p className="font-semibold">Compatibilité limitée</p>
                    <p>Les valises ELM327 bon marché (OBD11, KONNWEI, etc.) utilisent le <strong>Bluetooth classique (SPP)</strong>, incompatible avec les navigateurs.</p>
                    <p>Seuls les adaptateurs <strong>BLE</strong> fonctionnent : Vgate iCar Pro BLE, OBDLink CX, VEEPEAK OBDCheck BLE+.</p>
                  </div>
                </div>
                <Button className="w-full" onClick={onConnectBluetooth}>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Chercher un adaptateur BLE
                </Button>
                {onDemo && (
                  <Button variant="outline" className="w-full" onClick={onDemo}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Tester sans valise (données démo)
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedMode === 'wifi' && (
          <motion.div key="wifi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-500" />
                  Connexion WiFi
                  <Badge variant="success" className="text-[10px]">Recommandé</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  L'adaptateur WiFi crée son propre réseau. Connecte d'abord ton appareil à ce réseau WiFi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <WifiForm onConnect={onConnectWifi} />
                {onDemo && (
                  <Button variant="outline" className="w-full" onClick={onDemo}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Tester sans valise (données démo)
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!selectedMode && (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
              <Plug className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Sélectionne un mode ci-dessus. Le <strong>WiFi</strong> est le plus compatible (ELM327 WiFi). Le <strong>USB</strong> fonctionne avec Chrome/Edge. Le <strong>Bluetooth</strong> nécessite un adaptateur BLE spécifique.
              </p>
            </div>
            {onDemo && (
              <Button variant="outline" className="w-full" onClick={onDemo}>
                <FlaskConical className="h-4 w-4 mr-2" />
                Tester sans valise (données démo)
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CompatibilityNote() {
  return (
    <div className="rounded-lg border bg-muted/50 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 text-primary" />
        Adaptateurs compatibles
      </p>
      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
        <div>
          <p className="font-medium text-foreground mb-0.5">WiFi ✅</p>
          <p>ELM327 WiFi</p>
          <p>OBDLink LX WiFi</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-0.5">BLE ✅</p>
          <p>Vgate iCar Pro BLE</p>
          <p>OBDLink CX</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-0.5">USB ✅</p>
          <p>ELM327 USB</p>
          <p>(Chrome requis)</p>
        </div>
      </div>
      <p className="text-[10px] text-red-500">❌ ELM327 Bluetooth classique (SPP) non compatible navigateur</p>
    </div>
  )
}
