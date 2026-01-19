import Anthropic from '@anthropic-ai/sdk'
import type { Context } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface FrameAnalysis {
  timestamp: string
  observations: string[]
  anomalies: string[]
  pieces_visibles: string[]
  etat_general?: string
}

interface Vehicle {
  brand?: string
  model?: string
  year?: number
}

/**
 * Analyse UN frame avec Claude Vision
 */
async function analyzeFrame(
  frameBase64: string,
  frameIndex: number,
  totalFrames: number,
  vehicle?: Vehicle
): Promise<FrameAnalysis> {
  const timestamps = ['0:00', '0:05', '0:10', '0:15', '0:20', 'fin']
  const timestamp = timestamps[Math.min(frameIndex, timestamps.length - 1)]

  const vehicleInfo = vehicle
    ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim()
    : 'Non spécifié'

  const prompt = `Tu es un expert mécanicien automobile avec 20 ans d'expérience, analysant une vidéo de problème automobile.

VÉHICULE : ${vehicleInfo}
FRAME : ${frameIndex + 1}/${totalFrames} (timestamp approximatif: ${timestamp})

Analyse UNIQUEMENT ce que tu VOIS RÉELLEMENT dans cette image :

1. PIÈCES VISIBLES
   Liste TOUTES les pièces automobiles que tu peux identifier avec certitude

2. OBSERVATIONS VISUELLES FACTUELLES
   Décris précisément ce qui est visible (état, position, couleur, forme)
   NE SUPPOSE RIEN - décris seulement ce que tu vois

3. ANOMALIES DÉTECTÉES
   Identifie UNIQUEMENT les anomalies VISIBLES :
   - Fuites (liquide visible, couleur exacte, localisation précise)
   - Usure (pièce endommagée, rouille visible, fissures)
   - Déformation (pièce tordue, cassée, mal positionnée)
   - Traces de surchauffe (brûlures, décoloration)
   - Corrosion, oxydation
   - Câbles/durites endommagés

4. ÉTAT GÉNÉRAL
   Note l'état visible : Propre/Sale, Neuf/Usé, Bon état/Mauvais état

IMPORTANT : Si tu ne peux pas identifier quelque chose avec certitude, ne l'inclus pas.
Sois PRÉCIS et FACTUEL, pas spéculatif.

Retourne UNIQUEMENT ce JSON (pas de markdown, pas de commentaires) :
{
  "pieces_visibles": ["pièce1", "pièce2"],
  "observations": ["observation factuelle 1", "observation factuelle 2"],
  "anomalies": ["anomalie avec localisation précise"],
  "etat_general": "description de l'état général visible"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: frameBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const jsonText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(jsonText)

      return {
        timestamp,
        observations: parsed.observations || [],
        anomalies: parsed.anomalies || [],
        pieces_visibles: parsed.pieces_visibles || [],
        etat_general: parsed.etat_general
      }
    }
  } catch (err) {
    console.error(`Error analyzing frame ${frameIndex}:`, err)
  }

  return {
    timestamp,
    observations: [],
    anomalies: [],
    pieces_visibles: []
  }
}

/**
 * Synthèse globale de tous les frames
 */
async function synthesizeAnalysis(
  frames: FrameAnalysis[],
  vehicle?: Vehicle,
  userDescription?: string
) {
  const vehicleInfo = vehicle
    ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim()
    : 'Non spécifié'

  // Consolider toutes les observations
  const toutesObservations = frames.flatMap(f => f.observations)
  const toutesAnomalies = frames.flatMap(f => f.anomalies)
  const toutesPieces = [...new Set(frames.flatMap(f => f.pieces_visibles))]

  const prompt = `Tu es un expert mécanicien automobile avec 20 ans d'expérience.
Synthétise cette analyse vidéo pour fournir un diagnostic PROFESSIONNEL.

VÉHICULE : ${vehicleInfo}
DESCRIPTION UTILISATEUR : ${userDescription || 'Non fournie'}

OBSERVATIONS PAR FRAME :
${frames.map((f, i) => `
Frame ${i + 1} (${f.timestamp}) :
- Pièces identifiées : ${f.pieces_visibles.join(', ') || 'Aucune'}
- Observations : ${f.observations.join(' | ') || 'Aucune'}
- Anomalies : ${f.anomalies.join(' | ') || 'Aucune'}
- État : ${f.etat_general || 'Non déterminé'}
`).join('\n')}

RÉSUMÉ :
- Total pièces identifiées : ${toutesPieces.join(', ')}
- Total anomalies détectées : ${toutesAnomalies.length}

Fournis un diagnostic PROFESSIONNEL et HONNÊTE.
Si les preuves sont insuffisantes, dis-le clairement.

Retourne UNIQUEMENT ce JSON :
{
  "probleme_principal": "Nom technique exact du problème identifié ou 'Diagnostic incertain - preuves insuffisantes'",
  "pieces_concernees": ["pièce1", "pièce2"],
  "causes_probables": [
    {
      "cause": "Cause la plus probable basée sur les preuves",
      "probabilite": 70,
      "preuves": ["Preuve 1 observée à frame X", "Preuve 2"]
    }
  ],
  "urgence": "critique|important|moyen|faible",
  "peut_rouler": true,
  "conditions_roulage": ["Condition si peut rouler"],
  "risques": ["Risque si continue à rouler sans réparer"],
  "limitations_analyse": ["Limitation 1: ex. angle de vue limité", "Limitation 2: ex. qualité vidéo"],
  "recommandations": ["Recommandation professionnelle 1", "Recommandation 2"]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const jsonText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      return JSON.parse(jsonText)
    }
  } catch (err) {
    console.error('Error in synthesis:', err)
  }

  return {
    probleme_principal: 'Diagnostic non disponible',
    pieces_concernees: toutesPieces,
    causes_probables: [],
    urgence: 'moyen',
    peut_rouler: true,
    conditions_roulage: ['Faire vérifier par un professionnel'],
    risques: [],
    limitations_analyse: ['Erreur lors de l\'analyse'],
    recommandations: ['Consulter un mécanicien pour diagnostic physique']
  }
}

