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
  distance?: number // en km
  location: {
    lat: number
    lng: number
  }
}

export interface GarageSearchFilters {
  radius?: number // en mètres (default 10000)
  minRating?: number
  openNow?: boolean
  sortBy?: 'distance' | 'rating'
}

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions'

// Calcule la distance entre deux points GPS (formule Haversine)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function searchGarages(query: string): Promise<Garage[]> {
  const response = await fetch(`${API_BASE}/garages?query=${encodeURIComponent(query)}`)
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data.garages
}

export async function searchGaragesByLocation(
  lat: number,
  lng: number,
  filters?: GarageSearchFilters
): Promise<Garage[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
  })

  if (filters?.radius) {
    params.set('radius', filters.radius.toString())
  }

  const response = await fetch(`${API_BASE}/garages?${params}`)
  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  // Ajouter les distances et appliquer les filtres
  let garages: Garage[] = data.garages.map((garage: Garage) => ({
    ...garage,
    distance: calculateDistance(lat, lng, garage.location.lat, garage.location.lng),
  }))

  // Filtrer par note minimale
  if (filters?.minRating) {
    garages = garages.filter((g) => g.rating >= filters.minRating!)
  }

  // Filtrer par ouvert maintenant
  if (filters?.openNow) {
    garages = garages.filter((g) => g.openNow === true)
  }

  // Trier
  if (filters?.sortBy === 'rating') {
    garages.sort((a, b) => b.rating - a.rating)
  } else {
    // Par défaut : trier par distance
    garages.sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }

  return garages
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
