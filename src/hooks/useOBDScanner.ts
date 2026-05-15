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

  // Find the mode-01 echo "41XX" ANYWHERE in the response (handles leftover
  // command echo, frame prefixes, SEARCHING... etc). Match the exact PID byte.
  const pidByte = pid.substring(2) // "0C" for "010C"
  const re = new RegExp(`41${pidByte}([0-9A-F]+)`)
  const match = cleaned.match(re)
  if (!match) return null

  const dataHex = match[1]
  if (dataHex.length < 2) return null
  const A = parseInt(dataHex.substring(0, 2), 16)
  const B = dataHex.length >= 4 ? parseInt(dataHex.substring(2, 4), 16) : 0
  const C = dataHex.length >= 6 ? parseInt(dataHex.substring(4, 6), 16) : 0
  const D = dataHex.length >= 8 ? parseInt(dataHex.substring(6, 8), 16) : 0

  switch (pid) {
    // ── Moteur ──────────────────────────────────────────────────────────────
    case '010C': return Math.round((A * 256 + B) / 4)             // RPM
    case '010D': return A                                          // Vitesse
    case '0104': return Math.round(A * 100 / 255)                  // Charge
    case '0143': return Math.round((A * 256 + B) * 100 / 65535)    // Charge absolue
    case '0105': return A - 40                                     // LDR temp
    case '015C': return A - 40                                     // Huile temp
    case '010F': return A - 40                                     // Admission temp
    case '0146': return A - 40                                     // Ambiant temp
    case '010E': return +(A / 2 - 64).toFixed(1)                   // Avance allumage
    case '010B': return A                                          // MAP
    case '0110': return +((A * 256 + B) / 100).toFixed(2)          // MAF
    case '011F': return A * 256 + B                                // Temps moteur actif
    case '0145': return Math.round(A * 100 / 255)                  // Throttle relative
    case '0147': return Math.round(A * 100 / 255)                  // Throttle B
    case '0149': return Math.round(A * 100 / 255)                  // Accel pedal D
    case '014A': return Math.round(A * 100 / 255)                  // Accel pedal E
    case '014C': return Math.round(A * 100 / 255)                  // Commanded throttle
    case '0161': return A - 125                                    // Driver demand torque %
    case '0162': return A - 125                                    // Actual engine torque %
    case '0163': return A * 256 + B                                // Reference torque Nm
    case '0164': return A - 125                                    // Engine % torque

    // ── Carburant ───────────────────────────────────────────────────────────
    case '0106': return +((A - 128) * 100 / 128).toFixed(1)        // STFT B1
    case '0107': return +((A - 128) * 100 / 128).toFixed(1)        // LTFT B1
    case '0108': return +((A - 128) * 100 / 128).toFixed(1)        // STFT B2
    case '0109': return +((A - 128) * 100 / 128).toFixed(1)        // LTFT B2
    case '010A': return A * 3                                      // Fuel pressure
    case '0123': return (A * 256 + B) * 10                         // Rail abs pressure (kPa)
    case '012F': return Math.round(A * 100 / 255)                  // Fuel level
    case '015E': return +((A * 256 + B) / 20).toFixed(1)           // Fuel rate
    case '0151': return A                                          // Fuel type (code)
    case '0152': return +((A * 100) / 255).toFixed(1)              // Ethanol %
    case '0144': return +(((A * 256 + B) / 32768)).toFixed(3)      // Eq ratio
    case '0103': return A                                          // Fuel system status (code)

    // ── Turbo ───────────────────────────────────────────────────────────────
    case '0170': return A * 256 + B                                // Boost (manuf-spec)
    case '0172': return A * 256 + B                                // Boost commanded
    case '0174': return A - 40                                     // Turbo inlet temp
    case '0175': return A - 40                                     // Turbo outlet temp
    case '0176': return A * 256 + B                                // Turbo RPM
    case '0177': return A - 40                                     // Charge air temp

    // ── Électrique ──────────────────────────────────────────────────────────
    case '0111': return Math.round(A * 100 / 255)                  // Throttle
    case '0142': return +((A * 256 + B) / 1000).toFixed(2)         // Battery 12V
    case '0133': return A                                          // Baro

    // ── Échappement / Émissions ─────────────────────────────────────────────
    case '0114': return +(A / 200).toFixed(3)                      // O2 voltage B1S1
    case '0115': return +(A / 200).toFixed(3)                      // O2 voltage B1S2
    case '0118': return +(A / 200).toFixed(3)                      // O2 voltage B2S1
    case '0119': return +(A / 200).toFixed(3)                      // O2 voltage B2S2
    case '0134': return +(((A * 256 + B) / 32768)).toFixed(3)      // Wide-band lambda
    case '013C': return +((A * 256 + B) / 10 - 40).toFixed(0)      // Catalyst temp B1
    case '013D': return +((A * 256 + B) / 10 - 40).toFixed(0)      // Catalyst temp B2
    case '012C': return Math.round(A * 100 / 255)                  // Commanded EGR
    case '012D': return +((A - 128) * 100 / 128).toFixed(1)        // EGR error
    case '012E': return Math.round(A * 100 / 255)                  // Commanded purge
    case '0132': return Math.round(((A * 256 + B) / 4) - 8192)     // EVAP pressure (Pa)
    case '017C': return A * 256 + B - 40                           // DPF inlet temp
    case '017A': return +((A * 256 + B) / 100).toFixed(2)          // DPF differential
    case '0183': return A * 256 + B                                // NOx pre-SCR
    case '019B': return Math.round(A * 100 / 255)                  // AdBlue level

    // ── Hybride ─────────────────────────────────────────────────────────────
    case '015B': return Math.round(A * 100 / 255)                  // HV battery remaining

    // ── Diagnostic ──────────────────────────────────────────────────────────
    case '014D': return A * 256 + B                                // MIL time
    case '0121': return A * 256 + B                                // Distance MIL
    case '0131': return A * 256 + B                                // Distance since clear
    case '0130': return A                                          // Warmups since clear
    case '014E': return A * 256 + B                                // Time since clear

    default:
      // Multi-byte values that we don't have a formula for: return raw uint32
      if (dataHex.length >= 8) return (A << 24) | (B << 16) | (C << 8) | D
      if (dataHex.length >= 4) return A * 256 + B
      return A
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

// Couverture complète : 50+ adresses CAN 11-bit couvrant tous les calculateurs
// embarqués sur les véhicules modernes (essence/diesel/hybride/EV) toutes marques.
const ALL_ECU_MODULES = [
  // ── Powertrain (7E0-7E7) ─────────────────────────────────────────────────────
  { addr: '7E1', label: 'Boîte de vitesses (TCM)' },
  { addr: '7E2', label: 'Unité hybride / Inverter' },
  { addr: '7E3', label: 'Calculateur batterie HV (hybride/EV)' },
  { addr: '7E4', label: 'Moteur électrique / Inverter (EV)' },
  { addr: '7E5', label: 'Chargeur embarqué (EV)' },
  { addr: '7E6', label: 'DC-DC / Auxiliaire' },
  { addr: '7E7', label: 'Module auxiliaire 2' },

  // ── ABS / ESP / Freinage ─────────────────────────────────────────────────────
  { addr: '7B3', label: 'ABS/ESP' },
  { addr: '760', label: 'ABS (Renault/PSA)' },
  { addr: '7A0', label: 'ESP (PSA/Stellantis)' },
  { addr: '7B0', label: 'ABS (Ford/Opel)' },
  { addr: '713', label: 'ABS (Opel/GM)' },
  { addr: '7A4', label: 'ABS (Stellantis 2)' },
  { addr: '740', label: 'ABS (Toyota/Lexus)' },
  { addr: '7B5', label: 'ESP (VW/Audi)' },
  { addr: '741', label: 'ABS (Honda)' },
  { addr: '736', label: 'ABS (Hyundai/Kia)' },
  { addr: '7C5', label: 'Frein de stationnement électrique' },

  // ── Direction assistée (EPS) ─────────────────────────────────────────────────
  { addr: '772', label: 'EPS direction assistée' },
  { addr: '7A5', label: 'EPS variante' },
  { addr: '730', label: 'EPS (Toyota/Honda)' },
  { addr: '742', label: 'Capteur angle de volant' },

  // ── Airbag / SRS / sécurité ──────────────────────────────────────────────────
  { addr: '7B8', label: 'Airbag/SRS' },
  { addr: '752', label: 'SRS (Renault/PSA)' },
  { addr: '758', label: 'Airbag (Toyota)' },
  { addr: '731', label: 'Airbag (Hyundai/Kia)' },
  { addr: '7BC', label: 'Module collision (frontal)' },

  // ── Carrosserie / Confort (BSI/BCM) ──────────────────────────────────────────
  { addr: '764', label: 'BSI/BCM (Renault/PSA)' },
  { addr: '7A7', label: 'BCM générique' },
  { addr: '744', label: 'Body Computer (Stellantis)' },
  { addr: '720', label: 'BCM (Toyota)' },
  { addr: '770', label: 'Module confort (verrouillage, vitres)' },
  { addr: '745', label: 'Module confort variante' },

  // ── Climatisation ────────────────────────────────────────────────────────────
  { addr: '7A6', label: 'Climatisation' },
  { addr: '769', label: 'Clim variante' },
  { addr: '7C4', label: 'Clim (Toyota/Lexus)' },

  // ── Tableau de bord / Combiné instrument ─────────────────────────────────────
  { addr: '743', label: 'Tableau de bord (cluster)' },
  { addr: '7C0', label: 'Combiné instrument variante' },
  { addr: '746', label: 'Cluster Stellantis' },

  // ── ADAS / Aides à la conduite ───────────────────────────────────────────────
  { addr: '754', label: 'Aide au stationnement' },
  { addr: '776', label: 'Capteurs recul' },
  { addr: '757', label: 'Régulateur adaptatif (radar)' },
  { addr: '778', label: 'Caméra frontale' },
  { addr: '779', label: 'Assistant maintien voie' },
  { addr: '7C8', label: 'Détection angle mort' },

  // ── TPMS / Pression pneus ────────────────────────────────────────────────────
  { addr: '775', label: 'TPMS pression pneus' },
  { addr: '7B9', label: 'TPMS variante' },

  // ── Gateway / Réseau ─────────────────────────────────────────────────────────
  { addr: '710', label: 'Passerelle CAN (gateway)' },
  { addr: '711', label: 'Gateway variante' },

  // ── Multimédia / Télématique ─────────────────────────────────────────────────
  { addr: '7BC', label: 'Télématique / eCall' },
  { addr: '714', label: 'Module radio/audio' },

  // ── Suspension / Châssis actif ───────────────────────────────────────────────
  { addr: '76A', label: 'Suspension active/pilotée' },

  // ── Éclairage / Phares ───────────────────────────────────────────────────────
  { addr: '7A3', label: 'Phares adaptatifs/AFS' },
  { addr: '715', label: 'Module éclairage extérieur' },

  // ── Spécifique diesel ────────────────────────────────────────────────────────
  { addr: '74B', label: 'Préchauffage bougies (diesel)' },
  { addr: '7C3', label: 'AdBlue / SCR (diesel)' },

  // ── Hayon / portes électriques ───────────────────────────────────────────────
  { addr: '732', label: 'Hayon électrique' },
  { addr: '774', label: 'Module portes' },
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

  // CRITICAL: only ONE reader.read() can be in flight at a time. Calling read()
  // again before the previous resolves queues a second read that consumes the
  // NEXT chunk — meanwhile the first read's chunk is orphaned by Promise.race
  // and effectively lost. So we race a single read against the remaining time.
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break

    const readPromise = reader.read() as Promise<ReadableStreamReadResult<Uint8Array>>
    let timerId: ReturnType<typeof setTimeout> | undefined
    const timedOut = await Promise.race([
      readPromise.then(() => false),
      new Promise<boolean>((res) => { timerId = setTimeout(() => res(true), remaining) }),
    ])
    if (timerId) clearTimeout(timerId)
    if (timedOut) break

    const { value, done } = await readPromise
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
    let settled = false
    const finish = (val: string) => {
      if (settled) return
      settled = true
      clearTimeout(tid)
      ws.removeEventListener('message', handler)
      resolve(val)
    }
    const tid = setTimeout(() => finish(result), timeoutMs)
    const handler = (ev: MessageEvent) => {
      const chunk = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer)
      result += chunk
      if (result.includes('>')) finish(result)
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
    /^[6-9A-B]$/.test(p.trim())  // ATDPN codes: 6=CAN 11/500, 7=CAN 29/500, 8=CAN 11/250, 9=CAN 29/250
  )
}

