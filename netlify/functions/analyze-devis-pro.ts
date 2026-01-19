import Anthropic from '@anthropic-ai/sdk'
import type { Handler } from '@netlify/functions'

interface DevisLine {
  designation: string
  quantite: number
  prixUnitaire: number
  totalTTC: number
}

interface ExtractedDevis {
  garage: {
    nom: string
    adresse?: string
    siret?: string
  }
  vehicule?: {
    marque?: string
    modele?: string
    immatriculation?: string
  }
  lignes: DevisLine[]
  totalHT: number
  tva: number
  totalTTC: number
}

export const handler: Handler = async (event) => {
  // CORS headers
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Vérifier que l'API key est configurée
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY manquante')
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Configuration serveur manquante. Contacte le support.' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { imageBase64, vehicle } = body

    console.log('📥 Requête reçue, taille body:', event.body?.length || 0)

    if (!imageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image requise' })
      }
    }

    // Vérifier la taille de l'image (max ~4MB en base64)
    const imageSizeInMB = (imageBase64.length * 3) / 4 / 1024 / 1024
    console.log(`📦 Taille image: ${imageSizeInMB.toFixed(2)} MB`)

    if (imageSizeInMB > 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image trop volumineuse (max 4MB). Compresse-la ou prends une nouvelle photo.' })
      }
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Étape 1: Extraction OCR + Structuration du devis
    console.log('📄 Étape 1: Extraction OCR...')

    const extractionPrompt = `Tu es un expert en analyse de devis automobile. Analyse cette image de devis et extrais TOUTES les informations de manière structurée.

RETOURNE UNIQUEMENT UN JSON VALIDE (pas de markdown, pas de texte avant/après):

{
  "garage": {
    "nom": "Nom du garage",
    "adresse": "Adresse complète si visible",
    "siret": "Numéro SIRET si visible"
  },
  "vehicule": {
    "marque": "Si mentionné",
    "modele": "Si mentionné",
    "immatriculation": "Si visible"
  },
  "lignes": [
    {
      "designation": "Description de la pièce ou prestation",
      "quantite": 1,
      "prixUnitaire": 0.00,
      "totalTTC": 0.00
    }
  ],
  "totalHT": 0.00,
  "tva": 0.00,
  "totalTTC": 0.00,
  "dateDevis": "Date si visible",
  "numeroDevis": "Numéro si visible"
}

RÈGLES:
- Extrais CHAQUE ligne du devis séparément
- Les prix doivent être des nombres (pas de symbole €)
- Si une info n'est pas visible, mets null
- Sois PRÉCIS sur les désignations`

    const extractionResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: extractionPrompt
          }
        ]
      }]
    })

    const extractedText = extractionResponse.content[0].type === 'text'
      ? extractionResponse.content[0].text
      : ''

    console.log('📝 Texte extrait (100 premiers chars):', extractedText.substring(0, 100))

    // Nettoyer et parser le JSON
    let extractedDevis: ExtractedDevis
    try {
      const cleanJson = extractedText.replace(/```json\n?|\n?```/g, '').trim()
      extractedDevis = JSON.parse(cleanJson)
    } catch (e) {
      console.error('❌ Erreur parsing extraction:', e)
      console.error('Texte reçu:', extractedText.substring(0, 500))
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Impossible de lire le devis. Assure-toi que l\'image est nette et bien éclairée.' })
      }
    }

    console.log(`✅ Devis extrait: ${extractedDevis.lignes?.length || 0} lignes`)

    // Étape 2: Analyse professionnelle
    console.log('💰 Étape 2: Analyse des prix...')

    const vehicleInfo = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      : extractedDevis.vehicule?.marque
        ? `${extractedDevis.vehicule.marque} ${extractedDevis.vehicule.modele || ''}`.trim()
        : 'véhicule standard'

    const analysisPrompt = `Tu es un EXPERT automobile et mécanicien professionnel avec 20 ans d'expérience.
Analyse ce devis pour un ${vehicleInfo} de manière PROFESSIONNELLE et PRÉCISE.

DEVIS À ANALYSER:
${JSON.stringify(extractedDevis, null, 2)}

POUR CHAQUE LIGNE, tu dois:
1. Identifier précisément la pièce/prestation
2. Estimer le prix RÉEL du marché en 2026
3. Calculer l'écart en %
4. Donner un verdict

BARÈME DES VERDICTS:
- "ok" : écart < 15% → Prix correct
- "eleve" : écart 15-40% → Prix élevé mais négociable
- "arnaque" : écart > 40% → Surfacturation abusive

PRIX DE RÉFÉRENCE 2026:
- Main d'œuvre garage : 60-90€/heure
- Plaquettes frein avant (jeu) : 25-60€
- Disques frein avant (paire) : 50-120€
- Filtre à huile : 8-20€
- Vidange complète : 60-120€
- Révision standard : 150-300€

RETOURNE UNIQUEMENT UN JSON VALIDE:
{
  "lignesAnalysees": [
    {
      "designation": "Nom",
      "totalFacture": 0.00,
      "prixMarcheEstime": 0.00,
      "sourceEstimation": "Explication courte",
      "ecartPourcent": 0,
      "verdict": "ok|eleve|arnaque"
    }
  ],
  "garageAnalyse": {
    "observation": "Commentaire"
  },
  "alertes": {
    "graves": [],
    "moyennes": [],
    "info": []
  },
  "verdictGlobal": {
    "note": 8,
    "statut": "honnete|reserve|arnaque",
    "recommandation": "Conseil",
    "commentaireExpert": "Avis expert"
  },
  "economiesPossibles": {
    "montant": 0.00,
    "conseils": []
  }
}`

    const analysisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    })

    const analysisText = analysisResponse.content[0].type === 'text'
      ? analysisResponse.content[0].text
      : ''

    let analysisResult
    try {
      const cleanAnalysis = analysisText.replace(/```json\n?|\n?```/g, '').trim()
      analysisResult = JSON.parse(cleanAnalysis)
    } catch (e) {
      console.error('❌ Erreur parsing analyse:', e)
      console.error('Texte:', analysisText.substring(0, 500))
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erreur lors de l\'analyse. Réessaie.' })
      }
    }

    // Construire le résultat final
    const lignesOk = analysisResult.lignesAnalysees?.filter((l: any) => l.verdict === 'ok').length || 0
    const lignesElevees = analysisResult.lignesAnalysees?.filter((l: any) => l.verdict === 'eleve').length || 0
    const lignesArnaques = analysisResult.lignesAnalysees?.filter((l: any) => l.verdict === 'arnaque').length || 0

    const totalFacture = extractedDevis.totalTTC ||
      (extractedDevis.lignes?.reduce((sum, l) => sum + (l.totalTTC || 0), 0) || 0)

    const totalMarche = analysisResult.lignesAnalysees?.reduce(
      (sum: number, l: any) => sum + (l.prixMarcheEstime || 0), 0
    ) || 0

    const result = {
      garage: extractedDevis.garage,
      vehiculeDetecte: extractedDevis.vehicule,
      lignes: (analysisResult.lignesAnalysees || []).map((ligne: any, index: number) => ({
        designation: ligne.designation,
        quantite: extractedDevis.lignes?.[index]?.quantite || 1,
        prixUnitaire: extractedDevis.lignes?.[index]?.prixUnitaire || ligne.totalFacture,
        totalTTC: ligne.totalFacture,
        prixMarche: {
          oscaro: null,
          yakarouler: null,
          misterAuto: null,
          moyenne: ligne.prixMarcheEstime
        },
        ecart: ligne.ecartPourcent,
        verdict: ligne.verdict,
        sourceEstimation: ligne.sourceEstimation
      })),
      garageInfo: {
        nom: extractedDevis.garage?.nom,
        adresse: extractedDevis.garage?.adresse,
        noteGoogle: null,
        nombreAvis: 0,
        avisNegatifs: 0,
        signalements: 0,
        observation: analysisResult.garageAnalyse?.observation
      },
      alertes: analysisResult.alertes || { graves: [], moyennes: [], info: [] },
      verdict: {
        note: analysisResult.verdictGlobal?.note || 5,
        statut: analysisResult.verdictGlobal?.statut || 'reserve',
        recommandation: analysisResult.verdictGlobal?.recommandation || '',
        commentaireExpert: analysisResult.verdictGlobal?.commentaireExpert || '',
        lignesOk,
        lignesElevees,
        lignesArnaques
      },
      totaux: {
        totalFacture: Math.round(totalFacture * 100) / 100,
        totalMarche: Math.round(totalMarche * 100) / 100
      },
      economiesPotentielles: {
        montant: Math.round((totalFacture - totalMarche) * 100) / 100,
        pourcentage: totalMarche > 0
          ? Math.round(((totalFacture - totalMarche) / totalMarche) * 100)
          : 0,
        conseils: analysisResult.economiesPossibles?.conseils || []
      },
      timestamp: new Date().toISOString(),
      ocrText: extractedText
    }

    console.log(`✅ Analyse terminée: Note ${result.verdict.note}/10 - ${result.verdict.statut}`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }

  } catch (error: any) {
    console.error('❌ Erreur analyze-devis-pro:', error)
    console.error('Stack:', error.stack)

    let errorMessage = 'Erreur serveur. Réessaie dans quelques instants.'
    let statusCode = 500

    if (error.status === 429 || error.message?.includes('rate_limit')) {
      errorMessage = 'Trop de requêtes. Attends 1 minute et réessaie.'
      statusCode = 429
    } else if (error.status === 401 || error.message?.includes('invalid_api_key')) {
      errorMessage = 'Erreur de configuration API. Contacte le support.'
      statusCode = 401
    } else if (error.message?.includes('Could not process image')) {
      errorMessage = 'Impossible de traiter l\'image. Vérifie qu\'elle est nette.'
      statusCode = 400
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: errorMessage })
    }
  }
}
