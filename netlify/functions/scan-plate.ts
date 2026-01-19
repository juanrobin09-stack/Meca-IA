import type { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

// Recherche web pour trouver les infos du véhicule depuis la plaque
async function searchPlateInfo(plate: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    return ''
  }

  try {
    // Rechercher les infos du véhicule avec la plaque
    const queries = [
      `"${plate}" véhicule marque modèle`,
      `immatriculation ${plate} france voiture`,
    ]

    let allResults = ''

    for (const query of queries) {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=fr`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': BRAVE_API_KEY
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const results = data.web?.results || []
        allResults += results.map((r: { title: string; description: string }) =>
          `${r.title}: ${r.description}`
        ).join('\n')
      }
    }

    return allResults
  } catch (error) {
    console.error('Search error:', error)
    return ''
  }
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured' }),
    }
  }

  try {
    const { imageBase64, mediaType } = JSON.parse(event.body || '{}')

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image required' }),
      }
    }

    // ÉTAPE 1: Extraire la plaque de l'image
    const plateResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Lis la plaque d'immatriculation sur cette image. Format français: AA-123-BB.
RÉPONDS UNIQUEMENT avec la plaque, rien d'autre. Exemple: EH-723-DM
Si tu ne vois pas de plaque, réponds: NON_DETECTE`,
          },
        ],
      }],
    })

    const plateText = (plateResponse.content[0] as { type: 'text'; text: string }).text.trim().toUpperCase()

    if (!plateText || plateText === 'NON_DETECTE' || plateText.length < 5) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ plate: 'NON_DETECTE' }),
      }
    }

    // Nettoyer la plaque (enlever les espaces, garder le format)
    const cleanPlate = plateText.replace(/[^A-Z0-9-]/g, '')

    // ÉTAPE 2: Rechercher les infos du véhicule sur internet
    const webResults = await searchPlateInfo(cleanPlate)

    // ÉTAPE 3: Analyser l'image + résultats web pour identifier le véhicule
    const analysisPrompt = webResults
      ? `Tu es un expert automobile. Analyse cette image ET les résultats de recherche web pour identifier le véhicule.

PLAQUE DÉTECTÉE: ${cleanPlate}

RÉSULTATS WEB (peuvent contenir les infos du véhicule):
${webResults}

INSTRUCTIONS:
1. Si les résultats web mentionnent la marque/modèle pour cette plaque, utilise ces infos
2. Sinon, identifie visuellement le véhicule (logo, design, silhouette)
3. Estime l'année selon la génération

RÉPONDS UNIQUEMENT en JSON valide:
{"plate":"${cleanPlate}","brand":"Marque","model":"Modèle","year":2020,"fuel":"Essence","color":"Couleur"}`
      : `Tu es un expert automobile. Identifie ce véhicule visuellement.

PLAQUE DÉTECTÉE: ${cleanPlate}

INSTRUCTIONS:
1. Identifie la MARQUE par le logo, la calandre
2. Identifie le MODÈLE par la silhouette, les phares
3. Estime l'ANNÉE selon la génération
4. Devine le CARBURANT

RÉPONDS UNIQUEMENT en JSON valide:
{"plate":"${cleanPlate}","brand":"Marque","model":"Modèle","year":2020,"fuel":"Essence","color":"Couleur"}`

    const vehicleResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: analysisPrompt,
          },
        ],
      }],
    })

    const responseText = (vehicleResponse.content[0] as { type: 'text'; text: string }).text.trim()

    // Parser le JSON
    let vehicleInfo
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        vehicleInfo = JSON.parse(jsonMatch[0])
      } else {
        vehicleInfo = { plate: cleanPlate }
      }
    } catch {
      vehicleInfo = { plate: cleanPlate }
    }

    // S'assurer que la plaque est correcte
    vehicleInfo.plate = cleanPlate

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(vehicleInfo),
    }
  } catch (error) {
    console.error('Scan plate error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur lors du scan' }),
    }
  }
}
