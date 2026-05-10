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
  if (!bytes || bytes.toUpperCase() === 'NODATA' || bytes.toUpperCase() === 'ERROR') return null

  const hex = bytes.replace(/^(41|43)[0-9A-Fa-f]{2}/, '') // strip mode+pid echo
  const A = parseInt(hex.substring(0, 2), 16)
  const B = parseInt(hex.substring(2, 4), 16)

  switch (pid) {
    case '010C': return ((A * 256 + B) / 4)           // RPM
    case '010D': return A                               // Speed km/h
    case '0105': return A - 40                         // Coolant °C
    case '0104': return Math.round((A * 100) / 255)   // Engine load %
    case '0111': return Math.round((A * 100) / 255)   // Throttle %
    case '012F': return Math.round((A * 100) / 255)   // Fuel level %
    case '010F': return A - 40                         // Intake temp °C
    case '0110': return ((A * 256 + B) / 100)         // MAF g/s
    case '0142': return ((A * 256 + B) / 1000)        // Battery V
    case '011F': return (A * 256 + B)                  // Run time s
    default: return A
  }
}

function parseDTCResponse(raw: string): OBDFaultCode[] {
  const codes: OBDFaultCode[] = []
  const cleaned = raw.trim().replace(/\r/g, '\n').split('\n').join('')
  // Mode 03 response: 43 XX YY ZZ ... (pairs of bytes = one code each)
  const match = cleaned.match(/43([0-9A-Fa-f]{2,})/g)
  if (!match) return codes

  for (const block of match) {
    const data = block.substring(2) // strip "43"
    for (let i = 0; i < data.length - 3; i += 4) {
      const word = parseInt(data.substring(i, i + 4), 16)
      if (word === 0) continue
      const systemBits = (word >> 14) & 0x03
      const prefixes = ['P', 'P', 'C', 'B']
      const prefix = prefixes[systemBits] ?? 'U'
      const number = (word & 0x3FFF).toString(10).padStart(4, '0')
      const code = `${prefix}${number}`
      const system = DTC_SYSTEM_MAP[prefix] ?? 'powertrain'
      const description = KNOWN_DTC[code] ?? `Code inconnu — ${code}`
      const severity: OBDFaultCode['severity'] =
        prefix === 'P' && parseInt(number) >= 300 && parseInt(number) <= 399 ? 'high'
        : prefix === 'P' ? 'medium'
        : 'low'
      codes.push({ code, description, system, severity })
    }
  }
  return codes
}

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

async function readDTCs(send: SendFn): Promise<OBDFaultCode[]> {
  const raw = await send('03')
  return parseDTCResponse(raw)
}

async function readParameters(send: SendFn): Promise<OBDParameter[]> {
  const results: OBDParameter[] = []
  for (const [, meta] of Object.entries(OBD_PIDS)) {
    const raw = await send(meta.pid.substring(2)) // strip "01" prefix → just PID hex
    const value = parsePidValue(meta.pid, raw)
    results.push({ pid: meta.pid, name: meta.name, value, unit: meta.unit, raw })
  }
  return results
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOBDScanner() {
  const [state, setState] = useState<OBDScannerState>(INITIAL_STATE)
  const serialPortRef = useRef<SerialPort | null>(null)
  const serialWriterRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)
  const serialReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const setStatus = (patch: Partial<OBDScannerState>) =>
    setState((s) => ({ ...s, ...patch }))

  // ── USB / Serial ────────────────────────────────────────────────────────────
  const connectUSB = useCallback(async () => {
    if (!('serial' in navigator)) {
      setStatus({ status: 'error', error: 'Web Serial API non supporté. Utilise Chrome ou Edge.' })
      return
    }
    setStatus({ status: 'connecting', connectionType: 'usb', error: null })
    try {
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 38400 })
      serialPortRef.current = port
      serialWriterRef.current = port.writable.getWriter()
      serialReaderRef.current = port.readable.getReader()
      const send: SendFn = (cmd) =>
        serialSendCommand(serialWriterRef.current!, serialReaderRef.current!, cmd)
      await initELM327(send)
      setStatus({ status: 'connected', deviceName: 'ELM327 USB' })
      await runScan('usb', 'ELM327 USB', send)
    } catch (err: any) {
      setStatus({ status: 'error', error: err?.message ?? 'Erreur connexion USB' })
    }
  }, [])

  // ── Bluetooth ───────────────────────────────────────────────────────────────
  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setStatus({ status: 'error', error: 'Web Bluetooth non supporté. Utilise Chrome sur Android/Desktop.' })
      return
    }
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
      setStatus({ status: 'connected', deviceName })
      await runScan('bluetooth', deviceName, send)
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
      setStatus({ status: 'connected', deviceName })
      await runScan('wifi', deviceName, send)
    } catch (err: any) {
      setStatus({ status: 'error', error: err?.message ?? 'Erreur connexion WiFi' })
    }
  }, [])

  // ── Common scan runner ──────────────────────────────────────────────────────
  async function runScan(type: OBDConnectionType, deviceName: string, send: SendFn) {
    setStatus({ isScanning: true })
    try {
      const [faultCodes, parameters] = await Promise.all([
        readDTCs(send),
        readParameters(send),
      ])
      const result: OBDScanResult = {
        timestamp: new Date().toISOString(),
        connectionType: type,
        deviceName,
        faultCodes,
        parameters,
        protocolUsed: 'ISO 15765-4 CAN',
      }
      setStatus({ scanResult: result, isScanning: false })
    } catch (err: any) {
      setStatus({ isScanning: false, error: `Erreur scan: ${err?.message}` })
    }
  }

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
    // Re-use existing connection for a new scan
    setStatus({ scanResult: null })
    // We can't re-run easily without the send function — user should reconnect
    setStatus({ status: 'disconnected', error: 'Reconnecte-toi pour relancer un scan.' })
  }, [state.status])

  return {
    state,
    connectUSB,
    connectBluetooth,
    connectWifi,
    disconnect,
    rescan,
  }
}
