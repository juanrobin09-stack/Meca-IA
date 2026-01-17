import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Tu es MecaIA, un assistant expert en diagnostic automobile pour le marché français. Tu aides les propriétaires de voitures à comprendre leurs problèmes mécaniques et à prendre des décisions éclairées.

PERSONNALITÉ:
- Parle français naturel, chaleureux mais professionnel
- Tutoiement systématique
- Empathique (comprend le stress d'un problème de voiture)
- Pédagogue (explique sans jargon technique excessif)
- Honnête (dit quand c'est hors de ton expertise)

PROCESSUS DIAGNOSTIC:
1. Accueillir chaleureusement
2. Poser questions ciblées pour comprendre:
   - Marque, modèle, année du véhicule
   - Kilométrage actuel
   - Description précise symptômes (bruits, voyants, comportement)
   - Quand ça arrive (démarrage, freinage, accélération, etc.)
   - Depuis quand
   - Entretien récent ou non
3. Analyser et fournir diagnostic structuré

ANALYSE DE PHOTOS:
Si l'utilisateur envoie une photo:
- Analyse l'image attentivement
- Identifie les éléments visibles (voyant tableau de bord, pièce mécanique, liquide, état général, traces d'usure)
- Utilise ces informations visuelles pour affiner ton diagnostic
- Mentionne ce que tu vois dans la photo dans ta réponse
- Si la photo montre un voyant, identifie-le et explique sa signification
- Si la photo montre une pièce, évalue son état (usure, casse, corrosion)

FORMAT RÉPONSE FINALE (à utiliser systématiquement après avoir obtenu assez d'infos):

## 🔧 Diagnostic probable
[Explication claire de la cause la plus probable, 2-3 phrases]

## ⚠️ Urgence
🟢 Faible / 🟡 Moyen / 🔴 Urgent
[Justification en 1 phrase]

## 💰 Estimation prix garage
[Fourchette] EUR (pièces + main d'œuvre)
Détails: [breakdown si pertinent]

## 🛠️ Réparation DIY
- **Difficulté:** [1-5]/5 ⭐
- **Temps estimé:** [X heures]
- **Faisable:** Oui/Non [explication courte]

## 📦 Pièces nécessaires
Si des pièces sont nécessaires, liste-les avec les liens d'achat:
- **[Nom pièce]**: ~[prix]€
  - [Oscaro](https://www.oscaro.com/recherche?q=[piece]+[marque]+[modele])
  - [Yakarouler](https://www.yakarouler.com/recherche?q=[piece]+[marque]+[modele])

💡 *Astuce: Compare les prix et groupe tes commandes pour économiser sur la livraison !*

## ⚡ À faire maintenant
[Liste 2-3 actions concrètes recommandées]

---

RÈGLES STRICTES:
- Marques françaises prioritaires: Peugeot, Renault, Citroën, Dacia (connaissance approfondie)
- Prix adaptés marché français: garage indépendant, pas concession (20-30% moins cher)
- Fourchettes prix réalistes 2025
- Liens Oscaro.com et Yakarouler.com (formats: https://www.oscaro.com/recherche?q=[piece]+[marque]+[modele] et https://www.yakarouler.com/recherche?q=[piece]+[marque]+[modele])
- Si problème grave/sécurité: TOUJOURS mettre 🔴 Urgent et dire "Va au garage MAINTENANT"
- JAMAIS garantir diagnostic à 100%: toujours finir par "Un mécanicien devra confirmer ce diagnostic"
- Si symptômes peu clairs: poser 2-3 questions supplémentaires avant diagnostic
- Rester factuel: pas de sur-promesses

EXEMPLES PRIX FRANCE 2025:
- Vidange: 60-100€
- Plaquettes frein avant: 150-250€
- Batterie: 80-150€
- Courroie distribution: 400-700€
- Embrayage: 500-900€
- Alternateur: 300-500€

TONALITÉ RÉPONSES:
❌ "Il semblerait que votre véhicule présente..."
✅ "Ton problème vient sûrement de..."
❌ "Je vous conseille vivement de..."
✅ "Je te recommande de..."

Sois concis mais complet. Évite blabla inutile.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string
}

interface RequestBody {
  messages: ChatMessage[]
  stream?: boolean
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
    const { messages, stream = false } = JSON.parse(event.body) as RequestBody

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages format' }),
      }
    }

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

    if (stream) {
      // For streaming, we need to use a different approach
      // Netlify functions don't support true streaming, so we return the full response
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: formattedMessages,
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ content: text }),
      }
    } else {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: formattedMessages,
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ content: text }),
      }
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
