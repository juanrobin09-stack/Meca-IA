import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

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

    // UN SEUL appel API pour extraction + analyse (plus rapide)
    console.log('🚀 Analyse en cours...')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: `Analyse ce devis automobile. Extrais les infos et donne ton verdict.

RETOURNE UNIQUEMENT CE JSON (pas de markdown):
{
  "garage": {"nom": "...", "adresse": "..."},
  "lignes": [
    {"designation": "...", "totalTTC": 0, "prixMarcheEstime": 0, "ecartPourcent": 0, "verdict": "ok|eleve|arnaque"}
  ],
  "totalTTC": 0,
  "totalMarcheEstime": 0,
  "verdict": {
    "note": 7,
    "statut": "honnete|reserve|arnaque",
    "recommandation": "...",
    "commentaireExpert": "..."
  },
  "economiesPotentielles": {"montant": 0, "conseils": ["..."]}
}

RÈGLES CRITIQUES DE CALCUL:
1. totalTTC = le total EXACT du devis (prix facturé par le garage)
2. prixMarcheEstime = prix RÉALISTE de chaque prestation sur le marché français
3. totalMarcheEstime = SOMME des prixMarcheEstime de toutes les lignes
4. ecartPourcent = ((totalTTC_ligne - prixMarcheEstime) / prixMarcheEstime) * 100
5. economiesPotentielles.montant = totalTTC - totalMarcheEstime (DIFFÉRENCE GLOBALE)

VÉRIFICATION: Si totalTTC=1562€ et totalMarcheEstime=1315€, alors montant=247€ (PAS la somme des écarts!)

BARÈME VERDICT: ok=écart<15%, eleve=15-40%, arnaque=>40%
PRIX MARCHÉ 2026: Main d'œuvre 60-90€/h, Plaquettes 25-60€, Vidange 60-120€, Révision 150-300€`
          }
        ]
      }]
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('📝 Réponse reçue')

    let parsed
    try {
      const clean = responseText.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('❌ Parse error:', responseText.substring(0, 200))
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Impossible de lire le devis. Photo plus nette SVP.' }) }
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

    // CALCUL CORRECT de la différence (surfacturation)
    // On utilise le totalMarcheEstime de l'IA ou on calcule à partir des lignes
    const totalFacture = parsed.totalTTC || 0
    const totalMarcheFromLines = parsed.lignes?.reduce((s: number, l: LigneDevis) => s + (l.prixMarcheEstime || 0), 0) || 0

    // Préférer le total marché global si l'IA l'a fourni, sinon utiliser la somme des lignes
    const totalMarche = parsed.totalMarcheEstime && parsed.totalMarcheEstime > 0
      ? parsed.totalMarcheEstime
      : totalMarcheFromLines

    // Calcul de la différence : prix facturé - prix marché
    const difference = Math.round((totalFacture - totalMarche) * 100) / 100
    const pourcentage = totalMarche > 0 ? Math.round(((difference / totalMarche) * 100) * 10) / 10 : 0

    // Log pour debug
    console.log(`💰 Calcul: Facturé=${totalFacture}€, Marché=${totalMarche}€, Diff=${difference}€ (${pourcentage}%)`)

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
