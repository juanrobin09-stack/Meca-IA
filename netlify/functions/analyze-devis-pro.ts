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
    console.log('═══ DEBUT ANALYSE DEVIS PRO ═══')
    console.log(`📄 Image reçue: ${imageSizeKB}KB`)
    console.log(`🔍 Brave Search API: ${BRAVE_API_KEY ? '✅ Configurée' : '❌ Non configurée - PRIX MARCHÉ RISQUENT D\'ÊTRE SOUS-ESTIMÉS'}`)
    console.log(`🌐 Temperature: 0 (déterministe)`)
    console.log(`📅 Date analyse: ${new Date().toISOString()}`)

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

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #2 - RECHERCHE WEB OBLIGATOIRE POUR PRIX MARCHÉ
═══════════════════════════════════════════════════════════════════════════════
${BRAVE_API_KEY ? `TU DOIS OBLIGATOIREMENT utiliser search_prices pour CHAQUE pièce/prestation du devis.
NE JAMAIS utiliser uniquement ta mémoire (coupure janvier 2025) - les prix évoluent !

NOMBRE DE RECHERCHES: Fais 4-6 recherches minimum pour couvrir:
- Chaque pièce principale (pare-choc, phare, aile, etc.)
- Chaque prestation MO (carrosserie, peinture, mécanique)
- Consommables (peinture, vernis, apprêt)` : 'Note: Recherche web non disponible, utilise tes connaissances 2025 + inflation +5%.'}

REQUÊTES DE RECHERCHE OPTIMALES:
- "[pièce exacte] [marque] [modèle] prix 2026 oscaro"
- "[pièce] prix janvier 2026 yakarouler mister-auto"
- "tarif horaire main d'œuvre carrosserie garage 2026 france"
- "tarif horaire peinture automobile 2026"

POUR VOITURES SANS PERMIS (VSP) - TRÈS IMPORTANT:
Si le devis concerne Aixam, Ligier, Microcar, Chatenet, Bellier:
- Recherche: "[pièce] Aixam prix 2026 piecesanspermis"
- Recherche: "[pièce] VSP voiture sans permis prix 2026"
- Sites spécialisés: Piecesanspermis.fr, VSPieces.com, MisterVSP.fr
- ⚠️ Les pièces VSP sont souvent PLUS CHÈRES que les voitures normales !

