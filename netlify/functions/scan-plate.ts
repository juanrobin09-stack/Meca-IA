import type { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    // Extraire la plaque ET identifier le véhicule
    const response = await client.messages.create({
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
            text: `Tu es un expert automobile. Analyse cette image et identifie le véhicule.

INSTRUCTIONS IMPORTANTES:
1. Lis la plaque d'immatriculation (format français AA-123-BB)
2. Identifie la MARQUE par le logo, la calandre, le design
3. Identifie le MODÈLE par la forme, les phares, la silhouette
4. Estime l'ANNÉE selon la génération du modèle
5. Devine le CARBURANT (diesel si SUV/berline, essence si citadine)

RÉPONDS UNIQUEMENT en JSON valide :
{"plate":"EH-723-DM","brand":"Peugeot","model":"308","year":2021,"fuel":"Diesel","color":"Gris"}

Si tu vois une Peugeot, identifie si c'est 208, 308, 2008, 3008, 508, etc.
Si tu vois une Renault, identifie si c'est Clio, Megane, Captur, Arkana, etc.
ESSAIE TOUJOURS de deviner le modèle même si tu n'es pas sûr à 100%.`,
          },
        ],
      }],
    })

    const responseText = (response.content[0] as { type: 'text'; text: string }).text.trim()

    // Parser le JSON
    let vehicleInfo
    try {
      // Essayer de trouver le JSON dans la réponse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        vehicleInfo = JSON.parse(jsonMatch[0])
      } else {
        vehicleInfo = { plate: 'NON_DETECTE' }
      }
    } catch {
      // Si le parsing échoue, extraire juste la plaque
      vehicleInfo = { plate: responseText.toUpperCase() }
    }

    // Normaliser la plaque
    if (vehicleInfo.plate) {
      vehicleInfo.plate = vehicleInfo.plate.toUpperCase().trim()
    }

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
