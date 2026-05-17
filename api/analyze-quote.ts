import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'

export const config = { runtime: 'nodejs' }

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return json(res, 401, { error: 'Unauthorized' })

  const { imageBase64 } = req.body as { imageBase64: string }
  if (!imageBase64) return json(res, 400, { error: 'Missing image data' })

  if (!process.env.ANTHROPIC_API_KEY) return json(res, 500, { error: 'Server misconfiguration: missing API key' })
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: QUOTE_ANALYSIS_PROMPT },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return json(res, 200, { content: text })
  } catch (error) {
    console.error('Anthropic API error:', error)
    return json(res, 500, { error: 'Failed to analyze quote' })
  }
}
