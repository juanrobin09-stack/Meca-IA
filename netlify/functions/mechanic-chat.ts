import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Handler } from '@netlify/functions'

// Validate environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// Only create clients if env vars exist
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null

const FREE_MESSAGES_LIMIT_PER_DAY = 10

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

      if (messagesUsedToday >= FREE_MESSAGES_LIMIT_PER_DAY) {
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
    const systemPrompt = `Tu es un mécanicien automobile expert français, sympathique et pédagogue.
Tu t'appelles MECAI et tu es disponible 24h/24 pour aider les automobilistes.

${context.vehicle ? `
VÉHICULE DE L'UTILISATEUR :
- Marque : ${context.vehicle.brand}
- Modèle : ${context.vehicle.model}
- Année : ${context.vehicle.year}
- Carburant : ${context.vehicle.fuel_type || 'Non spécifié'}
- Kilométrage : ${context.vehicle.mileage?.toLocaleString() || 'Non spécifié'} km
` : 'Aucun véhicule sélectionné - demande à l\'utilisateur les infos sur son véhicule si nécessaire.'}

${context.recent_diagnostics && context.recent_diagnostics.length > 0 ? `
HISTORIQUE RÉCENT :
${context.recent_diagnostics.map(d => `- ${d.problem_description} (${new Date(d.created_at).toLocaleDateString('fr-FR')})`).join('\n')}
` : ''}

TON RÔLE :
- Répondre aux questions sur les problèmes automobiles
- Expliquer de manière simple et claire
- Donner des estimations de coûts réalistes (marché français 2026)
- Indiquer l'urgence (pas urgent / à surveiller / urgent / critique)
- Recommander des pièces ou des actions si pertinent

RÈGLES :
- Réponds TOUJOURS en français
- Tutoie l'utilisateur (on est entre passionnés !)
- Sois concis mais complet (max 300 mots)
- Utilise des emojis pour rendre ça vivant 🔧🚗
- Si tu ne sais pas, dis-le honnêtement
- Pour les coûts, donne une fourchette min-max réaliste
- Structure tes réponses avec des paragraphes courts
- Finis toujours par une question ou une suggestion d'action

ESTIMATIONS PRIX FRANCE 2026 :
- Vidange : 60-100€
- Plaquettes frein avant : 150-250€
- Batterie : 80-150€
- Courroie distribution : 400-700€
- Embrayage : 500-900€
- Amortisseurs (paire) : 400-600€

TONALITÉ :
✅ "Salut ! Ah, le voyant moteur, c'est souvent stressant..."
✅ "Pas de panique, on va regarder ça ensemble !"
❌ "Veuillez nous indiquer plus de détails concernant..."
❌ "Il semblerait que votre véhicule présente..."`

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

    // 7. Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages
    })

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : ''

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
    const messagesRemaining = isPremium ? null : (FREE_MESSAGES_LIMIT_PER_DAY - messagesUsedToday - 1)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        conversationId,
        messagesRemaining
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
