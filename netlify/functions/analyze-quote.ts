import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const QUOTE_ANALYSIS_PROMPT = `Tu es un expert en tarification automobile française avec 20 ans d'expérience. Analyse ce devis de garage.

STRUCTURE EXACTE DE TA RÉPONSE :

## VERDICT
[Ce devis est correct / Ce devis est négociable / Ce devis est trop cher]

## TOTAL
Total devis: [X]€
Prix marché estimation: [Y-Z]€

## ANALYSE PAR POSTE

[Nom prestation]: [Prix facturé]€ → marché [Prix marché]€
[Nom prestation 2]: [Prix facturé]€ → marché [Prix marché]€
(Continue pour chaque ligne identifiable)

## ÉCONOMIE POTENTIELLE
Tu peux économiser [X]€ à [Y]€ en négociant.

## SCRIPT DE NÉGOCIATION
« [Phrase exacte à dire au garagiste, polie mais ferme, mentionnant les prix du marché] »

## CONSEILS
- [Conseil pratique 1 pour négocier]
- [Conseil pratique 2]
- [Conseil 3 si pertinent]

RÈGLES :
- Compare aux prix moyens France 2024 (garage indépendant)
- Main d'œuvre normale : 50-70€/h (80-100€/h réseau constructeur)
- Sois précis sur les écarts de prix
- Si image illisible ou pas un devis auto, dis-le clairement`

interface RequestBody {
  imageBase64: string
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
    const { imageBase64 } = JSON.parse(event.body) as RequestBody

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing image data' }),
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: QUOTE_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: text }),
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to analyze quote' }),
    }
  }
}
