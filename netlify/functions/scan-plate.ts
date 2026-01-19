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
      model: 'claude-sonnet-4-20250514',
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
            text: `Analyse cette image de véhicule et extrais les informations suivantes.

RÉPONDS UNIQUEMENT en JSON valide, sans texte avant ou après :
{
  "plate": "XX-123-XX ou NON_DETECTE",
  "brand": "Marque du véhicule (Peugeot, Renault, Citroën, etc.) ou null",
  "model": "Modèle (208, Clio, C3, etc.) ou null",
  "year": 2020 ou null (estime l'année basé sur le design),
  "fuel": "Essence ou Diesel ou Électrique ou Hybride ou null",
  "color": "Couleur du véhicule ou null"
}

Sois précis pour la marque et le modèle si tu peux les identifier visuellement.`,
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
