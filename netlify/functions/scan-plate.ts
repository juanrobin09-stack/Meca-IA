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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
            text: "Extrait le numéro de plaque d'immatriculation française de cette image. Format attendu: XX-123-XX ou ancien format. Réponds UNIQUEMENT avec le numéro de plaque, rien d'autre. Si tu ne vois pas de plaque, réponds 'NON_DETECTE'.",
          },
        ],
      }],
    })

    const extractedPlate = (response.content[0] as { type: 'text'; text: string }).text.trim().toUpperCase()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ plate: extractedPlate }),
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
