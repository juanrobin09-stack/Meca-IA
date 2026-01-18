import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const VIDEO_ANALYSIS_PROMPT = `Tu es un expert mécanicien automobile français avec 30 ans d'expérience. On te montre plusieurs images extraites d'une vidéo filmée par un utilisateur qui a un problème avec sa voiture.

ANALYSE CES IMAGES ATTENTIVEMENT:
- Recherche tout signe visuel de problème (fumée, fuite, rouille, usure, pièce cassée/déformée, voyant allumé)
- L'utilisateur a peut-être filmé un bruit, une vibration, ou un comportement anormal
- Utilise ton expertise pour identifier le problème le plus probable

RÉPONDS EN JSON STRICT (pas de markdown, pas de texte autour):
{
  "description_visuelle": "Description de ce que tu vois sur les images (2-3 phrases)",
  "probleme_identifie": "Nom court du problème identifié",
  "causes_possibles": ["Cause 1", "Cause 2", "Cause 3"],
  "urgence": "faible|moyenne|élevée|critique",
  "pieces_concernees": ["Pièce 1", "Pièce 2"],
  "estimation_cout": {"min": 100, "max": 300},
  "recommandations": "Ce que l'utilisateur doit faire (1-2 phrases)"
}

RÈGLES URGENCE:
- "critique": Sécurité en jeu, ne pas rouler (freins HS, direction défaillante, fumée moteur)
- "élevée": Risque de casse imminente, réparation sous quelques jours
- "moyenne": À réparer dans les semaines à venir
- "faible": Surveillance ou entretien de routine

ESTIMATION COÛT: Prix garage indépendant français (pièces + main d'œuvre), pas concession.

Si les images ne montrent rien de visible, base-toi sur ce que l'utilisateur pourrait filmer (tableau de bord, compartiment moteur, sous le véhicule) et fais une analyse contextuelle.`

interface RequestBody {
  frames: string[] // Array of base64 encoded images
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Check for Authorization header (Supabase JWT)
  const authHeader = event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    const { frames } = JSON.parse(event.body) as RequestBody

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid frames data' }),
      }
    }

    // Build the content array with all frames
    const content: Anthropic.Messages.ContentBlockParam[] = []

    // Add all images first
    for (let i = 0; i < Math.min(frames.length, 5); i++) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: frames[i],
        },
      })
    }

    // Add the analysis prompt
    content.push({
      type: 'text',
      text: VIDEO_ANALYSIS_PROMPT,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's any text around it)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(parsed),
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
    }

    // Fallback response if parsing fails
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        description_visuelle: "Analyse des images en cours. Les éléments visuels sont difficiles à interpréter.",
        probleme_identifie: "Diagnostic visuel non concluant",
        causes_possibles: ["Images peu claires", "Angle de prise de vue insuffisant", "Problème non visible"],
        urgence: "moyenne",
        pieces_concernees: ["À déterminer"],
        estimation_cout: { min: 50, max: 200 },
        recommandations: "Filme à nouveau avec plus de lumière ou consulte un mécanicien pour un diagnostic physique."
      }),
    }
  } catch (error) {
    console.error('Video analysis error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to analyze video' }),
    }
  }
}
