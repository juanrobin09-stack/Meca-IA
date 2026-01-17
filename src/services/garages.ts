export interface Garage {
  id: string
  name: string
  address: string
  rating: number
  reviewCount: number
  phone?: string
  website?: string
  openNow?: boolean
  priceLevel?: number
  location: {
    lat: number
    lng: number
  }
}

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions'

export async function searchGarages(query: string): Promise<Garage[]> {
  const response = await fetch(`${API_BASE}/garages?query=${encodeURIComponent(query)}`)
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.garages
}

export async function getGarageDetails(placeId: string): Promise<Garage> {
  const response = await fetch(`${API_BASE}/garages?placeId=${placeId}`)
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  const place = data.result

  return {
    id: placeId,
    name: place.name,
    address: place.formatted_address,
    rating: place.rating || 0,
    reviewCount: place.user_ratings_total || 0,
    phone: place.formatted_phone_number,
    website: place.website,
    openNow: place.opening_hours?.open_now,
    priceLevel: place.price_level,
    location: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
  }
}
