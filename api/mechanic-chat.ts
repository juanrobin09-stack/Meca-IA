import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const FREE_MESSAGES_LIMIT_PER_DAY = 10

interface RequestBody {
  userId: string
  conversationId: string
  message: string
  vehicleId?: string
}

async function buildContext(userId: string, vehicleId?: string) {
  const context: Record<string, unknown> = {}

  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('brand, model, year, fuel_type, mileage')
      .eq('id', vehicleId)
      .single()

    if (vehicle) context.vehicle = vehicle

    const { data: diagnostics } = await supabase
      .from('diagnostics')
      .select('problem, solution, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (diagnostics?.length) context.recent_diagnostics = diagnostics
  }

  return context
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const { userId, conversationId, message, vehicleId } = req.body as RequestBody
  if (!userId || !conversationId || !message) {
    return json(res, 400, { error: 'Missing required fields' })
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    const isPremium = profile?.subscription_status === 'premium'
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
        return json(res, 403, {
          error: 'LIMIT_REACHED',
          message: "Tu as utilisé tes 10 messages gratuits aujourd'hui. Reviens demain ou passe à Premium !",
          upgradeUrl: '/pricing',
        })
      }
    }

    const context = await buildContext(userId, vehicleId)

    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    const vehicle = context.vehicle as { brand: string; model: string; year: number; fuel_type: string; mileage: number } | undefined
    const systemPrompt = `Tu es un mécanicien automobile expert français, sympathique et pédagogue.
Tu t'appelles MECAI et tu es disponible 24h/24 pour aider les automobilistes.

${vehicle ? `VÉHICULE: ${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${vehicle.fuel_type || '?'} — ${vehicle.mileage?.toLocaleString() || '?'} km` : "Aucun véhicule sélectionné — demande les infos si nécessaire."}

TON RÔLE: Répondre aux questions auto, expliquer simplement, donner des estimations réalistes (marché français 2026), indiquer l'urgence.

RÈGLES: Réponds en français, tutoie, max 300 mots, emojis bienvenus 🔧🚗, donne fourchettes min-max réalistes.`

    const messages: Anthropic.Messages.MessageParam[] = [
      ...(history || []).map((h) => ({
        role: h.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    })

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : ''

    await supabase.from('chat_messages').insert([
      { conversation_id: conversationId, user_id: userId, sender: 'user', content: message },
      { conversation_id: conversationId, user_id: userId, sender: 'ai', content: aiResponse },
    ])

    const isFirstMessage = !history || history.length === 0
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString(), ...(isFirstMessage ? { title: message.slice(0, 50) } : {}) })
      .eq('id', conversationId)

    return json(res, 200, {
      response: aiResponse,
      conversationId,
      messagesRemaining: isPremium ? null : FREE_MESSAGES_LIMIT_PER_DAY - messagesUsedToday - 1,
    })
  } catch (error) {
    console.error('Mechanic chat error:', error)
    return json(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
