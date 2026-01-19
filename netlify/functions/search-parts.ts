import { Handler } from '@netlify/functions'

interface SearchResult {
  title: string
  url: string
  description: string
  price?: string
  site: string
  thumbnail?: string
}

interface BraveSearchResult {
  title: string
  url: string
  description: string
  thumbnail?: {
    src: string
  }
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[]
  }
}

const ALLOWED_SITES = [
  'oscaro.com',
  'yakarouler.com',
  'mister-auto.com',
  'autodoc.fr',
  'all-auto-pieces.fr',
  'spareka.fr',
  'piecesauto.fr',
  'webdealauto.com',
  'carter-cash.com',
  'euromaster.fr',
  'norauto.fr',
  'feuvert.fr'
]

function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const siteName = hostname.split('.')[0]
    return siteName.charAt(0).toUpperCase() + siteName.slice(1)
  } catch {
    return 'Site'
  }
}

function extractPrice(text: string): string | undefined {
  // Try to find price patterns like "19,99 €" or "19.99€" or "à partir de 15€"
  const priceRegex = /(\d+[,.]?\d*)\s*€/
  const match = text.match(priceRegex)
  if (match) {
    return match[0]
  }
  return undefined
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
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

  try {
    const { piece, marque, modele } = JSON.parse(event.body || '{}')

    if (!piece || typeof piece !== 'string' || piece.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Le nom de la pièce est requis' })
      }
    }

    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY

    if (!braveApiKey) {
      // Fallback: return Google search URLs if no Brave API key
      const searchTerms = [piece, marque, modele].filter(Boolean).join(' ')
      const fallbackResults: SearchResult[] = ALLOWED_SITES.slice(0, 6).map(site => ({
        title: `Rechercher "${searchTerms}" sur ${extractSiteName('https://' + site)}`,
        url: `https://www.google.com/search?q=site:${site}+${encodeURIComponent(searchTerms)}`,
        description: `Cliquez pour rechercher sur ${extractSiteName('https://' + site)}`,
        site: extractSiteName('https://' + site)
      }))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: fallbackResults,
          query: searchTerms,
          fallback: true
        })
      }
    }

    // Build search query
    const searchParts = [piece.trim()]
    if (marque) searchParts.push(marque)
    if (modele) searchParts.push(modele)
    searchParts.push('acheter pièce auto')

    const query = searchParts.join(' ')

    // Call Brave Search API
    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20&country=fr&search_lang=fr&safesearch=moderate`

    const braveResponse = await fetch(braveUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': braveApiKey
      }
    })

    if (!braveResponse.ok) {
      console.error('Brave Search API error:', braveResponse.status, await braveResponse.text())
      throw new Error('Erreur de recherche')
    }

    const braveData: BraveSearchResponse = await braveResponse.json()

    // Filter and format results
    const results: SearchResult[] = []

    if (braveData.web?.results) {
      for (const result of braveData.web.results) {
        // Check if the URL is from an allowed site
        const isAllowedSite = ALLOWED_SITES.some(site => result.url.includes(site))

        if (isAllowedSite && results.length < 12) {
          results.push({
            title: result.title,
            url: result.url,
            description: result.description || '',
            price: extractPrice(result.title + ' ' + result.description),
            site: extractSiteName(result.url),
            thumbnail: result.thumbnail?.src
          })
        }
      }
    }

    // If not enough results from allowed sites, add some fallback links
    if (results.length < 4) {
      const searchTerms = [piece, marque, modele].filter(Boolean).join(' ')
      const fallbackSites = ['oscaro.com', 'yakarouler.com', 'mister-auto.com', 'autodoc.fr']

      for (const site of fallbackSites) {
        if (results.length >= 8) break
        if (!results.some(r => r.url.includes(site))) {
          results.push({
            title: `Rechercher sur ${extractSiteName('https://' + site)}`,
            url: `https://www.${site}/recherche?q=${encodeURIComponent(searchTerms)}`,
            description: `Voir les ${piece} disponibles`,
            site: extractSiteName('https://' + site)
          })
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        results,
        query,
        count: results.length
      })
    }

  } catch (error: any) {
    console.error('Search parts error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de la recherche',
        message: error.message
      })
    }
  }
}
