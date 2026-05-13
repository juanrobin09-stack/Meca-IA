import { useState, useCallback, useRef } from 'react'
import type {
  OBDConnectionType,
  OBDScannerState,
  OBDScanResult,
  OBDFaultCode,
  OBDParameter,
} from '@/types/obd'
import { OBD_PIDS, DTC_SYSTEM_MAP, KNOWN_DTC } from '@/types/obd'

const INITIAL_STATE: OBDScannerState = {
  status: 'disconnected',
  connectionType: null,
  deviceName: null,
  error: null,
  scanResult: null,
  isScanning: false,
}

// ─── PID value parser ─────────────────────────────────────────────────────────

function parsePidValue(pid: string, raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.toUpperCase().replace(/\s+/g, '').replace(/>/g, '')
  if (
    cleaned.includes('NODATA') ||
    cleaned.includes('ERROR') ||
    cleaned.includes('UNABLE') ||
    cleaned.includes('STOPPED') ||
    cleaned === '?'
  ) return null

  // Strip mode-01 response echo: "41XX" at the start
  const dataHex = cleaned.replace(/^41[0-9A-F]{2}/, '')
  if (dataHex.length < 2) return null
  const A = parseInt(dataHex.substring(0, 2), 16)
  const B = dataHex.length >= 4 ? parseInt(dataHex.substring(2, 4), 16) : 0

  switch (pid) {
    case '010C': return Math.round((A * 256 + B) / 4)
    case '010D': return A
    case '0104': return Math.round(A * 100 / 255)
    case '0105': return A - 40
    case '015C': return A - 40
    case '010F': return A - 40
    case '0146': return A - 40
    case '010E': return +(A / 2 - 64).toFixed(1)
    case '010B': return A
    case '0110': return +((A * 256 + B) / 100).toFixed(2)
    case '0143': return Math.round((A * 256 + B) * 100 / 65535)
    case '011F': return A * 256 + B
    case '0106': return +((A - 128) * 100 / 128).toFixed(1)
    case '0107': return +((A - 128) * 100 / 128).toFixed(1)
    case '0108': return +((A - 128) * 100 / 128).toFixed(1)
    case '0109': return +((A - 128) * 100 / 128).toFixed(1)
    case '010A': return A * 3
    case '012F': return Math.round(A * 100 / 255)
    case '015E': return +((A * 256 + B) / 20).toFixed(1)
    case '0111': return Math.round(A * 100 / 255)
    case '0142': return +((A * 256 + B) / 1000).toFixed(2)
    case '0133': return A
    case '013C': return +((A * 256 + B) / 10 - 40).toFixed(0)
    case '014D': return A * 256 + B
    case '0121': return A * 256 + B
    case '0131': return A * 256 + B
    default: return A
  }
}

// ─── DTC parser ───────────────────────────────────────────────────────────────

function parseDTCResponse(raw: string): OBDFaultCode[] {
  const codes: OBDFaultCode[] = []
  if (!raw) return codes

  // Strip single-digit ISO-TP frame-number prefixes (e.g. "0:" "1:" "2:") then whitespace
  const cleaned = raw.toUpperCase()
    .replace(/\b[0-9A-F]:/g, ' ')
    .replace(/\s+/g, '')

  // Match mode 03 (43), mode 07 pending (47), mode 0A permanent (4A) responses
  const match = cleaned.match(/(43|47|4A)[0-9A-F]{4,}/g)
  if (!match) return codes

  for (const block of match) {
    const modePrefix = block.substring(0, 2) // "43", "47", or "4A"
    const isPending = modePrefix === '47'
    const data = block.substring(2)

    for (let i = 0; i + 4 <= data.length; i += 4) {
      const word = parseInt(data.substring(i, i + 4), 16)
      if (word === 0) continue

      const systemBits = (word >> 14) & 0x03
      const prefix = (['P', 'C', 'B', 'U'] as const)[systemBits] ?? 'U'

      // Decode nibbles as hex digits — NOT decimal
      // Example: P0420 = 0x0420 → d1=0 d2=4 d3=2 d4=0 → "0420"
      const d1 = (word >> 12) & 0x03
      const d2 = (word >> 8) & 0x0F
      const d3 = (word >> 4) & 0x0F
      const d4 = word & 0x0F
      const number = `${d1}${d2.toString(16)}${d3.toString(16)}${d4.toString(16)}`.toUpperCase()
      const code = `${prefix}${number}`

      const system = DTC_SYSTEM_MAP[prefix] ?? 'powertrain'
      const description = KNOWN_DTC[code] ?? `Code inconnu — ${code}`
      const severity: OBDFaultCode['severity'] =
        prefix === 'C' ? 'high'
        : prefix === 'B' ? 'medium'
        : prefix === 'U' ? 'medium'
        : (parseInt(number, 16) >= 0x300 && parseInt(number, 16) <= 0x3FF) ? 'high'
        : 'medium'

      codes.push({ code, description, system, severity, ...(isPending ? { pending: true } : {}) })
    }
  }
  return codes
}

