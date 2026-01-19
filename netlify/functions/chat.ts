import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

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

// Tool definition
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

// Function to generate the system prompt with memory context
function generateSystemPrompt(memoryContext?: string): string {
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

═══════════════════════════════════════════════════════════════
                    UTILISATION DE LA MÉMOIRE
═══════════════════════════════════════════════════════════════

IMPORTANT: Si l'utilisateur a un historique, tu DOIS:
1. Faire des LIENS avec les problèmes passés similaires
2. VÉRIFIER si une pièce a déjà été changée récemment
3. DÉTECTER les problèmes récurrents (patterns)
4. ADAPTER ton diagnostic en fonction de l'historique
5. MENTIONNER si le problème était déjà apparu avant

Exemples d'utilisation de la mémoire:
- "Je note dans votre historique un problème de freinage signalé le [date]..."
- "Attention: les plaquettes ont été changées il y a 6 mois selon l'historique"
- "Ce symptôme revient pour la 3ème fois - il pourrait s'agir d'un problème récurrent"
- "L'analyse précédente mentionnait [X], cela pourrait être lié"

═══════════════════════════════════════════════════════════════
                    ANALYSE DE PHOTOS
═══════════════════════════════════════════════════════════════

- Analyse minutieusement tous les éléments visibles
- Identifie: voyants, pièces usées, fuites, corrosion, dommages
- Décris précisément ce que tu observes
- Lie les observations visuelles au diagnostic

═══════════════════════════════════════════════════════════════
                    FORMAT DE RÉPONSE STRUCTURÉ
═══════════════════════════════════════════════════════════════

Après avoir collecté suffisamment d'informations:

## 🔬 Diagnostic Expert

### Problème identifié
[Description technique précise du problème, 2-3 phrases]
**Confiance:** [XX]%

${memoryContext ? `### Lien avec l'historique
[Référence aux diagnostics/problèmes passés si pertinent]
` : ''}

### ⚠️ Niveau d'urgence
🟢 Faible | 🟡 Moyen | 🔴 Urgent | 🚨 Critique
[Justification technique]

### 💰 Estimation financière 2026
| Élément | Coût estimé |
|---------|-------------|
| Pièces | XX - XX € |
| Main d'œuvre | XX - XX € |
| **Total** | **XX - XX €** |

*Prix basés sur tarifs garage indépendant 2026*

### 🛠️ Réparation DIY
- **Difficulté:** [1-5]/5 ⭐
- **Temps estimé:** [X]h
- **Faisable soi-même:** Oui/Non
- **Outils nécessaires:** [liste]

### 📦 Pièces à commander
| Pièce | Prix 2026 | Référence |
|-------|-----------|-----------|
| [Nom] | XX € | REF-XXX |

### ✅ Actions recommandées
1. [Action prioritaire]
2. [Action secondaire]
3. [Suivi recommandé]

### 📋 Suivi
- **À surveiller:** [éléments]
- **Prochain contrôle:** [délai ou kilométrage]

---

═══════════════════════════════════════════════════════════════
                    RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

1. TON PROFESSIONNEL ET FORMEL
   - Vouvoiement de courtoisie possible mais tutoiement accepté
   - Terminologie technique précise
   - Pas d'emojis excessifs (juste les indicateurs visuels)
   - Chiffres et données concrètes

2. TRANSPARENCE
   - Indique TOUJOURS le niveau de confiance
   - Mentionne tes sources (historique, recherche web)
   - Admets les incertitudes
   - JAMAIS garantir à 100%

3. SÉCURITÉ PRIORITAIRE
   - Problème de sécurité → 🚨 CRITIQUE immédiat
   - Conseiller l'arrêt si dangereux
   - Expliquer les risques clairement

4. DONNÉES ACTUALISÉES
   - Prix 2026 via recherche web
   - Marques FR prioritaires: Peugeot, Renault, Citroën, Dacia
   - Prix garage indépendant (pas concessionnaire)`

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
    const { messages, stream = false, memoryContext } = JSON.parse(event.body) as RequestBody

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages format' }),
      }
    }

    // Generate system prompt with memory context
    const systemPrompt = generateSystemPrompt(memoryContext)

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

    // Tool use loop for web search
    let finalText = ''
    let iterations = 0
    const maxIterations = 4
    let currentMessages = [...formattedMessages]

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages: currentMessages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'recherche_web') {
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

      // Extract final response
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
      body: JSON.stringify({ error: 'Failed to get AI response' }),
    }
  }
}
