import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Handler } from '@netlify/functions'

// Validate environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

// Only create clients if env vars exist
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null

// Diagnostic phases
const MAX_COLLECTION_MESSAGES = 6 // After this, force diagnostic

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

// Tool definitions
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

// Tool for generating final diagnosis - AI calls this when it has enough info
const generateDiagnosisTool: Anthropic.Messages.Tool = {
  name: 'generate_final_diagnosis',
  description: `APPELLE CET OUTIL quand tu as collecté assez d'infos (après 2-4 échanges) pour générer le diagnostic final structuré.
Tu DOIS appeler cet outil avant de donner ton diagnostic complet. Ne génère JAMAIS le diagnostic dans le chat directement.
Appelle cet outil quand tu connais: le symptôme principal, les conditions d'apparition, et idéalement le véhicule.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      diagnosis_summary: {
        type: 'string',
        description: 'Résumé concis du problème identifié (1-2 phrases)'
      },
      urgency_level: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'low=peut attendre, medium=à traiter rapidement, high=urgent/sécurité'
      },
      estimated_cost_min: {
        type: 'number',
        description: 'Coût minimum estimé en euros (pièces + main d\'oeuvre)'
      },
      estimated_cost_max: {
        type: 'number',
        description: 'Coût maximum estimé en euros'
      },
      confidence_percent: {
        type: 'number',
        description: 'Niveau de confiance du diagnostic (0-100)'
      },
      problem_identified: {
        type: 'string',
        description: 'Description technique précise du problème'
      },
      causes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Causes possibles classées par probabilité'
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Actions recommandées par ordre de priorité'
      },
      diy_difficulty: {
        type: 'number',
        description: 'Difficulté réparation soi-même (1=facile à 5=pro requis)'
      },
      parts_needed: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price_estimate: { type: 'string' }
          }
        },
        description: 'Pièces nécessaires avec prix estimés'
      }
    },
    required: ['diagnosis_summary', 'urgency_level', 'estimated_cost_min', 'estimated_cost_max', 'confidence_percent', 'problem_identified', 'causes', 'recommendations']
  }
}

// Type for the diagnosis tool input
interface FinalDiagnosisInput {
  diagnosis_summary: string
  urgency_level: 'low' | 'medium' | 'high'
  estimated_cost_min: number
  estimated_cost_max: number
  confidence_percent: number
  problem_identified: string
  causes: string[]
  recommendations: string[]
  diy_difficulty?: number
  parts_needed?: Array<{ name: string; price_estimate: string }>
}

// Function to generate the system prompt with memory context
function generateSystemPrompt(memoryContext?: string, messageCount?: number, forceFinalize?: boolean): string {
  const shouldFinalize = forceFinalize || (messageCount && messageCount >= MAX_COLLECTION_MESSAGES)

  const basePrompt = `Tu es MECAI, EXPERT EN DIAGNOSTIC AUTOMOBILE professionnel pour le marché français.

═══════════════════════════════════════════════════════════════
                    MODE: DIAGNOSTIC IA EXPERT
═══════════════════════════════════════════════════════════════

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} (2026)

TON RÔLE:
- Expert médical automobile formel et structuré
- Analyse technique et précise
- Rapport professionnel exportable
- Utilise l'historique utilisateur pour affiner le diagnostic

${memoryContext ? `
═══════════════════════════════════════════════════════════════
                MÉMOIRE DE CET UTILISATEUR
═══════════════════════════════════════════════════════════════
${memoryContext}
` : ''}

═══════════════════════════════════════════════════════════════
          ⚠️ FLUX DE DIAGNOSTIC - TRÈS IMPORTANT ⚠️
═══════════════════════════════════════════════════════════════

Tu DOIS suivre ce flux en 2 phases:

📋 PHASE 1: COLLECTE D'INFORMATIONS (2-4 questions max)
- Pose des questions courtes et précises
- Symptôme principal ? Conditions d'apparition ? Véhicule ?
- UNE question à la fois, pas de listes
- Ton conversationnel mais professionnel

🔬 PHASE 2: DIAGNOSTIC FINAL
- Quand tu as assez d'infos, APPELLE L'OUTIL "generate_final_diagnosis"
- Tu DOIS utiliser cet outil pour générer le diagnostic
- NE GÉNÈRE JAMAIS le diagnostic directement dans le chat
- L'outil va créer le rapport structuré automatiquement

${shouldFinalize ? `
⚠️ ATTENTION: ${forceFinalize ? "L'utilisateur demande son diagnostic MAINTENANT" : "Tu as atteint la limite de questions"}.
Tu DOIS appeler l'outil "generate_final_diagnosis" immédiatement avec les infos collectées.
Fais ton meilleur diagnostic avec ce que tu sais.
` : ''}

