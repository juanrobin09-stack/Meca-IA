import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨 STABILITÉ CRITIQUE - Version 2.0 (25 jan 2026)
// ═══════════════════════════════════════════════════════════════════════════════
// PROBLÈME RÉSOLU: La recherche web Brave retournait des résultats DIFFÉRENTS
// à chaque appel, causant des écarts de 71% sur le même devis!
//
// SOLUTION: Utiliser des prix de référence FIXES et DÉTERMINISTES
// - Pas de recherche web (non déterministe)
// - Prix basés sur moyennes Oscaro/Yakarouler janvier 2026
// - TOUJOURS utiliser la MÉDIANE des fourchettes
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE PRIX DE RÉFÉRENCE JANVIER 2026 - DÉTERMINISTE
// Source: Moyennes Oscaro, Yakarouler, Mister-Auto (janvier 2026)
// ═══════════════════════════════════════════════════════════════════════════════
const PRIX_REFERENCE_2026 = {
  // Main d'œuvre (€/heure) - MÉDIANE des fourchettes
  mainOeuvre: {
    mecanique: { min: 70, max: 95, mediane: 82.5 },        // Garage indépendant
    carrosserie: { min: 80, max: 110, mediane: 95 },       // Carrossier
    peinture: { min: 85, max: 120, mediane: 102.5 },       // Peinture auto
    concession: { min: 90, max: 140, mediane: 115 },       // Concession officielle
    specialiste: { min: 100, max: 150, mediane: 125 }      // Spécialiste (turbo, injection)
  },

  // Pièces carrosserie (€ TTC) - Prix ADAPTABLE (origine = x1.8 à x2.5)
  carrosserie: {
    parechocAvant: { min: 120, max: 280, mediane: 200 },
    parechocArriere: { min: 100, max: 250, mediane: 175 },
    aileAvant: { min: 80, max: 200, mediane: 140 },
    aileArriere: { min: 150, max: 350, mediane: 250 },     // Souvent soudée
    capot: { min: 200, max: 500, mediane: 350 },
    portiere: { min: 250, max: 600, mediane: 425 },
    hayon: { min: 300, max: 700, mediane: 500 },
    toit: { min: 400, max: 1000, mediane: 700 },
    retroviseur: { min: 60, max: 180, mediane: 120 },
    calandre: { min: 50, max: 150, mediane: 100 },
    bavette: { min: 20, max: 60, mediane: 40 },
    jonc: { min: 30, max: 80, mediane: 55 }
  },

  // Éclairage (€ TTC)
  eclairage: {
    phareAvant: { min: 150, max: 450, mediane: 300 },      // Halogène
    phareAvantLED: { min: 400, max: 900, mediane: 650 },   // LED/Xénon
    phareAvantMatrix: { min: 800, max: 1800, mediane: 1300 }, // Matrix LED
    feuArriere: { min: 80, max: 250, mediane: 165 },
    feuArriereComplet: { min: 150, max: 400, mediane: 275 },
    antibrouillard: { min: 40, max: 120, mediane: 80 },
    clignotant: { min: 30, max: 80, mediane: 55 }
  },

  // Vitrage (€ TTC pose incluse)
  vitrage: {
    parebriseStandard: { min: 250, max: 500, mediane: 375 },
    parebriseChauffant: { min: 400, max: 800, mediane: 600 },
    parebriseCapteurs: { min: 500, max: 1200, mediane: 850 }, // Avec caméra/radar
    lunette: { min: 150, max: 400, mediane: 275 },
    vitrePortiere: { min: 100, max: 250, mediane: 175 }
  },

  // Mécanique courante (€ TTC pièce + MO)
  mecanique: {
    embrayageKit: { min: 400, max: 900, mediane: 650 },    // Kit complet
    freinsPlaqueAvant: { min: 80, max: 200, mediane: 140 },
    freinsPlaquetArriere: { min: 60, max: 150, mediane: 105 },
    disqueAvant: { min: 80, max: 180, mediane: 130 },       // Les 2
    disqueArriere: { min: 70, max: 150, mediane: 110 },     // Les 2
    amortisseurAvant: { min: 150, max: 350, mediane: 250 }, // Les 2 + MO
    amortisseurArriere: { min: 120, max: 280, mediane: 200 },
    silentbloc: { min: 80, max: 200, mediane: 140 },
    biellette: { min: 50, max: 120, mediane: 85 },
    rotule: { min: 60, max: 150, mediane: 105 },
    roulement: { min: 100, max: 250, mediane: 175 },
    triangleSuspension: { min: 150, max: 350, mediane: 250 }
  },

  // Moteur/Transmission (€ TTC pièce + MO)
  moteur: {
    turbo: { min: 900, max: 2500, mediane: 1700 },
    turboEchange: { min: 600, max: 1500, mediane: 1050 },   // Échange standard
    injecteur: { min: 150, max: 400, mediane: 275 },        // À l'unité
    pompeInjection: { min: 500, max: 1500, mediane: 1000 },
    fap: { min: 800, max: 2000, mediane: 1400 },
    catalyseur: { min: 400, max: 1200, mediane: 800 },
    egr: { min: 300, max: 800, mediane: 550 },
    demarreur: { min: 200, max: 450, mediane: 325 },
    alternateur: { min: 250, max: 550, mediane: 400 },
    courroieDistribution: { min: 450, max: 900, mediane: 675 }, // Kit complet + MO
    pompeEau: { min: 150, max: 350, mediane: 250 },
    radiateur: { min: 200, max: 500, mediane: 350 },
    ventilateur: { min: 150, max: 400, mediane: 275 }
  },

  // VSP - Voitures Sans Permis (prix spécifiques Aixam, Ligier, Microcar)
  vsp: {
    parechocAvant: { min: 150, max: 350, mediane: 250 },
    parechocArriere: { min: 130, max: 300, mediane: 215 },
    aile: { min: 100, max: 250, mediane: 175 },
    phare: { min: 100, max: 280, mediane: 190 },
    feuArriere: { min: 60, max: 180, mediane: 120 },
    capot: { min: 250, max: 550, mediane: 400 },
    portiere: { min: 300, max: 650, mediane: 475 },
    parebrise: { min: 200, max: 450, mediane: 325 },
    variateur: { min: 300, max: 700, mediane: 500 },
    courroie: { min: 80, max: 200, mediane: 140 },
    mainOeuvre: { min: 55, max: 85, mediane: 70 }           // Souvent moins cher
  },

  // Services additionnels
  services: {
    geometrie: { min: 60, max: 120, mediane: 90 },
    diagnostic: { min: 40, max: 80, mediane: 60 },
    climatisationRecharge: { min: 80, max: 150, mediane: 115 },
    climatisationReparation: { min: 200, max: 600, mediane: 400 },
    vidangeSimple: { min: 60, max: 120, mediane: 90 },
    vidangeComplete: { min: 150, max: 300, mediane: 225 },  // Filtres inclus
    nettoyageInjecteurs: { min: 80, max: 180, mediane: 130 }
  }
}

