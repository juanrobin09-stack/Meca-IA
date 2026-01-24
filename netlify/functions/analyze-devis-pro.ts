import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

// Brave Search API for real-time price verification (2026)
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

async function searchWeb(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    console.log('[analyze-devis-pro] No Brave API key - using AI memory only')
    return `[Recherche non disponible - clé API manquante. Utilise ta mémoire pour estimer les prix 2026.]`
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
      console.error('[analyze-devis-pro] Brave Search error:', response.status)
      return `[Recherche échouée - code ${response.status}]`
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return `[Aucun résultat trouvé pour: ${query}]`
    }

    // Format results with prices if found
    return results.slice(0, 4).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description} (${r.url})`
    ).join('\n')
  } catch (error) {
    console.error('[analyze-devis-pro] Search error:', error)
    return `[Erreur de recherche: ${error}]`
  }
}

// Tool definition for web search
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'search_prices',
  description: `Recherche les prix actuels (janvier 2026) des pièces auto et prestations garage sur le web français.
OBLIGATOIRE: Utilise cet outil pour CHAQUE pièce ou prestation du devis.
Sites de référence: Oscaro.com, Yakarouler.com, Mister-Auto.com, AutoDoc.fr, Feu-Vert.fr`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'La requête de recherche (ex: "plaquettes frein Peugeot 308 prix 2026 oscaro" ou "tarif horaire carrosserie garage 2026 france")'
      }
    },
    required: ['query']
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY manquante')
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Config manquante' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { imageBase64 } = body

    if (!imageBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image requise' }) }
    }

    const imageSizeKB = Math.round((imageBase64.length * 3) / 4 / 1024)
    console.log(`📦 Image: ${imageSizeKB}KB`)

    if (imageSizeKB > 4000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image trop grosse (max 4MB)' }) }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Analyse avec recherche web temps réel (2026)
    console.log('🚀 Analyse en cours...')
    console.log(`🔍 Brave Search API: ${BRAVE_API_KEY ? 'Configurée' : 'Non configurée'}`)

    const systemPrompt = `Tu es un expert en tarification automobile française avec 20 ans d'expérience.

DATE ACTUELLE: 25 janvier 2026

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #1 - EXTRACTION LITTÉRALE DES MONTANTS
═══════════════════════════════════════════════════════════════════════════════
Tu DOIS extraire les montants EXACTEMENT comme ils apparaissent sur le devis.
- Si le devis affiche "1562,00€", tu retournes 1562.00
- Si le devis affiche "TOTAL TTC: 847.50€", tu retournes 847.50
- JAMAIS d'estimation, JAMAIS d'arrondi, JAMAIS d'invention
- Les prix du devis sont SACRÉS et IMMUABLES
- En cas de doute, relis l'image et cite le montant EXACT
═══════════════════════════════════════════════════════════════════════════════

CAPACITÉ RECHERCHE WEB:
Tu as accès à l'outil search_prices pour rechercher les prix ACTUELS (2026) sur internet.
${BRAVE_API_KEY ? 'IMPORTANT: Fais MAX 3-4 recherches pour les pièces/prestations PRINCIPALES du devis (les plus chères). Pour les petites lignes, utilise tes connaissances.' : 'Note: Recherche web non disponible, utilise tes connaissances 2025 + inflation +3%.'}

REQUÊTES DE RECHERCHE À UTILISER:
- "[pièce] [marque] [modèle] prix 2026 oscaro"
- "[pièce] prix janvier 2026 yakarouler"
- "tarif horaire main d'œuvre [mécanique/carrosserie] 2026 france"

