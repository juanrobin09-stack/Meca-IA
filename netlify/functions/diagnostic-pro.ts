import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Handler } from '@netlify/functions'

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

// Initialize clients
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null

// Constants
const FREE_DIAGNOSTICS_LIMIT = 2

// Timeout helper for fetch requests
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// Web search function using Brave API
async function searchWeb(query: string): Promise<{ results: string; sources: string[] }> {
  if (!BRAVE_API_KEY) {
    return { results: '[Recherche web non disponible - clé API manquante]', sources: [] }
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=6&country=fr&search_lang=fr`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      },
      8000 // 8 secondes max pour la recherche
    )

    if (!response.ok) {
      console.error('[diagnostic-pro] Brave search failed:', response.status)
      return { results: '[Recherche échouée]', sources: [] }
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return { results: '[Aucun résultat trouvé]', sources: [] }
    }

    const sources: string[] = []
    const formattedResults = results.slice(0, 5).map((r: { title: string; description: string; url: string }) => {
      sources.push(`${r.title} - ${r.url}`)
      return `**${r.title}**\n${r.description}\nSource: ${r.url}`
    }).join('\n\n')

    return { results: formattedResults, sources }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[diagnostic-pro] Search timeout')
      return { results: '[Recherche timeout - veuillez réessayer]', sources: [] }
    }
    console.error('[diagnostic-pro] Search error:', error)
    return { results: '[Erreur de recherche]', sources: [] }
  }
}

// Tool definitions
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'web_search',
  description: `Recherche web temps réel pour obtenir des informations techniques actualisées.
UTILISE CET OUTIL POUR:
- TSB (Technical Service Bulletins) du constructeur
- Prix pièces actuels (oscaro, mister-auto, etc.)
- Forums techniques (forum-auto, forum-peugeot, etc.)
- Problèmes connus sur le modèle
- Tutoriels et guides de réparation
- Rappels constructeur

EXEMPLES DE REQUÊTES:
- "[Marque] [Modèle] [Année] [symptôme] TSB"
- "prix [pièce] [marque] [modèle] oscaro 2026"
- "[symptôme] [marque] [modèle] forum problème connu"
- "rappel [marque] [modèle] [année]"`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Requête de recherche précise en français'
      },
      search_type: {
        type: 'string',
        enum: ['tsb', 'price', 'forum', 'tutorial', 'recall', 'general'],
        description: 'Type de recherche pour optimiser les résultats'
      }
    },
    required: ['query']
  }
}

const generateFinalDiagnosisTool: Anthropic.Messages.Tool = {
  name: 'generate_final_diagnosis',
  description: `Génère le rapport de diagnostic professionnel final structuré.
APPELLE CET OUTIL quand tu as:
- Collecté suffisamment d'informations (symptômes, véhicule, contexte)
- Effectué des recherches web pour valider/enrichir
- Analysé les photos si fournies

Le diagnostic doit être COMPLET avec sources et données vérifiées.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      diagnosis_summary: {
        type: 'string',
        description: 'Résumé diagnostic détaillé avec conclusions basées sur les recherches'
      },
      causes_possibles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cause: { type: 'string', description: 'Description de la cause' },
            probabilite: { type: 'string', enum: ['élevée', 'moyenne', 'faible'] },
            explication: { type: 'string', description: 'Explication technique détaillée' }
          },
          required: ['cause', 'probabilite', 'explication']
        },
        description: 'Liste des causes possibles avec probabilités'
      },
      urgency_level: {
        type: 'string',
        enum: ['faible', 'moyen', 'urgent'],
        description: 'faible=peut attendre, moyen=à traiter rapidement, urgent=sécurité en jeu'
      },
      estimated_cost_min: {
        type: 'number',
        description: 'Coût minimum estimé en euros (basé sur recherches prix)'
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
        description: 'Description technique précise du problème identifié'
      },
      recommandations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Actions recommandées par ordre de priorité'
      },
      difficulty_diy: {
        type: 'string',
        enum: ['facile', 'moyen', 'difficile', 'impossible'],
        description: 'Difficulté pour une réparation soi-même'
      },
      parts_needed: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            reference: { type: 'string', description: 'Référence OEM ou équivalent si trouvée' },
            price_estimate: { type: 'string', description: 'Prix estimé basé sur recherches' }
          },
          required: ['name', 'price_estimate']
        },
        description: 'Pièces nécessaires avec références et prix recherchés'
      },
      time_estimate: {
        type: 'string',
        description: 'Temps estimé pour la réparation'
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Liste des sources utilisées (TSB, forums, sites prix)'
      },
      tsb_found: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            reference: { type: 'string' },
            description: { type: 'string' },
            url: { type: 'string' }
          }
        },
        description: 'TSB (Technical Service Bulletins) trouvés si applicable'
      },
      risks_if_ignored: {
        type: 'array',
        items: { type: 'string' },
        description: 'Risques si le problème n\'est pas traité'
      }
    },
    required: ['diagnosis_summary', 'causes_possibles', 'urgency_level',
               'estimated_cost_min', 'estimated_cost_max', 'recommandations', 'sources']
  }
}