// Fonction pour afficher la base de prix dans les logs (debug)
function logPrixReference(): void {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 BASE DE PRIX DE RÉFÉRENCE JANVIER 2026 (DÉTERMINISTE)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Main d\'œuvre:')
  Object.entries(PRIX_REFERENCE_2026.mainOeuvre).forEach(([k, v]) => {
    console.log(`  ${k}: ${v.mediane}€/h (fourchette ${v.min}-${v.max}€)`)
  })
  console.log('Carrosserie (pièce seule):')
  Object.entries(PRIX_REFERENCE_2026.carrosserie).slice(0, 5).forEach(([k, v]) => {
    console.log(`  ${k}: ${v.mediane}€ (fourchette ${v.min}-${v.max}€)`)
  })
  console.log('═══════════════════════════════════════════════════════════════')
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECHERCHE WEB DÉSACTIVÉE POUR GARANTIR LA STABILITÉ
// ═══════════════════════════════════════════════════════════════════════════════
// La recherche Brave causait des variations de 71% sur le même devis !
// On utilise maintenant les prix de référence FIXES ci-dessus.
// ═══════════════════════════════════════════════════════════════════════════════

const WEB_SEARCH_ENABLED = false  // 🚨 DÉSACTIVÉ - Cause d'instabilité

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function searchWeb(_query: string): Promise<string> {
  // Recherche désactivée pour stabilité - retourne toujours les prix de référence
  console.log('[analyze-devis-pro] ⚠️ Recherche web DÉSACTIVÉE pour stabilité')
  return `[Recherche web désactivée - Utilisation des prix de référence fixes janvier 2026 pour garantir des résultats STABLES et REPRODUCTIBLES]`
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🚀 DEBUT REQUETE ANALYZE-DEVIS-PRO (v2.0 STABLE)')
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log(`🔍 Recherche web: ${WEB_SEARCH_ENABLED ? '✅ ACTIVÉE' : '❌ DÉSACTIVÉE (stabilité)'}`)
  console.log(`📊 Mode: PRIX DE RÉFÉRENCE FIXES (médianes jan 2026)`)
  console.log('═══════════════════════════════════════════════════════════════')

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY manquante')
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Config manquante' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    let { imageBase64 } = body
    let detectedMediaType = 'image/jpeg' // Default, sera mis à jour si data: URL détectée

    console.log('📦 Body reçu:', {
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      imageBase64Start: imageBase64?.substring(0, 100) || 'N/A',
      bodyKeys: Object.keys(body)
    })

    if (!imageBase64) {
      console.error('❌ Pas d\'image dans le body')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image requise' }) }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔧 FIX CRITIQUE: Nettoyer le base64 si nécessaire
    // ═══════════════════════════════════════════════════════════════════════════
    if (imageBase64.startsWith('data:')) {
      console.log('🔧 Base64 contient préfixe data: URL - Nettoyage en cours...')

      // Extraire le type MIME depuis la data URL
      const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/)
      if (mimeMatch) {
        detectedMediaType = mimeMatch[1]
        console.log(`   Type MIME détecté: ${detectedMediaType}`)
      }

      // Extraire le base64 pur (après la virgule)
      const commaIndex = imageBase64.indexOf(',')
      if (commaIndex !== -1) {
        imageBase64 = imageBase64.substring(commaIndex + 1)
        console.log(`   ✅ Base64 nettoyé: ${imageBase64.length} chars`)
        console.log(`   Nouveaux premiers 50 chars: ${imageBase64.substring(0, 50)}`)
      } else {
        console.error('❌ Format data: URL invalide - pas de virgule trouvée!')
      }
    }

    const imageSizeKB = Math.round((imageBase64.length * 3) / 4 / 1024)
    console.log(`📦 Image: ${imageSizeKB}KB (${imageBase64.length} chars base64)`)
    console.log(`📸 Type MIME utilisé: ${detectedMediaType}`)

    if (imageSizeKB > 4000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image trop grosse (max 4MB)' }) }
    }

    // Vérifier si le base64 semble valide (après nettoyage)
    const base64Regex = /^[A-Za-z0-9+/=]+$/
    const sampleToCheck = imageBase64.substring(0, 100).replace(/\s/g, '') // Ignorer espaces/newlines
    const isValidBase64 = base64Regex.test(sampleToCheck)
    console.log(`🔍 Base64 valide: ${isValidBase64 ? '✅' : '❌'}`)

    if (!isValidBase64) {
      console.error('❌ Le base64 contient des caractères invalides')
      console.error('   Premiers 100 chars:', imageBase64.substring(0, 100))
      console.error('   Chars problématiques:', sampleToCheck.match(/[^A-Za-z0-9+/=]/g))

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Image corrompue. Reprends une photo avec l\'appareil photo.',
          debug: 'INVALID_BASE64'
        })
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Analyse SANS recherche web (single call pour respecter timeout Netlify)
    console.log('═══ DEBUT ANALYSE DEVIS PRO ═══')
    console.log(`📄 Image reçue: ${imageSizeKB}KB`)
    console.log(`🔍 Mode: Single call (pas de web search pour vitesse)`)
    console.log(`🌐 Temperature: 0 (déterministe)`)
    console.log(`📅 Date analyse: ${new Date().toISOString()}`)

    // Log de la base de prix au démarrage
    logPrixReference()

    // ✅ PROMPT STABILISÉ v2.0 - Prix de référence FIXES (pas de recherche web)
    const systemPrompt = `Expert tarification auto France. Date: 25 janvier 2026.

═══════════════════════════════════════════════════════════════
🚨 RÈGLE ABSOLUE - COHÉRENCE DES RÉSULTATS
═══════════════════════════════════════════════════════════════
Tu DOIS retourner des résultats IDENTIQUES pour le même devis.
Pour garantir cette cohérence, utilise UNIQUEMENT les prix ci-dessous.
NE PAS estimer "au feeling" - TOUJOURS utiliser la MÉDIANE des fourchettes.

═══════════════════════════════════════════════════════════════
RÈGLE #1 - EXTRACTION EXACTE
═══════════════════════════════════════════════════════════════
Lis les montants EXACTEMENT comme sur le devis. Pas d'estimation pour les prix facturés.

═══════════════════════════════════════════════════════════════
RÈGLE #2 - PRIX DE RÉFÉRENCE FIXES JANVIER 2026
═══════════════════════════════════════════════════════════════
UTILISE TOUJOURS LA MÉDIANE (pas min ni max, LA MÉDIANE!)
Source: Moyennes Oscaro, Yakarouler, Mister-Auto janvier 2026

MAIN D'ŒUVRE (€/heure) - Utilise la MÉDIANE:
- Mécanique garage indépendant: 82.5€/h (fourchette 70-95€)
- Carrosserie: 95€/h (fourchette 80-110€)
- Peinture: 102.5€/h (fourchette 85-120€)
- Concession officielle: 115€/h (fourchette 90-140€)
- Spécialiste (turbo, injection): 125€/h (fourchette 100-150€)
- VSP (voiture sans permis): 70€/h (fourchette 55-85€)

CARROSSERIE - Pièces ADAPTABLES (€ TTC) - Utilise la MÉDIANE:
- Pare-choc avant: 200€ (fourchette 120-280€)
- Pare-choc arrière: 175€ (fourchette 100-250€)
- Aile avant: 140€ (fourchette 80-200€)
- Aile arrière: 250€ (fourchette 150-350€)
- Capot: 350€ (fourchette 200-500€)
- Portière: 425€ (fourchette 250-600€)
- Hayon: 500€ (fourchette 300-700€)
- Rétroviseur: 120€ (fourchette 60-180€)
- Calandre: 100€ (fourchette 50-150€)
→ Si pièce ORIGINE: multiplier par 1.8 à 2.2

ÉCLAIRAGE (€ TTC) - Utilise la MÉDIANE:
- Phare avant halogène: 300€ (fourchette 150-450€)
- Phare avant LED/Xénon: 650€ (fourchette 400-900€)
- Phare Matrix LED: 1300€ (fourchette 800-1800€)
- Feu arrière: 165€ (fourchette 80-250€)
- Antibrouillard: 80€ (fourchette 40-120€)

VITRAGE (€ TTC pose incluse) - Utilise la MÉDIANE:
- Pare-brise standard: 375€ (fourchette 250-500€)
- Pare-brise chauffant: 600€ (fourchette 400-800€)
- Pare-brise avec capteurs: 850€ (fourchette 500-1200€)
- Lunette arrière: 275€ (fourchette 150-400€)

MÉCANIQUE COURANTE (€ TTC pièce + MO) - Utilise la MÉDIANE:
- Kit embrayage complet: 650€ (fourchette 400-900€)
- Plaquettes frein avant: 140€ (fourchette 80-200€)
- Plaquettes frein arrière: 105€ (fourchette 60-150€)
- Disques avant (x2): 130€ (fourchette 80-180€)
- Amortisseurs avant (x2 + MO): 250€ (fourchette 150-350€)
- Amortisseurs arrière (x2 + MO): 200€ (fourchette 120-280€)
- Triangle suspension: 250€ (fourchette 150-350€)
- Roulement: 175€ (fourchette 100-250€)

MOTEUR (€ TTC pièce + MO) - Utilise la MÉDIANE:
- Turbo neuf: 1700€ (fourchette 900-2500€)
- Turbo échange standard: 1050€ (fourchette 600-1500€)
- Injecteur (unité): 275€ (fourchette 150-400€)
- Pompe injection: 1000€ (fourchette 500-1500€)
- FAP: 1400€ (fourchette 800-2000€)
- Catalyseur: 800€ (fourchette 400-1200€)
- Vanne EGR: 550€ (fourchette 300-800€)
- Démarreur: 325€ (fourchette 200-450€)
- Alternateur: 400€ (fourchette 250-550€)
- Kit distribution complet: 675€ (fourchette 450-900€)
- Radiateur: 350€ (fourchette 200-500€)

VSP - VOITURES SANS PERMIS (Aixam, Ligier, Microcar):
- Pare-choc avant: 250€ (fourchette 150-350€)
- Pare-choc arrière: 215€ (fourchette 130-300€)
- Aile: 175€ (fourchette 100-250€)
- Phare: 190€ (fourchette 100-280€)
- Capot: 400€ (fourchette 250-550€)
- Variateur: 500€ (fourchette 300-700€)

SERVICES:
- Géométrie: 90€ (fourchette 60-120€)
- Diagnostic: 60€ (fourchette 40-80€)
- Recharge clim: 115€ (fourchette 80-150€)
- Vidange simple: 90€ (fourchette 60-120€)
- Vidange complète (filtres inclus): 225€ (fourchette 150-300€)

═══════════════════════════════════════════════════════════════
RÈGLE #3 - MÉTHODOLOGIE DE CALCUL (OBLIGATOIRE)
═══════════════════════════════════════════════════════════════
Pour CHAQUE ligne du devis:
1. Identifier la catégorie (carrosserie, éclairage, mécanique, etc.)
2. Prendre la MÉDIANE du prix de référence ci-dessus
3. Ajuster UNIQUEMENT si:
   - Pièce ORIGINE → multiplier par 1.8 à 2.2
   - Véhicule premium (BMW, Mercedes, Audi) → multiplier par 1.3
   - VSP → utiliser les prix VSP spécifiques
4. NE PAS faire de moyenne sans ces prix de référence
5. TOUJOURS citer le prix de référence utilisé

═══════════════════════════════════════════════════════════════
RÈGLE #3 - VERDICTS NUANCÉS (IMPORTANT!)
═══════════════════════════════════════════════════════════════
Utilise ces seuils PROGRESSIFS basés sur l'écart en pourcentage:
- ecart < -5%  → verdict "excellent" (en dessous du marché, bonne affaire)
- ecart <= 10% → verdict "correct" (dans la moyenne)
- ecart <= 20% → verdict "eleve" (légèrement au-dessus, à vérifier)
- ecart <= 35% → verdict "tres_eleve" (significativement élevé, comparer)
- ecart > 35%  → verdict "excessif" (tarifs excessifs, négocier ou changer)

IMPORTANT - TON PROFESSIONNEL:
❌ N'utilise JAMAIS ces mots: "arnaque", "fuyez", "scandaleux", "malhonnête", "escroquerie"
✅ Préfère ces formulations:
  - "Prix élevé" au lieu de "arnaque"
  - "Nous recommandons de comparer" au lieu de "fuyez"
  - "Tarif au-dessus du marché" au lieu de "surfacturation"
  - "À vérifier avec le garage" au lieu de accusations

CONTEXTE À TOUJOURS CONSIDÉRER:
1. Pièces ORIGINE vs ADAPTABLES: Un pare-choc à 350€ peut être justifié si origine constructeur (marché 250-400€), élevé si adaptable (marché 80-150€)
2. Qualité/Garantie: Des tarifs supérieurs peuvent s'expliquer par garantie étendue ou expertise
3. Complexité: Le temps de MO varie selon accessibilité des pièces

═══════════════════════════════════════════════════════════════
RÈGLE #4 - FORMULATION DU VERDICT GLOBAL
═══════════════════════════════════════════════════════════════
- Si écart global 0-15%: statut "honnete", "Devis dans la norme du marché"
- Si écart global 15-25%: statut "reserve", "Prix légèrement élevés, vérifiez les détails"
- Si écart global 25-40%: statut "reserve", "Prix élevés, comparez avec d'autres garages"
- Si écart global > 40%: statut "excessif", "Tarifs très élevés, nous recommandons fortement de comparer"

Note: statut "arnaque" UNIQUEMENT si écart > 50% ET plusieurs lignes excessives.

CALCUL: ecartPourcent = ((facturé - marché) / marché) × 100`

    const userPrompt = `Analyse ce devis automobile avec un ton NUANCÉ et PROFESSIONNEL.

🚨 ÉTAPES OBLIGATOIRES POUR RÉSULTATS STABLES:
1. Lis CHAQUE montant EXACTEMENT comme écrit sur le devis
2. Pour chaque ligne, identifie la catégorie dans les PRIX DE RÉFÉRENCE ci-dessus
3. Utilise TOUJOURS la MÉDIANE du prix de référence (PAS une estimation au feeling!)
4. Ajuste uniquement si pièce origine (+80%) ou véhicule premium (+30%)
5. Compare et calcule les écarts avec les SEUILS NUANCÉS

RAPPEL - TOUJOURS utiliser la MÉDIANE:
- Tu reçois une fourchette (min-max) → UTILISE LA MÉDIANE fournie
- Ex: Pare-choc avant 120-280€ → prix marché = 200€ (la médiane fournie)
- NE PAS inventer tes propres estimations

RAPPEL SEUILS (écart %):
- < -5% → "excellent" | <= 10% → "correct" | <= 20% → "eleve" | <= 35% → "tres_eleve" | > 35% → "excessif"

RETOURNE UNIQUEMENT CE JSON (pas de markdown, pas de texte):
{
  "garage": {"nom": "...", "adresse": "..."},
  "lignes": [
    {
      "designation": "...",
      "totalTTC": <MONTANT_EXACT_DU_DEVIS>,
      "prixMarcheEstime": <ESTIMATION_2026>,
      "ecartPourcent": <CALCUL>,
      "verdict": "excellent|correct|eleve|tres_eleve|excessif",
      "commentaire": "Court commentaire si prix élevé (ex: 'Acceptable si pièce origine, élevé si adaptable')"
    }
  ],
  "totalTTC": <TOTAL_EXACT_DU_DEVIS>,
  "totalMarcheEstime": <SOMME_ESTIMATIONS>,
  "verdict": {
    "note": <1-10>,
    "statut": "honnete|reserve|excessif",
    "recommandation": "...",
    "commentaireExpert": "Analyse nuancée mentionnant le contexte (pièces origine/adaptable, complexité...)"
  },
  "economiesPotentielles": {"montant": <DIFFERENCE>, "conseils": ["..."]}
}`

    // Initial message with image
    const messages: Anthropic.Messages.MessageParam[] = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: detectedMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: imageBase64 }
        },
        {
          type: 'text',
          text: userPrompt
        }
      ]
    }]

    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 APPEL UNIQUE (PAS DE RECHERCHE WEB) - GARANTIT STABILITÉ
    // ═══════════════════════════════════════════════════════════════════════════
    let responseText = ''

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🤖 APPEL CLAUDE VISION API - MODE STABLE v2.0')
    console.log(`   Model: claude-sonnet-4-20250514`)
    console.log(`   Temperature: 0 (DÉTERMINISTE)`)
    console.log(`   Web search: ❌ DÉSACTIVÉ (stabilité)`)
    console.log(`   Prix référence: ✅ MÉDIANES FIXES janvier 2026`)
    console.log('═══════════════════════════════════════════════════════════════')

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        temperature: 0,  // 🚨 CRITIQUE: TOUJOURS 0 pour déterminisme
        system: systemPrompt,
        // ❌ PAS DE TOOLS - Garantit un seul appel déterministe
        messages,
      })

      // 🔍 LOGS DÉTAILLÉS DE LA RÉPONSE CLAUDE
      console.log(`✅ Réponse reçue:`)
      console.log(`   stop_reason: ${response.stop_reason}`)
      console.log(`   model: ${response.model}`)
      console.log(`   usage: input=${response.usage?.input_tokens}, output=${response.usage?.output_tokens}`)
      console.log(`   content blocks: ${response.content.length}`)

      // Log chaque bloc de contenu
      response.content.forEach((block, idx) => {
        console.log(`   📦 Block ${idx}: type=${block.type}`)
        if (block.type === 'text') {
          console.log(`      text length: ${block.text.length}`)
          console.log(`      text preview: ${block.text.substring(0, 200)}...`)
        }
      })

      // Si pas de contenu du tout, c'est un problème
      if (!response.content || response.content.length === 0) {
        console.error('🚨 ERREUR: Claude a retourné une réponse VIDE (content=[])!')
        console.error('   Cela peut indiquer un problème avec l\'image ou le prompt.')
      }

      // Extract final text
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        responseText = textBlock.text
        console.log(`✅ Texte final extrait: ${responseText.length} caractères`)
      } else {
        console.error('❌ Pas de bloc texte dans la réponse!')
        console.error('   Blocs présents:', response.content.map(b => b.type).join(', '))

        // Essayer de récupérer n'importe quel texte
        const anyText = response.content
          .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
          .map(b => b.text)
          .join('\n')

        if (anyText) {
          responseText = anyText
          console.log('🔧 Texte récupéré par fallback:', anyText.length, 'chars')
        }
      }

    } catch (apiError) {
      console.error(`❌ Erreur API Claude:`, apiError)
      const err = apiError as { message?: string; status?: number; error?: { type?: string } }
      console.error(`   Message: ${err.message}`)
      console.error(`   Status: ${err.status}`)
      console.error(`   Type: ${err.error?.type}`)
      throw apiError
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`📝 BILAN: Réponse reçue en 1 appel (mode stable)`)
    console.log(`   responseText length: ${responseText.length}`)
    console.log('═══════════════════════════════════════════════════════════════')

    // ══════════════════════════════════════════════════════════════════════════
    // DEBUG LOGS - Pour diagnostiquer les échecs d'extraction
    // ══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════')
    console.log('📸 EXTRACTION DEBUG:')
    console.log(`   Réponse brute (longueur): ${responseText.length} caractères`)
    if (responseText.length > 0) {
      console.log(`   Réponse brute (premiers 500 chars):`)
      console.log(responseText.substring(0, 500))
      console.log(`   Réponse brute (derniers 200 chars):`)
      console.log(responseText.substring(Math.max(0, responseText.length - 200)))
    } else {
      console.log('   ⚠️ RÉPONSE VIDE!')
    }
    console.log('═══════════════════════════════════════════════════')

    // Si réponse vide, c'est un problème de vision/image
    if (!responseText || responseText.trim().length === 0) {
      console.error('🚨 ERREUR CRITIQUE: Réponse vide de Claude')
      console.error('   Causes possibles:')
      console.error('   1. L\'image n\'est pas lisible par Claude Vision')
      console.error('   2. L\'image ne contient pas de devis')
      console.error('   3. Format d\'image non supporté')
      console.error('   4. Problème de base64 encoding')
      console.error(`   Image size: ${imageSizeKB}KB`)

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'L\'IA n\'a pas pu analyser cette image. Causes possibles: image floue, pas un devis, ou format non supporté. Essaie avec une photo plus nette du devis.',
          debug: 'EMPTY_RESPONSE',
          details: {
            imageSizeKB,
            mode: 'stable-v2.0',
            tip: 'Utilise le bouton "Prendre photo" pour capturer une nouvelle image'
          }
        })
      }
    }

    // Si réponse très courte, probablement un message d'erreur de Claude
    if (responseText.trim().length < 50) {
      console.warn('⚠️ Réponse très courte:', responseText)
      console.warn('   Cela peut indiquer que Claude n\'a pas pu lire le devis')
    }

    let parsed
    try {
      // Nettoyage robuste du JSON
      let clean = responseText

      // Supprimer les blocs markdown ```json ... ```
      clean = clean.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

      // Trouver le JSON dans la réponse (chercher { ... })
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        clean = jsonMatch[0]
      }

      clean = clean.trim()

      console.log('🔧 JSON après nettoyage (premiers 300 chars):')
      console.log(clean.substring(0, 300))

      parsed = JSON.parse(clean)
      console.log('✅ JSON parsé avec succès')
    } catch (parseError) {
      console.error('❌ ERREUR PARSING JSON:')
      console.error(`   Message: ${parseError}`)
      console.error(`   Réponse brute complète:`)
      console.error(responseText)

      // Analyser le type d'erreur pour un meilleur message
      const isNoQuoteDetected = responseText.toLowerCase().includes('pas un devis') ||
                                 responseText.toLowerCase().includes('cannot read') ||
                                 responseText.toLowerCase().includes('not a quote')

      const isImageProblem = responseText.toLowerCase().includes('image') &&
                              (responseText.toLowerCase().includes('floue') ||
                               responseText.toLowerCase().includes('illisible') ||
                               responseText.toLowerCase().includes('blurry'))

      if (isNoQuoteDetected) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Cette image ne semble pas être un devis automobile. Envoie une photo de ton devis garage.',
            debug: 'NOT_A_QUOTE'
          })
        }
      }

      if (isImageProblem) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'L\'image est difficile à lire. Prends une nouvelle photo avec un meilleur éclairage.',
            debug: 'IMAGE_QUALITY'
          })
        }
      }

      // Erreur générique avec plus de contexte
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Erreur lors de l\'analyse. L\'IA n\'a pas retourné un format valide. Réessaie.',
          debug: 'JSON_PARSE_ERROR',
          hint: responseText.substring(0, 100)
        })
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VALIDATION: Vérifier cohérence des montants extraits
    // ══════════════════════════════════════════════════════════════════════════
    const totalFromLines = parsed.lignes?.reduce((s: number, l: { totalTTC?: number }) => s + (l.totalTTC || 0), 0) || 0
    const declaredTotal = parsed.totalTTC || 0
    const tolerance = 5 // 5€ de tolérance pour les arrondis

    if (Math.abs(totalFromLines - declaredTotal) > tolerance && totalFromLines > 0) {
      console.warn('⚠️ INCOHÉRENCE DÉTECTÉE:')
      console.warn(`   Somme des lignes: ${totalFromLines}€`)
      console.warn(`   Total déclaré: ${declaredTotal}€`)
      console.warn(`   Écart: ${Math.abs(totalFromLines - declaredTotal)}€`)
      // On utilise le total déclaré car c'est ce qui est affiché sur le devis
    }

    // Vérifier que le total n'est pas aberrant (ex: 0€ ou négatif)
    if (declaredTotal <= 0) {
      console.error('❌ Total invalide:', declaredTotal)
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Impossible de lire le total du devis. Assure-toi que le montant TTC est visible.' }) }
    }

    // Construire résultat avec verdicts nuancés
    interface LigneDevis {
      designation: string
      totalTTC: number
      prixMarcheEstime: number
      ecartPourcent: number
      verdict: 'excellent' | 'correct' | 'eleve' | 'tres_eleve' | 'excessif' | 'ok' | 'arnaque'
      commentaire?: string
    }

    // Comptage avec mapping des anciens verdicts vers nouveaux
    const mapVerdict = (v: string): string => {
      // Compatibilité avec anciens verdicts
      if (v === 'ok') return 'correct'
      if (v === 'arnaque') return 'excessif'
      return v
    }

    // Compter les lignes par catégorie (nuancée)
    const lignesExcellent = parsed.lignes?.filter((l: LigneDevis) => mapVerdict(l.verdict) === 'excellent').length || 0
    const lignesCorrect = parsed.lignes?.filter((l: LigneDevis) => mapVerdict(l.verdict) === 'correct').length || 0
    const lignesEleve = parsed.lignes?.filter((l: LigneDevis) => mapVerdict(l.verdict) === 'eleve').length || 0
    const lignesTresEleve = parsed.lignes?.filter((l: LigneDevis) => mapVerdict(l.verdict) === 'tres_eleve').length || 0
    const lignesExcessif = parsed.lignes?.filter((l: LigneDevis) => mapVerdict(l.verdict) === 'excessif').length || 0

    // Pour rétrocompatibilité avec le frontend existant
    const lignesOk = lignesExcellent + lignesCorrect
    const lignesElevees = lignesEleve + lignesTresEleve
    const lignesArnaques = lignesExcessif

    // ══════════════════════════════════════════════════════════════════════════
    // CALCUL CORRECT de la différence (surfacturation)
    // RÈGLE: différence = totalFacture - totalMarche (PAS la somme des écarts!)
    // ══════════════════════════════════════════════════════════════════════════

    const totalFacture = parsed.totalTTC || 0

    // TOUJOURS recalculer le total marché à partir des lignes pour éviter les erreurs de l'IA
    const totalMarcheFromLines = parsed.lignes?.reduce((s: number, l: LigneDevis) => s + (l.prixMarcheEstime || 0), 0) || 0

    // Utiliser le total calculé à partir des lignes (plus fiable que le total global de l'IA)
    const totalMarche = totalMarcheFromLines > 0
      ? totalMarcheFromLines
      : (parsed.totalMarcheEstime || 0)

    // Calcul de la différence : prix facturé - prix marché
    // C'est LA SEULE formule correcte pour calculer l'économie potentielle
    const difference = Math.round((totalFacture - totalMarche) * 100) / 100
    const pourcentage = totalMarche > 0 ? Math.round(((difference / totalMarche) * 100) * 10) / 10 : 0

    // ══════════════════════════════════════════════════════════════════════════
    // VALIDATION CRITIQUE: Détecter prix marché anormalement bas
    // Si ratio < 60%, l'IA a probablement sous-estimé les prix !
    // ══════════════════════════════════════════════════════════════════════════
    const ratioMarcheFacture = totalMarche / totalFacture

    // Log détaillé pour debug et vérification
    console.log('═══════════════════════════════════════════════════')
    console.log('💰 CALCUL DIFFÉRENCE:')
    console.log(`   Prix facturé (totalTTC): ${totalFacture}€`)
    console.log(`   Prix marché (somme lignes): ${totalMarcheFromLines}€`)
    console.log(`   Prix marché (IA global): ${parsed.totalMarcheEstime || 'non fourni'}€`)
    console.log(`   Total marché utilisé: ${totalMarche}€`)
    console.log(`   ➤ DIFFÉRENCE = ${totalFacture} - ${totalMarche} = ${difference}€`)
    console.log(`   ➤ Pourcentage: ${pourcentage}%`)
    console.log(`   📊 Ratio marché/facturé: ${(ratioMarcheFacture * 100).toFixed(1)}%`)
    if (parsed.economiesPotentielles?.montant) {
      console.log(`   ⚠️ Montant retourné par IA: ${parsed.economiesPotentielles.montant}€ (ignoré, on utilise notre calcul)`)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 LOGS DÉTAILLÉS - ANALYSE LIGNE PAR LIGNE (pour debug stabilité)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 DÉTAIL ANALYSE LIGNE PAR LIGNE (MODE STABLE v2.0)')
    console.log('═══════════════════════════════════════════════════════════════')

    parsed.lignes?.forEach((l: LigneDevis, i: number) => {
      const ligneRatio = l.prixMarcheEstime > 0 ? l.totalTTC / l.prixMarcheEstime : 0
      const ecartPct = l.ecartPourcent || 0
      const verdictEmoji = l.verdict === 'excellent' || l.verdict === 'correct' ? '✅' :
                          l.verdict === 'eleve' ? '⚠️' :
                          l.verdict === 'tres_eleve' ? '🟠' : '🔴'

      console.log(`───────────────────────────────────────────────────────────────`)
      console.log(`📦 LIGNE ${i + 1}: ${l.designation}`)
      console.log(`   💰 Prix facturé: ${l.totalTTC}€`)
      console.log(`   📊 Prix marché (médiane réf): ${l.prixMarcheEstime}€`)
      console.log(`   📈 Écart: ${ecartPct > 0 ? '+' : ''}${ecartPct.toFixed(1)}%`)
      console.log(`   ${verdictEmoji} Verdict: ${l.verdict}`)
      if (l.commentaire) {
        console.log(`   💬 Commentaire: ${l.commentaire}`)
      }
    })

    console.log('═══════════════════════════════════════════════════════════════')

    // ALERTE si prix marché suspicieusement bas
    if (ratioMarcheFacture < 0.60 && totalMarche > 0) {
      console.warn('🚨 ALERTE: Prix marché possiblement SOUS-ESTIMÉ!')
      console.warn(`   Le prix marché (${totalMarche}€) est inférieur à 60% du prix facturé (${totalFacture}€)`)
      console.warn('   Cela peut indiquer une sous-estimation des prix par l\'IA')
      console.warn('   Vérifier manuellement les prix des pièces principales')
    } else if (ratioMarcheFacture >= 0.85) {
      console.log('✅ Prix marché cohérent avec prix facturé (ratio >= 85%)')
    }

    // Validation prix marché pas aberrant
    if (totalMarche <= 0) {
      console.error('🚨 ERREUR: Prix marché invalide (<=0)')
    }

    console.log('═══════════════════════════════════════════════════')

    // Mapper le statut pour éviter "arnaque" dans l'affichage
    const mapStatut = (statut: string): 'honnete' | 'reserve' | 'arnaque' => {
      if (statut === 'excessif') return 'arnaque'  // Pour rétrocompat frontend
      if (statut === 'honnete' || statut === 'reserve' || statut === 'arnaque') {
        return statut as 'honnete' | 'reserve' | 'arnaque'
      }
      return 'reserve'
    }

    // Mapper les verdicts de ligne pour l'affichage frontend
    const mapVerdictLigne = (v: string): 'ok' | 'eleve' | 'arnaque' => {
      if (v === 'excellent' || v === 'correct' || v === 'ok') return 'ok'
      if (v === 'eleve' || v === 'tres_eleve') return 'eleve'
      return 'arnaque'  // excessif -> "arnaque" pour rétrocompat (mais texte sera nuancé)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔐 GÉNÉRATION D'UN HASH POUR TRAÇABILITÉ
    // Permet de vérifier si 2 analyses du même devis donnent les mêmes résultats
    // ═══════════════════════════════════════════════════════════════════════════
    const analysisHash = `${totalFacture}-${totalMarche}-${parsed.lignes?.length || 0}`

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🔐 RÉSUMÉ ANALYSE (pour vérification stabilité)')
    console.log(`   Hash analyse: ${analysisHash}`)
    console.log(`   Total facturé: ${totalFacture}€`)
    console.log(`   Total marché: ${totalMarche}€`)
    console.log(`   Différence: ${difference}€ (${pourcentage}%)`)
    console.log(`   Nb lignes: ${parsed.lignes?.length || 0}`)
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📋 Si vous analysez le MÊME devis plusieurs fois,')
    console.log('   les valeurs ci-dessus DOIVENT être IDENTIQUES.')
    console.log('   Variation acceptable: <5%')
    console.log('═══════════════════════════════════════════════════════════════')

    const result = {
      garage: parsed.garage || { nom: 'Non identifié' },
      lignes: (parsed.lignes || []).map((l: LigneDevis) => ({
        designation: l.designation,
        totalTTC: l.totalTTC,
        prixMarche: { moyenne: l.prixMarcheEstime },
        ecart: l.ecartPourcent,
        verdict: mapVerdictLigne(l.verdict),  // Mapping pour rétrocompat
        verdictNuance: l.verdict,  // Nouveau verdict nuancé
        commentaireLigne: l.commentaire || '',  // Commentaire contextuel
        sourceEstimation: 'Prix marché janvier 2026 (médiane Oscaro/Yakarouler)'
      })),
      garageInfo: { nom: parsed.garage?.nom },
      alertes: { graves: [], moyennes: [], info: [] },
      verdict: {
        note: parsed.verdict?.note || 5,
        statut: mapStatut(parsed.verdict?.statut || 'reserve'),
        recommandation: parsed.verdict?.recommandation || '',
        commentaireExpert: parsed.verdict?.commentaireExpert || '',
        lignesOk,
        lignesElevees,
        lignesArnaques,
        // Nouveaux compteurs nuancés
        lignesExcellent,
        lignesCorrect,
        lignesEleve,
        lignesTresEleve,
        lignesExcessif
      },
      totaux: {
        totalFacture,
        totalMarche
      },
      // FIX: Calcul correct = totalFacture - totalMarche (pas la somme des écarts)
      economiesPotentielles: {
        montant: difference,
        pourcentage,
        conseils: parsed.economiesPotentielles?.conseils || []
      },
      // Métadonnées pour debug stabilité
      _debug: {
        version: '2.0-stable',
        analysisHash,
        webSearchEnabled: WEB_SEARCH_ENABLED,
        priceSource: 'MEDIANES_FIXES_JAN2026'
      },
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Note: ${result.verdict.note}/10`)

    return { statusCode: 200, headers, body: JSON.stringify(result) }

  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; error?: { type?: string; message?: string } }

    console.error('═══════════════════════════════════════════════════════════════')
    console.error('💥 ERREUR CRITIQUE - ANALYZE-DEVIS-PRO')
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('Message:', err.message)
    console.error('Status:', err.status)
    console.error('Error type:', err.error?.type)
    console.error('Error message:', err.error?.message)
    console.error('Full error:', JSON.stringify(err, null, 2))
    console.error('Stack:', (error as Error).stack)
    console.error('═══════════════════════════════════════════════════════════════')

    if (err.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Trop de requêtes. Attends 1 minute et réessaie.',
          debug: 'RATE_LIMIT'
        })
      }
    }

    if (err.status === 400) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Erreur avec l\'image. Essaie avec une photo différente.',
          debug: 'BAD_REQUEST',
          details: err.error?.message
        })
      }
    }

    if (err.status === 401 || err.status === 403) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Erreur de configuration serveur. Contacte le support.',
          debug: 'AUTH_ERROR'
        })
      }
    }

    // Erreur de parsing JSON du body
    if (err.message?.includes('JSON')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Données reçues invalides. Recharge la page et réessaie.',
          debug: 'JSON_ERROR'
        })
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur inattendue. Réessaie dans quelques instants.',
        debug: 'SERVER_ERROR',
        details: err.message
      })
    }
  }
}
