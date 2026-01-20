import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Handler } from '@netlify/functions'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null

interface RequestBody {
  userId: string
  frameBase64: string
  userQuestion?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

const SYSTEM_PROMPT = `Tu es Alex, un mécanicien expert français avec 15 ans d'expérience.

PERSONNALITÉ :
- Sympa, décontracté, tutoiement
- Parles comme un vrai mécanicien (avec expressions du métier)
- Rassurant mais honnête
- Utilise des emojis naturellement 🔧

ANALYSE VIDÉO :
- Décris ce que tu vois sur l'image de la voiture
- Identifie les problèmes potentiels visibles
- Donne des conseils pratiques
- Demande plus de détails si nécessaire

STYLE DE RÉPONSE :
- RÉPONDS EN 2-3 PHRASES MAX (c'est pour du vocal)
- Sois naturel et conversationnel
- Commence par une observation directe
- Termine par une question ou un conseil

EXEMPLES DE BONNES RÉPONSES :
"Ah je vois ton moteur là ! Tout m'a l'air propre de ce côté. Tu peux me montrer sous le capot côté courroie ?"
"Ouh là, cette fuite d'huile sous le carter ça sent pas bon ça 🔧 Faut pas rouler avec, tu risques de casser le moteur !"
"Nickel tes plaquettes ont encore de la marge ! Par contre approche-toi des disques que je vérifie l'usure."`

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!event.body) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
  }

  try {
    if (!supabase || !anthropic) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
      }
    }

    const { userId, frameBase64, userQuestion, conversationHistory = [] } = JSON.parse(event.body) as RequestBody

    if (!userId || !frameBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId or frameBase64' }),
      }
    }

    // Check premium status (video chat is Premium only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    const isPremium = profile?.subscription_status === 'premium'

    if (!isPremium) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'PREMIUM_REQUIRED',
          message: 'Le chat vidéo est réservé aux membres Premium'
        }),
      }
    }

    // Build messages with history
    const messages: Anthropic.Messages.MessageParam[] = [
      ...conversationHistory.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      {
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: frameBase64
            }
          },
          {
            type: 'text' as const,
            text: userQuestion || "Que vois-tu sur cette image de voiture ? Analyse en tant que mécanicien expert."
          }
        ]
      }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Detect emotion from response
    const lowerText = text.toLowerCase()
    let emotion: 'neutral' | 'happy' | 'thinking' | 'concerned' = 'neutral'

    if (lowerText.includes('attention') || lowerText.includes('urgent') || lowerText.includes('grave') || lowerText.includes('danger')) {
      emotion = 'concerned'
    } else if (lowerText.includes('nickel') || lowerText.includes('parfait') || lowerText.includes('super') || lowerText.includes('👍')) {
      emotion = 'happy'
    } else if (lowerText.includes('hmm') || lowerText.includes('voyons') || lowerText.includes('regardons') || lowerText.includes('montre')) {
      emotion = 'thinking'
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text,
        emotion
      }),
    }

  } catch (error: unknown) {
    console.error('Video analysis error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
    }
  }
}
