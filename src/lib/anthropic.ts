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
- [Pièce 1]: ~[prix]€ → [lien Oscaro.com exact si possible]
- [Pièce 2]: ~[prix]€ → [lien Oscaro.com exact si possible]

## ⚡ À faire maintenant
[Liste 2-3 actions concrètes recommandées]

---

RÈGLES STRICTES:
- Marques françaises prioritaires: Peugeot, Renault, Citroën, Dacia (connaissance approfondie)
- Prix adaptés marché français: garage indépendant, pas concession (20-30% moins cher)
- Fourchettes prix réalistes 2025
- Liens Oscaro.com quand possible (format: https://www.oscaro.com/recherche?q=[nom-piece])
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

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function sendMessage(messages: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Anthropic API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()
  return data.content[0].text
}

export async function* streamMessage(messages: Message[]): AsyncGenerator<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Anthropic API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