SITES DE RÉFÉRENCE:
- Oscaro.com (leader France pièces auto)
- Yakarouler.com
- Mister-Auto.com
- AutoDoc.fr
- Feu-Vert.fr (tarifs main d'œuvre)

TARIFS INDICATIFS MAIN D'ŒUVRE 2026:
- Mécanique générale: 70-100€/h
- Carrosserie-peinture: 80-120€/h
- Concession: 90-140€/h

═══════════════════════════════════════════════════════════════════════════════
RÈGLES CRITIQUES DE CALCUL:
═══════════════════════════════════════════════════════════════════════════════
1. totalTTC = le total EXACT LU SUR LE DEVIS (pas estimé, pas calculé)
2. Chaque ligne.totalTTC = montant EXACT LU SUR LE DEVIS pour cette ligne
3. prixMarcheEstime = prix trouvé par recherche web OU estimation 2026
4. totalMarcheEstime = SOMME de tous les prixMarcheEstime
5. ecartPourcent = ((totalTTC_ligne - prixMarcheEstime) / prixMarcheEstime) * 100

⚠️ CALCUL DIFFÉRENCE CRITIQUE:
economiesPotentielles.montant = totalTTC - totalMarcheEstime
C'est la DIFFÉRENCE GLOBALE, PAS la somme des écarts individuels!

EXEMPLE:
- Ligne 1: facturé 800€ (lu sur devis), marché 700€, écart +14%
- Ligne 2: facturé 762€ (lu sur devis), marché 615€, écart +24%
- Total facturé: 1562€ (lu sur devis)
- Total marché: 1315€ (700 + 615)
- Différence = 1562 - 1315 = 247€ ✅

BARÈME VERDICT: ok=écart<15%, eleve=15-40%, arnaque=>40%`

    const userPrompt = `Analyse ce devis automobile.

⚠️ EXTRACTION LITTÉRALE OBLIGATOIRE:
- Lis CHAQUE montant EXACTEMENT comme écrit sur le devis
- Le "totalTTC" de chaque ligne = montant EXACT sur le devis (pas estimé)
- Le "totalTTC" global = TOTAL TTC EXACT affiché sur le devis
- NE JAMAIS inventer ou estimer les prix facturés

ÉTAPES:
1. LIS ATTENTIVEMENT chaque montant sur le devis (prix exact, pas d'estimation)
2. ${BRAVE_API_KEY ? 'Pour les 3-4 lignes principales, recherche les prix marché 2026' : 'Estime les prix marché 2026'}
3. Compare prix facturés (lus) vs prix marché (estimés)

RETOURNE UNIQUEMENT CE JSON (pas de markdown, pas de texte avant/après):
{
  "garage": {"nom": "...", "adresse": "..."},
  "lignes": [
    {"designation": "...", "totalTTC": <MONTANT_EXACT_LU_SUR_DEVIS>, "prixMarcheEstime": 0, "ecartPourcent": 0, "verdict": "ok|eleve|arnaque"}
  ],
  "totalTTC": <TOTAL_TTC_EXACT_LU_SUR_DEVIS>,
  "totalMarcheEstime": 0,
  "verdict": {
    "note": 7,
    "statut": "honnete|reserve|arnaque",
    "recommandation": "...",
    "commentaireExpert": "..."
  },
  "economiesPotentielles": {"montant": 0, "conseils": ["..."]},
  "sourcesPrix": "Recherche web janvier 2026 (Oscaro, Yakarouler, etc.)"
}`

    // Initial message with image
    const messages: Anthropic.Messages.MessageParam[] = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
        },
        {
          type: 'text',
          text: userPrompt
        }
      ]
    }]

    // Tool use loop - limit to 4 searches to stay under 60s timeout
    let responseText = ''
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
      iterations++

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0,  // ⚠️ CRITIQUE: Force extraction DÉTERMINISTE des montants
        system: systemPrompt,
        tools: BRAVE_API_KEY ? [webSearchTool] : [],
        messages,
      })

      // Check if model wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlock && toolUseBlock.name === 'search_prices') {
        // Execute the search
        const input = toolUseBlock.input as { query: string }
        console.log(`🔍 [${iterations}] Recherche: ${input.query}`)
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

      // No more tool calls, extract final text
      const textBlock = response.content.find(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
      )

      if (textBlock) {
        responseText = textBlock.text
      }

      break
    }

    console.log(`📝 Réponse reçue après ${iterations} itération(s)`)

    let parsed
    try {
      const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('❌ Parse error:', responseText.substring(0, 200))
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Impossible de lire le devis. Photo plus nette SVP.' }) }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VALIDATION: Vérifier cohérence des montants extraits
    // ══════════════════════════════════════════════════════════════════════════
    const totalFromLines = parsed.lignes?.reduce((s: number, l: { totalTTC?: number }) => s + (l.totalTTC || 0), 0) || 0
    const declaredTotal = parsed.totalTTC || 0
    const tolerance = 5 // 5€ de tolérance pour les arrondis

    if (Math.abs(totalFromLines - declaredTotal) > tolerance && totalFromLines > 0) {
      console.warn('⚠️ INCOHÉRENCE DÉTECTÉE:')
      console.warn(`   Somme des lignes: ${totalFromLines}€`)
      console.warn(`   Total déclaré: ${declaredTotal}€`)
      console.warn(`   Écart: ${Math.abs(totalFromLines - declaredTotal)}€`)
      // On utilise le total déclaré car c'est ce qui est affiché sur le devis
    }

    // Vérifier que le total n'est pas aberrant (ex: 0€ ou négatif)
    if (declaredTotal <= 0) {
      console.error('❌ Total invalide:', declaredTotal)
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Impossible de lire le total du devis. Assure-toi que le montant TTC est visible.' }) }
    }

    // Construire résultat
    interface LigneDevis {
      designation: string
      totalTTC: number
      prixMarcheEstime: number
      ecartPourcent: number
      verdict: 'ok' | 'eleve' | 'arnaque'
    }
    const lignesOk = parsed.lignes?.filter((l: LigneDevis) => l.verdict === 'ok').length || 0
    const lignesElevees = parsed.lignes?.filter((l: LigneDevis) => l.verdict === 'eleve').length || 0
    const lignesArnaques = parsed.lignes?.filter((l: LigneDevis) => l.verdict === 'arnaque').length || 0

    // ══════════════════════════════════════════════════════════════════════════
    // CALCUL CORRECT de la différence (surfacturation)
    // RÈGLE: différence = totalFacture - totalMarche (PAS la somme des écarts!)
    // ══════════════════════════════════════════════════════════════════════════

    const totalFacture = parsed.totalTTC || 0

    // TOUJOURS recalculer le total marché à partir des lignes pour éviter les erreurs de l'IA
    const totalMarcheFromLines = parsed.lignes?.reduce((s: number, l: LigneDevis) => s + (l.prixMarcheEstime || 0), 0) || 0

    // Utiliser le total calculé à partir des lignes (plus fiable que le total global de l'IA)
    const totalMarche = totalMarcheFromLines > 0
      ? totalMarcheFromLines
      : (parsed.totalMarcheEstime || 0)

    // Calcul de la différence : prix facturé - prix marché
    // C'est LA SEULE formule correcte pour calculer l'économie potentielle
    const difference = Math.round((totalFacture - totalMarche) * 100) / 100
    const pourcentage = totalMarche > 0 ? Math.round(((difference / totalMarche) * 100) * 10) / 10 : 0

    // Log détaillé pour debug et vérification
    console.log('═══════════════════════════════════════════════════')
    console.log('💰 CALCUL DIFFÉRENCE:')
    console.log(`   Prix facturé (totalTTC): ${totalFacture}€`)
    console.log(`   Prix marché (somme lignes): ${totalMarcheFromLines}€`)
    console.log(`   Prix marché (IA global): ${parsed.totalMarcheEstime || 'non fourni'}€`)
    console.log(`   Total marché utilisé: ${totalMarche}€`)
    console.log(`   ➤ DIFFÉRENCE = ${totalFacture} - ${totalMarche} = ${difference}€`)
    console.log(`   ➤ Pourcentage: ${pourcentage}%`)
    if (parsed.economiesPotentielles?.montant) {
      console.log(`   ⚠️ Montant retourné par IA: ${parsed.economiesPotentielles.montant}€ (ignoré, on utilise notre calcul)`)
    }
    console.log('═══════════════════════════════════════════════════')

    const result = {
      garage: parsed.garage || { nom: 'Non identifié' },
      lignes: (parsed.lignes || []).map((l: LigneDevis) => ({
        designation: l.designation,
        totalTTC: l.totalTTC,
        prixMarche: { moyenne: l.prixMarcheEstime },
        ecart: l.ecartPourcent,
        verdict: l.verdict,
        sourceEstimation: 'Prix marché 2026'
      })),
      garageInfo: { nom: parsed.garage?.nom },
      alertes: { graves: [], moyennes: [], info: [] },
      verdict: {
        note: parsed.verdict?.note || 5,
        statut: parsed.verdict?.statut || 'reserve',
        recommandation: parsed.verdict?.recommandation || '',
        commentaireExpert: parsed.verdict?.commentaireExpert || '',
        lignesOk,
        lignesElevees,
        lignesArnaques
      },
      totaux: {
        totalFacture,
        totalMarche
      },
      // FIX: Calcul correct = totalFacture - totalMarche (pas la somme des écarts)
      economiesPotentielles: {
        montant: difference,
        pourcentage,
        conseils: parsed.economiesPotentielles?.conseils || []
      },
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Note: ${result.verdict.note}/10`)

    return { statusCode: 200, headers, body: JSON.stringify(result) }

  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    console.error('❌ Erreur:', err.message)

    if (err.status === 429) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Trop de requêtes. Attends 1 min.' }) }
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur serveur. Réessaie.' }) }
  }
}
