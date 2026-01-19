import Anthropic from '@anthropic-ai/sdk'

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
  lignes: DevisLine[]
  totalHT: number
  tva: number
  totalTTC: number
}

interface AnalyzedLine extends DevisLine {
  prixMarche: {
    estimation: number
    source: string
  }
  ecart: number
  verdict: 'ok' | 'eleve' | 'arnaque'
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { imageBase64, vehicle, userId } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Étape 1: Extraction OCR + Structuration du devis
    console.log('📄 Étape 1: Extraction et structuration du devis...')

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
- Sois PRÉCIS sur les désignations (marque de pièce, référence, etc.)`

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

    // Nettoyer et parser le JSON
    let extractedDevis: ExtractedDevis
    try {
      // Supprimer les backticks markdown si présents
      const cleanJson = extractedText.replace(/```json\n?|\n?```/g, '').trim()
      extractedDevis = JSON.parse(cleanJson)
    } catch (e) {
      console.error('Erreur parsing JSON extraction:', e)
      return new Response(JSON.stringify({
        error: 'Impossible de lire le devis. Assure-toi que l\'image est nette.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Devis extrait: ${extractedDevis.lignes.length} lignes trouvées`)

    // Étape 2: Analyse professionnelle avec recherche de prix
    console.log('💰 Étape 2: Analyse des prix du marché...')

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
2. Estimer le prix RÉEL du marché en 2026 basé sur ta connaissance (Oscaro, Yakarouler, Mister Auto pour les pièces, tarifs garages pour la main d'œuvre)
3. Calculer l'écart en %
4. Donner un verdict

BARÈME DES VERDICTS:
- "ok" : écart < 15% → Prix correct
- "eleve" : écart 15-40% → Prix élevé mais négociable
- "arnaque" : écart > 40% → Surfacturation abusive

PRIX DE RÉFÉRENCE 2026 (moyens marché France):
- Main d'œuvre garage : 60-90€/heure
- Plaquettes frein avant (jeu) : 25-60€
- Disques frein avant (paire) : 50-120€
- Filtre à huile : 8-20€
- Filtre à air : 15-35€
- Huile moteur 5L : 30-60€
- Bougie allumage (x1) : 8-25€
- Amortisseur : 60-150€
- Courroie distribution : 40-100€
- Kit distribution complet (pose incluse) : 400-800€
- Vidange complète : 60-120€
- Révision standard : 150-300€

RETOURNE UNIQUEMENT UN JSON VALIDE:
{
  "lignesAnalysees": [
    {
      "designation": "Nom de la pièce/prestation",
      "totalFacture": 0.00,
      "prixMarcheEstime": 0.00,
      "sourceEstimation": "Explication courte du prix marché",
      "ecartPourcent": 0,
      "verdict": "ok|eleve|arnaque"
    }
  ],
  "garageAnalyse": {
    "observation": "Commentaire sur le garage si pertinent"
  },
  "alertes": {
    "graves": ["Liste des problèmes graves"],
    "moyennes": ["Liste des points d'attention"],
    "info": ["Informations utiles"]
  },
  "verdictGlobal": {
    "note": 8,
    "statut": "honnete|reserve|arnaque",
    "recommandation": "Conseil clair et actionnable",
    "commentaireExpert": "Ton avis d'expert en 2-3 phrases"
  },
  "economiesPossibles": {
    "montant": 0.00,
    "conseils": ["Comment économiser"]
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
      console.error('Erreur parsing analyse:', e)
      return new Response(JSON.stringify({
        error: 'Erreur lors de l\'analyse du devis'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Construire le résultat final
    const lignesOk = analysisResult.lignesAnalysees.filter((l: any) => l.verdict === 'ok').length
    const lignesElevees = analysisResult.lignesAnalysees.filter((l: any) => l.verdict === 'eleve').length
    const lignesArnaques = analysisResult.lignesAnalysees.filter((l: any) => l.verdict === 'arnaque').length

    const totalFacture = extractedDevis.totalTTC ||
      extractedDevis.lignes.reduce((sum, l) => sum + l.totalTTC, 0)

    const totalMarche = analysisResult.lignesAnalysees.reduce(
      (sum: number, l: any) => sum + (l.prixMarcheEstime || 0), 0
    )

    const result = {
      garage: extractedDevis.garage,
      vehiculeDetecte: extractedDevis.vehicule,
      lignes: analysisResult.lignesAnalysees.map((ligne: any, index: number) => ({
        designation: ligne.designation,
        quantite: extractedDevis.lignes[index]?.quantite || 1,
        prixUnitaire: extractedDevis.lignes[index]?.prixUnitaire || ligne.totalFacture,
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
        nom: extractedDevis.garage.nom,
        adresse: extractedDevis.garage.adresse,
        noteGoogle: null,
        nombreAvis: 0,
        avisNegatifs: 0,
        signalements: 0,
        observation: analysisResult.garageAnalyse?.observation
      },
      alertes: analysisResult.alertes || { graves: [], moyennes: [], info: [] },
      verdict: {
        note: analysisResult.verdictGlobal.note,
        statut: analysisResult.verdictGlobal.statut,
        recommandation: analysisResult.verdictGlobal.recommandation,
        commentaireExpert: analysisResult.verdictGlobal.commentaireExpert,
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Erreur analyze-devis-pro:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Erreur serveur'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = {
  path: '/api/analyze-devis-pro'
}
