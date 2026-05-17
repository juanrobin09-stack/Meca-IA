import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'


const VIDEO_ANALYSIS_PROMPT = `Tu es un expert mécanicien automobile français avec 30 ans d'expérience. On te montre plusieurs images extraites d'une vidéo filmée par un utilisateur qui a un problème avec sa voiture.

ANALYSE CES IMAGES ATTENTIVEMENT:
- Recherche tout signe visuel de problème (fumée, fuite, rouille, usure, pièce cassée/déformée, voyant allumé)
- L'utilisateur a peut-être filmé un bruit, une vibration, ou un comportement anormal
- Utilise ton expertise pour identifier le problème le plus probable

RÉPONDS EN JSON STRICT (pas de markdown, pas de texte autour):
{
  "description_visuelle": "Description de ce que tu vois sur les images (2-3 phrases)",
  "probleme_identifie": "Nom court du problème identifié",
  "causes_possibles": ["Cause 1", "Cause 2", "Cause 3"],
  "urgence": "faible|moyenne|élevée|critique",
  "pieces_concernees": ["Pièce 1", "Pièce 2"],
  "estimation_cout": {"min": 100, "max": 300},
  "recommandations": "Ce que l'utilisateur doit faire (1-2 phrases)"
}

RÈGLES URGENCE:
- "critique": Sécurité en jeu, ne pas rouler (freins HS, direction défaillante, fumée moteur)
- "élevée": Risque de casse imminente, réparation sous quelques jours
- "moyenne": À réparer dans les semaines à venir
- "faible": Surveillance ou entretien de routine

ESTIMATION COÛT: Prix garage indépendant français (pièces + main d'œuvre), pas concession.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return json(res, 401, { error: 'Unauthorized' })

  const { frames } = req.body as { frames: string[] }
  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return json(res, 400, { error: 'Missing or invalid frames data' })
  }

  if (!process.env.ANTHROPIC_API_KEY) return json(res, 500, { error: 'Server misconfiguration: missing API key' })
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const content: Anthropic.Messages.ContentBlockParam[] = []

    for (let i = 0; i < Math.min(frames.length, 5); i++) {
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frames[i] } })
    }
    content.push({ type: 'text', text: VIDEO_ANALYSIS_PROMPT })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return json(res, 200, JSON.parse(jsonMatch[0]))
    } catch { /* fallthrough */ }

    return json(res, 200, {
      description_visuelle: 'Analyse des images en cours. Les éléments visuels sont difficiles à interpréter.',
      probleme_identifie: 'Diagnostic visuel non concluant',
      causes_possibles: ['Images peu claires', 'Angle de prise de vue insuffisant', 'Problème non visible'],
      urgence: 'moyenne',
      pieces_concernees: ['À déterminer'],
      estimation_cout: { min: 50, max: 200 },
      recommandations: 'Filme à nouveau avec plus de lumière ou consulte un mécanicien pour un diagnostic physique.',
    })
  } catch (error) {
    console.error('Video analysis error:', error)
    return json(res, 500, { error: 'Failed to analyze video' })
  }
}
