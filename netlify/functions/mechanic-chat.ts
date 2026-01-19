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

const FREE_MESSAGES_LIMIT_PER_DAY = 10

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

    if (!response.ok) {
      return `[Recherche échouée]`
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return `[Aucun résultat]`
    }

    return results.slice(0, 4).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description}\n  Source: ${r.url}`
    ).join('\n\n')
  } catch (error) {
    console.error('Search error:', error)
    return `[Erreur de recherche]`
  }
}

// Tool definition for web search
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'recherche_web',
  description: 'Recherche sur le web français pour: prix pièces auto (Oscaro, Yakarouler, Mister Auto), rappels constructeur, problèmes connus sur forums, garages recommandés, tutoriels YouTube. Utilise cet outil quand tu as besoin d\'informations actualisées.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'La requête de recherche en français'
      }
    },
    required: ['query']
  }
}

interface RequestBody {
  userId: string
  conversationId: string
  message: string
  vehicleId?: string
}

interface VehicleContext {
  vehicle?: {
    brand: string
    model: string
    year: number
    fuel_type: string
    mileage: number
  }
  recent_diagnostics?: Array<{
    problem_description: string
    diagnosis_summary: string
    created_at: string
  }>
  forecast?: unknown
}

async function buildContext(userId: string, vehicleId?: string): Promise<VehicleContext> {
  const context: VehicleContext = {}

  if (vehicleId) {
    // Véhicule
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('brand, model, year, fuel_type, mileage')
      .eq('id', vehicleId)
      .single()

    if (vehicle) {
      context.vehicle = vehicle
    }

    // Derniers diagnostics
    const { data: diagnostics } = await supabase
      .from('diagnostics')
      .select('problem_description, diagnosis_summary, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (diagnostics && diagnostics.length > 0) {
      context.recent_diagnostics = diagnostics
    }
  }

  return context
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

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    // Check if clients are initialized
    if (!supabase || !anthropic) {
      console.error('Missing env vars:', {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_SERVICE_KEY,
        hasAnthropicKey: !!ANTHROPIC_KEY
      })
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        }),
      }
    }

    const { userId, conversationId, message, vehicleId } = JSON.parse(event.body) as RequestBody

    if (!userId || !conversationId || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    // 1. Check premium status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    const isPremium = profile?.subscription_status === 'premium'

    // 2. Check daily message limit for free users
    let messagesUsedToday = 0
    let purchasedCredits = 0
    if (!isPremium) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('sender', 'user')
        .gte('created_at', startOfDay.toISOString())

      messagesUsedToday = count || 0

      // Get purchased chat credits
      const { data: profileCredits } = await supabase
        .from('profiles')
        .select('purchased_chat_credits')
        .eq('id', userId)
        .single()

      purchasedCredits = profileCredits?.purchased_chat_credits || 0

      if (messagesUsedToday >= FREE_MESSAGES_LIMIT_PER_DAY) {
        // Check if user has purchased credits
        if (purchasedCredits > 0) {
          // Use one purchased credit
          await supabase.rpc('use_chat_credit', { p_user_id: userId })
          console.log(`Used 1 chat credit for user ${userId}, remaining: ${purchasedCredits - 1}`)
        } else {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({
              error: 'LIMIT_REACHED',
              message: 'Tu as utilisé tes 10 messages gratuits aujourd\'hui. Reviens demain ou passe à Premium pour un accès illimité 24/7 !',
              upgradeUrl: '/pricing'
            }),
          }
        }
      }
    }

    // 3. Build context
    const context = await buildContext(userId, vehicleId)

    // 4. Get conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 5. Build system prompt
    const systemPrompt = `Tu es MECAI, mécanicien automobile expert français disponible 24h/24.

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

CAPACITÉS SPÉCIALES:
✅ Accès RECHERCHE WEB temps réel via l'outil "recherche_web"
✅ Utilise-le pour: prix actuels, rappels constructeur, forums, tutoriels

${context.vehicle ? `
VÉHICULE DE L'UTILISATEUR :
- ${context.vehicle.brand} ${context.vehicle.model} ${context.vehicle.year}
- Carburant: ${context.vehicle.fuel_type || 'Non spécifié'}
- Kilométrage: ${context.vehicle.mileage?.toLocaleString() || '?'} km
` : 'Aucun véhicule sélectionné.'}

${context.recent_diagnostics && context.recent_diagnostics.length > 0 ? `
HISTORIQUE RÉCENT :
${context.recent_diagnostics.map(d => `- ${d.problem_description} (${new Date(d.created_at).toLocaleDateString('fr-FR')})`).join('\n')}
` : ''}

QUAND UTILISER LA RECHERCHE WEB:
🔍 Prix pièces → "prix [pièce] [marque] [modèle] oscaro 2024"
🔍 Rappels → "rappel [marque] [modèle] [année] 2024"
🔍 Problèmes connus → "[symptôme] [marque] [modèle] forum"
🔍 Tutoriels → "tuto [opération] [modèle] youtube"
🔍 Garages → "garage [ville] avis"

TON RÔLE :
- Diagnostic automobile précis
- Prix RÉELS via recherche web
- Conseils pratiques et urgence
- Liens vers sources (Oscaro, Yakarouler, forums)

RÈGLES :
- Tutoiement systématique
- Concis (max 300 mots)
- Emojis modérés 🔧🚗
- Si prix demandé → TOUJOURS utiliser recherche_web
- Fourchettes de prix réalistes
- Finir par question ou action

TONALITÉ :
✅ "Salut ! Ah, ce bruit au freinage..."
✅ "Je vais chercher les prix actuels pour toi..."
❌ "Veuillez nous indiquer..."
❌ "Il semblerait que votre véhicule..."`

    // 6. Build messages array
    const messages: Anthropic.Messages.MessageParam[] = [
      ...(history || []).map((h) => ({
        role: h.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: h.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // 7. Call Claude with tool use loop
    let aiResponse = ''
    let iterations = 0
    const maxIterations = 4 // Limit tool use iterations

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'recherche_web') {
        const input = toolUseBlock.input as { query: string }
        console.log(`[mechanic-chat] Searching: ${input.query}`)
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

      // Extract final response
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        aiResponse = textBlock.text
      }

      break
    }

    // 8. Save messages to database
    await supabase.from('chat_messages').insert([
      {
        conversation_id: conversationId,
        user_id: userId,
        sender: 'user',
        content: message
      },
      {
        conversation_id: conversationId,
        user_id: userId,
        sender: 'ai',
        content: aiResponse
      }
    ])

    // 9. Update conversation (title if first message, updated_at)
    const isFirstMessage = !history || history.length === 0
    await supabase
      .from('chat_conversations')
      .update({
        updated_at: new Date().toISOString(),
        ...(isFirstMessage ? { title: message.slice(0, 50) } : {})
      })
      .eq('id', conversationId)

    // 10. Calculate remaining messages for today
    const freeMessagesRemaining = Math.max(0, FREE_MESSAGES_LIMIT_PER_DAY - messagesUsedToday - 1)
    // Update purchased credits after potentially using one
    const creditsRemaining = messagesUsedToday >= FREE_MESSAGES_LIMIT_PER_DAY && purchasedCredits > 0
      ? purchasedCredits - 1
      : purchasedCredits

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        conversationId,
        messagesRemaining: isPremium ? null : freeMessagesRemaining,
        purchasedCredits: isPremium ? null : creditsRemaining,
      }),
    }

  } catch (error: unknown) {
    console.error('Mechanic chat error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
    }
  }
}
