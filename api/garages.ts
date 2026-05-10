import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  if (!API_KEY) return json(res, 500, { error: 'Google Places API key not configured' })

  const { query, placeId } = req.query as Record<string, string>

  try {
    if (placeId) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry,price_level&language=fr&key=${API_KEY}`
      const data = await fetch(url).then((r) => r.json())

      if (data.status !== 'OK') return json(res, 404, { error: 'Garage non trouvé' })
      return json(res, 200, data)
    }

    if (!query) return json(res, 400, { error: 'Query parameter required' })

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)},France&key=${API_KEY}`
    const geoData = await fetch(geocodeUrl).then((r) => r.json())

    if (!geoData.results?.[0]?.geometry?.location) {
      return json(res, 404, { error: 'Ville non trouvée' })
    }

    const { lat, lng } = geoData.results[0].geometry.location
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=car_repair&keyword=garage+automobile&language=fr&key=${API_KEY}`
    const placesData = await fetch(placesUrl).then((r) => r.json())

    interface PlaceResult {
      place_id: string
      name: string
      vicinity: string
      rating?: number
      user_ratings_total?: number
      opening_hours?: { open_now?: boolean }
      price_level?: number
      geometry: { location: { lat: number; lng: number } }
    }

    const garages = (placesData.results || []).map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      openNow: place.opening_hours?.open_now,
      priceLevel: place.price_level,
      location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
    }))

    return json(res, 200, { garages })
  } catch (error) {
    console.error('Garages API error:', error)
    return json(res, 500, { error: 'Erreur serveur' })
  }
}
