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
  // ── Moteur / Powertrain ────────────────────────────────────────────────────
  P0100: 'Débitmètre d\'air (MAF) — Circuit défaillant',
  P0101: 'Débitmètre d\'air (MAF) — Plage/performance hors limites',
  P0110: 'Capteur température admission — Circuit défaillant',
  P0115: 'Capteur température liquide refroidissement — Circuit défaillant',
  P0120: 'Capteur position papillon (TPS) — Circuit défaillant',
  P0130: 'Sonde lambda amont — Circuit défaillant',
  P0170: 'Système carburant — Mélange trop riche ou pauvre (Banc 1)',
  P0171: 'Système carburant — Mélange trop pauvre (Banc 1)',
  P0172: 'Système carburant — Mélange trop riche (Banc 1)',
  P0174: 'Système carburant — Mélange trop pauvre (Banc 2)',
  P0175: 'Système carburant — Mélange trop riche (Banc 2)',
  P0200: 'Circuit injecteur — Défaut général',
  P0230: 'Pompe à carburant — Circuit défaillant',
  P0300: 'Ratés d\'allumage aléatoires détectés',
  P0301: 'Raté d\'allumage cylindre 1',
  P0302: 'Raté d\'allumage cylindre 2',
  P0303: 'Raté d\'allumage cylindre 3',
  P0304: 'Raté d\'allumage cylindre 4',
  P0305: 'Raté d\'allumage cylindre 5',
  P0306: 'Raté d\'allumage cylindre 6',
  P0335: 'Capteur position vilebrequin (CKP) — Circuit défaillant',
  P0340: 'Capteur position arbre à cames (CMP) — Circuit défaillant',
  P0380: 'Préchauffage (bougie de préchauffage) — Circuit défaillant',
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

  // ── ABS / Frein / Châssis (C-codes) ───────────────────────────────────────
  C0020: 'ABS — Défaut général système de freinage',
  C0031: 'Capteur vitesse roue avant gauche — Circuit ouvert',
  C0032: 'Capteur vitesse roue avant gauche — Court-circuit',
  C0033: 'Capteur vitesse roue avant gauche — Signal absent',
  C0034: 'Capteur vitesse roue avant droite — Défaut circuit',
  C0035: 'Capteur vitesse roue avant droite — Circuit ouvert',
  C0036: 'Capteur vitesse roue avant droite — Court-circuit',
  C0037: 'Capteur vitesse roue avant droite — Signal absent',
  C0040: 'Capteur vitesse roue arrière droite — Défaut circuit',
  C0041: 'Capteur vitesse roue arrière droite — Signal absent',
  C0042: 'Capteur vitesse roue arrière droite — Court-circuit',
  C0045: 'Capteur vitesse roue arrière gauche — Défaut circuit',
  C0046: 'Capteur vitesse roue arrière gauche — Signal absent',
  C0047: 'Capteur vitesse roue arrière gauche — Court-circuit',
  C0051: 'Incohérence vitesses capteurs de roues',
  C0060: 'Actionneur ABS — Défaut circuit',
  C0065: 'Électrovanne ABS — Défaut',
  C0070: 'Moteur pompe ABS — Défaut circuit',
  C0071: 'Moteur pompe ABS — Sous-tension',
  C0110: 'Moteur pompe ABS — Défaillance',
  C0113: 'Capteur pression hydraulique — Défaut',
  C0121: 'Relais soupape ABS — Circuit défaillant',
  C0131: 'Capteur pression frein — Défaut',
  C0136: 'Capteur pression frein — Circuit défaillant',
  C0141: 'Solénoïde ABS côté gauche — Défaut circuit',
  C0148: 'Solénoïde ABS côté droit — Défaut circuit',
  C0161: 'Contacteur feux stop — Défaut circuit',
  C0165: 'Capteur de lacet (ESP) — Défaut circuit',
  C0186: 'Capteur accélération latérale — Défaut',
  C0187: 'Capteur accélération latérale — Signal incohérent',
  C0196: 'Capteur taux de lacet / gyroscope (ESP) — Défaut',
  C0197: 'Capteur taux de lacet — Signal incohérent',
  C0200: 'Capteur accélération longitudinale — Défaut',
  C0210: 'Capteur vitesse transmission — Défaut circuit',
  C0221: 'Capteur vitesse AV droite — Circuit ouvert',
  C0222: 'Capteur vitesse AV droite — Signal absent',
  C0223: 'Capteur vitesse AV droite — Signal erratique',
  C0225: 'Capteur vitesse AV gauche — Circuit ouvert',
  C0226: 'Capteur vitesse AV gauche — Signal absent',
  C0227: 'Capteur vitesse AV gauche — Signal erratique',
  C0229: 'Perte signal capteurs vitesse roues avant',
  C0232: 'Capteur vitesse AR droite — Défaut signal',
  C0235: 'Capteur vitesse AR gauche — Défaut signal',
  C0238: 'Écart vitesses entre roues — Valeur hors plage',
  C0240: 'Relais alimentation module ABS — Défaut',
  C0241: 'Électrovanne ABS — Défaut circuit',
  C0245: 'Fréquence capteur vitesse roue — Erreur',
  C0254: 'Électrovanne ABS — Court-circuit',
  C0265: 'Relais ABS — Défaut circuit',
  C0267: 'Moteur pompe ABS — Circuit ouvert / court-circuit',
  C0268: 'Moteur pompe ABS — Court-circuit à la masse',
  C0269: 'Temps de décharge/isolation ABS excessif',
  C0274: 'Temps de décharge ABS excessif',
  C0281: 'Contacteur pédale de frein — Défaut circuit',
  C0283: 'Contacteur pédale de frein — Signal incohérent',
  C0284: 'Module ABS/ESP — Défaut interne',
  C0285: 'Indicateur niveau liquide de frein — Défaut',
  C0286: 'Voyant ABS — Court-circuit alimentation',
  C0291: 'Perte communication avec BSI/BCM',
  C0292: 'Perte communication avec calculateur moteur (ECM)',
  C0299: 'Perte communication système stabilité (ESP)',
  C1000: 'Module de contrôle ABS — Défaillance interne',
  C1001: 'Capteur ABS — Défaut général',
  C1010: 'Solénoïde ABS avant gauche — Défaut',
  C1011: 'Solénoïde ABS avant droit — Défaut',
  C1012: 'Solénoïde ABS arrière gauche — Défaut',
  C1013: 'Solénoïde ABS arrière droit — Défaut',
  C1094: 'Moteur pompe ABS — Tension hors limites',
  C1095: 'Moteur pompe ABS — Circuit ouvert',
  C1096: 'Moteur pompe ABS — Court-circuit à la masse',
  C1100: 'Moteur pompe ABS — Défaillance',
  C1101: 'Pompe de retour ABS — Défaut',
  C1121: 'Capteur vitesse roue AV gauche — Signal faible',
  C1122: 'Capteur vitesse roue AV droite — Signal faible',
  C1123: 'Capteur vitesse roue AR gauche — Signal faible',
  C1124: 'Capteur vitesse roue AR droite — Signal faible',
  C1155: 'Capteur vitesse roue AV gauche — Absence signal',
  C1156: 'Capteur vitesse roue AV droite — Absence signal',
  C1157: 'Capteur vitesse roue AR gauche — Absence signal',
  C1158: 'Capteur vitesse roue AR droite — Absence signal',
  C1200: 'Capteur pression maître-cylindre frein — Défaut',
  C1201: 'Système ABS — Défaut moteur',
  C1210: 'Voyant ABS — Défaut',
  C1230: 'Capteur vitesse roue — Défaut général',
  C1233: 'Capteur vitesse roue AV gauche — Signal absent',
  C1234: 'Capteur vitesse roue AV droite — Signal absent',
  C1235: 'Capteur vitesse roue AR droite — Signal absent',
  C1236: 'Capteur vitesse roue AR gauche — Signal absent',
  C1237: 'Capteur vitesse roue AV gauche — Signal incohérent',
  C1238: 'Capteur vitesse roue AV droite — Signal incohérent',

  // ── Carrosserie / Body (B-codes) ──────────────────────────────────────────
  B0001: 'Airbag conducteur — Circuit défaillant',
  B0002: 'Airbag passager — Circuit défaillant',
  B0010: 'Airbag rideaux gauche — Défaut',
  B0011: 'Airbag rideaux droit — Défaut',
  B0020: 'Prétensionneur ceinture conducteur — Défaut',
  B0021: 'Prétensionneur ceinture passager — Défaut',
  B0051: 'Module airbag — Défaut interne',
  B1000: 'Module BSI/BCM — Défaut général',
  B1001: 'Module climatisation — Défaut',

  // ── Réseau / Network (U-codes) ────────────────────────────────────────────
  U0001: 'Bus CAN haute vitesse — Défaut communication',
  U0010: 'Bus CAN moyenne vitesse — Défaut communication',
  U0100: 'Perte communication calculateur moteur (ECM/PCM)',
  U0101: 'Perte communication calculateur boîte de vitesses (TCM)',
  U0121: 'Perte communication module ABS/ESP',
  U0122: 'Perte communication module stabilité (VDC/ESP)',
  U0140: 'Perte communication BSI/BCM',
  U0155: 'Perte communication tableau de bord (cluster)',
  U0401: 'Données invalides reçues du calculateur moteur',
}