// ─── ECU modules to scan ──────────────────────────────────────────────────────

const ALL_ECU_MODULES = [
  { addr: '7B3', label: 'ABS/ESP' },
  { addr: '760', label: 'ABS (Renault/PSA)' },
  { addr: '7A0', label: 'ESP (PSA/Stellantis)' },
  { addr: '7B0', label: 'ABS (Ford/Opel)' },
  { addr: '713', label: 'ABS (Opel)' },
  { addr: '7A4', label: 'ABS (Stellantis 2)' },
  { addr: '740', label: 'ABS (Toyota)' },
  { addr: '7B5', label: 'ESP (VW/Audi)' },
  { addr: '7E1', label: 'Boîte de vitesses (TCM)' },
  { addr: '7A2', label: 'TCM (variante)' },
  { addr: '7B8', label: 'Airbag/SRS' },
  { addr: '752', label: 'SRS (Renault/PSA)' },
  { addr: '764', label: 'BSI/BCM (Renault/PSA)' },
  { addr: '7A7', label: 'BCM (générique)' },
  { addr: '7A6', label: 'Climatisation' },
  { addr: '772', label: 'Direction assistée (EPS)' },
  { addr: '7A5', label: 'EPS (variante)' },
]

// ─── Web Serial (USB/COM) ────────────────────────────────────────────────────

async function serialSendCommand(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  cmd: string,
  timeoutMs = 3000
): Promise<string> {
  await writer.write(new TextEncoder().encode(cmd + '\r'))

  const decoder = new TextDecoder()
  let result = ''
  const deadline = Date.now() + timeoutMs
  const TICK = Symbol('tick')

  while (Date.now() < deadline) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break

    const outcome = await Promise.race([
      reader.read() as Promise<ReadableStreamReadResult<Uint8Array>>,
      new Promise<typeof TICK>((res) => setTimeout(() => res(TICK), Math.min(remaining, 300))),
    ])

    if (outcome === TICK) continue
    const { value, done } = outcome
    if (done) break
    if (value?.length) result += decoder.decode(value)
    if (result.includes('>')) break
  }
  return result
}

// ─── WiFi WebSocket ───────────────────────────────────────────────────────────

