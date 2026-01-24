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

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #1 - EXTRACTION LITTÉRALE DES MONTANTS
═══════════════════════════════════════════════════════════════════════════════
Tu DOIS extraire les montants EXACTEMENT comme ils apparaissent sur le devis.
- Si le devis affiche "1562,00€", tu écris 1562€
- JAMAIS d'estimation des montants facturés, JAMAIS d'invention
- Les prix du devis sont SACRÉS et IMMUABLES
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #2 - RECHERCHE WEB OBLIGATOIRE POUR PRIX MARCHÉ
═══════════════════════════════════════════════════════════════════════════════
TU DOIS OBLIGATOIREMENT utiliser search_prices pour CHAQUE pièce/prestation du devis.
NE JAMAIS utiliser uniquement ta mémoire (coupure janvier 2025) - les prix évoluent !

NOMBRE DE RECHERCHES: Fais 4-6 recherches minimum pour couvrir:
- Chaque pièce principale (pare-choc, phare, aile, etc.)
- Chaque prestation MO (carrosserie, peinture, mécanique)
- Consommables (peinture, vernis, apprêt)

REQUÊTES DE RECHERCHE OPTIMALES:
- "[pièce exacte] [marque] [modèle] prix 2026 oscaro"
- "[pièce] prix janvier 2026 yakarouler mister-auto"
- "tarif horaire main d'œuvre carrosserie garage 2026 france"

POUR VOITURES SANS PERMIS (VSP):
Si Aixam, Ligier, Microcar, Chatenet, Bellier:
- Recherche: "[pièce] Aixam prix 2026 piecesanspermis"
- Sites: Piecesanspermis.fr, VSPieces.com, MisterVSP.fr
- ⚠️ Pièces VSP souvent PLUS CHÈRES que voitures normales !

SITES DE RÉFÉRENCE:
- Oscaro.com, Yakarouler.com, Mister-Auto.com, AutoDoc.fr
- Feu-Vert.fr, Norauto.fr (tarifs main d'œuvre)
- Piecesanspermis.fr (VSP)

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #3 - NE PAS SOUS-ESTIMER LES PRIX MARCHÉ
═══════════════════════════════════════════════════════════════════════════════
ERREUR FATALE: Sous-estimer les prix = accuser un garage honnête d'arnaque !

TARIFS MAIN D'ŒUVRE 2026 RÉALISTES (France métropolitaine):
- Mécanique générale: 70-95€/h TTC
- Carrosserie-peinture: 80-110€/h TTC (travail qualifié!)
- Concession/spécialiste: 100-150€/h TTC

EXEMPLES PRIX PIÈCES 2026 (ordre de grandeur):
- Pare-choc origine: 200-450€ (pas 80-100€!)
- Aile avant: 150-350€
- Phare complet: 150-500€
- Peinture + vernis auto: 80-150€/élément

RÈGLE D'OR: En cas de doute, ARRONDIR À LA HAUSSE le prix marché.
Mieux vaut dire "devis correct" que "arnaque" par erreur !
═══════════════════════════════════════════════════════════════════════════════

STRUCTURE EXACTE DE TA RÉPONSE :

## VERDICT
[Ce devis est correct / Ce devis est légèrement élevé / Ce devis est trop cher]

## TOTAL
Total devis: [X]€
Prix marché estimation: [Y-Z]€

## ANALYSE PAR POSTE

[Nom prestation]: [Prix facturé]€ → marché [Prix marché]€ (source: [site])
[Nom prestation 2]: [Prix facturé]€ → marché [Prix marché]€ (source: [site])
(Continue pour chaque ligne identifiable)

## ÉCONOMIE POTENTIELLE
⚠️ CALCUL CRITIQUE:
Différence = Total facturé - Somme des prix marché
NE PAS additionner les écarts individuels!

Différence totale: [Total facturé] - [Total marché] = [X]€

## SCRIPT DE NÉGOCIATION
« [Phrase exacte à dire au garagiste, polie mais ferme] »

## CONSEILS
- [Conseil pratique 1]
- [Conseil pratique 2]

## SOURCES
Prix recherchés le 25 janvier 2026 via: [liste des sources utilisées]

RÈGLES FINALES:
- TOUJOURS faire des recherches web pour les prix actuels 2026
- Ne JAMAIS te baser uniquement sur ta mémoire (coupure janvier 2025)
- Sois RÉALISTE sur les prix (ne pas sous-estimer!)
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
        temperature: 0,  // ⚠️ CRITIQUE: Force extraction DÉTERMINISTE des montants
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
