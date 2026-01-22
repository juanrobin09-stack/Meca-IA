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
  image?: string // base64 encoded image
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

interface UserMemory {
  vehicles: Array<{
    id: string
    brand: string
    model: string
    year: number
    license_plate?: string
    mileage?: number
    fuel_type?: string
  }>
  problemes: Array<{
    date: string
    type: string
    probleme: string
    solution?: string
    cout?: number
    resolu: boolean
  }>
  entretiens: Array<{
    date: string
    type: string
    garage?: string
    cout?: number
    pieces: string[]
  }>
  pieces_changees: Array<{
    piece: string
    date: string
    kilometrage?: number
  }>
}

/**
 * Charge la mémoire COMPLÈTE de l'utilisateur - LE COEUR DE L'APP
 * L'IA retient TOUT pour chaque utilisateur
 */
async function loadUserMemory(userId: string): Promise<UserMemory> {
  if (!supabase) {
    return { vehicles: [], problemes: [], entretiens: [], pieces_changees: [] }
  }

  try {
    // 1. Tous les véhicules
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, brand, model, year, license_plate, mileage, fuel_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 2. Tous les diagnostics (historique complet)
    const { data: diagnostics } = await supabase
      .from('diagnostics')
      .select('created_at, problem_description, diagnosis_summary, estimated_cost_min, estimated_cost_max, conversation')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    // 3. Conversations chat mécanicien précédentes
    const { data: chatConvs } = await supabase
      .from('chat_conversations')
      .select('id, title, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10)

    // 4. Messages de ces conversations
    let chatMessages: Array<{ conversation_id: string; content: string; sender: string }> = []
    if (chatConvs && chatConvs.length > 0) {
      const convIds = chatConvs.map(c => c.id)
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('conversation_id, content, sender')
        .in('conversation_id', convIds)
        .eq('sender', 'user')
        .order('created_at', { ascending: false })
        .limit(50)
      chatMessages = messages || []
    }

    // 5. Analyses vidéo
    const { data: videoAnalyses } = await supabase
      .from('video_diagnostic')
      .select('cree_at, analyse_resultat')
      .eq('utilisateur_id', userId)
      .order('cree_at', { ascending: false })
      .limit(10)

    // 6. Analyses devis
    const { data: devisAnalyses } = await supabase
      .from('devis_analyses')
      .select('created_at, garage_name, original_amount, analysis_result')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // 7. Entretiens
    const { data: entretiens } = await supabase
      .from('entretiens')
      .select('date, type, garage, cout, kilometrage, pieces_changees')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(20)

    // 8. Historique interactions
    const { data: interactions } = await supabase
      .from('interactions_history')
      .select('created_at, type, probleme, solution, cout, resolu')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    // Consolider les problèmes
    const problemes: UserMemory['problemes'] = []

    // Depuis diagnostics
    diagnostics?.forEach(d => {
      const conversation = d.conversation || []
      const userMsg = conversation.find((m: { role: string }) => m.role === 'user')
      problemes.push({
        date: d.created_at,
        type: 'diagnostic',
        probleme: d.problem_description || userMsg?.content || 'Diagnostic',
        solution: d.diagnosis_summary,
        cout: d.estimated_cost_min ? Math.round((d.estimated_cost_min + (d.estimated_cost_max || d.estimated_cost_min)) / 2) : undefined,
        resolu: !!d.diagnosis_summary
      })
    })

    // Depuis chat mécanicien
    chatMessages?.forEach(m => {
      if (m.content && m.content.length > 10) {
        problemes.push({
          date: new Date().toISOString(),
          type: 'chat',
          probleme: m.content.slice(0, 200),
          resolu: true
        })
      }
    })

    // Depuis vidéo
    videoAnalyses?.forEach(v => {
      const result = v.analyse_resultat
      if (result) {
        problemes.push({
          date: v.cree_at,
          type: 'video',
          probleme: result?.verdict?.diagnostic || result?.synthesis?.diagnostic_global || 'Analyse vidéo',
          cout: result?.verdict?.cout_estime?.total,
          resolu: false
        })
      }
    })

    // Depuis devis
    devisAnalyses?.forEach(d => {
      problemes.push({
        date: d.created_at,
        type: 'devis',
        probleme: `Devis ${d.garage_name}: ${d.original_amount}€`,
        cout: d.original_amount,
        resolu: true
      })
    })

    // Depuis interactions
    interactions?.forEach(i => {
      if (!problemes.find(p => p.probleme === i.probleme && p.date === i.created_at)) {
        problemes.push({
          date: i.created_at,
          type: i.type,
          probleme: i.probleme,
          solution: i.solution,
          cout: i.cout,
          resolu: i.resolu || false
        })
      }
    })

    // Trier par date
    problemes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Entretiens
    const entretiensFormatted = (entretiens || []).map(e => ({
      date: e.date,
      type: e.type,
      garage: e.garage,
      cout: e.cout,
      pieces: e.pieces_changees || []
    }))

    // Pièces changées
    const pieces_changees: UserMemory['pieces_changees'] = []
    entretiens?.forEach(e => {
      (e.pieces_changees || []).forEach((piece: string) => {
        pieces_changees.push({
          piece,
          date: e.date,
          kilometrage: e.kilometrage
        })
      })
    })

    return {
      vehicles: vehicles || [],
      problemes: problemes.slice(0, 50), // Top 50
      entretiens: entretiensFormatted,
      pieces_changees
    }
  } catch (error) {
    console.error('Error loading user memory:', error)
    return { vehicles: [], problemes: [], entretiens: [], pieces_changees: [] }
  }
}

/**
 * Génère le contexte formaté pour l'IA
 */
function generateMemoryContext(memory: UserMemory): string {
  if (memory.vehicles.length === 0 && memory.problemes.length === 0) {
    return 'Nouvel utilisateur - Aucun historique'
  }

  let context = '\n═══════════════════════════════════════\n'
  context += '        MÉMOIRE UTILISATEUR MECAI        \n'
  context += '═══════════════════════════════════════\n\n'

  // Véhicules
  if (memory.vehicles.length > 0) {
    context += '🚗 VÉHICULES:\n'
    memory.vehicles.forEach(v => {
      context += `• ${v.brand} ${v.model} ${v.year}`
      if (v.mileage) context += ` - ${v.mileage.toLocaleString('fr-FR')} km`
      if (v.fuel_type) context += ` (${v.fuel_type})`
      if (v.license_plate) context += ` [${v.license_plate}]`
      context += '\n'
    })
    context += '\n'
  }

  // Historique problèmes (top 15)
  if (memory.problemes.length > 0) {
    context += `📋 HISTORIQUE (${memory.problemes.length} interactions):\n`
    memory.problemes.slice(0, 15).forEach(p => {
      const date = new Date(p.date).toLocaleDateString('fr-FR')
      const status = p.resolu ? '✓' : '⚠️'
      context += `${status} [${date}] ${p.type.toUpperCase()}: ${p.probleme.slice(0, 100)}`
      if (p.cout) context += ` (~${p.cout}€)`
      context += '\n'
      if (p.solution) context += `  → ${p.solution.slice(0, 80)}...\n`
    })
    context += '\n'
  }

  // Pièces changées
  if (memory.pieces_changees.length > 0) {
    context += '🔧 PIÈCES CHANGÉES:\n'
    memory.pieces_changees.slice(0, 10).forEach(p => {
      const date = new Date(p.date).toLocaleDateString('fr-FR')
      context += `• ${p.piece} (${date})`
      if (p.kilometrage) context += ` à ${p.kilometrage.toLocaleString('fr-FR')} km`
      context += '\n'
    })
    context += '\n'
  }

  // Entretiens
  if (memory.entretiens.length > 0) {
    context += '🛠️ ENTRETIENS:\n'
    memory.entretiens.slice(0, 5).forEach(e => {
      const date = new Date(e.date).toLocaleDateString('fr-FR')
      context += `• ${date}: ${e.type}`
      if (e.garage) context += ` chez ${e.garage}`
      if (e.cout) context += ` (${e.cout}€)`
      context += '\n'
    })
    context += '\n'
  }

  // Patterns détectés
  const problemTypes = memory.problemes.map(p => p.probleme.toLowerCase())
  const recurringKeywords = ['frein', 'bruit', 'fuite', 'voyant', 'démarrage', 'embrayage', 'suspension', 'moteur']
  const recurring = recurringKeywords.filter(k =>
    problemTypes.filter(t => t.includes(k)).length >= 2
  )

  if (recurring.length > 0) {
    context += `⚠️ PATTERNS RÉCURRENTS: ${recurring.join(', ')}\n`
  }

  // Problèmes non résolus
  const nonResolus = memory.problemes.filter(p => !p.resolu).slice(0, 3)
  if (nonResolus.length > 0) {
    context += '\n🔴 À SUIVRE (non résolu):\n'
    nonResolus.forEach(p => {
      context += `• ${p.probleme.slice(0, 80)}\n`
    })
  }

  context += '\n═══════════════════════════════════════\n'

  return context
}

async function buildContext(userId: string, vehicleId?: string): Promise<VehicleContext> {
  const context: VehicleContext = {}

  if (!supabase) return context

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

    const { userId, conversationId, message, vehicleId, image } = JSON.parse(event.body) as RequestBody

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

    // 3. Build context + MÉMOIRE COMPLÈTE
    const context = await buildContext(userId, vehicleId)
    const userMemory = await loadUserMemory(userId)
    const memoryContext = generateMemoryContext(userMemory)

    // 4. Get conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('sender, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 5. Build system prompt - ALEX LE MÉCANICIEN (persona casual et amical)
    const vehicleText = context.vehicle
      ? `${context.vehicle.brand} ${context.vehicle.model} ${context.vehicle.year}${context.vehicle.mileage ? ` (${context.vehicle.mileage.toLocaleString('fr-FR')} km)` : ''}`
      : 'ta caisse'

    const systemPrompt = `Tu es ALEX, mécanicien passionné avec 15 ans d'expérience dans un garage indépendant.

═══════════════════════════════════════════════════════════════
                    PERSONNALITÉ D'ALEX
═══════════════════════════════════════════════════════════════

🎭 QUI TU ES:
- Alex, 38 ans, mécanicien passionné depuis toujours
- Tu as ton propre garage depuis 8 ans
- Tu TUTOIES toujours, tu parles comme un pote
- Tu aimes partager tes connaissances
- Parfois un peu blagueur mais toujours pro
- Tu rassures et tu encourages
- Tu es HONNÊTE sur les prix et les urgences

💬 TON STYLE:
- Langage naturel et décontracté
- Emojis naturels mais pas excessifs 🔧💡🚗⚠️✅
- Phrases courtes et dynamiques
- Tu expliques le jargon simplement
- Comme un vrai pote qui s'y connaît en bagnoles

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} (2026)

═══════════════════════════════════════════════════════════════
                    CAPACITÉS SPÉCIALES
═══════════════════════════════════════════════════════════════

✅ Accès RECHERCHE WEB temps réel via l'outil "recherche_web"
✅ Prix actuels 2026 des pièces (Oscaro, Yakarouler, Mister Auto)
✅ Rappels constructeur en vigueur
✅ Forums et problèmes connus
✅ Tutoriels YouTube

QUAND UTILISER LA RECHERCHE WEB:
🔍 Prix → "prix [pièce] [marque] [modèle] oscaro 2026"
🔍 Rappels → "rappel [marque] [modèle] [année] 2026"
🔍 Problèmes → "[symptôme] [marque] [modèle] forum"
🔍 Tutos → "tuto [opération] [modèle] youtube"

═══════════════════════════════════════════════════════════════
                    CONTEXTE UTILISATEUR
═══════════════════════════════════════════════════════════════

${context.vehicle ? `
🚗 VÉHICULE ACTUEL: ${vehicleText}
   Carburant: ${context.vehicle.fuel_type || 'Non spécifié'}
` : '⚠️ Aucun véhicule sélectionné - demande-lui sa voiture !'}

${memoryContext}

👆 SUPER IMPORTANT - UTILISE CETTE MÉMOIRE !
- Fais référence aux problèmes passés: "Tiens, la dernière fois tu m'avais parlé de..."
- Rappelle les pièces déjà changées: "Tes plaquettes ont été changées il y a..."
- Évite de répéter des solutions déjà essayées
- Si un problème était non résolu, demande des nouvelles: "Au fait, ton souci de X c'est réglé ?"

═══════════════════════════════════════════════════════════════
                    RÈGLES DE CONVERSATION
═══════════════════════════════════════════════════════════════

1. SOIS VRAIMENT CONVERSATIONNEL
   - Pose des questions courtes et naturelles
   - Reformule avec tes mots
   - Rebondis sur ses réponses
   - Une petite blague légère si approprié

2. UTILISE L'HISTORIQUE
   - "Ah ta ${vehicleText}, je me souviens !"
   - Fais le lien avec les problèmes passés
   - "Tiens, ça ressemble au souci dont tu m'as parlé..."

3. STRUCTURE NATURELLE (pas de listes forcées)
   - Écris comme tu parlerais
   - Max 3-4 paragraphes courts
   - Emojis naturels, pas à chaque phrase

4. DÉTECTE LES URGENCES
   - Si critique → "⚠️ Stop, faut pas rouler avec ça !"
   - Explique les risques simplement

5. CONSEILS PRATIQUES
   - Prix indicatifs 2026 via recherche
   - "Tu peux le faire toi-même ?" ou "Là faut un pro"
   - Temps estimé
   - Alternatives économiques si budget serré

6. RESTE HUMBLE
   - "Sans voir, dur de te dire à 100%..."
   - "Je suis pas sûr mais ça ressemble à..."
   - Admets quand tu ne sais pas

7. PROPOSE DES ACTIONS
   - "Tu veux que je t'explique comment vérifier ?"
   - "Je te trouve les prix ?"
   - "Tu préfères le faire toi-même ou garage ?"

═══════════════════════════════════════════════════════════════
                    EXEMPLES DE TON
═══════════════════════════════════════════════════════════════

❌ MAUVAIS (trop formel):
"Bonjour. Concernant votre problème de freinage, je vous recommande de procéder à une vérification des plaquettes de frein."

✅ BON (naturel):
"Hey ! Alors ce bruit au freinage 🔧 C'est souvent les plaquettes qui commencent à fatiguer. Tu me décris le bruit ? Genre grincement aigu ou plutôt un frottement sourd ?"

❌ MAUVAIS (trop technique):
"Le symptôme suggère une usure prématurée du compound de friction des garnitures, possiblement exacerbée par une contamination des surfaces."

✅ BON (accessible):
"Ah ça, c'est souvent les plaquettes qui s'usent. Y'a un petit témoin métallique dedans qui frotte sur le disque pour te prévenir - c'est un peu comme un rappel automatique de la voiture 😄"

═══════════════════════════════════════════════════════════════

Réponds maintenant de manière naturelle et conversationnelle !`

    // 6. Build messages array
    const messages: Anthropic.Messages.MessageParam[] = [
      ...(history || []).map((h) => ({
        role: h.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: h.content
      })),
      {
        role: 'user' as const,
        content: image
          ? [
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: 'image/jpeg' as const,
                  data: image
                }
              },
              { type: 'text' as const, text: message }
            ]
          : message
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
    const userMessageContent = image ? `[IMAGE]\n${message}` : message
    await supabase.from('chat_messages').insert([
      {
        conversation_id: conversationId,
        user_id: userId,
        sender: 'user',
        content: userMessageContent
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
