import type { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY

// Web search function for real-time data
async function searchWeb(query: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    return ''
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

    if (!response.ok) return ''

    const data = await response.json()
    const results = data.web?.results || []

    return results.slice(0, 4).map((r: { title: string; description: string; url: string }) =>
      `- ${r.title}: ${r.description}`
    ).join('\n')
  } catch (error) {
    console.error('Search error:', error)
    return ''
  }
}

interface VehicleInfo {
  brand: string
  model: string
  year: number
  fuel_type: string
  mileage: number
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    const vehicle: VehicleInfo = JSON.parse(event.body || '{}')

    if (!vehicle.brand || !vehicle.model) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Vehicle brand and model required' }),
      }
    }

    const vehicleDesc = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
    const currentYear = new Date().getFullYear()

    // Parallel web searches for real-time data
    const [recallsSearch, problemsSearch, pricesSearch] = await Promise.all([
      searchWeb(`rappel ${vehicleDesc} ${currentYear}`),
      searchWeb(`problème fréquent ${vehicleDesc} forum`),
      searchWeb(`prix entretien ${vehicleDesc} oscaro ${currentYear}`),
    ])

    // Use Claude to analyze and synthesize the information
    const prompt = `Tu es un expert automobile français. Analyse ces informations pour un ${vehicleDesc} avec ${vehicle.mileage} km (${vehicle.fuel_type}).

RECHERCHES WEB ACTUELLES:

RAPPELS CONSTRUCTEUR:
${recallsSearch || 'Aucune info trouvée'}

PROBLÈMES FRÉQUENTS:
${problemsSearch || 'Aucune info trouvée'}

PRIX ACTUELS:
${pricesSearch || 'Aucune info trouvée'}

Réponds UNIQUEMENT en JSON valide:
{
  "rappels": [
    {"titre": "Rappel XYZ", "description": "Description courte", "urgence": "haute/moyenne/faible"}
  ],
  "problemes_connus": [
    {"piece": "Nom pièce", "description": "Problème fréquent", "km_apparition": 80000}
  ],
  "prix_actuels": {
    "revision_complete": {"min": 200, "max": 400},
    "plaquettes_frein": {"min": 150, "max": 250},
    "vidange": {"min": 50, "max": 100}
  },
  "conseil_prioritaire": "Un conseil personnalisé basé sur le kilométrage et l'âge du véhicule",
  "fiabilite_score": 7
}

Base tes réponses sur les recherches web si disponibles. Si pas d'info, utilise tes connaissances générales sur ce modèle.
Limite à 3 rappels max, 5 problèmes max.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = (response.content[0] as { type: 'text'; text: string }).text.trim()

    // Parse JSON from response
    let analysisResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // Default fallback
      analysisResult = {
        rappels: [],
        problemes_connus: [],
        prix_actuels: {},
        conseil_prioritaire: 'Effectuez un contrôle régulier de votre véhicule.',
        fiabilite_score: 7
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        vehicle: vehicleDesc,
        mileage: vehicle.mileage,
        analysis: analysisResult,
        searchesPerformed: {
          recalls: !!recallsSearch,
          problems: !!problemsSearch,
          prices: !!pricesSearch,
        }
      }),
    }
  } catch (error) {
    console.error('Predict issues error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur lors de l\'analyse' }),
    }
  }
}