// Helper: Clean and validate base64 image data
function cleanBase64Image(base64: string): { valid: boolean; data: string; error?: string } {
  if (!base64 || typeof base64 !== 'string') {
    return { valid: false, data: '', error: 'Image vide ou invalide' }
  }

  // Remove data URL prefix if present
  let cleanData = base64
  if (base64.includes(',')) {
    cleanData = base64.split(',').pop() || ''
  }

  // Remove whitespace and newlines
  cleanData = cleanData.replace(/[\s\n\r]/g, '')

  // Remove any non-base64 characters
  cleanData = cleanData.replace(/[^A-Za-z0-9+/=]/g, '')

  // Validate minimum length
  if (cleanData.length < 100) {
    return { valid: false, data: '', error: 'Image trop petite ou corrompue' }
  }

  // Validate base64 pattern
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  if (!base64Regex.test(cleanData)) {
    return { valid: false, data: '', error: 'Format base64 invalide' }
  }

  // Check if it's a valid base64 length (must be divisible by 4)
  if (cleanData.length % 4 !== 0) {
    // Pad with = to make it valid
    const padding = 4 - (cleanData.length % 4)
    cleanData = cleanData + '='.repeat(padding)
  }

  console.log(`[diagnostic-pro] Base64 cleaned: ${cleanData.length} chars`)
  return { valid: true, data: cleanData }
}

// Types
interface DiagnosticProCause {
  cause: string
  probabilite: 'élevée' | 'moyenne' | 'faible'
  explication: string
}

interface DiagnosticProPart {
  name: string
  reference?: string
  price_estimate: string
}

interface DiagnosticProTSB {
  reference: string
  description: string
  url?: string
}

interface FinalDiagnosisPro {
  diagnosis_summary: string
  causes_possibles: DiagnosticProCause[]
  urgency_level: 'faible' | 'moyen' | 'urgent'
  estimated_cost_min: number
  estimated_cost_max: number
  confidence_percent?: number
  problem_identified?: string
  recommandations: string[]
  difficulty_diy?: 'facile' | 'moyen' | 'difficile' | 'impossible'
  parts_needed?: DiagnosticProPart[]
  time_estimate?: string
  sources: string[]
  tsb_found?: DiagnosticProTSB[]
  risks_if_ignored?: string[]
}

interface DiagnosticMessage {
  role: 'user' | 'assistant'
  content: string | Anthropic.Messages.ContentBlockParam[]
  images?: string[]
}

interface RequestBody {
  message: string
  userId: string
  sessionId?: string
  images?: string[]
  forceFinalize?: boolean
}

