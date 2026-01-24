/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRICE MATCHER - Matching intelligent de pieces avec la base de prix
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Ce module permet de faire correspondre les designations de pieces d'un devis
 * avec les prix de reference de la base de donnees.
 *
 * OBJECTIF: Rendre les estimations de prix DETERMINISTES (pas de variation)
 *
 * @version 1.0
 * @date 2026-01-24
 */

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE PRIX DE RÉFÉRENCE JANVIER 2026 - INLINE POUR SERVERLESS
// Source: Moyennes Oscaro, Yakarouler, AutoDoc, Mister-Auto (janvier 2026)
// ═══════════════════════════════════════════════════════════════════════════════

const prixReference = {
  meta: {
    version: "1.0",
    date: "2026-01-24",
    sources: ["Oscaro", "Yakarouler", "AutoDoc", "Piecesanspermis", "Mister-Auto"],
    notes: "Prix moyennes janvier 2026 - DETERMINISTE"
  },

  pieces: {
    aixam: {
      "pare-choc-arriere": {
        adaptable: { min: 50, max: 165, avg: 107, confidence: "high" },
        origine: { min: 200, max: 350, avg: 275, confidence: "medium" }
      },
      "pare-choc-avant": {
        adaptable: { min: 50, max: 159, avg: 104, confidence: "high" },
        origine: { min: 200, max: 350, avg: 275, confidence: "medium" }
      },
      "custode-droite": {
        adaptable: { min: 150, max: 200, avg: 175, confidence: "high" },
        origine: { min: 280, max: 350, avg: 315, confidence: "medium" }
      },
      "custode-gauche": {
        adaptable: { min: 150, max: 200, avg: 175, confidence: "high" },
        origine: { min: 280, max: 350, avg: 315, confidence: "medium" }
      },
      "aile-avant": {
        adaptable: { min: 80, max: 139, avg: 109, confidence: "high" }
      },
      "aile-arriere": {
        adaptable: { min: 100, max: 180, avg: 140, confidence: "medium" }
      },
      capot: {
        adaptable: { min: 100, max: 180, avg: 140, confidence: "medium" },
        origine: { min: 250, max: 400, avg: 325, confidence: "medium" }
      },
      porte: {
        adaptable: { min: 150, max: 250, avg: 200, confidence: "medium" },
        origine: { min: 350, max: 500, avg: 425, confidence: "medium" }
      },
      hayon: {
        adaptable: { min: 200, max: 350, avg: 275, confidence: "medium" },
        origine: { min: 400, max: 600, avg: 500, confidence: "medium" }
      },
      retroviseur: {
        adaptable: { min: 40, max: 80, avg: 60, confidence: "high" },
        origine: { min: 100, max: 180, avg: 140, confidence: "medium" }
      },
      phare: {
        adaptable: { min: 80, max: 150, avg: 115, confidence: "high" },
        origine: { min: 180, max: 300, avg: 240, confidence: "medium" }
      },
      "feu-arriere": {
        adaptable: { min: 50, max: 100, avg: 75, confidence: "high" },
        origine: { min: 120, max: 200, avg: 160, confidence: "medium" }
      },
      "pare-brise": {
        adaptable: { min: 180, max: 280, avg: 230, confidence: "medium" },
        origine: { min: 300, max: 450, avg: 375, confidence: "medium" }
      },
      "lunette-arriere": {
        adaptable: { min: 120, max: 200, avg: 160, confidence: "medium" }
      },
      variateur: {
        standard: { min: 300, max: 700, avg: 500, confidence: "high" }
      },
      courroie: {
        standard: { min: 80, max: 200, avg: 140, confidence: "high" }
      }
    },

    ligier: {
      "pare-choc-arriere": {
        adaptable: { min: 60, max: 180, avg: 120, confidence: "high" },
        origine: { min: 220, max: 380, avg: 300, confidence: "medium" }
      },
      "pare-choc-avant": {
        adaptable: { min: 60, max: 170, avg: 115, confidence: "high" },
        origine: { min: 220, max: 380, avg: 300, confidence: "medium" }
      },
      "aile-avant": {
        adaptable: { min: 90, max: 150, avg: 120, confidence: "high" }
      },
      capot: {
        adaptable: { min: 120, max: 200, avg: 160, confidence: "medium" }
      },
      porte: {
        adaptable: { min: 160, max: 280, avg: 220, confidence: "medium" }
      },
      phare: {
        adaptable: { min: 90, max: 170, avg: 130, confidence: "high" }
      },
      "feu-arriere": {
        adaptable: { min: 55, max: 110, avg: 82, confidence: "high" }
      }
    },

    microcar: {
      "pare-choc-arriere": {
        adaptable: { min: 55, max: 170, avg: 112, confidence: "high" },
        origine: { min: 210, max: 360, avg: 285, confidence: "medium" }
      },
      "pare-choc-avant": {
        adaptable: { min: 55, max: 165, avg: 110, confidence: "high" },
        origine: { min: 210, max: 360, avg: 285, confidence: "medium" }
      },
      "aile-avant": {
        adaptable: { min: 85, max: 145, avg: 115, confidence: "high" }
      },
      capot: {
        adaptable: { min: 110, max: 190, avg: 150, confidence: "medium" }
      },
      porte: {
        adaptable: { min: 155, max: 270, avg: 212, confidence: "medium" }
      },
      phare: {
        adaptable: { min: 85, max: 160, avg: 122, confidence: "high" }
      },
      "feu-arriere": {
        adaptable: { min: 50, max: 105, avg: 77, confidence: "high" }
      }
    },

    "generic-vsp": {
      "pare-choc-avant": {
        adaptable: { min: 50, max: 180, avg: 115, confidence: "high" },
        origine: { min: 200, max: 380, avg: 290, confidence: "medium" }
      },
      "pare-choc-arriere": {
        adaptable: { min: 50, max: 165, avg: 107, confidence: "high" },
        origine: { min: 200, max: 350, avg: 275, confidence: "medium" }
      },
      aile: {
        adaptable: { min: 80, max: 150, avg: 115, confidence: "high" }
      },
      capot: {
        adaptable: { min: 100, max: 200, avg: 150, confidence: "medium" }
      },
      porte: {
        adaptable: { min: 150, max: 280, avg: 215, confidence: "medium" }
      },
      phare: {
        adaptable: { min: 80, max: 170, avg: 125, confidence: "high" },
        origine: { min: 180, max: 300, avg: 240, confidence: "medium" }
      },
      "feu-arriere": {
        adaptable: { min: 50, max: 110, avg: 80, confidence: "high" },
        origine: { min: 120, max: 200, avg: 160, confidence: "medium" }
      },
      "pare-brise": {
        standard: { min: 180, max: 300, avg: 240, confidence: "medium" }
      },
      variateur: {
        standard: { min: 300, max: 700, avg: 500, confidence: "high" }
      },
      courroie: {
        standard: { min: 80, max: 200, avg: 140, confidence: "high" }
      }
    },

    "generic-auto": {
      "pare-choc-avant": {
        adaptable: { min: 120, max: 280, avg: 200, confidence: "high" },
        origine: { min: 350, max: 600, avg: 475, confidence: "medium" }
      },
      "pare-choc-arriere": {
        adaptable: { min: 100, max: 250, avg: 175, confidence: "high" },
        origine: { min: 300, max: 550, avg: 425, confidence: "medium" }
      },
      "aile-avant": {
        adaptable: { min: 80, max: 200, avg: 140, confidence: "high" },
        origine: { min: 200, max: 400, avg: 300, confidence: "medium" }
      },
      "aile-arriere": {
        adaptable: { min: 150, max: 350, avg: 250, confidence: "medium" }
      },
      capot: {
        adaptable: { min: 200, max: 500, avg: 350, confidence: "medium" },
        origine: { min: 450, max: 900, avg: 675, confidence: "medium" }
      },
      porte: {
        adaptable: { min: 250, max: 600, avg: 425, confidence: "medium" },
        origine: { min: 500, max: 1000, avg: 750, confidence: "medium" }
      },
      hayon: {
        adaptable: { min: 300, max: 700, avg: 500, confidence: "medium" },
        origine: { min: 600, max: 1200, avg: 900, confidence: "medium" }
      },
      toit: {
        adaptable: { min: 400, max: 1000, avg: 700, confidence: "low" }
      },
      retroviseur: {
        adaptable: { min: 60, max: 180, avg: 120, confidence: "high" },
        origine: { min: 150, max: 350, avg: 250, confidence: "medium" }
      },
      calandre: {
        adaptable: { min: 50, max: 150, avg: 100, confidence: "high" }
      },
      bavette: {
        adaptable: { min: 20, max: 60, avg: 40, confidence: "high" }
      },
      jonc: {
        adaptable: { min: 30, max: 80, avg: 55, confidence: "high" }
      },
      "phare-avant-halogene": {
        adaptable: { min: 150, max: 450, avg: 300, confidence: "high" }
      },
      "phare-avant-led": {
        adaptable: { min: 400, max: 900, avg: 650, confidence: "medium" }
      },
      "phare-avant-matrix": {
        adaptable: { min: 800, max: 1800, avg: 1300, confidence: "medium" }
      },
      "feu-arriere": {
        adaptable: { min: 80, max: 250, avg: 165, confidence: "high" }
      },
      "feu-arriere-complet": {
        adaptable: { min: 150, max: 400, avg: 275, confidence: "medium" }
      },
      antibrouillard: {
        adaptable: { min: 40, max: 120, avg: 80, confidence: "high" }
      },
      clignotant: {
        adaptable: { min: 30, max: 80, avg: 55, confidence: "high" }
      },
      "pare-brise-standard": {
        standard: { min: 250, max: 500, avg: 375, confidence: "high" }
      },
      "pare-brise-chauffant": {
        standard: { min: 400, max: 800, avg: 600, confidence: "medium" }
      },
      "pare-brise-capteurs": {
        standard: { min: 500, max: 1200, avg: 850, confidence: "medium" }
      },
      "lunette-arriere": {
        standard: { min: 150, max: 400, avg: 275, confidence: "medium" }
      },
      "vitre-portiere": {
        standard: { min: 100, max: 250, avg: 175, confidence: "high" }
      }
    },

    generic: {
      "kit-collage-carrosserie": {
        standard: { min: 25, max: 40, avg: 32, confidence: "high" }
      },
      "petites-fournitures": {
        standard: { min: 3, max: 10, avg: 5, confidence: "high" }
      },
      "recyclage-dechets": {
        standard: { min: 3, max: 10, avg: 5, confidence: "high" }
      },
      "visserie-clips": {
        standard: { min: 5, max: 20, avg: 12, confidence: "high" }
      },
      "mastic-carrosserie": {
        standard: { min: 15, max: 35, avg: 25, confidence: "high" }
      },
      "apret-peinture": {
        standard: { min: 20, max: 50, avg: 35, confidence: "high" }
      }
    }
  },

  mecanique: {
    "embrayage-kit": {
      standard: { min: 400, max: 900, avg: 650, confidence: "high" }
    },
    "freins-plaquettes-avant": {
      standard: { min: 80, max: 200, avg: 140, confidence: "high" }
    },
    "freins-plaquettes-arriere": {
      standard: { min: 60, max: 150, avg: 105, confidence: "high" }
    },
    "disques-avant": {
      standard: { min: 80, max: 180, avg: 130, confidence: "high" }
    },
    "disques-arriere": {
      standard: { min: 70, max: 150, avg: 110, confidence: "high" }
    },
    "amortisseur-avant": {
      standard: { min: 150, max: 350, avg: 250, confidence: "high" }
    },
    "amortisseur-arriere": {
      standard: { min: 120, max: 280, avg: 200, confidence: "high" }
    },
    silentbloc: {
      standard: { min: 80, max: 200, avg: 140, confidence: "medium" }
    },
    biellette: {
      standard: { min: 50, max: 120, avg: 85, confidence: "high" }
    },
    rotule: {
      standard: { min: 60, max: 150, avg: 105, confidence: "high" }
    },
    roulement: {
      standard: { min: 100, max: 250, avg: 175, confidence: "high" }
    },
    "triangle-suspension": {
      standard: { min: 150, max: 350, avg: 250, confidence: "medium" }
    }
  },

  moteur: {
    turbo: {
      neuf: { min: 900, max: 2500, avg: 1700, confidence: "medium" },
      "echange-standard": { min: 600, max: 1500, avg: 1050, confidence: "high" }
    },
    injecteur: {
      standard: { min: 150, max: 400, avg: 275, confidence: "high" }
    },
    "pompe-injection": {
      standard: { min: 500, max: 1500, avg: 1000, confidence: "medium" }
    },
    fap: {
      standard: { min: 800, max: 2000, avg: 1400, confidence: "medium" }
    },
    catalyseur: {
      standard: { min: 400, max: 1200, avg: 800, confidence: "medium" }
    },
    egr: {
      standard: { min: 300, max: 800, avg: 550, confidence: "medium" }
    },
    demarreur: {
      standard: { min: 200, max: 450, avg: 325, confidence: "high" }
    },
    alternateur: {
      standard: { min: 250, max: 550, avg: 400, confidence: "high" }
    },
    "courroie-distribution-kit": {
      standard: { min: 450, max: 900, avg: 675, confidence: "high" }
    },
    "pompe-eau": {
      standard: { min: 150, max: 350, avg: 250, confidence: "high" }
    },
    radiateur: {
      standard: { min: 200, max: 500, avg: 350, confidence: "medium" }
    },
    ventilateur: {
      standard: { min: 150, max: 400, avg: 275, confidence: "medium" }
    }
  },

  "main-oeuvre": {
    "2026": {
      "mecanique-generale": { min: 70, max: 95, avg: 82.5, confidence: "high" },
      carrosserie: { min: 80, max: 110, avg: 95, confidence: "high" },
      peinture: { min: 85, max: 120, avg: 102.5, confidence: "high" },
      concession: { min: 90, max: 140, avg: 115, confidence: "medium" },
      specialiste: { min: 100, max: 150, avg: 125, confidence: "medium" },
      vsp: { min: 55, max: 85, avg: 70, confidence: "high" }
    },
    "2018": {
      carrosserie: { min: 60, max: 75, avg: 67, confidence: "high" },
      peinture: { min: 60, max: 75, avg: 67, confidence: "high" }
    }
  },

  "ingredients-peinture": {
    "2026": {
      opaque: { min: 25, max: 35, avg: 30, confidence: "high" },
      metallise: { min: 30, max: 40, avg: 35, confidence: "high" },
      nacre: { min: 35, max: 50, avg: 42, confidence: "high" }
    }
  },

  services: {
    geometrie: { min: 60, max: 120, avg: 90, confidence: "high" },
    diagnostic: { min: 40, max: 80, avg: 60, confidence: "high" },
    "climatisation-recharge": { min: 80, max: 150, avg: 115, confidence: "high" },
    "climatisation-reparation": { min: 200, max: 600, avg: 400, confidence: "medium" },
    "vidange-simple": { min: 60, max: 120, avg: 90, confidence: "high" },
    "vidange-complete": { min: 150, max: 300, avg: 225, confidence: "high" },
    "nettoyage-injecteurs": { min: 80, max: 180, avg: 130, confidence: "medium" }
  }
} as const

