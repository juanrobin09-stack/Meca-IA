import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Brave Search API for real-time price verification
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

async function searchWeb(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    return `[Recherche non disponible - clé API manquante]`
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

    if (!response.ok) {
      console.error('Brave Search error:', response.status)
      return `[Recherche échouée]`
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return `[Aucun résultat trouvé]`
    }

    // Format results for the AI
    return results.slice(0, 3).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description} (${r.url})`
    ).join('\n')
  } catch (error) {
    console.error('Search error:', error)
    return `[Erreur de recherche]`
  }
}

const QUOTE_ANALYSIS_PROMPT = `Tu es un expert en tarification automobile française avec 20 ans d'expérience. Analyse ce devis de garage.

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

CAPACITÉ: Tu as accès à des recherches web en temps réel pour vérifier les prix actuels.

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

## SOURCES
[Liste les sources de prix utilisées si recherche web effectuée]

RÈGLES :
- Utilise les résultats de recherche web pour les prix actuels
- Compare aux prix moyens France (garage indépendant)
- Main d'œuvre normale : 50-70€/h (80-100€/h réseau constructeur)
- Sois précis sur les écarts de prix
- Si image illisible ou pas un devis auto, dis-le clairement`

// Tool definition for web search
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'search_prices',
  description: 'Recherche les prix actuels des pièces auto et prestations garage sur le web français (Oscaro, Yakarouler, forums). Utilise cet outil pour chaque pièce ou prestation du devis.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'La requête de recherche (ex: "prix plaquettes frein Peugeot 308 2024" ou "tarif vidange garage France 2024")'
      }
    },
    required: ['query']
  }
}

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

    // Initial message with image
    const messages: Anthropic.Messages.MessageParam[] = [
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
    ]

    // Tool use loop - allow up to 5 search calls
    let finalText = ''
    let iterations = 0
    const maxIterations = 6

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2048,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'search_prices') {
        // Execute the search
        const input = toolUseBlock.input as { query: string }
        console.log(`[analyze-quote] Searching: ${input.query}`)
        const searchResults = await searchWeb(input.query)

        // Add assistant message with tool use
        messages.push({
          role: 'assistant',
          content: response.content,
        })

        // Add tool result
        messages.push({
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

      // No more tool calls, extract final text
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
      body: JSON.stringify({ error: 'Failed to analyze quote' }),
    }
  }
}