SITES DE RÉFÉRENCE:
- Oscaro.com (leader France pièces auto)
- Yakarouler.com, Mister-Auto.com, AutoDoc.fr
- Feu-Vert.fr, Norauto.fr (tarifs main d'œuvre)
- Piecesanspermis.fr (VSP)

═══════════════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ABSOLUE #3 - NE PAS SOUS-ESTIMER LES PRIX MARCHÉ
═══════════════════════════════════════════════════════════════════════════════
ERREUR FATALE À ÉVITER: Sous-estimer les prix = accuser un garage honnête d'arnaque !

TARIFS MAIN D'ŒUVRE 2026 RÉALISTES (France métropolitaine):
- Mécanique générale: 70-95€/h TTC
- Carrosserie-peinture: 80-110€/h TTC (travail qualifié!)
- Concession/spécialiste: 100-150€/h TTC
- Garage rural: 55-75€/h TTC

EXEMPLES DE PRIX PIÈCES 2026 (ordre de grandeur):
- Pare-choc origine: 200-450€ (pas 80-100€!)
- Aile avant: 150-350€
- Phare complet: 150-500€
- Rétroviseur: 80-250€
- Peinture + vernis auto: 80-150€/élément

RÈGLE D'OR: En cas de doute, ARRONDIR À LA HAUSSE le prix marché.
Mieux vaut dire "devis correct" que "arnaque" par erreur !
═══════════════════════════════════════════════════════════════════════════════

RÈGLES CRITIQUES DE CALCUL:
1. totalTTC = le total EXACT LU SUR LE DEVIS (pas estimé, pas calculé)
2. Chaque ligne.totalTTC = montant EXACT LU SUR LE DEVIS pour cette ligne
3. prixMarcheEstime = prix trouvé par recherche web OU estimation RÉALISTE 2026
4. totalMarcheEstime = SOMME de tous les prixMarcheEstime
5. ecartPourcent = ((totalTTC_ligne - prixMarcheEstime) / prixMarcheEstime) * 100

⚠️ CALCUL DIFFÉRENCE CRITIQUE:
economiesPotentielles.montant = totalTTC - totalMarcheEstime
C'est la DIFFÉRENCE GLOBALE, PAS la somme des écarts individuels!

EXEMPLE CORRECT:
- Pare-choc facturé 350€ → marché 280-320€ → écart ~10-20%
- Main d'œuvre facturé 400€ (5h × 80€) → marché 350-450€ → correct
- Total facturé: 750€ → Total marché: ~700€ → Différence: ~50€ (+7%)
- Verdict: CORRECT ✅

BARÈME VERDICT (basé sur écart % par rapport au marché):
- ok: écart < 15% (devis normal)
- eleve: écart 15-30% (négociable mais pas arnaque)
- arnaque: écart > 30% (surfacturation claire)`

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

    // ══════════════════════════════════════════════════════════════════════════
    // DEBUG LOGS - Pour diagnostiquer les échecs d'extraction
    // ══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════')
    console.log('📸 EXTRACTION DEBUG:')
    console.log(`   Réponse brute (longueur): ${responseText.length} caractères`)
    console.log(`   Réponse brute (premiers 500 chars):`)
    console.log(responseText.substring(0, 500))
    console.log(`   Réponse brute (derniers 200 chars):`)
    console.log(responseText.substring(Math.max(0, responseText.length - 200)))
    console.log('═══════════════════════════════════════════════════')

    // Si réponse vide, c'est un problème de vision/image
    if (!responseText || responseText.trim().length === 0) {
      console.error('🚨 ERREUR: Réponse vide de Claude - Problème de lecture de l\'image')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'L\'IA n\'a pas pu lire l\'image. Vérifie que c\'est bien une photo de devis et réessaie.',
          debug: 'EMPTY_RESPONSE'
        })
      }
    }

    let parsed
    try {
      // Nettoyage robuste du JSON
      let clean = responseText

      // Supprimer les blocs markdown ```json ... ```
      clean = clean.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

      // Trouver le JSON dans la réponse (chercher { ... })
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        clean = jsonMatch[0]
      }

      clean = clean.trim()

      console.log('🔧 JSON après nettoyage (premiers 300 chars):')
      console.log(clean.substring(0, 300))

      parsed = JSON.parse(clean)
      console.log('✅ JSON parsé avec succès')
    } catch (parseError) {
      console.error('❌ ERREUR PARSING JSON:')
      console.error(`   Message: ${parseError}`)
      console.error(`   Réponse brute complète:`)
      console.error(responseText)

      // Analyser le type d'erreur pour un meilleur message
      const isNoQuoteDetected = responseText.toLowerCase().includes('pas un devis') ||
                                 responseText.toLowerCase().includes('cannot read') ||
                                 responseText.toLowerCase().includes('not a quote')

      const isImageProblem = responseText.toLowerCase().includes('image') &&
                              (responseText.toLowerCase().includes('floue') ||
                               responseText.toLowerCase().includes('illisible') ||
                               responseText.toLowerCase().includes('blurry'))

      if (isNoQuoteDetected) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Cette image ne semble pas être un devis automobile. Envoie une photo de ton devis garage.',
            debug: 'NOT_A_QUOTE'
          })
        }
      }

      if (isImageProblem) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'L\'image est difficile à lire. Prends une nouvelle photo avec un meilleur éclairage.',
            debug: 'IMAGE_QUALITY'
          })
        }
      }

      // Erreur générique avec plus de contexte
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Erreur lors de l\'analyse. L\'IA n\'a pas retourné un format valide. Réessaie.',
          debug: 'JSON_PARSE_ERROR',
          hint: responseText.substring(0, 100)
        })
      }
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

    // ══════════════════════════════════════════════════════════════════════════
    // VALIDATION CRITIQUE: Détecter prix marché anormalement bas
    // Si ratio < 60%, l'IA a probablement sous-estimé les prix !
    // ══════════════════════════════════════════════════════════════════════════
    const ratioMarcheFacture = totalMarche / totalFacture

    // Log détaillé pour debug et vérification
    console.log('═══════════════════════════════════════════════════')
    console.log('💰 CALCUL DIFFÉRENCE:')
    console.log(`   Prix facturé (totalTTC): ${totalFacture}€`)
    console.log(`   Prix marché (somme lignes): ${totalMarcheFromLines}€`)
    console.log(`   Prix marché (IA global): ${parsed.totalMarcheEstime || 'non fourni'}€`)
    console.log(`   Total marché utilisé: ${totalMarche}€`)
    console.log(`   ➤ DIFFÉRENCE = ${totalFacture} - ${totalMarche} = ${difference}€`)
    console.log(`   ➤ Pourcentage: ${pourcentage}%`)
    console.log(`   📊 Ratio marché/facturé: ${(ratioMarcheFacture * 100).toFixed(1)}%`)
    if (parsed.economiesPotentielles?.montant) {
      console.log(`   ⚠️ Montant retourné par IA: ${parsed.economiesPotentielles.montant}€ (ignoré, on utilise notre calcul)`)
    }

    // ALERTE si prix marché suspicieusement bas
    if (ratioMarcheFacture < 0.60 && totalMarche > 0) {
      console.warn('🚨 ALERTE: Prix marché possiblement SOUS-ESTIMÉ!')
      console.warn(`   Le prix marché (${totalMarche}€) est inférieur à 60% du prix facturé (${totalFacture}€)`)
      console.warn('   Cela peut indiquer une sous-estimation des prix par l\'IA')
      console.warn('   Vérifier manuellement les prix des pièces principales')

      // Log des lignes pour investigation
      console.log('📝 Détail des lignes pour investigation:')
      parsed.lignes?.forEach((l: LigneDevis, i: number) => {
        const ligneRatio = l.prixMarcheEstime / l.totalTTC
        const flag = ligneRatio < 0.5 ? '🔴' : ligneRatio < 0.7 ? '🟡' : '🟢'
        console.log(`   ${flag} Ligne ${i+1}: "${l.designation}" - Facturé: ${l.totalTTC}€, Marché: ${l.prixMarcheEstime}€ (ratio: ${(ligneRatio * 100).toFixed(0)}%)`)
      })
    } else if (ratioMarcheFacture >= 0.85) {
      console.log('✅ Prix marché cohérent avec prix facturé (ratio >= 85%)')
    }

    // Validation prix marché pas aberrant
    if (totalMarche <= 0) {
      console.error('🚨 ERREUR: Prix marché invalide (<=0)')
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
