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

DATE ACTUELLE: 25 janvier 2026

CAPACITÉ RECHERCHE WEB:
Tu as accès à l'outil search_prices pour rechercher les prix ACTUELS (2026) sur internet.
IMPORTANT: Fais MAX 3-4 recherches pour les pièces/prestations PRINCIPALES du devis (les plus chères). Pour les petites lignes, utilise tes connaissances.

REQUÊTES DE RECHERCHE À UTILISER:
- "[pièce] [marque] [modèle] prix 2026 oscaro"
- "[pièce] prix janvier 2026 yakarouler"
- "tarif horaire main d'œuvre [mécanique/carrosserie] 2026 france"

SITES DE RÉFÉRENCE:
- Oscaro.com (leader France pièces auto)
- Yakarouler.com
- Mister-Auto.com
- AutoDoc.fr
- Feu-Vert.fr (tarifs main d'œuvre)

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
⚠️ CALCUL CRITIQUE:
Différence = Total facturé - Somme des prix marché
Exemple: 1562€ - 1315€ = 247€
NE PAS additionner les écarts individuels!

Différence totale: [Total facturé] - [Total marché] = [X]€
Tu peux économiser [X]€ en négociant.

## SCRIPT DE NÉGOCIATION
« [Phrase exacte à dire au garagiste, polie mais ferme, mentionnant les prix du marché] »

## CONSEILS
- [Conseil pratique 1 pour négocier]
- [Conseil pratique 2]
- [Conseil 3 si pertinent]

## SOURCES
Prix recherchés le 25 janvier 2026 via: [liste des sources utilisées]

RÈGLES :
- TOUJOURS faire des recherches web pour les prix actuels 2026
- Ne JAMAIS te baser uniquement sur ta mémoire (coupure janvier 2025)
- Tarifs main d'œuvre 2026 : 70-100€/h (garage indépendant), 90-140€/h (concession)
- Sois précis sur les écarts de prix
- Si image illisible ou pas un devis auto, dis-le clairement`

// Tool definition for web search
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'search_prices',
  description: `Recherche les prix actuels (janvier 2026) des pièces auto et prestations garage sur le web français.
OBLIGATOIRE: Utilise cet outil pour CHAQUE pièce ou prestation du devis.
Sites de référence: Oscaro.com, Yakarouler.com, Mister-Auto.com, AutoDoc.fr, Feu-Vert.fr`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'La requête de recherche (ex: "plaquettes frein Peugeot 308 prix 2026 oscaro" ou "tarif horaire carrosserie garage 2026 france")'
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

    // Tool use loop - limit to 4 searches to stay under 60s timeout
    let finalText = ''
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
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