QUAND APPELER generate_final_diagnosis:
✅ Tu connais le symptôme principal
✅ Tu sais quand/comment ça se produit
✅ Tu as une idée du véhicule (ou l'utilisateur ne le sait pas)
✅ Après 2-4 échanges de questions

═══════════════════════════════════════════════════════════════
                    CAPACITÉS SPÉCIALES
═══════════════════════════════════════════════════════════════

✅ Accès RECHERCHE WEB temps réel via l'outil "recherche_web"
✅ Prix actuels 2026 des pièces auto
✅ Rappels constructeur en vigueur
✅ Problèmes connus sur forums
✅ Tutoriels et guides techniques

QUAND UTILISER LA RECHERCHE WEB:
🔍 Prix → "prix [pièce] [marque] [modèle] oscaro 2026"
🔍 Rappels → "rappel [marque] [modèle] [année] 2026"
🔍 Problèmes → "[symptôme] [marque] [modèle] forum 2026"
🔍 Tutoriels → "tuto [opération] [modèle] youtube"

Tu peux utiliser la recherche web AVANT de finaliser le diagnostic pour obtenir des prix précis.

═══════════════════════════════════════════════════════════════
                    UTILISATION DE LA MÉMOIRE
═══════════════════════════════════════════════════════════════

IMPORTANT: Si l'utilisateur a un historique, tu DOIS:
1. Faire des LIENS avec les problèmes passés similaires
2. VÉRIFIER si une pièce a déjà été changée récemment
3. DÉTECTER les problèmes récurrents (patterns)
4. ADAPTER ton diagnostic en fonction de l'historique
5. MENTIONNER si le problème était déjà apparu avant

═══════════════════════════════════════════════════════════════
                    ANALYSE DE PHOTOS
═══════════════════════════════════════════════════════════════

- Analyse minutieusement tous les éléments visibles
- Identifie: voyants, pièces usées, fuites, corrosion, dommages
- Décris précisément ce que tu observes
- Lie les observations visuelles au diagnostic

═══════════════════════════════════════════════════════════════
                    RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

1. TON PROFESSIONNEL ET FORMEL
   - Tutoiement accepté
   - Terminologie technique précise
   - Pas d'emojis excessifs (juste les indicateurs visuels)
   - Chiffres et données concrètes

2. TRANSPARENCE
   - Indique TOUJOURS le niveau de confiance dans le diagnostic
   - Mentionne tes sources (historique, recherche web)
   - Admets les incertitudes
   - JAMAIS garantir à 100%

3. SÉCURITÉ PRIORITAIRE
   - Problème de sécurité → urgency_level: "high"
   - Conseiller l'arrêt si dangereux
   - Expliquer les risques clairement

4. DONNÉES ACTUALISÉES
   - Prix 2026 via recherche web
   - Marques FR prioritaires: Peugeot, Renault, Citroën, Dacia
   - Prix garage indépendant (pas concessionnaire)

═══════════════════════════════════════════════════════════════
                    EXEMPLES DE CONVERSATION
═══════════════════════════════════════════════════════════════

👤 User: "Ma voiture fait un bruit bizarre"
🤖 Toi: "D'accord, peux-tu me décrire ce bruit ? C'est plutôt un grincement, un claquement, un sifflement ?"

👤 User: "Un grincement au freinage"
🤖 Toi: "Ça se produit uniquement au freinage ou aussi en roulant ? Le matin au démarrage ou tout le temps ?"

👤 User: "Surtout le matin, puis ça disparaît après quelques freinages"
🤖 Toi: "OK, c'est assez caractéristique. C'est quel véhicule ? (marque, modèle, année si possible)"

👤 User: "Clio 4, 2015"
🤖 [APPELLE generate_final_diagnosis avec les données collectées]`

  return basePrompt
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string
}

interface RequestBody {
  messages: ChatMessage[]
  stream?: boolean
  memoryContext?: string
  diagnosticId?: string // For saving to DB
  forceFinalize?: boolean // User clicked "Get diagnosis" button
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
    // Check if clients are initialized
    if (!anthropic) {
      console.error('Missing Anthropic API key')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        }),
      }
    }

    const { messages, memoryContext, diagnosticId, forceFinalize } = JSON.parse(event.body) as RequestBody

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages format' }),
      }
    }

    // Count user messages to know if we should force finalization
    const userMessageCount = messages.filter(m => m.role === 'user').length

    // Generate system prompt with memory context and message count
    const systemPrompt = generateSystemPrompt(memoryContext, userMessageCount, forceFinalize)

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

    // Build tools array
    const tools: Anthropic.Messages.Tool[] = [generateDiagnosisTool]
    if (BRAVE_API_KEY) {
      tools.push(webSearchTool)
    }

    // Tool use loop
    let finalText = ''
    let finalDiagnosis: FinalDiagnosisInput | null = null
    let iterations = 0
    const maxIterations = 6 // Allow more iterations for web search + diagnosis
    const currentMessages = [...formattedMessages]

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock) {
        // Handle web search tool
        if (toolUseBlock.name === 'recherche_web') {
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

        // Handle generate_final_diagnosis tool
        if (toolUseBlock.name === 'generate_final_diagnosis') {
          finalDiagnosis = toolUseBlock.input as FinalDiagnosisInput
          console.log(`[chat] Generating final diagnosis:`, finalDiagnosis.diagnosis_summary)

          // Save to database if we have diagnosticId and supabase client
          if (diagnosticId && supabase) {
            try {
              const { error: updateError } = await supabase
                .from('diagnostics')
                .update({
                  diagnosis_summary: finalDiagnosis.diagnosis_summary,
                  urgency_level: finalDiagnosis.urgency_level,
                  estimated_cost_min: finalDiagnosis.estimated_cost_min,
                  estimated_cost_max: finalDiagnosis.estimated_cost_max,
                  updated_at: new Date().toISOString()
                })
                .eq('id', diagnosticId)

              if (updateError) {
                console.error('Error updating diagnostic:', updateError)
              } else {
                console.log(`[chat] Saved diagnosis to DB for diagnostic ${diagnosticId}`)
              }
            } catch (dbError) {
              console.error('Database error:', dbError)
            }
          }

          // Add assistant message with tool use
          currentMessages.push({
            role: 'assistant',
            content: response.content,
          })

          // Add tool result to get the final formatted response
          currentMessages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: 'Diagnostic enregistré. Génère maintenant une réponse finale pour l\'utilisateur avec le diagnostic complet formaté.',
              },
            ],
          })

          continue
        }
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

    // Return response with diagnosis data if available
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: finalText,
        diagnosis: finalDiagnosis,
        phase: finalDiagnosis ? 'completed' : 'collecting'
      }),
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