// Types pour la base de prix
interface PriceRange {
  min: number
  max: number
  avg: number
  confidence: 'high' | 'medium' | 'low'
}

interface PieceTypes {
  adaptable?: PriceRange
  origine?: PriceRange
  standard?: PriceRange
  neuf?: PriceRange
  'echange-standard'?: PriceRange
}

export interface MatchResult {
  category: string
  pieceKey: string
  priceData: PieceTypes | null
  confidence: 'exact' | 'partial' | 'fallback' | 'none'
  matchedKeywords: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALISATION DU TEXTE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalise une chaine pour le matching (accents, casse, espaces)
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION DE MARQUE VSP
// ═══════════════════════════════════════════════════════════════════════════════

type VspBrand = 'aixam' | 'ligier' | 'microcar' | 'generic-vsp' | null

/**
 * Detecte si la designation concerne un vehicule sans permis (VSP)
 */
export function detectVspBrand(designation: string, marque?: string): VspBrand {
  const text = normalize(designation + ' ' + (marque || ''))

  if (text.includes('aixam')) return 'aixam'
  if (text.includes('ligier')) return 'ligier'
  if (text.includes('microcar')) return 'microcar'
  if (text.includes('chatenet')) return 'generic-vsp'
  if (text.includes('vsp') || text.includes('sans permis') || text.includes('quadricycle')) {
    return 'generic-vsp'
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYWORDS MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

// Keywords pour identifier les types de pieces
const KEYWORDS_MAP: Record<string, string[]> = {
  // Carrosserie
  'pare-choc-avant': ['pare choc avant', 'parechoc avant', 'pc avant', 'bouclier avant'],
  'pare-choc-arriere': ['pare choc arriere', 'parechoc arriere', 'pc arriere', 'bouclier arriere'],
  'aile-avant': ['aile avant', 'aile av', 'aile avt', 'garde boue avant'],
  'aile-arriere': ['aile arriere', 'aile ar', 'aile arr', 'garde boue arriere'],
  'capot': ['capot'],
  'porte': ['porte', 'portiere'],
  'hayon': ['hayon', 'coffre'],
  'toit': ['toit', 'pavillon'],
  'retroviseur': ['retroviseur', 'retro', 'miroir'],
  'calandre': ['calandre', 'grille'],
  'custode-droite': ['custode droite', 'custode droit', 'vitre custode d', 'custode d'],
  'custode-gauche': ['custode gauche', 'custode g', 'vitre custode g'],
  'bavette': ['bavette'],
  'jonc': ['jonc', 'moulure', 'baguette'],

  // Eclairage
  'phare': ['phare', 'optique', 'projecteur'],
  'phare-avant-halogene': ['phare halogene', 'optique halogene'],
  'phare-avant-led': ['phare led', 'optique led', 'phare xenon', 'bi led', 'full led'],
  'phare-avant-matrix': ['phare matrix', 'matrix led', 'phare laser'],
  'feu-arriere': ['feu arriere', 'feu ar', 'optique arriere', 'lanterne'],
  'feu-arriere-complet': ['bloc feu arriere', 'feu complet'],
  'antibrouillard': ['antibrouillard', 'anti brouillard', 'ab', 'feu de brouillard'],
  'clignotant': ['clignotant', 'repetiteur'],

  // Vitrage
  'pare-brise-standard': ['pare brise', 'parebrise'],
  'pare-brise-chauffant': ['pare brise chauffant', 'parebrise chauffant'],
  'pare-brise-capteurs': ['pare brise capteur', 'parebrise camera', 'pare brise radar'],
  'lunette-arriere': ['lunette arriere', 'vitre arriere', 'glace ar'],
  'vitre-portiere': ['vitre portiere', 'glace porte', 'vitre porte'],

  // Mecanique
  'embrayage-kit': ['embrayage', 'kit embrayage', 'volant moteur'],
  'freins-plaquettes-avant': ['plaquette avant', 'plaquettes av', 'freins avant', 'garniture avant'],
  'freins-plaquettes-arriere': ['plaquette arriere', 'plaquettes ar', 'freins arriere', 'garniture arriere'],
  'disques-avant': ['disque avant', 'disques av'],
  'disques-arriere': ['disque arriere', 'disques ar'],
  'amortisseur-avant': ['amortisseur avant', 'amortisseur av', 'suspension avant'],
  'amortisseur-arriere': ['amortisseur arriere', 'amortisseur ar', 'suspension arriere'],
  'silentbloc': ['silentbloc', 'silent bloc', 'silent-bloc'],
  'biellette': ['biellette', 'barre stabilisatrice'],
  'rotule': ['rotule', 'rotule direction'],
  'roulement': ['roulement', 'moyeu'],
  'triangle-suspension': ['triangle', 'bras suspension', 'bras de suspension'],

  // Moteur
  'turbo': ['turbo', 'turbocompresseur'],
  'injecteur': ['injecteur'],
  'pompe-injection': ['pompe injection', 'pompe hp', 'pompe haute pression'],
  'fap': ['fap', 'filtre a particule', 'filtre particule', 'dpf'],
  'catalyseur': ['catalyseur', 'pot catalytique', 'cata'],
  'egr': ['egr', 'vanne egr'],
  'demarreur': ['demarreur'],
  'alternateur': ['alternateur'],
  'courroie-distribution-kit': ['distribution', 'courroie distribution', 'kit distribution'],
  'pompe-eau': ['pompe eau', 'pompe a eau', 'pompe refroidissement'],
  'radiateur': ['radiateur'],
  'ventilateur': ['ventilateur', 'motoventilateur'],

  // VSP specifique
  'variateur': ['variateur'],
  'courroie': ['courroie', 'courroie variateur'],

  // Fournitures
  'kit-collage-carrosserie': ['kit collage', 'colle carrosserie', 'colle structurelle'],
  'petites-fournitures': ['fourniture', 'petites fournitures', 'consommable'],
  'recyclage-dechets': ['recyclage', 'dechet', 'mise en dechet', 'tri'],
  'visserie-clips': ['visserie', 'clip', 'agrafe', 'fixation'],
  'mastic-carrosserie': ['mastic', 'enduit'],
  'apret-peinture': ['appret', 'apret', 'primaire'],
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Trouve la meilleure correspondance pour une designation de piece
 */
export function matchPiece(designation: string, marque?: string): MatchResult {
  const normalizedDesignation = normalize(designation)
  const vspBrand = detectVspBrand(designation, marque)
  const matchedKeywords: string[] = []

  // Cherche les keywords qui correspondent
  let bestMatch: { key: string; score: number } | null = null

  for (const [pieceKey, keywords] of Object.entries(KEYWORDS_MAP)) {
    for (const keyword of keywords) {
      if (normalizedDesignation.includes(keyword)) {
        const score = keyword.length // Score base sur la longueur du match
        matchedKeywords.push(keyword)

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { key: pieceKey, score }
        }
      }
    }
  }

  if (!bestMatch) {
    return {
      category: 'unknown',
      pieceKey: '',
      priceData: null,
      confidence: 'none',
      matchedKeywords: []
    }
  }

  // Determine la categorie de recherche
  let priceData: PieceTypes | null = null
  let category = ''
  let confidence: 'exact' | 'partial' | 'fallback' = 'partial'

  // 1. D'abord chercher dans les pieces VSP specifiques si applicable
  if (vspBrand) {
    const vspPieces = (prixReference.pieces as Record<string, Record<string, PieceTypes>>)[vspBrand]
    if (vspPieces && vspPieces[bestMatch.key]) {
      priceData = vspPieces[bestMatch.key]
      category = `pieces.${vspBrand}`
      confidence = 'exact'
    } else if (vspBrand !== 'generic-vsp') {
      // Fallback sur generic-vsp
      const genericVsp = prixReference.pieces['generic-vsp'] as unknown as Record<string, PieceTypes>
      if (genericVsp && genericVsp[bestMatch.key]) {
        priceData = genericVsp[bestMatch.key]
        category = 'pieces.generic-vsp'
        confidence = 'fallback'
      }
    }
  }

  // 2. Sinon chercher dans generic-auto
  if (!priceData) {
    const genericAuto = prixReference.pieces['generic-auto'] as unknown as Record<string, PieceTypes>
    if (genericAuto && genericAuto[bestMatch.key]) {
      priceData = genericAuto[bestMatch.key]
      category = 'pieces.generic-auto'
      confidence = vspBrand ? 'fallback' : 'partial'
    }
  }

  // 3. Chercher dans mecanique
  if (!priceData) {
    const mecanique = prixReference.mecanique as unknown as Record<string, PieceTypes>
    if (mecanique && mecanique[bestMatch.key]) {
      priceData = mecanique[bestMatch.key]
      category = 'mecanique'
      confidence = 'exact'
    }
  }

  // 4. Chercher dans moteur
  if (!priceData) {
    const moteur = prixReference.moteur as unknown as Record<string, PieceTypes>
    if (moteur && moteur[bestMatch.key]) {
      priceData = moteur[bestMatch.key]
      category = 'moteur'
      confidence = 'exact'
    }
  }

  // 5. Chercher dans generic (fournitures)
  if (!priceData) {
    const generic = prixReference.pieces.generic as unknown as Record<string, PieceTypes>
    if (generic && generic[bestMatch.key]) {
      priceData = generic[bestMatch.key]
      category = 'pieces.generic'
      confidence = 'exact'
    }
  }

  // 6. Chercher dans services
  if (!priceData) {
    const services = prixReference.services as Record<string, PriceRange>
    if (services && services[bestMatch.key]) {
      priceData = { standard: services[bestMatch.key] }
      category = 'services'
      confidence = 'exact'
    }
  }

  return {
    category,
    pieceKey: bestMatch.key,
    priceData,
    confidence: priceData ? confidence : 'none',
    matchedKeywords: Array.from(new Set(matchedKeywords)) // Dedupe
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTION DU PRIX DE REFERENCE
// ═══════════════════════════════════════════════════════════════════════════════

export type PieceQuality = 'adaptable' | 'origine' | 'standard' | 'neuf' | 'echange-standard'

/**
 * Obtient le prix de reference pour une piece matchee
 *
 * @param matchResult Resultat du matching
 * @param quality Type de piece prefere (adaptable par defaut)
 * @returns Prix de reference ou null
 */
export function getPrixReference(
  matchResult: MatchResult,
  quality: PieceQuality = 'adaptable'
): PriceRange | null {
  if (!matchResult.priceData) return null

  // Ordre de priorite pour trouver un prix
  const priorities: PieceQuality[] = [quality, 'adaptable', 'standard', 'origine', 'neuf']

  for (const q of priorities) {
    const price = matchResult.priceData[q]
    if (price) return price as PriceRange
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIX MAIN D'OEUVRE
// ═══════════════════════════════════════════════════════════════════════════════

export type WorkType = 'mecanique-generale' | 'carrosserie' | 'peinture' | 'concession' | 'specialiste' | 'vsp'

/**
 * Obtient le taux horaire de main d'oeuvre
 */
export function getMainOeuvreRate(workType: WorkType = 'carrosserie'): PriceRange {
  const rates = prixReference['main-oeuvre']['2026'] as Record<string, PriceRange>
  return rates[workType] || rates['mecanique-generale']
}

/**
 * Detecte le type de travail a partir d'une designation
 */
export function detectWorkType(designation: string): WorkType {
  const text = normalize(designation)

  if (text.includes('peinture') || text.includes('vernis') || text.includes('teinte')) {
    return 'peinture'
  }
  if (text.includes('carrosserie') || text.includes('debosselage') || text.includes('redressage')) {
    return 'carrosserie'
  }
  if (text.includes('turbo') || text.includes('injection') || text.includes('specialiste')) {
    return 'specialiste'
  }
  if (detectVspBrand(designation)) {
    return 'vsp'
  }

  return 'mecanique-generale'
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIX PEINTURE
// ═══════════════════════════════════════════════════════════════════════════════

export type PaintType = 'opaque' | 'metallise' | 'nacre'

/**
 * Obtient le cout des ingredients peinture par heure
 */
export function getPaintIngredientCost(paintType: PaintType = 'metallise'): PriceRange {
  const ingredients = prixReference['ingredients-peinture']['2026'] as Record<string, PriceRange>
  return ingredients[paintType] || ingredients['metallise']
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Formate un prix avec fourchette pour l'affichage
 */
export function formatPriceRange(price: PriceRange): string {
  return `${price.avg}€ (fourchette ${price.min}-${price.max}€)`
}

/**
 * Calcule l'ecart en pourcentage
 */
export function calculateEcart(facture: number, marche: number): number {
  if (marche === 0) return 0
  return Math.round(((facture - marche) / marche) * 100 * 10) / 10
}

/**
 * Determine le verdict en fonction de l'ecart
 */
export function getVerdict(ecartPourcent: number): 'excellent' | 'correct' | 'eleve' | 'tres_eleve' | 'excessif' {
  if (ecartPourcent < -5) return 'excellent'
  if (ecartPourcent <= 10) return 'correct'
  if (ecartPourcent <= 20) return 'eleve'
  if (ecartPourcent <= 35) return 'tres_eleve'
  return 'excessif'
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DE LA BASE COMPLETE (pour debug)
// ═══════════════════════════════════════════════════════════════════════════════

export function getPrixReferenceDatabase() {
  return prixReference
}

export function logPrixReferenceInfo(): void {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 BASE DE PRIX DE RÉFÉRENCE JANVIER 2026')
  console.log(`   Version: ${prixReference.meta.version}`)
  console.log(`   Date: ${prixReference.meta.date}`)
  console.log(`   Sources: ${prixReference.meta.sources.join(', ')}`)
  console.log('═══════════════════════════════════════════════════════════════')
}
