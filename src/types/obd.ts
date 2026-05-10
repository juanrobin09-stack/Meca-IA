export type OBDConnectionType = 'wifi' | 'bluetooth' | 'usb'

export type OBDConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface OBDParameter {
  pid: string
  name: string
  value: number | string | null
  unit: string
  raw?: string
}

export interface OBDFaultCode {
  code: string
  description: string
  system: 'powertrain' | 'chassis' | 'body' | 'network'
  severity: 'low' | 'medium' | 'high'
}

export interface OBDScanResult {
  timestamp: string
  connectionType: OBDConnectionType
  deviceName?: string
  faultCodes: OBDFaultCode[]
  parameters: OBDParameter[]
  vehicleVin?: string
  protocolUsed?: string
}

export interface OBDScannerState {
  status: OBDConnectionStatus
  connectionType: OBDConnectionType | null
  deviceName: string | null
  error: string | null
  scanResult: OBDScanResult | null
  isScanning: boolean
}

// Known PIDs we read (Mode 01)
export const OBD_PIDS = {
  RPM:           { pid: '010C', name: 'Régime moteur',    unit: 'tr/min' },
  SPEED:         { pid: '010D', name: 'Vitesse',           unit: 'km/h'  },
  COOLANT_TEMP:  { pid: '0105', name: 'Temp. refroidissement', unit: '°C' },
  ENGINE_LOAD:   { pid: '0104', name: 'Charge moteur',    unit: '%'     },
  THROTTLE:      { pid: '0111', name: 'Position papillon',unit: '%'     },
  FUEL_LEVEL:    { pid: '012F', name: 'Niveau carburant', unit: '%'     },
  INTAKE_TEMP:   { pid: '010F', name: 'Temp. admission',  unit: '°C'    },
  MAF:           { pid: '0110', name: 'Débit air (MAF)',   unit: 'g/s'   },
  BATTERY:       { pid: '0142', name: 'Tension batterie', unit: 'V'     },
  RUN_TIME:      { pid: '011F', name: 'Temps moteur actif', unit: 's'   },
} as const

// DTC system prefix mapping
export const DTC_SYSTEM_MAP: Record<string, OBDFaultCode['system']> = {
  P: 'powertrain',
  C: 'chassis',
  B: 'body',
  U: 'network',
}

// Common French DTC descriptions
export const KNOWN_DTC: Record<string, string> = {
  P0100: 'Débitmètre d\'air (MAF) — Circuit défaillant',
  P0101: 'Débitmètre d\'air (MAF) — Plage/performance hors limites',
  P0110: 'Capteur température admission — Circuit défaillant',
  P0115: 'Capteur température liquide refroidissement — Circuit défaillant',
  P0120: 'Capteur position papillon (TPS) — Circuit défaillant',
  P0130: 'Sonde lambda amont — Circuit défaillant',
  P0170: 'Système carburant — Mélange trop riche ou pauvre (Banc 1)',
  P0171: 'Système carburant — Mélange trop pauvre (Banc 1)',
  P0172: 'Système carburant — Mélange trop riche (Banc 1)',
  P0200: 'Circuit injecteur — Défaut général',
  P0230: 'Pompe à carburant — Circuit défaillant',
  P0300: 'Ratés d\'allumage aléatoires détectés',
  P0301: 'Raté d\'allumage cylindre 1',
  P0302: 'Raté d\'allumage cylindre 2',
  P0303: 'Raté d\'allumage cylindre 3',
  P0304: 'Raté d\'allumage cylindre 4',
  P0335: 'Capteur position vilebrequin (CKP) — Circuit défaillant',
  P0340: 'Capteur position arbre à cames (CMP) — Circuit défaillant',
  P0400: 'Recirculation des gaz d\'échappement (EGR) — Débit insuffisant',
  P0401: 'Recirculation des gaz d\'échappement (EGR) — Débit insuffisant détecté',
  P0420: 'Catalyseur — Efficacité insuffisante (Banc 1)',
  P0440: 'Système évaporation carburant — Défaut général',
  P0441: 'Système évaporation carburant — Purge incorrecte',
  P0500: 'Capteur vitesse véhicule — Défaut',
  P0505: 'Système ralenti — Défaut',
  P0600: 'Bus de communication série — Défaut',
  P0700: 'Système de contrôle boîte de vitesses — Défaut',
  P0715: 'Capteur vitesse d\'entrée/turbine — Défaut',
  P0720: 'Capteur vitesse de sortie — Défaut',
  P0740: 'Convertisseur de couple — Défaut de verrouillage',
  P1000: 'Autodiagnostic en cours (readiness non complété)',
}
