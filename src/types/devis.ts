export interface Vehicle {
  brand: string
  model: string
  year: number
  fuel_type?: string
}

export interface PrixMarche {
  oscaro: number | null
  yakarouler: number | null
  misterAuto: number | null
  moyenne: number
}

export interface DevisLine {
  designation: string
  quantite: number
  prixUnitaire: number
  totalTTC: number
  prixMarche: PrixMarche
  ecart: number
  verdict: 'ok' | 'eleve' | 'arnaque'
}

export interface GarageInfo {
  nom: string
  adresse?: string
  noteGoogle: number | null
  nombreAvis: number
  avisNegatifs: number
  signalements: number
}

export interface Alertes {
  graves: string[]
  moyennes: string[]
  info: string[]
}

export interface Verdict {
  note: number
  statut: 'honnete' | 'reserve' | 'arnaque'
  recommandation: string
  lignesOk: number
  lignesElevees: number
  lignesArnaques: number
}

export interface Totaux {
  totalFacture: number
  totalMarche: number
}

export interface EconomiesPotentielles {
  montant: number
  pourcentage: number
}

export interface DevisAnalysisResult {
  garage: {
    nom: string
    adresse?: string
    siret?: string
  }
  lignes: DevisLine[]
  garageInfo: GarageInfo | null
  alertes: Alertes
  verdict: Verdict
  totaux: Totaux
  economiesPotentielles: EconomiesPotentielles
  timestamp: string
  fromCache?: boolean
}

export interface DevisAnalysisCache {
  id: string
  user_id: string
  devis_hash: string
  ocr_text: string
  analysis_result: DevisAnalysisResult
  created_at: string
}