// System prompt generator
function generateSystemPrompt(messageCount: number, forceFinalize: boolean): string {
  const shouldFinalize = forceFinalize || messageCount >= 8

  return `Tu es un EXPERT DIAGNOSTIC AUTOMOBILE PROFESSIONNEL avec accès à la recherche web temps réel.

═══════════════════════════════════════════════════════════════
              DIAGNOSTIC PRO - SYSTÈME AVANCÉ
═══════════════════════════════════════════════════════════════

DATE ACTUELLE: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

Tu n'es PAS un simple chatbot. Tu es un système de diagnostic professionnel qui:
- Recherche SYSTÉMATIQUEMENT des informations techniques actualisées
- Cite ses sources (TSB, forums, prix vérifiés)
- Analyse les photos en détail si fournies
- Génère des rapports structurés et exploitables

═══════════════════════════════════════════════════════════════
                    PROCESSUS EN 3 PHASES
═══════════════════════════════════════════════════════════════

**PHASE 1: COLLECTE (2-3 messages)**
Questions PRÉCISES et TECHNIQUES:
- Marque, modèle, année, kilométrage
- Symptômes EXACTS (type de bruit, odeur, comportement)
- Contexte d'apparition (quand, comment, fréquence)
- Code défaut OBD si disponible
- Demande des photos si pertinent

**PHASE 2: RECHERCHE APPROFONDIE**
UTILISE web_search SYSTÉMATIQUEMENT pour:
1. TSB du constructeur: "[Marque] [Modèle] [symptôme] TSB bulletin technique"
2. Forums techniques: "[symptôme] [Marque] [Modèle] forum problème connu"
3. Prix pièces: "prix [pièce] [marque] oscaro mister-auto"
4. Rappels: "rappel [Marque] [Modèle] [année]"
5. Tutoriels: "tuto [opération] [modèle]"

FAIS AU MOINS 2-3 RECHERCHES avant de conclure!

**PHASE 3: DIAGNOSTIC FINAL**
Quand tu as:
- Assez d'infos du client
- Fait tes recherches web
- Analysé les photos (si fournies)

Appelle generate_final_diagnosis avec TOUTES les données.

${shouldFinalize ? `
⚠️ IMPORTANT: Tu as ${forceFinalize ? 'reçu une demande de finalisation' : 'atteint la limite de questions'}.
Tu DOIS maintenant appeler generate_final_diagnosis avec les informations collectées.
Fais ton meilleur diagnostic basé sur ce que tu sais.
` : ''}

═══════════════════════════════════════════════════════════════
                    ANALYSE DE PHOTOS
═══════════════════════════════════════════════════════════════

Si des photos sont fournies, analyse MINUTIEUSEMENT:
- État des pièces visibles (usure, corrosion, dommages)
- Fuites (huile, liquide refroidissement, carburant)
- Voyants tableau de bord
- Couleur des fumées/liquides
- Connexions et câblages
- Comparaison avec état normal

Décris PRÉCISÉMENT ce que tu observes et lie-le au diagnostic.

═══════════════════════════════════════════════════════════════
                    RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

1. TOUJOURS RECHERCHER avant de diagnostiquer
2. CITER les sources (TSB, forums, prix trouvés)
3. Prix basés sur RECHERCHES RÉELLES, pas d'estimations
4. Niveau de confiance HONNÊTE
5. Mentionner les RISQUES si non réparé
6. Ton PROFESSIONNEL et TECHNIQUE
7. JAMAIS garantir à 100%
8. Sécurité = priorité absolue

═══════════════════════════════════════════════════════════════
                    FORMAT DES RÉPONSES
═══════════════════════════════════════════════════════════════

IMPORTANT: Réponds UNIQUEMENT en texte simple et naturel.
- NE PAS utiliser de formatage markdown (pas de **, ##, *, -, etc.)
- NE PAS utiliser d'étoiles ou dièses pour mettre en valeur
- NE PAS faire de listes avec des tirets ou numéros
- Écris des phrases fluides et naturelles comme dans une conversation
- Utilise des retours à la ligne pour séparer les idées si besoin
- Garde un ton professionnel mais conversationnel

═══════════════════════════════════════════════════════════════
                    EXEMPLE DE FLUX
═══════════════════════════════════════════════════════════════

User: "Ma Clio 4 fait un bruit de grincement au freinage"

Toi: "D'accord, je vais t'aider à identifier ce problème de grincement. Pour affiner mon diagnostic, j'ai besoin de quelques précisions.

C'est une Clio 4 de quelle année et quel kilométrage ? Le grincement se produit uniquement au freinage ou aussi en roulant ? Et est-ce plutôt au démarrage à froid ou tout le temps ?"

User: "2015, 85000 km. Surtout à froid le matin, puis ça disparaît"

[Tu utilises web_search: "Clio 4 2015 grincement freinage à froid TSB"]
[Tu utilises web_search: "prix plaquettes frein Clio 4 oscaro"]

Puis tu appelles generate_final_diagnosis avec toutes les infos.`
}