// Returns true if the protocol uses 29-bit CAN addressing (ATSP7 or ATSP9)
function isCAN29Bit(protocol: string): boolean {
  const p = protocol.toUpperCase()
  return (
    p.includes('29BIT') ||
    p.includes('29 BIT') ||
    p.includes('29-BIT') ||
    p === '7' || p === '9'
  )
}

// Returns the OBD-II functional broadcast address for the given CAN protocol
function broadcastAddr(protocol: string): string {
  // 29-bit CAN uses 18DB33F1 (ISO 15765-4 functional addressing)
  // 11-bit CAN uses 7DF
  return isCAN29Bit(protocol) ? '18DB33F1' : '7DF'
}

// ─── ELM327 init ─────────────────────────────────────────────────────────────

async function initELM327(send: SendFn): Promise<void> {
  // ATZ already done by pingELM327 caller — reset state then configure
  await send('ATE0', 1500)  // Echo off
  await send('ATL0', 1000)  // Linefeeds off
  await send('ATS0', 1000)  // Spaces off
  await send('ATH0', 1000)  // Headers off
  await send('ATAL', 1000)  // Allow Long messages (multi-frame DTCs)
  await send('ATSP0', 1000) // Auto protocol — detect on first OBD command
  // ATST 4B = 0x4B = 75 × 4ms = 300ms per ELM327 internal protocol attempt
  await send('ATST 4B', 1000)
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
  const broadcast = broadcastAddr(protocol) // "7DF" or "18DB33F1"

  function addUnique(codes: OBDFaultCode[]) {
    for (const c of codes) {
      const key = c.code + (c.module ?? '') + (c.pending ? '_p' : '')
      if (!seen.has(key)) { seen.add(key); all.push(c) }
    }
  }

  // Set functional broadcast address for CAN (7DF for 11-bit, 18DB33F1 for 29-bit)
  if (canMode) {
    try { await send(`AT SH ${broadcast}`, 1000) } catch { /* ignore */ }
  }

  // Mode 03 — confirmed DTCs (ECM + all ECUs that respond to broadcast)
  onStep?.('Lecture codes défauts moteur…')
  try { addUnique(parseDTCResponse(await send('03', 2500))) } catch { /* ECU busy */ }

  // Mode 07 — pending DTCs
  onStep?.('Codes en attente…')
  try {
    const pending = parseDTCResponse(await send('07', 2000)).map(c => ({ ...c, pending: true as const }))
    addUnique(pending)
  } catch { /* not all ECUs support mode 07 */ }

  // Mode 0A — permanent DTCs (won't clear on reset)
  onStep?.('Codes permanents…')
  try { addUnique(parseDTCResponse(await send('0A', 2000))) } catch { /* not all ECUs support 0A */ }

  // Multi-module CAN scan — only on CAN vehicles, 11-bit addressing
  // (29-bit per-module scan would need different addresses — skip to avoid errors)
  if (canMode && !isCAN29Bit(protocol)) {
    // Short ELM327 internal timeout for fast NO DATA from silent modules
    // ATST 32 = 0x32 = 50 × 4ms = 200ms per module attempt
    try { await send('ATST 32', 800) } catch { /* clone may not support */ }

    for (const mod of ALL_ECU_MODULES) {
      try {
        onStep?.(`Scan ${mod.label}…`)
        await send(`AT SH ${mod.addr}`, 600)
        const raw = await send('03', 800) // 800ms outer per module
        if (isOBDError(raw) || !raw) continue
        const codes = parseDTCResponse(raw).map(c => ({ ...c, module: mod.label }))
        addUnique(codes)
      } catch { /* module absent */ }
    }

    // Restore default timeout and broadcast address
    try { await send('ATST C8', 800) } catch { /* ignore */ }
    try { await send(`AT SH ${broadcast}`, 800) } catch { /* ignore */ }
  }

  return all
}

