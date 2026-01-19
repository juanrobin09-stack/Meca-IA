import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // CORS preflight
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

    // Infos véhicule
    const vehicleInfo = vehicle
      ? `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim()
      : 'Non spécifié'

    // UN SEUL appel API avec tous les frames (max 4 pour rester dans le timeout)
    const framesToAnalyze = frames.slice(0, 4)

    const content: Anthropic.Messages.ContentBlockParam[] = []

    // Ajouter les images
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

    // Ajouter le prompt d'analyse
    content.push({
      type: 'text',
      text: `Tu es un expert mécanicien automobile avec 20 ans d'expérience.
Analyse ces ${framesToAnalyze.length} images extraites d'une vidéo de problème automobile.

VÉHICULE: ${vehicleInfo}
DESCRIPTION UTILISATEUR: ${userDescription || 'Non fournie'}

Analyse ATTENTIVEMENT chaque image et identifie:
- Pièces visibles (moteur, freins, suspension, etc.)
- Anomalies (fuites, usure, rouille, casse, fumée)
- État général

Puis fournis un DIAGNOSTIC COMPLET.

IMPORTANT: Réponds UNIQUEMENT avec ce JSON (pas de markdown):
{
  "frames_analyses": [
    {
      "timestamp": "0:0X",
      "observations": ["observation 1", "observation 2"],
      "anomalies": ["anomalie détectée"],
      "pieces_visibles": ["pièce 1", "pièce 2"]
    }
  ],
  "synthesis": {
    "probleme_principal": "Diagnostic principal",
    "pieces_concernees": ["pièce à réparer/remplacer"],
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
    "recommandations": ["Action recommandée"]
  },
  "verdict": {
    "diagnostic": "Résumé du diagnostic",
    "cout_estime": {
      "pieces": 150,
      "main_oeuvre": 100,
      "total": 250
    },
    "urgence": "critique|important|moyen|faible"
  },
  "confiance": 75
}

RÈGLES URGENCE:
- critique: Sécurité (freins, direction, fumée) → ARRÊT IMMÉDIAT
- important: Risque casse imminente → Réparer sous quelques jours
- moyen: À réparer prochainement
- faible: Surveillance/entretien

Si tu ne vois pas clairement le problème, indique "confiance" basse et recommande un diagnostic physique.`
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
    let result
    try {
      const jsonText = textContent.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      result = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error('Erreur parsing JSON:', parseErr)
      // Fallback si parsing échoue
      result = {
        frames_analyses: [],
        synthesis: {
          probleme_principal: 'Analyse non concluante',
          pieces_concernees: [],
          causes_probables: [],
          urgence: 'moyen',
          peut_rouler: true,
          conditions_roulage: ['Faire vérifier par un professionnel'],
          risques: [],
          recommandations: ['Consulter un mécanicien pour diagnostic physique']
        },
        verdict: {
          diagnostic: 'Images difficiles à analyser',
          cout_estime: { pieces: 0, main_oeuvre: 80, total: 80 },
          urgence: 'moyen'
        },
        confiance: 30
      }
    }

    // Ajouter timestamp
    result.timestamp = new Date().toISOString()

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
