import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Garage } from '@/services/garages'
import { Star, Phone, Navigation, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icon with rating
function createRatingIcon(rating: number, isOpen?: boolean) {
  const bgColor = isOpen === false ? '#9CA3AF' : rating >= 4.5 ? '#22C55E' : rating >= 4 ? '#3B82F6' : '#F59E0B'

  return L.divIcon({
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${rating.toFixed(1)}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

// User location marker
const userLocationIcon = L.divIcon({
  html: `
    <div style="
      background: #3B82F6;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      border: 3px solid white;
    "></div>
  `,
  className: 'user-location-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Component to recenter map when location changes
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap()
  const prevCenter = useRef(center)

  useEffect(() => {
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      map.setView(center, map.getZoom())
      prevCenter.current = center
    }
  }, [center, map])

  return null
}

interface GarageMapProps {
  garages: Garage[]
  userLocation: { lat: number; lng: number } | null
  onGarageSelect: (garage: Garage) => void
  onCall: (garage: Garage) => void
  onDirections: (garage: Garage) => void
  selectedGarage?: Garage | null
}

export default function GarageMap({
  garages,
  userLocation,
  onGarageSelect,
  onCall,
  onDirections,
  selectedGarage,
}: GarageMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Calculate center from garages or user location
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : garages.length > 0
    ? [garages[0].location.lat, garages[0].location.lng]
    : [48.8566, 2.3522] // Paris fallback

  const formatDistance = (distance?: number) => {
    if (!distance) return null
    if (distance < 1) return `${Math.round(distance * 1000)} m`
    return `${distance.toFixed(1)} km`
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterController center={center} />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup className="user-popup">
              <div className="text-center font-medium text-sm">
                Ta position
              </div>
            </Popup>
          </Marker>
        )}

        {/* Garage markers */}
        {garages.map((garage) => (
          <Marker
            key={garage.id}
            position={[garage.location.lat, garage.location.lng]}
            icon={createRatingIcon(garage.rating, garage.openNow)}
            eventHandlers={{
              click: () => onGarageSelect(garage),
            }}
          >
            <Popup className="garage-popup" maxWidth={280} minWidth={240}>
              <div className="p-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {garage.name}
                  </h3>
                  {garage.openNow !== undefined && (
                    <Badge
                      variant={garage.openNow ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px] px-1.5 py-0 shrink-0',
                        garage.openNow && 'bg-green-500'
                      )}
                    >
                      {garage.openNow ? 'Ouvert' : 'Fermé'}
                    </Badge>
                  )}
                </div>

                {/* Rating & Distance */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{garage.rating.toFixed(1)}</span>
                    <span>({garage.reviewCount})</span>
                  </div>
                  {garage.distance && (
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(garage.distance)}
                    </div>
                  )}
                </div>

                {/* Address */}
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {garage.address}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCall(garage)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Appeler
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDirections(garage)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 active:scale-95 transition-all"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Y aller
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Garage count badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border">
        <span className="text-sm font-medium">
          {garages.length} garage{garages.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