// ─── VIN reader ───────────────────────────────────────────────────────────────

async function readVIN(send: SendFn): Promise<string | null> {
  try {
    // VIN is multi-frame on CAN — give it 4s to fully transfer all chunks
    const raw = await send('0902', 4000)
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

    // CRITICAL: clean up any leftover state from a previous failed attempt.
    // Without this, the port stays opened and port.open() fails with
    // 'Port is already open' on retry.
    try { serialReaderRef.current?.releaseLock() } catch { /* ignore */ }
    try { serialWriterRef.current?.releaseLock() } catch { /* ignore */ }
    try { await serialPortRef.current?.close() } catch { /* ignore */ }
    serialPortRef.current = null
    serialWriterRef.current = null
    serialReaderRef.current = null

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingPorts: any[] = await (navigator as any).serial.getPorts()
      const port = existingPorts.length > 0
        ? existingPorts[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : await (navigator as any).serial.requestPort()

      // Force-close in case it was left open by a previous session
      try { await port.close() } catch { /* not open, fine */ }

      // Try standard baud rates in order. We pick the FIRST one where port.open
      // succeeds — no strict ATZ validation (was too strict, rejecting valid
      // adapters with non-standard banners). If the baud rate is wrong, the
      // probeVehicleECU step will catch it with a meaningful error.
      const baudRates = [38400, 9600, 115200, 57600]
      let openedBaud = 0
      for (const baudRate of baudRates) {
        try {
          await port.open({ baudRate })
          openedBaud = baudRate
          break
        } catch { /* try next */ }
      }
      if (!openedBaud) {
        throw new Error(
          'Impossible d\'ouvrir le port COM. Vérifie qu\'aucun autre logiciel ne l\'utilise ' +
          '(ferme Torque, OBD Auto Doctor, OBDLink…), puis débranche/rebranche la valise.'
        )
      }

      // Brief warmup so USB-Serial chip stabilizes after enumeration
      await new Promise(r => setTimeout(r, 200))

      serialPortRef.current = port
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serialWriterRef.current = (port as any).writable.getWriter()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serialReaderRef.current = (port as any).readable.getReader()
      const send: SendFn = (cmd, timeoutMs?) =>
        serialSendCommand(serialWriterRef.current!, serialReaderRef.current!, cmd, timeoutMs)

      // Configure ELM327 (includes ATZ reset). If the adapter is unreachable
      // we'll find out at the probe step with a useful error.
      await initELM327(send)

      const info = await port.getInfo?.() ?? {}
      const deviceName = info.usbVendorId
        ? `ELM327 USB (${openedBaud} baud, VID:${info.usbVendorId.toString(16)})`
        : `ELM327 USB (${openedBaud} baud)`
      setStatus({ status: 'connected', deviceName, isScanning: true })
      await runScan('usb', deviceName, send, step => setState(prev => ({ ...prev, scanStep: step })))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('No port selected') || msg.includes('cancelled') || msg.includes('user')) {
        setStatus({ status: 'error', error: 'Aucun port sélectionné. Branche ta valise USB puis clique à nouveau et choisis le port COM.' })
      } else {
        setStatus({ status: 'error', error: msg || 'Erreur connexion USB. Vérifie que la valise est branchée.' })
      }
    }
  }, [])

  // ── Bluetooth (BLE only) ────────────────────────────────────────────────────
  // IMPORTANT: Web Bluetooth ne supporte QUE le BLE. Les ELM327 bon marché
  // utilisent Bluetooth Classic (SPP) → IMPOSSIBLE depuis un navigateur.
  // Pour Bluetooth Classic: appairer la valise dans Windows, puis utiliser
  // le port COM virtuel via le bouton USB.
  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setStatus({
        status: 'error',
        error: 'Web Bluetooth non supporté. Utilise Chrome ou Edge sur PC/Android. ' +
               'Sur iPhone, le navigateur ne supporte pas Bluetooth — utilise USB.',
      })
      return
    }
    setStatus({ status: 'connecting', connectionType: 'bluetooth', error: null })
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'ELM' }, { namePrefix: 'OBD' }, { namePrefix: 'OBDII' },
          { namePrefix: 'Vgate' }, { namePrefix: 'Konnwei' }, { namePrefix: 'VEEPEAK' },
          { namePrefix: 'iCar' }, { namePrefix: 'BAFX' }, { namePrefix: 'Carista' },
          { namePrefix: 'OBDLink' }, { namePrefix: 'BlueDriver' }, { namePrefix: 'Topdon' },
        ],
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',  // Common OBD BLE
          '00001101-0000-1000-8000-00805f9b34fb',  // SPP (won't work in browser but listed)
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',  // Vgate iCar Pro
          '0000ffe0-0000-1000-8000-00805f9b34fb',  // Generic UART BLE
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',  // Nordic UART Service
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

      if (!writeChar || !notifyChar) {
        throw new Error(
          'Caractéristiques BLE OBD introuvables. Ta valise utilise probablement Bluetooth Classic (SPP) ' +
          'qui n\'est PAS supporté par les navigateurs. Solution : appaire la valise dans Windows ' +
          '(Paramètres > Bluetooth), elle apparaîtra comme port COM virtuel — utilise alors le bouton USB ici.'
        )
      }

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
          if (writeChar.writeValueWithoutResponse) {
            writeChar.writeValueWithoutResponse(encoded)
          } else {
            writeChar.writeValue(encoded)
          }
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
