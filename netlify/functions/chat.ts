import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

// Web search function
async function searchWeb(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    return `[Recherche non disponible]`
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=fr`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      }
    )

    if (!response.ok) return `[Recherche échouée]`

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) return `[Aucun résultat]`

    return results.slice(0, 4).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description}\n  Source: ${r.url}`
    ).join('\n\n')
  } catch (error) {
    console.error('Search error:', error)
    return `[Erreur de recherche]`
  }
}

// Tool definition
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'recherche_web',
  description: 'Recherche web pour prix pièces auto, rappels constructeur, forums, tutoriels. Utilise pour infos actualisées.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Requête de recherche en français' }
    },
    required: ['query']
  }
}

const SYSTEM_PROMPT = `Tu es MECAI, assistant expert en diagnostic automobile pour le marché français.

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

CAPACITÉS SPÉCIALES:
✅ Accès RECHERCHE WEB temps réel via l'outil "recherche_web"
✅ Utilise-le pour: prix actuels des pièces, rappels constructeur, problèmes connus, tutoriels

PERSONNALITÉ:
- Français naturel, tutoiement
- Empathique et pédagogue
- Honnête sur tes limites

QUAND UTILISER LA RECHERCHE WEB:
🔍 Prix → "prix [pièce] [marque] [modèle] oscaro 2024"
🔍 Rappels → "rappel [marque] [modèle] [année]"
🔍 Problèmes → "[symptôme] [marque] [modèle] forum"
🔍 Tutoriels → "tuto [opération] [modèle] youtube"

ANALYSE DE PHOTOS:
- Analyse les éléments visibles (voyant, pièce, fuite)
- Mentionne ce que tu vois
- Affine le diagnostic avec les infos visuelles

FORMAT RÉPONSE (après avoir assez d'infos):

## 🔧 Diagnostic probable
[Explication claire, 2-3 phrases]

## ⚠️ Urgence
🟢 Faible / 🟡 Moyen / 🔴 Urgent
[Justification]

## 💰 Estimation prix
[Fourchette]€ (pièces + MO)
*Prix vérifiés via recherche web si disponible*

## 🛠️ DIY
- Difficulté: [1-5]/5
- Temps: [X]h
- Faisable: Oui/Non

## 📦 Pièces (avec liens recherchés)
- [Pièce]: [prix]€
  - Oscaro: [lien]
  - Yakarouler: [lien]

## ⚡ À faire
[2-3 actions concrètes]

---

RÈGLES:
- Si prix demandé → utiliser recherche_web
- Marques FR prioritaires: Peugeot, Renault, Citroën, Dacia
- Prix garage indépendant (pas concession)
- Problème sécurité → 🔴 URGENT
- JAMAIS garantir à 100%
- Concis, pas de blabla

TONALITÉ:
✅ "Ton problème vient sûrement de..."
❌ "Il semblerait que votre véhicule..."`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string
}

interface RequestBody {
  messages: ChatMessage[]
  stream?: boolean
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
    const { messages, stream = false } = JSON.parse(event.body) as RequestBody

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages format' }),
      }
    }

    // Format messages for Anthropic API
    const formattedMessages = messages.map((m) => {
      if (m.image) {
        return {
          role: m.role as 'user' | 'assistant',
          content: [
            {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: 'image/jpeg' as const,
                data: m.image,
              },
            },
            ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
          ],
        }
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }
    })

    // Tool use loop for web search
    let finalText = ''
    let iterations = 0
    const maxIterations = 4
    let currentMessages = [...formattedMessages]

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages: currentMessages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'recherche_web') {
        const input = toolUseBlock.input as { query: string }
        console.log(`[chat] Searching: ${input.query}`)
        const searchResults = await searchWeb(input.query)

        // Add assistant message with tool use
        currentMessages.push({
          role: 'assistant',
          content: response.content,
        })

        // Add tool result
        currentMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: searchResults,
            },
          ],
        })

        continue
      }

      // Extract final response
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        finalText = textBlock.text
      }

      break
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: finalText }),
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get AI response' }),
    }
  }
}
