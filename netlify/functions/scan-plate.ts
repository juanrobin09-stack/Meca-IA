import type { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Vérifier la clé API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is missing')
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured', plate: 'NON_DETECTE' })
    }
  }

  try {
    // Parser le body
    let body
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON', plate: 'NON_DETECTE' }) }
    }

    const { imageBase64, mediaType } = body

    if (!imageBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image required', plate: 'NON_DETECTE' }) }
    }

    console.log('Scan started, image length:', imageBase64.length)

    // Créer le client Anthropic
    const client = new Anthropic({ apiKey })

    // Analyser l'image
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyse cette image de véhicule.

1. Lis la plaque d'immatriculation (format français AA-123-BB)
2. Identifie la marque (Peugeot, Renault, Citroën, etc.)
3. Identifie le modèle (208, Clio, C3, etc.)
4. Estime l'année
5. Devine le carburant

RÉPONDS UNIQUEMENT en JSON valide:
{"plate":"XX-123-XX","brand":"Marque","model":"Modele","year":2020,"fuel":"Essence","color":"Couleur"}

Si pas de plaque visible: {"plate":"NON_DETECTE"}`,
          },
        ],
      }],
    })

    console.log('Claude response received')

    const responseText = (response.content[0] as { type: 'text'; text: string }).text.trim()
    console.log('Response text:', responseText)

    // Parser le JSON
    let vehicleInfo = { plate: 'NON_DETECTE' }
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        vehicleInfo = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('JSON parse error:', e)
    }

    // Normaliser la plaque
    if (vehicleInfo.plate && vehicleInfo.plate !== 'NON_DETECTE') {
      vehicleInfo.plate = vehicleInfo.plate.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    }

    console.log('Final result:', vehicleInfo)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(vehicleInfo),
    }

  } catch (error) {
    console.error('Scan error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Scan failed',
        details: message,
        plate: 'NON_DETECTE'
      }),
    }
  }
}
