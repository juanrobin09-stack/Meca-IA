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

// ─── ELM327 AT command helpers ───────────────────────────────────────────────

function parsePidValue(pid: string, raw: string): number | null {
  const bytes = raw.trim().replace(/\s/g, '')
  if (!bytes || bytes.toUpperCase().includes('NODATA') || bytes.toUpperCase().includes('ERROR')) return null

  // Strip mode+pid echo (ex: 410C → garde les octets de données)
  const hex = bytes.replace(/^(41|43)[0-9A-Fa-f]{2}/, '')
  if (hex.length < 2) return null
  const A = parseInt(hex.substring(0, 2), 16)
  const B = hex.length >= 4 ? parseInt(hex.substring(2, 4), 16) : 0

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
    // Fuel trims: (A-128)*100/128
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

function parseDTCResponse(raw: string): OBDFaultCode[] {
  const codes: OBDFaultCode[] = []
  // Strip ALL whitespace — ELM327 responses often have spaces between bytes
  const cleaned = raw.toUpperCase().replace(/\s+/g, '')
  // Match mode 03 (43), mode 07 pending (47), mode 0A permanent (4A)
  const match = cleaned.match(/(43|47|4A)[0-9A-F]{4,}/g)
  if (!match) return codes

  for (const block of match) {
    const data = block.substring(2) // strip "43"/"47"/"4A"
    for (let i = 0; i < data.length - 3; i += 4) {
      const word = parseInt(data.substring(i, i + 4), 16)
      if (word === 0) continue
      const systemBits = (word >> 14) & 0x03
      const prefixes = ['P', 'C', 'B', 'U']
      const prefix = prefixes[systemBits] ?? 'U'
      const number = (word & 0x3FFF).toString(10).padStart(4, '0')
      const code = `${prefix}${number}`
      const system = DTC_SYSTEM_MAP[prefix] ?? 'powertrain'
      const description = KNOWN_DTC[code] ?? `Code inconnu — ${code}`
      const severity: OBDFaultCode['severity'] =
        prefix === 'C' ? 'high'                                                        // ABS/ESP/frein = toujours urgent
        : prefix === 'B' ? 'medium'
        : prefix === 'U' ? 'medium'
        : parseInt(number) >= 300 && parseInt(number) <= 399 ? 'high'                 // ratés allumage
        : 'medium'
      codes.push({ code, description, system, severity })
    }
  }
  return codes
}

// Tous les modules ECU à scanner pour les DTCs
const ALL_ECU_MODULES = [
  // ABS / ESP / Frein
  { send: '7B3', recv: '7BB', label: 'ABS/ESP' },
  { send: '760', recv: '768', label: 'ABS (Renault/PSA)' },
  { send: '7A0', recv: '7A8', label: 'ESP (PSA/Stellantis)' },
  { send: '7B0', recv: '7B8', label: 'ABS (Ford/Opel)' },
  { send: '713', recv: '71B', label: 'ABS (Opel)' },
  { send: '7A4', recv: '7AC', label: 'ABS (Stellantis 2)' },
  { send: '740', recv: '748', label: 'ABS (Toyota)' },
  { send: '7B5', recv: '7BD', label: 'ESP (VW/Audi)' },
  // Boîte de vitesses (TCM)
  { send: '7E1', recv: '7E9', label: 'Boîte de vitesses (TCM)' },
  { send: '7A2', recv: '7AA', label: 'TCM (variante)' },
  // Airbag / SRS
  { send: '7B8', recv: '7BC', label: 'Airbag/SRS' },
  { send: '752', recv: '75A', label: 'SRS (Renault/PSA)' },
  // BSI / BCM (calculateur de confort)
  { send: '764', recv: '76C', label: 'BSI/BCM (Renault/PSA)' },
  { send: '7A7', recv: '7AF', label: 'BCM (générique)' },
  // Climatisation
  { send: '7A6', recv: '7AE', label: 'Climatisation' },
  // Direction assistée électrique (EPS)
  { send: '772', recv: '77A', label: 'Direction assistée (EPS)' },
  { send: '7A5', recv: '7AD', label: 'EPS (variante)' },
]

// ─── Web Serial API (USB + Bluetooth paired as COM) ──────────────────────────

async function serialSendCommand(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  cmd: string,
  timeoutMs = 2000
): Promise<string> {
  const encoder = new TextEncoder()
  await writer.write(encoder.encode(cmd + '\r'))

  const decoder = new TextDecoder()
  let result = ''
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const { value, done } = await Promise.race([
      reader.read(),
      new Promise<{ value: Uint8Array; done: boolean }>((resolve) =>
        setTimeout(() => resolve({ value: new Uint8Array(), done: true }), 200)
      ),
    ])
    if (done) break
    result += decoder.decode(value)
    if (result.includes('>')) break // ELM327 prompt means response complete
  }
  return result
}

