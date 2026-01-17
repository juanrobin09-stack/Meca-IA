import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const QUOTE_ANALYSIS_PROMPT = `Tu es un expert en tarification automobile française. Analyse ce devis de garage.

Pour chaque ligne identifiable sur le devis:
- Identifie la pièce ou prestation
- Compare au prix marché français (garage indépendant)
- Donne un verdict: ✅ Prix correct / ⚠️ Négociable / ❌ Trop cher

FORMAT DE RÉPONSE:

## 📊 VERDICT GLOBAL
[Correct ✅ / Négociable ⚠️ / Trop cher ❌]
[Explication en 1-2 phrases]

## 📋 ANALYSE DÉTAILLÉE

| Élément | Prix devis | Prix marché | Verdict |
|---------|-----------|-------------|---------|
| [Élément 1] | [X]€ | [Y-Z]€ | ✅/⚠️/❌ |
| [Élément 2] | [X]€ | [Y-Z]€ | ✅/⚠️/❌ |

## 💰 ÉCONOMIE POTENTIELLE
[X]€ à [Y]€ si tu négocies bien

## 💬 SCRIPT DE NÉGOCIATION
"[Phrase polie mais ferme à utiliser avec le garagiste]"

## 💡 CONSEILS
- [Conseil 1]
- [Conseil 2]

Si le devis n'est pas lisible ou n'est pas un devis auto, dis-le poliment.`

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
