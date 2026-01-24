import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

// Brave Search API for real-time price verification (2026)
const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

async function searchWeb(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    console.log('[analyze-devis-pro] No Brave API key - using AI memory only')
    return `[Recherche non disponible - utilise les prix de référence du prompt.]`
  }

  try {
    // ⚡ Timeout 5s pour éviter les blocages
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3&country=fr`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        },
        signal: controller.signal
      }
    )

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('[analyze-devis-pro] Brave Search error:', response.status)
      return `[Recherche échouée - code ${response.status}]`
    }

    const data = await response.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      return `[Aucun résultat trouvé pour: ${query}]`
    }

    // Format results - compact pour vitesse
    return results.slice(0, 3).map((r: { title: string; description: string }) =>
      `${r.title}: ${r.description}`
    ).join('\n')
  } catch (error) {
    console.error('[analyze-devis-pro] Search error:', error)
    // En cas d'erreur/timeout, on continue sans web search
    return `[Recherche timeout - utilise les prix de référence]`
  }
}

// Tool definition for web search - LIMITÉ à 1 recherche pour vitesse
const webSearchTool: Anthropic.Messages.Tool = {
  name: 'search_prices',
  description: `Recherche prix 2026 pièces/MO auto. LIMITE: 1 seule recherche groupée!
Ex: "pare-choc aile phare Peugeot 308 prix 2026 oscaro tarif carrosserie"`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Requête groupée (ex: "pare-choc aile Peugeot prix 2026 oscaro tarif MO carrosserie")'
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

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🚀 DEBUT REQUETE ANALYZE-DEVIS-PRO')
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  console.log('═══════════════════════════════════════════════════════════════')

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
    let { imageBase64 } = body
    let detectedMediaType = 'image/jpeg' // Default, sera mis à jour si data: URL détectée

    console.log('📦 Body reçu:', {
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      imageBase64Start: imageBase64?.substring(0, 100) || 'N/A',
      bodyKeys: Object.keys(body)
    })

    if (!imageBase64) {
      console.error('❌ Pas d\'image dans le body')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image requise' }) }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔧 FIX CRITIQUE: Nettoyer le base64 si nécessaire
    // ═══════════════════════════════════════════════════════════════════════════
    if (imageBase64.startsWith('data:')) {
      console.log('🔧 Base64 contient préfixe data: URL - Nettoyage en cours...')

      // Extraire le type MIME depuis la data URL
      const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/)
      if (mimeMatch) {
        detectedMediaType = mimeMatch[1]
        console.log(`   Type MIME détecté: ${detectedMediaType}`)
      }

      // Extraire le base64 pur (après la virgule)
      const commaIndex = imageBase64.indexOf(',')
      if (commaIndex !== -1) {
        imageBase64 = imageBase64.substring(commaIndex + 1)
        console.log(`   ✅ Base64 nettoyé: ${imageBase64.length} chars`)
        console.log(`   Nouveaux premiers 50 chars: ${imageBase64.substring(0, 50)}`)
      } else {
        console.error('❌ Format data: URL invalide - pas de virgule trouvée!')
      }
    }

    const imageSizeKB = Math.round((imageBase64.length * 3) / 4 / 1024)
    console.log(`📦 Image: ${imageSizeKB}KB (${imageBase64.length} chars base64)`)
    console.log(`📸 Type MIME utilisé: ${detectedMediaType}`)

    if (imageSizeKB > 4000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image trop grosse (max 4MB)' }) }
    }

    // Vérifier si le base64 semble valide (après nettoyage)
    const base64Regex = /^[A-Za-z0-9+/=]+$/
    const sampleToCheck = imageBase64.substring(0, 100).replace(/\s/g, '') // Ignorer espaces/newlines
    const isValidBase64 = base64Regex.test(sampleToCheck)
    console.log(`🔍 Base64 valide: ${isValidBase64 ? '✅' : '❌'}`)

    if (!isValidBase64) {
      console.error('❌ Le base64 contient des caractères invalides')
      console.error('   Premiers 100 chars:', imageBase64.substring(0, 100))
      console.error('   Chars problématiques:', sampleToCheck.match(/[^A-Za-z0-9+/=]/g))

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Image corrompue. Reprends une photo avec l\'appareil photo.',
          debug: 'INVALID_BASE64'
        })
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Analyse SANS recherche web (single call pour respecter timeout Netlify)
    console.log('═══ DEBUT ANALYSE DEVIS PRO ═══')
    console.log(`📄 Image reçue: ${imageSizeKB}KB`)
    console.log(`🔍 Mode: Single call (pas de web search pour vitesse)`)
    console.log(`🌐 Temperature: 0 (déterministe)`)
    console.log(`📅 Date analyse: ${new Date().toISOString()}`)

    // ✅ PROMPT OPTIMISÉ: Sonnet + 1 recherche web groupée
    const systemPrompt = `Expert tarification auto France. Date: janvier 2026.

RÈGLE #1 - EXTRACTION EXACTE:
Lis les montants EXACTEMENT comme sur le devis. Pas d'estimation pour les prix facturés.

RÈGLE #2 - RECHERCHE WEB:
${BRAVE_API_KEY ? `Fais UNE SEULE recherche groupée avec search_prices pour vérifier les prix 2026.
Ex: "pare-choc aile [marque modèle] prix 2026 oscaro tarif carrosserie"` : 'Pas de recherche web, utilise les fourchettes ci-dessous.'}

PRIX DE RÉFÉRENCE 2026 (si pas de recherche):
- MO mécanique: 70-95€/h | MO carrosserie: 80-110€/h
- Pare-choc: 200-500€ | Aile: 150-400€ | Phare: 150-600€
- Embrayage: 300-700€ | Turbo: 800-2500€ | FAP: 800-2000€

RÈGLE #3 - VERDICTS:
- ok: écart < 15% | eleve: 15-30% | arnaque: > 30%
- NE PAS SOUS-ESTIMER les prix marché !

CALCUL: ecartPourcent = ((facturé - marché) / marché) × 100`

    const userPrompt = `Analyse ce devis automobile.

ÉTAPES:
1. Lis CHAQUE montant EXACTEMENT comme écrit sur le devis
2. Estime le prix marché 2026 pour chaque ligne (utilise les fourchettes du system prompt)
3. Compare et calcule les écarts

RETOURNE UNIQUEMENT CE JSON (pas de markdown, pas de texte):
{
  "garage": {"nom": "...", "adresse": "..."},
  "lignes": [
    {"designation": "...", "totalTTC": <MONTANT_EXACT_DU_DEVIS>, "prixMarcheEstime": <ESTIMATION_2026>, "ecartPourcent": <CALCUL>, "verdict": "ok|eleve|arnaque"}
  ],
  "totalTTC": <TOTAL_EXACT_DU_DEVIS>,
  "totalMarcheEstime": <SOMME_ESTIMATIONS>,
  "verdict": {
    "note": <1-10>,
    "statut": "honnete|reserve|arnaque",
    "recommandation": "...",
    "commentaireExpert": "..."
  },
  "economiesPotentielles": {"montant": <DIFFERENCE>, "conseils": ["..."]}
}`

    // Initial message with image
    const messages: Anthropic.Messages.MessageParam[] = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: detectedMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: imageBase64 }
        },
        {
          type: 'text',
          text: userPrompt
        }
      ]
    }]

    // ⚡ OPTIMISÉ: Sonnet + 1 recherche web max pour rester < 26s
    let responseText = ''
    let iterations = 0
    const maxIterations = 2  // 1 initial + 1 tool use max

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🤖 DEBUT APPEL CLAUDE VISION API')
    console.log(`   Model: claude-sonnet-4-20250514 (QUALITÉ)`)
    console.log(`   Max iterations: ${maxIterations} (1 search max)`)
    console.log(`   Web search: ${BRAVE_API_KEY ? '✅ ACTIVÉ (1 recherche groupée)' : '❌ Non configuré'}`)
    console.log('═══════════════════════════════════════════════════════════════')

    while (iterations < maxIterations) {
      iterations++
      console.log(`\n🔄 [Iteration ${iterations}/${maxIterations}] Appel Claude...`)

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',  // ✅ QUALITÉ: Sonnet pour analyse précise
          max_tokens: 2500,
          temperature: 0,  // ⚠️ CRITIQUE: Force extraction DÉTERMINISTE des montants
          system: systemPrompt,
          tools: BRAVE_API_KEY ? [webSearchTool] : [],  // ✅ Web search si disponible
          messages,
        })

        // 🔍 LOGS DÉTAILLÉS DE LA RÉPONSE CLAUDE
        console.log(`✅ Réponse reçue:`)
        console.log(`   stop_reason: ${response.stop_reason}`)
        console.log(`   model: ${response.model}`)
        console.log(`   usage: input=${response.usage?.input_tokens}, output=${response.usage?.output_tokens}`)
        console.log(`   content blocks: ${response.content.length}`)

        // Log chaque bloc de contenu
        response.content.forEach((block, idx) => {
          console.log(`   📦 Block ${idx}: type=${block.type}`)
          if (block.type === 'text') {
            console.log(`      text length: ${block.text.length}`)
            console.log(`      text preview: ${block.text.substring(0, 200)}...`)
          } else if (block.type === 'tool_use') {
            console.log(`      tool: ${block.name}`)
            console.log(`      input: ${JSON.stringify(block.input)}`)
          }
        })

        // Si pas de contenu du tout, c'est un problème
        if (!response.content || response.content.length === 0) {
          console.error('🚨 ERREUR: Claude a retourné une réponse VIDE (content=[])!')
          console.error('   Cela peut indiquer un problème avec l\'image ou le prompt.')
          break
        }

        // Check if model wants to use a tool
        const toolUseBlock = response.content.find(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        )

        if (toolUseBlock && toolUseBlock.name === 'search_prices') {
          // Execute the search
          const input = toolUseBlock.input as { query: string }
          console.log(`🔍 [${iterations}] Exécution recherche: ${input.query}`)
          const searchResults = await searchWeb(input.query)
          console.log(`   Résultats: ${searchResults.substring(0, 200)}...`)

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

        // Vérifier si c'est un tool_use inconnu
        if (toolUseBlock) {
          console.warn(`⚠️ Tool use inattendu: ${toolUseBlock.name}`)
        }

        // No more tool calls, extract final text
        const textBlock = response.content.find(
          (block): block is Anthropic.Messages.TextBlock => block.type === 'text'
        )

        if (textBlock) {
          responseText = textBlock.text
          console.log(`✅ Texte final extrait: ${responseText.length} caractères`)
        } else {
          console.error('❌ Pas de bloc texte dans la réponse finale!')
          console.error('   Blocs présents:', response.content.map(b => b.type).join(', '))

          // Essayer de récupérer n'importe quel texte
          const anyText = response.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')

          if (anyText) {
            responseText = anyText
            console.log('🔧 Texte récupéré par fallback:', anyText.length, 'chars')
          }
        }

        break
      } catch (apiError) {
        console.error(`❌ [Iteration ${iterations}] Erreur API Claude:`, apiError)
        const err = apiError as { message?: string; status?: number; error?: { type?: string } }
        console.error(`   Message: ${err.message}`)
        console.error(`   Status: ${err.status}`)
        console.error(`   Type: ${err.error?.type}`)

        // Si erreur API, on stoppe
        throw apiError
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`📝 BILAN: Réponse reçue après ${iterations} itération(s)`)
    console.log(`   responseText length: ${responseText.length}`)
    console.log('═══════════════════════════════════════════════════════════════')

    // ══════════════════════════════════════════════════════════════════════════
    // DEBUG LOGS - Pour diagnostiquer les échecs d'extraction
    // ══════════════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════')
    console.log('📸 EXTRACTION DEBUG:')
    console.log(`   Réponse brute (longueur): ${responseText.length} caractères`)
    if (responseText.length > 0) {
      console.log(`   Réponse brute (premiers 500 chars):`)
      console.log(responseText.substring(0, 500))
      console.log(`   Réponse brute (derniers 200 chars):`)
      console.log(responseText.substring(Math.max(0, responseText.length - 200)))
    } else {
      console.log('   ⚠️ RÉPONSE VIDE!')
    }
    console.log('═══════════════════════════════════════════════════')

    // Si réponse vide, c'est un problème de vision/image
    if (!responseText || responseText.trim().length === 0) {
      console.error('🚨 ERREUR CRITIQUE: Réponse vide de Claude')
      console.error('   Causes possibles:')
      console.error('   1. L\'image n\'est pas lisible par Claude Vision')
      console.error('   2. L\'image ne contient pas de devis')
      console.error('   3. Format d\'image non supporté')
      console.error('   4. Problème de base64 encoding')
      console.error(`   Image size: ${imageSizeKB}KB`)
      console.error(`   Iterations: ${iterations}`)

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'L\'IA n\'a pas pu analyser cette image. Causes possibles: image floue, pas un devis, ou format non supporté. Essaie avec une photo plus nette du devis.',
          debug: 'EMPTY_RESPONSE',
          details: {
            imageSizeKB,
            iterations,
            tip: 'Utilise le bouton "Prendre photo" pour capturer une nouvelle image'
          }
        })
      }
    }

    // Si réponse très courte, probablement un message d'erreur de Claude
    if (responseText.trim().length < 50) {
      console.warn('⚠️ Réponse très courte:', responseText)
      console.warn('   Cela peut indiquer que Claude n\'a pas pu lire le devis')
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
    const err = error as { message?: string; status?: number; error?: { type?: string; message?: string } }

    console.error('═══════════════════════════════════════════════════════════════')
    console.error('💥 ERREUR CRITIQUE - ANALYZE-DEVIS-PRO')
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('Message:', err.message)
    console.error('Status:', err.status)
    console.error('Error type:', err.error?.type)
    console.error('Error message:', err.error?.message)
    console.error('Full error:', JSON.stringify(err, null, 2))
    console.error('Stack:', (error as Error).stack)
    console.error('═══════════════════════════════════════════════════════════════')

    if (err.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Trop de requêtes. Attends 1 minute et réessaie.',
          debug: 'RATE_LIMIT'
        })
      }
    }

    if (err.status === 400) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Erreur avec l\'image. Essaie avec une photo différente.',
          debug: 'BAD_REQUEST',
          details: err.error?.message
        })
      }
    }

    if (err.status === 401 || err.status === 403) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Erreur de configuration serveur. Contacte le support.',
          debug: 'AUTH_ERROR'
        })
      }
    }

    // Erreur de parsing JSON du body
    if (err.message?.includes('JSON')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Données reçues invalides. Recharge la page et réessaie.',
          debug: 'JSON_ERROR'
        })
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur inattendue. Réessaie dans quelques instants.',
        debug: 'SERVER_ERROR',
        details: err.message
      })
    }
  }
}