function createWifiSocket(ip: string, port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${ip}:${port}`)
    ws.binaryType = 'arraybuffer'
    const t = setTimeout(() => { ws.close(); reject(new Error('Timeout connexion WiFi')) }, 8000)
    ws.onopen = () => { clearTimeout(t); resolve(ws) }
    ws.onerror = () => { clearTimeout(t); reject(new Error(`Impossible de joindre ${ip}:${port}`)) }
  })
}

async function wifiSendCommand(ws: WebSocket, cmd: string, timeoutMs = 3500): Promise<string> {
  return new Promise((resolve) => {
    let result = ''
    const tid = setTimeout(() => resolve(result), timeoutMs)
    const handler = (ev: MessageEvent) => {
      const chunk = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer)
      result += chunk
      if (result.includes('>')) {
        clearTimeout(tid)
        ws.removeEventListener('message', handler)
        resolve(result)
      }
    }
    ws.addEventListener('message', handler)
    ws.send(cmd + '\r')
  })
}

// ─── Scan orchestration ───────────────────────────────────────────────────────

type SendFn = (cmd: string, timeoutMs?: number) => Promise<string>

function normalizeOBD(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, '').replace(/>/g, '')
}

function isOBDError(raw: string): boolean {
  const c = normalizeOBD(raw)
  return (
    !c ||
    c.includes('NODATA') ||
    c.includes('UNABLETOCONNECT') ||
    c.includes('BUSERROR') ||
    c.includes('CANERROR') ||
    c.includes('DATAERROR') ||
    c.includes('FBERROR') ||
    c.includes('STOPPED') ||
    c === '?' ||
    c.endsWith('?')
  )
}

function hasVehicleData(raw: string): boolean {
  if (isOBDError(raw)) return false
  // SEARCHING... alone is not data; with a valid OBD response appended it is
  const c = normalizeOBD(raw).replace('SEARCHING...', '')
  return /41[0-9A-F]{2}/.test(c)
}

// Returns true if the detected protocol string is CAN-based
function isCAN(protocol: string): boolean {
  const p = protocol.toUpperCase()
  return (
    p.includes('CAN') ||
    p.includes('ISO 15765') ||
    p === '6' || p === '7' || p === '8' || p === '9' ||
    /^[6-9]$/.test(p.trim())
  )
}

// ─── ELM327 init ─────────────────────────────────────────────────────────────

async function initELM327(send: SendFn): Promise<void> {
  await send('ATZ')     // Reset — takes up to ~1500ms, waits for '>'
  await send('ATE0')    // Echo off
  await send('ATL0')    // Linefeeds off
  await send('ATS0')    // Spaces off
  await send('ATH0')    // Headers off
  await send('ATAL')    // Allow Long messages (multi-frame DTCs)
  await send('ATSP0')   // Auto protocol — detect on first OBD command
  // ATST 4B = 0x4B = 75 × 4ms = 300ms per ELM327 protocol attempt.
  // ATSP0 tries up to 9 protocols × 300ms = 2.7s, which fits our 3s outer timeout.
  await send('ATST 4B')
}

// ─── Protocol detection ───────────────────────────────────────────────────────

async function probeVehicleECU(send: SendFn, onStep?: (s: string) => void): Promise<string> {
  onStep?.('Détection du calculateur...')

  // Fast path — ATSP0 lets the ELM327 scan all protocols internally.
  // We use 8000ms so it has plenty of time to finish (9 protocols × 300ms = 2.7s).
  for (const cmd of ['0100', '0101', '010D', '010C']) {
    try {
      const raw = await send(cmd, 8000)
      if (hasVehicleData(raw)) {
        // Restore longer per-command timeout for data reads
        try { await send('ATST C8', 1000) } catch { /* ignore */ }
        const dpn = await send('ATDPN', 1000)
        return dpn.trim() || 'Auto'
      }
    } catch { /* continue to next cmd */ }
  }

  // Fallback — force each protocol one by one (1500ms each, fast for CAN)
  const protocols = [
    { cmd: 'ATSP6', label: 'CAN 11bit 500k' },
    { cmd: 'ATSP8', label: 'CAN 11bit 250k' },
    { cmd: 'ATSP7', label: 'CAN 29bit 500k' },
    { cmd: 'ATSP9', label: 'CAN 29bit 250k' },
    { cmd: 'ATSP5', label: 'KWP fast init' },
    { cmd: 'ATSP4', label: 'KWP 5 baud' },
    { cmd: 'ATSP3', label: 'ISO 9141-2' },
    { cmd: 'ATSP2', label: 'ISO 9141 5-baud' },
    { cmd: 'ATSP1', label: 'SAE J1850 PWM' },
  ]

  for (const protocol of protocols) {
    try {
      onStep?.(`Essai ${protocol.label}...`)
      await send(protocol.cmd, 1000)           // AT command — fast
      for (const cmd of ['0100', '010D', '010C', '0101']) {
        const raw = await send(cmd, 1500)       // OBD probe — 1500ms per protocol
        if (hasVehicleData(raw)) {
          try { await send('ATST C8', 1000) } catch { /* ignore */ }
          return protocol.label
        }
      }
    } catch { /* protocole non supporté */ }
  }

  try { await send('ATSP0', 1000) } catch { /* ignore */ }
  throw new Error(
    'Valise connectée, mais le calculateur moteur ne répond pas. Vérifie : contact en position ON (tableau de bord allumé), valise bien enfoncée dans la prise OBD. Si le problème persiste, démarre le moteur et réessaie.'
  )
}

// ─── DTC reader ───────────────────────────────────────────────────────────────

async function readDTCs(send: SendFn, protocol: string, onStep?: (s: string) => void): Promise<OBDFaultCode[]> {
  const seen = new Set<string>()
  const all: OBDFaultCode[] = []
  const canMode = isCAN(protocol)

  function addUnique(codes: OBDFaultCode[]) {
    for (const c of codes) {
      const key = c.code + (c.module ?? '') + (c.pending ? '_p' : '')
      if (!seen.has(key)) { seen.add(key); all.push(c) }
    }
  }

  // Set functional address for CAN (7DF = broadcast to all ECUs)
  // For 29-bit CAN the address is 18DB33F1 but most adapters accept 7DF too
  if (canMode) {
    try { await send('AT SH 7DF') } catch { /* ignore on non-CAN */ }
  }

  // Mode 03 — confirmed DTCs
  onStep?.('Lecture codes défauts moteur…')
  try { addUnique(parseDTCResponse(await send('03'))) } catch { /* ECU busy */ }

  // Mode 07 — pending DTCs
  onStep?.('Codes en attente…')
  try {
    const pending = parseDTCResponse(await send('07')).map(c => ({ ...c, pending: true as const }))
    addUnique(pending)
  } catch { /* not all ECUs support mode 07 */ }

  // Mode 0A — permanent DTCs
  onStep?.('Codes permanents…')
  try { addUnique(parseDTCResponse(await send('0A'))) } catch { /* not all ECUs support 0A */ }

  // Multi-module CAN scan — only on CAN vehicles
  if (canMode) {
    // Short timeout so silent modules fail fast (0x50 = 80 × 4ms = 320ms)
    try { await send('ATST 50') } catch { /* some clones don't support ATST */ }

    for (const mod of ALL_ECU_MODULES) {
      try {
        onStep?.(`Scan ${mod.label}…`)
        await send(`AT SH ${mod.addr}`)
        const raw = await send('03')
        if (isOBDError(raw) || !raw) continue
        const codes = parseDTCResponse(raw).map(c => ({ ...c, module: mod.label }))
        addUnique(codes)
      } catch { /* module absent */ }
    }

    // Restore broadcast address and default timeout
    try { await send('ATST C8') } catch { /* ignore */ }
    try { await send('AT SH 7DF') } catch { /* ignore */ }
  }

  return all
}

// ─── VIN reader ───────────────────────────────────────────────────────────────

async function readVIN(send: SendFn): Promise<string | null> {
  try {
    const raw = await send('0902')
    if (!raw || isOBDError(raw)) return null

    const stripped = raw.toUpperCase()
      .replace(/\r?\n/g, ' ')
      .replace(/\b[0-9A-F]:/g, ' ')  // strip ISO-TP frame prefixes
    const cleaned = stripped.replace(/\s+/g, '')

    // 4902 [optional frame-count byte] [17 bytes = 34 hex chars]
    const match = cleaned.match(/4902(?:[0-9A-F]{2})?([0-9A-F]{34})/)
    if (!match) return null

    let vin = ''
    const hex = match[1]
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16)
      if (code > 31 && code < 127) vin += String.fromCharCode(code)
    }
    return vin.length >= 10 ? vin : null
  } catch { return null }
}

// ─── Readiness reader ─────────────────────────────────────────────────────────

async function readReadiness(send: SendFn): Promise<{ mil: boolean; dtcCount: number; monitors: import('@/types/obd').ReadinessMonitor[] } | null> {
  try {
    const raw = await send('0101')
    if (!raw || isOBDError(raw)) return null

    const cleaned = normalizeOBD(raw)
    const match = cleaned.match(/4101([0-9A-F]{8})/)
    if (!match) return null

    const A = parseInt(match[1].substring(0, 2), 16)
    const B = parseInt(match[1].substring(2, 4), 16)
    const C = parseInt(match[1].substring(4, 6), 16)
    const D = parseInt(match[1].substring(6, 8), 16)

    const mil = (A & 0x80) !== 0
    const dtcCount = A & 0x7F

    const monitors: import('@/types/obd').ReadinessMonitor[] = [
      { name: 'Ratés allumage',     supported: !(B & 0x10), ready: !(B & 0x01) },
      { name: 'Système carburant',  supported: !(B & 0x20), ready: !(B & 0x02) },
      { name: 'Composants',         supported: !(B & 0x40), ready: !(B & 0x04) },
      { name: 'Catalyseur',         supported: !(C & 0x01), ready: !(D & 0x01) },
      { name: 'Catalyseur chauffé', supported: !(C & 0x02), ready: !(D & 0x02) },
      { name: 'Système évap.',      supported: !(C & 0x04), ready: !(D & 0x04) },
      { name: 'Air secondaire',     supported: !(C & 0x08), ready: !(D & 0x08) },
      { name: 'Sonde O2',           supported: !(C & 0x20), ready: !(D & 0x20) },
      { name: 'Chauffe sonde O2',   supported: !(C & 0x40), ready: !(D & 0x40) },
      { name: 'Recirculation EGR',  supported: !(C & 0x80), ready: !(D & 0x80) },
    ]

    return { mil, dtcCount, monitors: monitors.filter(m => m.supported) }
  } catch { return null }
}

// ─── Parameters reader ────────────────────────────────────────────────────────

async function readParameters(send: SendFn, onStep?: (s: string) => void): Promise<OBDParameter[]> {
  onStep?.('Lecture paramètres temps réel…')
  const results: OBDParameter[] = []

  for (const [, meta] of Object.entries(OBD_PIDS)) {
    try {
      const raw = await send(meta.pid)
      const value = parsePidValue(meta.pid, raw)
      results.push({ pid: meta.pid, name: meta.name, value, unit: meta.unit, group: meta.group, raw })
    } catch {
      results.push({ pid: meta.pid, name: meta.name, value: null, unit: meta.unit, group: meta.group, raw: '' })
    }
  }
  return results
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOBDScanner() {
  const [state, setState] = useState<OBDScannerState>(INITIAL_STATE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialPortRef = useRef<any>(null)
  const serialWriterRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)
  const serialReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const setStatus = (patch: Partial<OBDScannerState>) =>
    setState((s) => ({ ...s, ...patch }))

  // ── Common scan runner ──────────────────────────────────────────────────────
  async function runScan(type: OBDConnectionType, deviceName: string, send: SendFn, setStep: (s: string) => void) {
    try {
      const protocolUsed = await probeVehicleECU(send, setStep)

      setStep('Lecture VIN…')
      const vin = await readVIN(send)

      setStep('Moniteurs de disponibilité…')
      const readinessData = await readReadiness(send)

      const faultCodes = await readDTCs(send, protocolUsed, setStep)

      const parameters = await readParameters(send, setStep)

      const hasLiveData = parameters.some(p => p.value !== null)
      if (!vin && !readinessData && faultCodes.length === 0 && !hasLiveData) {
        throw new Error(
          'Connexion établie, mais aucune donnée ECU lue. Vérifie que le contact est mis et que la valise est bien enfoncée.'
        )
      }

      const result: OBDScanResult = {
        timestamp: new Date().toISOString(),
        connectionType: type,
        deviceName,
        faultCodes,
        parameters,
        vin: vin ?? undefined,
        milOn: readinessData?.mil,
        dtcCount: readinessData?.dtcCount,
        readiness: readinessData?.monitors,
        protocolUsed,
      }
      setState(prev => ({ ...prev, scanResult: result, isScanning: false, scanStep: undefined, error: null }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'lecture OBD impossible'
      setState(prev => ({
        ...prev,
        status: 'error',
        isScanning: false,
        scanStep: undefined,
        error: msg,
      }))
    }
  }

  // ── USB / Serial ────────────────────────────────────────────────────────────
  const connectUSB = useCallback(async () => {
    if (!('serial' in navigator)) {
      setStatus({ status: 'error', error: 'Web Serial API non supporté. Utilise Chrome ou Edge.' })
      return
    }
    setStatus({ status: 'connecting', connectionType: 'usb', error: null })
    try {
      const existingPorts: SerialPort[] = await (navigator as Navigator & { serial: { getPorts: () => Promise<SerialPort[]>; requestPort: () => Promise<SerialPort> } }).serial.getPorts()
      const port = existingPorts.length > 0
        ? existingPorts[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : await (navigator as any).serial.requestPort()

      const baudRates = [38400, 115200, 9600, 57600]
      let opened = false
      for (const baudRate of baudRates) {
        try { await port.open({ baudRate }); opened = true; break } catch { /* try next */ }
      }
      if (!opened) throw new Error('Impossible d\'ouvrir le port (vérifie qu\'aucun autre programme ne l\'utilise)')

      serialPortRef.current = port
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serialWriterRef.current = (port as any).writable.getWriter()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serialReaderRef.current = (port as any).readable.getReader()
      const send: SendFn = (cmd, timeoutMs?) =>
        serialSendCommand(serialWriterRef.current!, serialReaderRef.current!, cmd, timeoutMs)

      await initELM327(send)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = await (port as any).getInfo?.() ?? {}
      const deviceName = info.usbVendorId ? `USB (VID:${info.usbVendorId.toString(16)})` : 'ELM327 USB'
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('usb', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('No port selected') || msg.includes('cancelled') || msg.includes('user')) {
        setStatus({ status: 'error', error: 'Aucun port sélectionné. Branche ta valise USB puis clique à nouveau.' })
      } else {
        setStatus({ status: 'error', error: msg || 'Erreur connexion USB. Vérifie que la valise est branchée.' })
      }
    }
  }, [])

  // ── Bluetooth (BLE only) ────────────────────────────────────────────────────
  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setStatus({ status: 'error', error: 'Web Bluetooth non supporté. Utilise Chrome.' })
      return
    }
    setStatus({ status: 'connecting', connectionType: 'bluetooth', error: null })
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'ELM' }, { namePrefix: 'OBD' }, { namePrefix: 'OBDII' },
          { namePrefix: 'Vgate' }, { namePrefix: 'Konnwei' }, { namePrefix: 'VEEPEAK' },
        ],
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '00001101-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const server = await (device as any).gatt.connect()
      const deviceName: string = device.name ?? 'ELM327 Bluetooth'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let writeChar: any = null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let notifyChar: any = null

      for (const uuid of ['0000fff0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']) {
        try {
          const service = await server.getPrimaryService(uuid)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chars: any[] = await service.getCharacteristics()
          for (const c of chars) {
            if (c.properties.writeWithoutResponse || c.properties.write) writeChar = c
            if (c.properties.notify) notifyChar = c
          }
          if (writeChar) break
        } catch { /* try next UUID */ }
      }

      if (!writeChar || !notifyChar) throw new Error('Caractéristiques BLE OBD introuvables')

      let responseBuffer = ''
      const responseQueue: Array<(v: string) => void> = []

      await notifyChar.startNotifications()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notifyChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        responseBuffer += new TextDecoder().decode(ev.target.value)
        if (responseBuffer.includes('>') && responseQueue.length > 0) {
          const resolve = responseQueue.shift()!
          const val = responseBuffer
          responseBuffer = ''
          resolve(val)
        }
      })

      const send: SendFn = (cmd, timeoutMs = 3500) =>
        new Promise((resolve) => {
          responseQueue.push(resolve)
          const encoded = new TextEncoder().encode(cmd + '\r')
          writeChar.writeValueWithoutResponse
            ? writeChar.writeValueWithoutResponse(encoded)
            : writeChar.writeValue(encoded)
          setTimeout(() => {
            const idx = responseQueue.indexOf(resolve)
            if (idx !== -1) {
              responseQueue.splice(idx, 1)
              resolve(responseBuffer || 'NO DATA')
              responseBuffer = ''
            }
          }, timeoutMs)
        })

      await initELM327(send)
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('bluetooth', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: unknown) {
      setStatus({ status: 'error', error: err instanceof Error ? err.message : 'Erreur connexion Bluetooth' })
    }
  }, [])

  // ── WiFi ────────────────────────────────────────────────────────────────────
  const connectWifi = useCallback(async (ip: string, port: number) => {
    setStatus({ status: 'connecting', connectionType: 'wifi', error: null })
    try {
      const ws = await createWifiSocket(ip, port)
      wsRef.current = ws
      const send: SendFn = (cmd, timeoutMs?) => wifiSendCommand(ws, cmd, timeoutMs)
      await initELM327(send)
      const deviceName = `ELM327 WiFi (${ip})`
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('wifi', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: unknown) {
      setStatus({ status: 'error', error: err instanceof Error ? err.message : 'Erreur connexion WiFi' })
    }
  }, [])

  const disconnect = useCallback(async () => {
    try { serialReaderRef.current?.releaseLock() } catch { /* ignore */ }
    try { serialWriterRef.current?.releaseLock() } catch { /* ignore */ }
    try { await serialPortRef.current?.close() } catch { /* ignore */ }
    wsRef.current?.close()
    serialPortRef.current = null
    serialWriterRef.current = null
    serialReaderRef.current = null
    wsRef.current = null
    setState(INITIAL_STATE)
  }, [])

  const rescan = useCallback(async () => {
    if (state.status !== 'connected') return
    setStatus({ scanResult: null, status: 'disconnected', error: 'Reconnecte-toi pour relancer un scan.' })
  }, [state.status])

  // ── Demo mode ─────────────────────────────────────────────────────────────────
  const connectDemo = useCallback(() => {
    const demoResult: OBDScanResult = {
      timestamp: new Date().toISOString(),
      connectionType: 'wifi',
      deviceName: 'Démo — données simulées',
      protocolUsed: 'ISO 15765-4 CAN (démo)',
      vin: 'VF1BM0B0H12345678',
      milOn: true,
      dtcCount: 4,
      faultCodes: [
        { code: 'P0171', description: 'Système carburant — Mélange trop pauvre (Banc 1)', system: 'powertrain', severity: 'medium' },
        { code: 'P0300', description: 'Ratés d\'allumage aléatoires détectés', system: 'powertrain', severity: 'high' },
        { code: 'C0035', description: 'Capteur vitesse roue avant droite — Circuit ouvert', system: 'chassis', severity: 'high', module: 'ABS/ESP' },
        { code: 'C0196', description: 'Capteur taux de lacet / gyroscope (ESP) — Défaut', system: 'chassis', severity: 'high', module: 'ABS/ESP' },
      ],
      readiness: [
        { name: 'Catalyseur', supported: true, ready: false },
        { name: 'Sonde O2', supported: true, ready: true },
        { name: 'Système évap.', supported: true, ready: false },
        { name: 'Recirculation EGR', supported: true, ready: true },
        { name: 'Ratés allumage', supported: true, ready: false },
        { name: 'Système carburant', supported: true, ready: false },
      ],
      parameters: [
        { pid: '010C', name: 'Régime moteur',              value: 820,   unit: 'tr/min', group: 'engine', raw: '' },
        { pid: '010D', name: 'Vitesse',                    value: 0,     unit: 'km/h',   group: 'engine', raw: '' },
        { pid: '0105', name: 'Temp. refroidissement',      value: 88,    unit: '°C',     group: 'engine', raw: '' },
        { pid: '015C', name: 'Temp. huile moteur',         value: 92,    unit: '°C',     group: 'engine', raw: '' },
        { pid: '0104', name: 'Charge moteur',              value: 12.5,  unit: '%',      group: 'engine', raw: '' },
        { pid: '010E', name: 'Avance allumage',            value: 8.5,   unit: '°',      group: 'engine', raw: '' },
        { pid: '010B', name: 'Pression admission (MAP)',   value: 34,    unit: 'kPa',    group: 'engine', raw: '' },
        { pid: '0110', name: 'Débit air (MAF)',            value: 3.21,  unit: 'g/s',    group: 'engine', raw: '' },
        { pid: '010F', name: 'Temp. admission',            value: 24,    unit: '°C',     group: 'engine', raw: '' },
        { pid: '0146', name: 'Temp. extérieure',           value: 18,    unit: '°C',     group: 'engine', raw: '' },
        { pid: '011F', name: 'Temps moteur actif',         value: 1240,  unit: 's',      group: 'engine', raw: '' },
        { pid: '0106', name: 'Correction CT carburant B1', value: +14.8, unit: '%',      group: 'fuel',   raw: '' },
        { pid: '0107', name: 'Correction LT carburant B1', value: +18.0, unit: '%',      group: 'fuel',   raw: '' },
        { pid: '012F', name: 'Niveau carburant',           value: 45,    unit: '%',      group: 'fuel',   raw: '' },
        { pid: '010A', name: 'Pression carburant (rail)',  value: 312,   unit: 'kPa',    group: 'fuel',   raw: '' },
        { pid: '0111', name: 'Position papillon',          value: 0,     unit: '%',      group: 'electric', raw: '' },
        { pid: '0142', name: 'Tension batterie',           value: 13.8,  unit: 'V',      group: 'electric', raw: '' },
        { pid: '013C', name: 'Temp. catalyseur B1S1',      value: 420,   unit: '°C',     group: 'exhaust', raw: '' },
        { pid: '0131', name: 'Distance depuis reset',      value: 42,    unit: 'km',     group: 'diag',   raw: '' },
        { pid: '014D', name: 'Temps MIL allumé',           value: 12,    unit: 'min',    group: 'diag',   raw: '' },
      ],
    }
    setState(prev => ({ ...prev, status: 'connected', deviceName: 'Démo', isScanning: false, scanResult: demoResult, error: null }))
  }, [])

  return { state, connectUSB, connectBluetooth, connectWifi, connectDemo, disconnect, rescan }
}