// ─── WiFi WebSocket relay ─────────────────────────────────────────────────────

function createWifiSocket(ip: string, port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${ip}:${port}`)
    ws.binaryType = 'arraybuffer'
    const timeout = setTimeout(() => { ws.close(); reject(new Error('Timeout de connexion WiFi')) }, 8000)
    ws.onopen = () => { clearTimeout(timeout); resolve(ws) }
    ws.onerror = () => { clearTimeout(timeout); reject(new Error(`Impossible de joindre ${ip}:${port}`)) }
  })
}

async function wifiSendCommand(ws: WebSocket, cmd: string, timeoutMs = 2000): Promise<string> {
  return new Promise((resolve) => {
    let result = ''
    const tid = setTimeout(() => resolve(result), timeoutMs)
    const handler = (ev: MessageEvent) => {
      const chunk = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data)
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

type SendFn = (cmd: string) => Promise<string>

async function initELM327(send: SendFn): Promise<string> {
  await send('ATZ')       // Reset
  await send('ATE0')      // Echo off
  await send('ATL0')      // Linefeeds off
  await send('ATS0')      // Spaces off
  const proto = await send('ATSP0')  // Auto protocol
  return proto.trim()
}

async function readDTCs(send: SendFn, onStep?: (s: string) => void): Promise<OBDFaultCode[]> {
  const seen = new Set<string>()
  const all: OBDFaultCode[] = []

  function addUnique(codes: OBDFaultCode[]) {
    for (const c of codes) {
      if (!seen.has(c.code + (c.module ?? ''))) {
        seen.add(c.code + (c.module ?? ''))
        all.push(c)
      }
    }
  }

  // Mode 03 — codes confirmés ECM
  onStep?.('Lecture codes défauts moteur…')
  addUnique(parseDTCResponse(await send('03')))

  // Mode 07 — codes en attente ECM
  const pending = parseDTCResponse(await send('07')).map(c => ({ ...c, pending: true }))
  addUnique(pending)

  // Scan tous les modules ECU
  for (const mod of ALL_ECU_MODULES) {
    try {
      onStep?.(`Scan ${mod.label}…`)
      await send(`AT SH ${mod.send}`)
      await send(`AT CRA ${mod.recv}`)
      const raw = await send('03')
      if (!raw || raw.includes('NO DATA') || raw.includes('ERROR') || raw.includes('UNABLE') || raw.includes('BUS')) continue
      const codes = parseDTCResponse(raw).map(c => ({ ...c, module: mod.label }))
      addUnique(codes)
    } catch { /* module absent */ }
  }

  // Reset adressage broadcast
  try {
    await send('AT SH 7DF')
    await send('ATE0')
  } catch { /* ignore */ }

  return all
}

async function readVIN(send: SendFn): Promise<string | null> {
  try {
    const raw = await send('0902')
    if (!raw || raw.includes('NO DATA') || raw.includes('ERROR')) return null
    // VIN: réponse 49 02 01 [17 bytes ASCII]
    const cleaned = raw.toUpperCase().replace(/\s+/g, '')
    const match = cleaned.match(/4902(?:01)?([0-9A-F]{34})/)
    if (!match) return null
    const hex = match[1]
    let vin = ''
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16)
      if (code > 31 && code < 127) vin += String.fromCharCode(code)
    }
    return vin.length >= 10 ? vin : null
  } catch { return null }
}

async function readReadiness(send: SendFn): Promise<{ mil: boolean; dtcCount: number; monitors: import('@/types/obd').ReadinessMonitor[] } | null> {
  try {
    const raw = await send('0101')
    if (!raw || raw.includes('NO DATA') || raw.includes('ERROR')) return null
    const cleaned = raw.toUpperCase().replace(/\s+/g, '')
    const match = cleaned.match(/4101([0-9A-F]{8})/)
    if (!match) return null
    const A = parseInt(match[1].substring(0, 2), 16)
    const B = parseInt(match[1].substring(2, 4), 16)
    const C = parseInt(match[1].substring(4, 6), 16)
    const D = parseInt(match[1].substring(6, 8), 16)

    const mil = (A & 0x80) !== 0
    const dtcCount = A & 0x7F

    const monitors: import('@/types/obd').ReadinessMonitor[] = [
      { name: 'Ratés allumage',      supported: !(B & 0x10), ready: !(B & 0x01) },
      { name: 'Système carburant',   supported: !(B & 0x20), ready: !(B & 0x02) },
      { name: 'Composants',          supported: !(B & 0x40), ready: !(B & 0x04) },
      { name: 'Catalyseur',          supported: !(C & 0x01), ready: !(D & 0x01) },
      { name: 'Catalyseur chauffé',  supported: !(C & 0x02), ready: !(D & 0x02) },
      { name: 'Système évap.',       supported: !(C & 0x04), ready: !(D & 0x04) },
      { name: 'Air secondaire',      supported: !(C & 0x08), ready: !(D & 0x08) },
      { name: 'Sonde O2',            supported: !(C & 0x20), ready: !(D & 0x20) },
      { name: 'Chauffe sonde O2',    supported: !(C & 0x40), ready: !(D & 0x40) },
      { name: 'Recirculation EGR',   supported: !(C & 0x80), ready: !(D & 0x80) },
    ]

    return { mil, dtcCount, monitors: monitors.filter(m => m.supported) }
  } catch { return null }
}

async function readParameters(send: SendFn, onStep?: (s: string) => void): Promise<OBDParameter[]> {
  onStep?.('Lecture paramètres temps réel…')
  const results: OBDParameter[] = []
  for (const [, meta] of Object.entries(OBD_PIDS)) {
    const pidCmd = meta.pid.substring(2) // strip "01"
    const raw = await send(pidCmd)
    const value = parsePidValue(meta.pid, raw)
    results.push({ pid: meta.pid, name: meta.name, value, unit: meta.unit, group: meta.group, raw })
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
      // VIN
      setStep('Lecture VIN…')
      const vin = await readVIN(send)

      // Readiness monitors
      setStep('Moniteurs de disponibilité…')
      const readinessData = await readReadiness(send)

      // DTCs — tous modules
      const faultCodes = await readDTCs(send, setStep)

      // Paramètres temps réel
      const parameters = await readParameters(send, setStep)

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
        protocolUsed: 'ISO 15765-4 CAN',
      }
      setState(prev => ({ ...prev, scanResult: result, isScanning: false, scanStep: undefined }))
    } catch (err: any) {
      setState(prev => ({ ...prev, isScanning: false, scanStep: undefined, error: `Erreur scan: ${err?.message}` }))
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
      // Essaie d'abord les ports déjà autorisés (reconnexion automatique)
      const existingPorts: any[] = await (navigator as any).serial.getPorts()
      // Sans filters → affiche TOUS les ports série (USB, COM Bluetooth, etc.)
      const port = existingPorts.length > 0
        ? existingPorts[0]
        : await (navigator as any).serial.requestPort()

      // Tente plusieurs débits courants des adaptateurs ELM327
      const baudRates = [38400, 115200, 9600, 57600]
      let opened = false
      for (const baudRate of baudRates) {
        try {
          await port.open({ baudRate })
          opened = true
          break
        } catch { /* essaie le débit suivant */ }
      }
      if (!opened) throw new Error('Impossible d\'ouvrir le port (vérifie qu\'aucun autre programme ne l\'utilise)')

      serialPortRef.current = port
      serialWriterRef.current = port.writable.getWriter()
      serialReaderRef.current = port.readable.getReader()
      const send: SendFn = (cmd) =>
        serialSendCommand(serialWriterRef.current!, serialReaderRef.current!, cmd)
      await initELM327(send)
      const info = await port.getInfo?.() ?? {}
      const deviceName = info.usbVendorId ? `USB (VID:${info.usbVendorId.toString(16)})` : 'ELM327 USB'
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('usb', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: any) {
      const msg: string = err?.message ?? ''
      if (msg.includes('No port selected') || msg.includes('cancelled') || msg.includes('user')) {
        setStatus({
          status: 'error',
          error: 'Aucun port sélectionné. Branche ta valise USB, puis clique à nouveau et sélectionne le port COM dans la liste.',
        })
      } else {
        setStatus({ status: 'error', error: msg || 'Erreur connexion USB. Vérife que la valise est branchée et qu\'aucun autre logiciel ne l\'utilise.' })
      }
    }
  }, [])

  // ── Bluetooth ───────────────────────────────────────────────────────────────
  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setStatus({
        status: 'error',
        error: 'Web Bluetooth non supporté sur ce navigateur. Utilise Chrome (pas Firefox ni Safari).',
      })
      return
    }
    // Avertissement : la Web Bluetooth API ne supporte que le BLE, pas le Bluetooth classique (SPP)
    // Les valises ELM327 bon marché utilisent le Bluetooth classique → incompatibles
    setStatus({ status: 'connecting', connectionType: 'bluetooth', error: null })
    try {
      // BLE OBD adapters (ELM327 BLE) expose Nordic UART Service or custom GATT
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'ELM' },
          { namePrefix: 'OBD' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'Vgate' },
          { namePrefix: 'Konnwei' },
          { namePrefix: 'VEEPEAK' },
        ],
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb', // common OBD BLE service
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Vgate iCar Pro
        ],
      })
      const server = await device.gatt.connect()
      const deviceName = device.name ?? 'ELM327 Bluetooth'

      // Try to find writable characteristic
      let writeChar: any = null
      let notifyChar: any = null

      const serviceUUIDs = [
        '0000fff0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      ]

      for (const uuid of serviceUUIDs) {
        try {
          const service = await server.getPrimaryService(uuid)
          const chars = await service.getCharacteristics()
          for (const c of chars) {
            if (c.properties.writeWithoutResponse || c.properties.write) writeChar = c
            if (c.properties.notify) notifyChar = c
          }
          if (writeChar) break
        } catch { /* try next */ }
      }

      if (!writeChar || !notifyChar) throw new Error('Caractéristiques BLE OBD introuvables')

      let responseBuffer = ''
      const responseQueue: Array<(v: string) => void> = []

      await notifyChar.startNotifications()
      notifyChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        const chunk = new TextDecoder().decode(ev.target.value)
        responseBuffer += chunk
        if (responseBuffer.includes('>') && responseQueue.length > 0) {
          const resolve = responseQueue.shift()!
          const val = responseBuffer
          responseBuffer = ''
          resolve(val)
        }
      })

      const send: SendFn = (cmd) => {
        return new Promise((resolve) => {
          responseQueue.push(resolve)
          const encoded = new TextEncoder().encode(cmd + '\r')
          writeChar.writeValueWithoutResponse
            ? writeChar.writeValueWithoutResponse(encoded)
            : writeChar.writeValue(encoded)
          setTimeout(() => {
            if (responseQueue.includes(resolve)) {
              responseQueue.splice(responseQueue.indexOf(resolve), 1)
              resolve(responseBuffer || 'NO DATA')
              responseBuffer = ''
            }
          }, 3000)
        })
      }

      await initELM327(send)
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('bluetooth', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: any) {
      setStatus({ status: 'error', error: err?.message ?? 'Erreur connexion Bluetooth' })
    }
  }, [])

  // ── WiFi ────────────────────────────────────────────────────────────────────
  const connectWifi = useCallback(async (ip: string, port: number) => {
    setStatus({ status: 'connecting', connectionType: 'wifi', error: null })
    try {
      const ws = await createWifiSocket(ip, port)
      wsRef.current = ws
      const send: SendFn = (cmd) => wifiSendCommand(ws, cmd)
      await initELM327(send)
      const deviceName = `ELM327 WiFi (${ip})`
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('wifi', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: any) {
      setStatus({ status: 'error', error: err?.message ?? 'Erreur connexion WiFi' })
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      serialReaderRef.current?.releaseLock()
      serialWriterRef.current?.releaseLock()
      await serialPortRef.current?.close()
    } catch { /* ignore */ }
    wsRef.current?.close()
    serialPortRef.current = null
    serialWriterRef.current = null
    serialReaderRef.current = null
    wsRef.current = null
    setState(INITIAL_STATE)
  }, [])

  const rescan = useCallback(async () => {
    if (state.status !== 'connected') return
    setStatus({ scanResult: null })
    setStatus({ status: 'disconnected', error: 'Reconnecte-toi pour relancer un scan.' })
  }, [state.status])

  // ── Mode démo ─────────────────────────────────────────────────────────────────
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
        { pid: '010C', name: 'Régime moteur',              value: 820,   unit: 'tr/min', group: 'engine' },
        { pid: '010D', name: 'Vitesse',                    value: 0,     unit: 'km/h',   group: 'engine' },
        { pid: '0105', name: 'Temp. refroidissement',      value: 88,    unit: '°C',     group: 'engine' },
        { pid: '015C', name: 'Temp. huile moteur',         value: 92,    unit: '°C',     group: 'engine' },
        { pid: '0104', name: 'Charge moteur',              value: 12.5,  unit: '%',      group: 'engine' },
        { pid: '010E', name: 'Avance allumage',            value: 8.5,   unit: '°',      group: 'engine' },
        { pid: '010B', name: 'Pression admission (MAP)',   value: 34,    unit: 'kPa',    group: 'engine' },
        { pid: '0110', name: 'Débit air (MAF)',            value: 3.21,  unit: 'g/s',    group: 'engine' },
        { pid: '010F', name: 'Temp. admission',            value: 24,    unit: '°C',     group: 'engine' },
        { pid: '0146', name: 'Temp. extérieure',           value: 18,    unit: '°C',     group: 'engine' },
        { pid: '011F', name: 'Temps moteur actif',         value: 1240,  unit: 's',      group: 'engine' },
        { pid: '0106', name: 'Correction CT carburant B1', value: +14.8, unit: '%',      group: 'fuel' },  // anormal!
        { pid: '0107', name: 'Correction LT carburant B1', value: +18.0, unit: '%',      group: 'fuel' },  // très anormal!
        { pid: '012F', name: 'Niveau carburant',           value: 45,    unit: '%',      group: 'fuel' },
        { pid: '010A', name: 'Pression carburant (rail)',  value: 312,   unit: 'kPa',    group: 'fuel' },
        { pid: '0111', name: 'Position papillon',          value: 0,     unit: '%',      group: 'electric' },
        { pid: '0142', name: 'Tension batterie',           value: 13.8,  unit: 'V',      group: 'electric' },
        { pid: '0133', name: 'Pression atmosphérique',     value: 101,   unit: 'kPa',    group: 'electric' },
        { pid: '013C', name: 'Temp. catalyseur B1 S1',    value: 420,   unit: '°C',     group: 'exhaust' },
        { pid: '014D', name: 'Durée voyant MIL allumé',   value: 320,   unit: 'min',    group: 'diag' },
        { pid: '0121', name: 'Distance avec MIL allumé',  value: 87,    unit: 'km',     group: 'diag' },
        { pid: '0131', name: 'Distance depuis effacement', value: 342,   unit: 'km',     group: 'diag' },
      ],
    }
    setState({
      status: 'connected',
      connectionType: 'wifi',
      deviceName: 'Démo — données simulées',
      error: null,
      scanResult: demoResult,
      isScanning: false,
    })
  }, [])

  return {
    state,
    connectUSB,
    connectBluetooth,
    connectWifi,
    connectDemo,
    disconnect,
    rescan,
  }
}
