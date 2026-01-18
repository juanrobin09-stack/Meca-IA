import type { Handler } from '@netlify/functions'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Google Places API key not configured' }),
    }
  }

  const { query, placeId, lat, lng, radius } = event.queryStringParameters || {}

  try {
    // Si placeId fourni → détails d'un garage
    if (placeId) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry,price_level&language=fr&key=${API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== 'OK') {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Garage non trouvé' }),
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      }
    }

    let searchLat: number
    let searchLng: number
    const searchRadius = radius ? parseInt(radius) : 10000

    // Si lat/lng fournis → recherche par coordonnées
    if (lat && lng) {
      searchLat = parseFloat(lat)
      searchLng = parseFloat(lng)
    } else if (query) {
      // Sinon → recherche par texte, geocoder la ville
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)},France&key=${API_KEY}`
      const geoResponse = await fetch(geocodeUrl)
      const geoData = await geoResponse.json()

      if (!geoData.results?.[0]?.geometry?.location) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Ville non trouvée' }),
        }
      }

      searchLat = geoData.results[0].geometry.location.lat
      searchLng = geoData.results[0].geometry.location.lng
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query or lat/lng parameters required' }),
      }
    }

    // Chercher les garages
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${searchRadius}&type=car_repair&keyword=garage+automobile&language=fr&key=${API_KEY}`
    const placesResponse = await fetch(placesUrl)
    const placesData = await placesResponse.json()

    // Transformer les résultats
    interface PlaceResult {
      place_id: string
      name: string
      vicinity: string
      rating?: number
      user_ratings_total?: number
      opening_hours?: { open_now?: boolean }
      price_level?: number
      geometry: {
        location: { lat: number; lng: number }
      }
    }

    const garages = (placesData.results || []).map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      openNow: place.opening_hours?.open_now,
      priceLevel: place.price_level,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
    }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ garages }),
    }
  } catch (error) {
    console.error('Garages API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' }),
    }
  }
}
