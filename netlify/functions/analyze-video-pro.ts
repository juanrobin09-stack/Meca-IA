import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

// Prix moyens estimés 2026 pour pièces courantes
const PRIX_PIECES: Record<string, number> = {
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

function estimerPrixPiece(piece: string): number {
  const pieceLower = piece.toLowerCase()
  for (const [key, prix] of Object.entries(PRIX_PIECES)) {
    if (pieceLower.includes(key) || key.includes(pieceLower)) {
      return prix
    }
  }
  return 100 // Prix par défaut
}

function genererPrixPieces(pieces: string[]) {
  return pieces.map(piece => {
    const prixMoyen = estimerPrixPiece(piece)
    const variation = 0.15
    return {
      piece,
      oscaro: Math.round(prixMoyen * (1 - variation / 2)),
      yakarouler: Math.round(prixMoyen * (1 + variation / 3)),
      misterAuto: Math.round(prixMoyen * (1 - variation / 3)),
      moyenne: prixMoyen
    }
  })
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Corps de requête manquant' })
    }
  }

  try {
    const { frames, vehicle, userDescription } = JSON.parse(event.body)

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Frames requis pour l\'analyse' })
      }
    }

    console.log(`🎥 Analyse vidéo: ${frames.length} frames`)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const vehicleInfo = vehicle
      ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim()
      : 'Non spécifié'

    // Max 4 frames pour rester dans le timeout
    const framesToAnalyze = frames.slice(0, 4)

    const content: Anthropic.Messages.ContentBlockParam[] = []

    for (let i = 0; i < framesToAnalyze.length; i++) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: framesToAnalyze[i]
        }
      })
    }

    content.push({
      type: 'text',
      text: `Tu es un expert mécanicien automobile avec 20 ans d'expérience.
Analyse ces ${framesToAnalyze.length} images extraites d'une vidéo de problème automobile.

VÉHICULE: ${vehicleInfo}
DESCRIPTION UTILISATEUR: ${userDescription || 'Non fournie'}

Analyse ATTENTIVEMENT chaque image et fournis un diagnostic COMPLET.

IMPORTANT: Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour):
{
  "frames_analyses": [
    {
      "timestamp": "0:0X",
      "observations": ["observation 1"],
      "anomalies": ["anomalie détectée"],
      "pieces_visibles": ["pièce 1"],
      "etat_general": "description état"
    }
  ],
  "probleme_principal": "Diagnostic principal en une phrase",
  "pieces_concernees": ["pièce à remplacer 1", "pièce 2"],
  "causes_probables": [
    {
      "cause": "Cause probable",
      "probabilite": 70,
      "preuves": ["Preuve visible"]
    }
  ],
  "urgence": "critique|important|moyen|faible",
  "peut_rouler": true,
  "conditions_roulage": ["Condition si peut rouler"],
  "risques": ["Risque si pas réparé"],
  "limitations_analyse": ["Limitation 1: qualité vidéo", "Limitation 2: angle limité"],
  "recommandations": ["Action recommandée 1", "Action 2"],
  "cout_pieces": 150,
  "cout_main_oeuvre": 100,
  "confiance": 65
}

RÈGLES URGENCE:
- critique: Sécurité (freins, direction, fumée) → ARRÊT IMMÉDIAT
- important: Risque casse imminente → Réparer sous quelques jours
- moyen: À réparer prochainement
- faible: Surveillance/entretien

Si tu ne vois pas clairement le problème, mets confiance < 50 et recommande un diagnostic physique.`
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content
      }]
    })

    const textContent = response.content[0]
    if (textContent.type !== 'text') {
      throw new Error('Réponse inattendue de l\'IA')
    }

    // Parser le JSON
    let parsed
    try {
      const jsonText = textContent.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error('Erreur parsing JSON:', parseErr)
      parsed = {
        frames_analyses: [],
        probleme_principal: 'Analyse non concluante - images difficiles à interpréter',
        pieces_concernees: [],
        causes_probables: [{ cause: 'Impossible à déterminer', probabilite: 20, preuves: ['Images peu claires'] }],
        urgence: 'moyen',
        peut_rouler: true,
        conditions_roulage: ['Faire vérifier par un professionnel'],
        risques: ['Aggravation possible du problème'],
        limitations_analyse: ['Qualité vidéo insuffisante', 'Problème non visible sur les images'],
        recommandations: ['Consulter un mécanicien pour diagnostic physique'],
        cout_pieces: 0,
        cout_main_oeuvre: 80,
        confiance: 25
      }
    }

    // Générer les prix des pièces
    const prix_pieces = genererPrixPieces(parsed.pieces_concernees || [])
    const coutPieces = parsed.cout_pieces || prix_pieces.reduce((sum, p) => sum + p.moyenne, 0)
    const coutMO = parsed.cout_main_oeuvre || 100
    const coutTotal = coutPieces + coutMO

    // Construire le résultat au format VideoAnalysisResult complet
    const result = {
      frames_analyses: parsed.frames_analyses || [],
      audio_analysis: {
        bruits_detectes: []
      },
      synthesis: {
        probleme_principal: parsed.probleme_principal,
        pieces_concernees: parsed.pieces_concernees || [],
        causes_probables: parsed.causes_probables || [],
        urgence: parsed.urgence || 'moyen',
        peut_rouler: parsed.peut_rouler ?? true,
        conditions_roulage: parsed.conditions_roulage || [],
        risques: parsed.risques || [],
        limitations_analyse: parsed.limitations_analyse || ['Analyse basée uniquement sur les images fournies'],
        recommandations: parsed.recommandations || []
      },
      prix_pieces,
      rappels: null,
      forums_info: null,
      verdict: {
        diagnostic: parsed.probleme_principal,
        causes: parsed.causes_probables || [],
        pieces_a_remplacer: parsed.pieces_concernees || [],
        cout_estime: {
          pieces: Math.round(coutPieces),
          main_oeuvre: coutMO,
          total: Math.round(coutTotal)
        },
        urgence: parsed.urgence || 'moyen',
        peut_rouler: parsed.peut_rouler ?? true,
        conditions_roulage: parsed.conditions_roulage || [],
        risques: parsed.risques || [],
        recommandations: parsed.recommandations || [],
        rappel_constructeur: false
      },
      confiance: parsed.confiance || 50,
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Analyse terminée - Confiance: ${result.confiance}%`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }

  } catch (error) {
    console.error('Erreur analyse vidéo:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de l\'analyse vidéo. Réessaie avec moins de frames ou une vidéo plus courte.'
      })
    }
  }
}