// Main handler
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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Verify authorization
  const authHeader = event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (!event.body) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
  }

  try {
    if (!anthropic) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error - missing API key' })
      }
    }

    if (!supabase) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error - missing database' })
      }
    }

    const { message, userId, sessionId, images = [], forceFinalize = false } = JSON.parse(event.body) as RequestBody

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('[diagnostic-pro] REQUEST RECEIVED')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('[diagnostic-pro] userId:', userId)
    console.log('[diagnostic-pro] sessionId:', sessionId)
    console.log('[diagnostic-pro] forceFinalize:', forceFinalize)
    console.log('[diagnostic-pro] message length:', message?.length || 0)
    console.log('[diagnostic-pro] images count:', images.length)

    // Log image details for debugging
    if (images.length > 0) {
      images.forEach((img, i) => {
        const hasPrefix = img?.includes('data:') || img?.includes('base64,')
        const rawLength = img?.length || 0
        const sample = img?.substring(0, 50) || 'empty'
        console.log(`[diagnostic-pro] Image ${i + 1}:`)
        console.log(`  - Length: ${rawLength} chars`)
        console.log(`  - Has data URL prefix: ${hasPrefix}`)
        console.log(`  - Sample (first 50): ${sample}...`)
      })
    }
    console.log('═══════════════════════════════════════════════════════════════')

    // 1. Get or create user profile and check limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    const isPremium = profile.subscription_status === 'premium'
    const diagnosticsUsed = profile.free_diagnostics_used || 0
    const purchasedCredits = profile.purchased_diagnostic_credits || 0

    // 2. Handle session management
    let currentSessionId = sessionId
    let session = null

    if (currentSessionId) {
      // Load existing session
      const { data: existingSession } = await supabase
        .from('diagnostic_pro_sessions')
        .select('*')
        .eq('id', currentSessionId)
        .single()

      if (existingSession) {
        session = existingSession
      }
    }

    if (!session) {
      // Check limits for new session
      if (!isPremium && diagnosticsUsed >= FREE_DIAGNOSTICS_LIMIT && purchasedCredits <= 0) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Limite atteinte',
            limitReached: true,
            diagnosticsUsed,
            limit: FREE_DIAGNOSTICS_LIMIT
          })
        }
      }

      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('diagnostic_pro_sessions')
        .insert({
          user_id: userId,
          title: message.substring(0, 80),
          status: 'active',
          messages: [],
          sources_collected: []
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[diagnostic-pro] Session creation error:', sessionError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create session' })
        }
      }

      session = newSession
      currentSessionId = newSession.id

      // Increment diagnostic counter
      if (!isPremium) {
        if (diagnosticsUsed < FREE_DIAGNOSTICS_LIMIT) {
          await supabase
            .from('profiles')
            .update({ free_diagnostics_used: diagnosticsUsed + 1 })
            .eq('id', userId)
        } else if (purchasedCredits > 0) {
          await supabase
            .from('profiles')
            .update({ purchased_diagnostic_credits: purchasedCredits - 1 })
            .eq('id', userId)
        }
      }

      console.log('[diagnostic-pro] Created new session:', currentSessionId)
    }

    // 3. Load message history
    const existingMessages: DiagnosticMessage[] = session.messages || []
    const userMessageCount = existingMessages.filter((m: DiagnosticMessage) => m.role === 'user').length + 1

    // 4. Build user message with images (with validation)
    const userContent: Anthropic.Messages.ContentBlockParam[] = []
    const validatedImages: string[] = []

    console.log(`[diagnostic-pro] Processing ${images.length} images...`)

    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageBase64 = images[i]
        console.log(`[diagnostic-pro] Image ${i + 1}: original length=${imageBase64?.length || 0}`)

        const cleaned = cleanBase64Image(imageBase64)

        if (!cleaned.valid) {
          console.error(`[diagnostic-pro] Image ${i + 1} invalid: ${cleaned.error}`)
          // Skip invalid images but continue with others
          continue
        }

        validatedImages.push(cleaned.data)
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: cleaned.data
          }
        })
        console.log(`[diagnostic-pro] Image ${i + 1} validated: ${cleaned.data.length} chars`)
      }
    }

    console.log(`[diagnostic-pro] Valid images: ${validatedImages.length}/${images.length}`)

    userContent.push({
      type: 'text',
      text: message
    })

    // 5. Format messages for Anthropic
    const formattedMessages: Anthropic.Messages.MessageParam[] = existingMessages.map((m: DiagnosticMessage) => {
      if (m.images && m.images.length > 0) {
        const content: Anthropic.Messages.ContentBlockParam[] = m.images.map(img => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: 'image/jpeg' as const,
            data: img
          }
        }))
        content.push({ type: 'text', text: typeof m.content === 'string' ? m.content : '' })
        return { role: m.role as 'user' | 'assistant', content }
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : ''
      }
    })

    formattedMessages.push({
      role: 'user',
      content: userContent
    })

    // 6. Build tools
    const tools: Anthropic.Messages.Tool[] = [generateFinalDiagnosisTool]
    if (BRAVE_API_KEY) {
      tools.push(webSearchTool)
    }

    // 7. Tool use loop with timeout protection
    let finalText = ''
    let finalDiagnosis: FinalDiagnosisPro | null = null
    let allSources: string[] = [...(session.sources_collected || [])]
    let iterations = 0
    const maxIterations = 6 // Réduit de 8 à 6 pour éviter timeout
    const currentMessages = [...formattedMessages]
    let searchCount = 0
    const maxSearches = 3 // Limite les recherches web pour éviter timeout
    const startTime = Date.now()
    const maxTotalTime = 22000 // 22 secondes max (marge avant timeout Netlify de 26s)

    const systemPrompt = generateSystemPrompt(userMessageCount, forceFinalize)

    while (iterations < maxIterations) {
      // Vérifier le temps total écoulé
      if (Date.now() - startTime > maxTotalTime) {
        console.log('[diagnostic-pro] Total time limit reached, finalizing')
        if (!finalText) {
          finalText = 'Le diagnostic prend plus de temps que prévu. Basé sur les informations collectées, je vous recommande de réessayer ou de demander le diagnostic final.'
        }
        break
      }

      iterations++
      console.log(`[diagnostic-pro] Iteration ${iterations}, searches: ${searchCount}, elapsed: ${Date.now() - startTime}ms`)

      let response
      try {
        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          tools,
          messages: currentMessages,
        })
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
        console.error('[diagnostic-pro] Claude API error:', errorMessage)

        // Check for base64/pattern validation error
        if (errorMessage.includes('did not match') || errorMessage.includes('expected pattern') || errorMessage.includes('base64')) {
          console.error('[diagnostic-pro] Base64 image validation failed - removing images and retrying')

          // Remove image blocks from the current message and retry once
          if (currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1]
            if (Array.isArray(lastMessage.content)) {
              // Filter out image blocks
              const textOnlyContent = (lastMessage.content as Anthropic.Messages.ContentBlockParam[])
                .filter(block => block.type !== 'image')

              if (textOnlyContent.length > 0) {
                currentMessages[currentMessages.length - 1] = {
                  ...lastMessage,
                  content: textOnlyContent
                }
                console.log('[diagnostic-pro] Retrying without images...')
                continue // Retry the loop without images
              }
            }
          }

          finalText = 'Une image n\'a pas pu être analysée. Pouvez-vous décrire votre problème en texte ou prendre une nouvelle photo ?'
        } else {
          // Si on a déjà du texte, on le garde, sinon on met un message d'erreur
          if (!finalText) {
            finalText = 'Une erreur temporaire est survenue lors de l\'analyse. Veuillez réessayer dans quelques instants.'
          }
        }
        break
      }

      // Find tool use block
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock) {
        // Handle web search
        if (toolUseBlock.name === 'web_search') {
          const input = toolUseBlock.input as { query: string; search_type?: string }
          console.log(`[diagnostic-pro] Web search: ${input.query}`)

          let searchResult
          if (searchCount >= maxSearches) {
            console.log('[diagnostic-pro] Max searches reached, skipping')
            searchResult = {
              results: '[Limite de recherches atteinte pour cette session. Procédez au diagnostic avec les informations disponibles.]',
              sources: []
            }
          } else {
            searchCount++
            searchResult = await searchWeb(input.query)
            allSources = [...allSources, ...searchResult.sources]
          }

          // Add assistant response with tool use
          currentMessages.push({
            role: 'assistant',
            content: response.content,
          })

          // Add tool result
          currentMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: searchResult.results,
            }],
          })

          continue
        }

        // Handle final diagnosis generation
        if (toolUseBlock.name === 'generate_final_diagnosis') {
          finalDiagnosis = toolUseBlock.input as FinalDiagnosisPro

          // Add collected sources to the diagnosis
          if (finalDiagnosis.sources) {
            finalDiagnosis.sources = [...new Set([...finalDiagnosis.sources, ...allSources])]
          } else {
            finalDiagnosis.sources = [...new Set(allSources)]
          }

          console.log('[diagnostic-pro] Final diagnosis generated:', finalDiagnosis.diagnosis_summary)

          // Update session with final diagnosis
          await supabase
            .from('diagnostic_pro_sessions')
            .update({
              status: 'completed',
              diagnosis_summary: finalDiagnosis.diagnosis_summary,
              urgency_level: finalDiagnosis.urgency_level,
              estimated_cost_min: finalDiagnosis.estimated_cost_min,
              estimated_cost_max: finalDiagnosis.estimated_cost_max,
              final_diagnosis: finalDiagnosis,
              sources_collected: finalDiagnosis.sources,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSessionId)

          // Add assistant response with tool use
          currentMessages.push({
            role: 'assistant',
            content: response.content,
          })

          // Add tool result to get final formatted response
          currentMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: 'Diagnostic enregistré avec succès. Génère maintenant une réponse finale pour confirmer au client que son diagnostic professionnel est prêt.',
            }],
          })

          continue
        }
      }

      // Extract final text response
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        finalText = textBlock.text
      }

      break
    }

    // 8. Save messages to session
    const updatedMessages = [
      ...existingMessages,
      {
        role: 'user' as const,
        content: message,
        images: images.length > 0 ? images : undefined
      },
      {
        role: 'assistant' as const,
        content: finalText
      }
    ]

    await supabase
      .from('diagnostic_pro_sessions')
      .update({
        messages: updatedMessages,
        sources_collected: [...new Set(allSources)],
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSessionId)

    // 9. Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: finalText,
        sessionId: currentSessionId,
        finalDiagnosis,
        phase: finalDiagnosis ? 'completed' : 'collecting',
        sourcesCount: allSources.length,
        usage: {
          diagnosticsUsed: isPremium ? 0 : (sessionId ? diagnosticsUsed : diagnosticsUsed + 1),
          limit: isPremium ? Infinity : FREE_DIAGNOSTICS_LIMIT,
          isPremium
        }
      })
    }

  } catch (error) {
    console.error('[diagnostic-pro] Error:', error)

    // Déterminer le type d'erreur pour un message plus utile
    let errorMessage = 'Une erreur est survenue lors du diagnostic.'
    const errorStr = error instanceof Error ? error.message : String(error)

    if (errorStr.includes('timeout') || errorStr.includes('Timeout')) {
      errorMessage = 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
    } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
      errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.'
    } else if (errorStr.includes('did not match') || errorStr.includes('expected pattern') || errorStr.includes('base64')) {
      // This is the specific error we're fixing
      console.error('[diagnostic-pro] Base64 validation error - image format issue')
      errorMessage = 'Une image n\'a pas pu être traitée. Essayez de prendre une nouvelle photo ou envoyez votre message sans image.'
    } else if (errorStr.includes('invalid_request_error')) {
      errorMessage = 'Format de requête invalide. Reformulez votre message.'
    }

    console.error('[diagnostic-pro] Returning error:', errorMessage)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        canRetry: true
      })
    }
  }
}
