import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Brave Search API for real-time price verification
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

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

    if (!response.ok) {
      return `[Recherche échouée]`
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return `[Aucun résultat]`
    }

    return results.slice(0, 3).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description} (${r.url})`
    ).join('\n')
  } catch (error) {
    console.error('Search error:', error)
    return `[Erreur de recherche]`
  }
}

// Tool definition for web search
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'search_auto',
  description: 'Recherche sur le web français: prix pièces (Oscaro, Yakarouler), rappels constructeur, problèmes connus sur forums, bulletins techniques.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'La requête (ex: "prix alternateur Renault Clio 3 2024", "rappel Peugeot 208 2015", "problème bruit frein 308 forum")'
      }
    },
    required: ['query']
  }
}

const VIDEO_ANALYSIS_PROMPT = `Tu es un expert mécanicien automobile français avec 30 ans d'expérience. On te montre plusieurs images extraites d'une vidéo filmée par un utilisateur qui a un problème avec sa voiture.

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

CAPACITÉS:
✅ Analyse visuelle des images
✅ Recherche web temps réel (prix actuels, rappels, problèmes connus)

INSTRUCTIONS:
1. Analyse ATTENTIVEMENT les images (fumée, fuite, usure, voyant, pièce endommagée)
2. Utilise l'outil search_auto pour:
   - Chercher les prix ACTUELS des pièces identifiées
   - Vérifier s'il y a des rappels constructeur
   - Chercher des problèmes connus sur ce type de véhicule/symptôme

RÉPONDS EN JSON STRICT (pas de markdown, pas de texte autour):
{
  "description_visuelle": "Ce que tu vois RÉELLEMENT sur les images (2-3 phrases)",
  "probleme_identifie": "Nom du problème identifié",
  "causes_possibles": ["Cause 1", "Cause 2", "Cause 3"],
  "urgence": "faible|moyenne|élevée|critique",
  "pieces_concernees": ["Pièce 1", "Pièce 2"],
  "estimation_cout": {"min": 100, "max": 300},
  "recommandations": "Actions à faire (1-2 phrases)",
  "sources_prix": ["Source 1", "Source 2"],
  "rappel_constructeur": "OUI/NON + détails si trouvé"
}

RÈGLES URGENCE:
- "critique": Sécurité en jeu (freins, direction, fumée moteur) → ARRÊT IMMÉDIAT
- "élevée": Risque casse imminente → Réparer sous quelques jours
- "moyenne": À réparer prochainement
- "faible": Surveillance/entretien routine

ESTIMATION COÛT: Utilise les VRAIS prix trouvés via recherche web (Oscaro, Yakarouler, etc.)`

interface RequestBody {
  frames: string[] // Array of base64 encoded images
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
    const { frames } = JSON.parse(event.body) as RequestBody

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid frames data' }),
      }
    }

    // Build the content array with all frames
    const initialContent: Anthropic.Messages.ContentBlockParam[] = []

    // Add all images first (max 5)
    for (let i = 0; i < Math.min(frames.length, 5); i++) {
      initialContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: frames[i],
        },
      })
    }

    // Add the analysis prompt
    initialContent.push({
      type: 'text',
      text: VIDEO_ANALYSIS_PROMPT,
    })

    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: 'user',
        content: initialContent,
      },
    ]

    // Tool use loop - allow up to 5 search calls
    let finalText = ''
    let iterations = 0
    const maxIterations = 6

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'search_auto') {
        const input = toolUseBlock.input as { query: string }
        console.log(`[analyze-video] Searching: ${input.query}`)
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

      // Extract final text
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        finalText = textBlock.text
      }

      break
    }

    // Parse the JSON response
    try {
      const jsonMatch = finalText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(parsed),
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
    }

    // Fallback response if parsing fails
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        description_visuelle: "Analyse des images en cours. Les éléments visuels sont difficiles à interpréter.",
        probleme_identifie: "Diagnostic visuel non concluant",
        causes_possibles: ["Images peu claires", "Angle de prise de vue insuffisant", "Problème non visible"],
        urgence: "moyenne",
        pieces_concernees: ["À déterminer"],
        estimation_cout: { min: 50, max: 200 },
        recommandations: "Filme à nouveau avec plus de lumière ou consulte un mécanicien pour un diagnostic physique.",
        sources_prix: [],
        rappel_constructeur: "Non vérifié"
      }),
    }
  } catch (error) {
    console.error('Video analysis error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to analyze video' }),
    }
  }
}