/**
 * Calcule le niveau de confiance (0-100)
 */
function calculerConfiance(frames: FrameAnalysis[]): number {
  let confiance = 40 // Base

  // Bonus si anomalies détectées
  const totalAnomalies = frames.reduce((sum, f) => sum + f.anomalies.length, 0)
  confiance += Math.min(totalAnomalies * 8, 25)

  // Bonus si pièces identifiées
  const totalPieces = [...new Set(frames.flatMap(f => f.pieces_visibles))].length
  confiance += Math.min(totalPieces * 4, 20)

  // Bonus si observations cohérentes
  const totalObservations = frames.reduce((sum, f) => sum + f.observations.length, 0)
  confiance += Math.min(totalObservations * 3, 15)

  return Math.min(Math.max(confiance, 20), 95) // Entre 20 et 95%
}

/**
 * Estime les prix des pièces (prix moyens 2026)
 */
function estimerPrixPieces(pieces: string[]): Array<{
  piece: string
  oscaro: number | null
  yakarouler: number | null
  misterAuto: number | null
  moyenne: number
}> {
  // Prix moyens estimés 2026 pour pièces courantes
  const prixBase: Record<string, number> = {
    'plaquettes de frein': 45,
    'disques de frein': 85,
    'amortisseur': 120,
    'rotule': 35,
    'silent bloc': 25,
    'courroie distribution': 180,
    'pompe à eau': 95,
    'alternateur': 250,
    'démarreur': 180,
    'embrayage': 350,
    'injecteur': 150,
    'bougie': 15,
    'filtre à air': 25,
    'filtre à huile': 12,
    'batterie': 120,
    'radiateur': 180,
    'durite': 45,
    'joint culasse': 450,
    'turbo': 850,
    'vanne EGR': 280,
    'catalyseur': 450,
    'pot échappement': 220,
    'roulement roue': 65,
    'cardan': 180,
    'biellette direction': 45,
    'crémaillère': 380
  }

  return pieces.map(piece => {
    const pieceLower = piece.toLowerCase()
    let prixMoyen = 100 // Prix par défaut

    // Chercher correspondance
    for (const [key, prix] of Object.entries(prixBase)) {
      if (pieceLower.includes(key) || key.includes(pieceLower)) {
        prixMoyen = prix
        break
      }
    }

    // Variation pour simuler différents fournisseurs
    const variation = 0.15
    const oscaro = Math.round(prixMoyen * (1 - variation / 2))
    const yakarouler = Math.round(prixMoyen * (1 + variation / 3))
    const misterAuto = Math.round(prixMoyen * (1 - variation / 3))

    return {
      piece,
      oscaro,
      yakarouler,
      misterAuto,
      moyenne: Math.round((oscaro + yakarouler + misterAuto) / 3)
    }
  })
}

export default async function handler(req: Request, _context: Context) {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const { frames, vehicle, userDescription, userId } = body

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: 'Frames requis pour l\'analyse' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`🎥 Analyse vidéo Pro: ${frames.length} frames à analyser`)

    // 1. Analyser chaque frame
    const frameAnalyses: FrameAnalysis[] = []
    for (let i = 0; i < frames.length; i++) {
      console.log(`📸 Analyse frame ${i + 1}/${frames.length}...`)
      const analysis = await analyzeFrame(frames[i], i, frames.length, vehicle)
      frameAnalyses.push(analysis)
    }

    // 2. Synthèse globale
    console.log('🔬 Synthèse du diagnostic...')
    const synthesis = await synthesizeAnalysis(frameAnalyses, vehicle, userDescription)

    // 3. Calcul confiance
    const confiance = calculerConfiance(frameAnalyses)

    // 4. Estimation prix pièces
    const prixPieces = estimerPrixPieces(synthesis.pieces_concernees || [])

    // 5. Calcul coût total
    const coutPieces = prixPieces.reduce((sum, p) => sum + (p.moyenne || 0), 0)
    const coutMO = synthesis.urgence === 'critique' ? 200 :
                   synthesis.urgence === 'important' ? 150 :
                   synthesis.urgence === 'moyen' ? 100 : 65
    const coutTotal = coutPieces + coutMO

    // 6. Construire résultat final
    const result = {
      frames_analyses: frameAnalyses,
      audio_analysis: {
        bruits_detectes: [] // TODO: analyse audio
      },
      synthesis,
      prix_pieces: prixPieces,
      rappels: null,
      forums_info: null,
      verdict: {
        diagnostic: synthesis.probleme_principal,
        causes: synthesis.causes_probables,
        pieces_a_remplacer: synthesis.pieces_concernees,
        cout_estime: {
          pieces: Math.round(coutPieces),
          main_oeuvre: coutMO,
          total: Math.round(coutTotal)
        },
        urgence: synthesis.urgence,
        peut_rouler: synthesis.peut_rouler,
        conditions_roulage: synthesis.conditions_roulage,
        risques: synthesis.risques,
        recommandations: synthesis.recommandations,
        rappel_constructeur: false
      },
      confiance,
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Analyse terminée - Confiance: ${confiance}%`)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Erreur analyse vidéo:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'analyse vidéo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
