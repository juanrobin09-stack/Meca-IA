export interface FrameAnalysis {
  timestamp: string
  observations: string[]
  anomalies: string[]
  pieces_visibles: string[]
  etat_general?: string
}

export interface AudioAnalysis {
  bruits_detectes: Array<{
    type: string
    timestamp: string
    description: string
    severite: 'faible' | 'moyen' | 'grave'
  }>
}

export interface CauseProbable {
  cause: string
  probabilite: number
  preuves: string[]
}

export interface Synthesis {
  probleme_principal: string
  pieces_concernees: string[]
  causes_probables: CauseProbable[]
  urgence: 'critique' | 'important' | 'moyen' | 'faible'
  peut_rouler: boolean
  conditions_roulage: string[]
  risques: string[]
  limitations_analyse: string[]
  recommandations: string[]
}

export interface PrixPiece {
  piece: string
  oscaro: number | null
  yakarouler: number | null
  misterAuto: number | null
  moyenne: number
}

export interface Verdict {
  diagnostic: string
  causes: CauseProbable[]
  pieces_a_remplacer: string[]
  cout_estime: {
    pieces: number
    main_oeuvre: number
    total: number
  }
  urgence: Synthesis['urgence']
  peut_rouler: boolean
  conditions_roulage: string[]
  risques: string[]
  recommandations: string[]
  rappel_constructeur: boolean
}

export interface VideoAnalysisResult {
  frames_analyses: FrameAnalysis[]
  audio_analysis: AudioAnalysis
  synthesis: Synthesis
  prix_pieces: PrixPiece[]
  rappels: {
    rappels_actifs: string[]
    bulletins_techniques: string[]
  } | null
  forums_info: {
    cas_similaires: number
    solutions_trouvees: string[]
  } | null
  verdict: Verdict
  confiance: number
  timestamp: string
  fromCache?: boolean
}

export interface VideoAnalysisCache {
  id: string
  user_id: string
  video_hash: string
  video_url?: string
  analysis_result: VideoAnalysisResult
  confidence_score: number
  created_at: string
}
