import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Phone,
  Navigation,
  Star,
  Search,
  Loader2,
  Clock,
  Locate,
  MapIcon,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  searchGarages,
  searchGaragesByLocation,
  getGarageDetails,
  type Garage,
  type GarageSearchFilters,
} from '@/services/garages'
import { useUserLocation } from '@/hooks/useUserLocation'
import { cn } from '@/lib/utils'

// Filtres disponibles
const DISTANCE_FILTERS = [
  { label: 'Tous', value: null },
  { label: '< 5 km', value: 5000 },
  { label: '< 10 km', value: 10000 },
  { label: '< 20 km', value: 20000 },
]

const RATING_FILTERS = [
  { label: 'Toutes notes', value: null },
  { label: '⭐ 4+', value: 4 },
  { label: '⭐ 4.5+', value: 4.5 },
]

// Skeleton loader pour les cards
function GarageCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-muted rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-8 bg-muted rounded-lg w-20" />
            <div className="h-8 bg-muted rounded-lg w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Chip pour les filtres
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
        'min-h-[44px] active:scale-95',
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {children}
    </button>
  )
}

// Composant GarageCard optimisé mobile
function GarageCard({
  garage,
  onCall,
  onDirections,
}: {
  garage: Garage
  onCall: () => void
  onDirections: () => void
}) {
  const formatDistance = (distance?: number) => {
    if (!distance) return null
    if (distance < 1) return `${Math.round(distance * 1000)} m`
    return `${distance.toFixed(1)} km`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border shadow-sm overflow-hidden"
    >
      {/* Header avec badge ouvert/fermé */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{garage.name}</h3>
              {garage.openNow !== undefined && (
                <Badge
                  variant={garage.openNow ? 'default' : 'secondary'}
                  className={cn(
                    'text-[10px] px-2 py-0.5',
                    garage.openNow && 'bg-green-500 hover:bg-green-500'
                  )}
                >
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {garage.openNow ? 'Ouvert' : 'Fermé'}
                </Badge>
              )}
            </div>

            {/* Distance */}
            {garage.distance !== undefined && (
              <p className="text-sm text-primary font-medium mt-0.5">
                {formatDistance(garage.distance)}
              </p>
            )}
          </div>

          {/* Note et avis */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{garage.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{garage.reviewCount} avis</p>
          </div>
        </div>

        {/* Adresse */}
        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{garage.address}</span>
        </p>

        {/* Prix */}
        {garage.priceLevel && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {'€'.repeat(garage.priceLevel)}
            </Badge>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex border-t">
        <button
          onClick={onCall}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[48px]"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={onDirections}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors min-h-[48px]"
        >
          <Navigation className="h-4 w-4" />
          Itinéraire
        </button>
      </div>
    </motion.div>
  )
}

export default function Garages() {
  const [query, setQuery] = useState('')
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // Filtres
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [openNowFilter, setOpenNowFilter] = useState(false)

  // Géolocalisation
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    getUserLocation,
    clearError: clearLocationError,
  } = useUserLocation()

  // Recherche automatique quand la localisation est disponible
  const searchByLocation = useCallback(async () => {
    if (!userLocation) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const filters: GarageSearchFilters = {
        radius: distanceFilter || 10000,
        minRating: ratingFilter || undefined,
        openNow: openNowFilter || undefined,
        sortBy: 'distance',
      }

      const results = await searchGaragesByLocation(
        userLocation.lat,
        userLocation.lng,
        filters
      )
      setGarages(results)
    } catch (err) {
      setError('Impossible de trouver des garages. Réessaie.')
      setGarages([])
    } finally {
      setLoading(false)
    }
  }, [userLocation, distanceFilter, ratingFilter, openNowFilter])

  // Recherche par texte
  async function handleSearch() {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const results = await searchGarages(query)
      setGarages(results)
    } catch (err) {
      setError('Impossible de trouver des garages. Vérifie ta recherche.')
      setGarages([])
    } finally {
      setLoading(false)
    }
  }

  // Géolocaliser et rechercher
  function handleLocateMe() {
    getUserLocation()
  }

  // Recherche quand la localisation change
  useEffect(() => {
    if (userLocation && !query) {
      searchByLocation()
    }
  }, [userLocation, searchByLocation, query])

  // Réappliquer les filtres
  useEffect(() => {
    if (userLocation && searched && !query) {
      searchByLocation()
    }
  }, [distanceFilter, ratingFilter, openNowFilter])

  async function handleCall(garage: Garage) {
    // Si on a déjà le numéro
    if (garage.phone) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = `tel:${garage.phone.replace(/\s/g, '')}`
      } else {
        // Sur PC, afficher le numéro dans une alerte avec option de copier
        const copied = await navigator.clipboard.writeText(garage.phone).then(() => true).catch(() => false)
        alert(`📞 ${garage.phone}${copied ? '\n\n(Numéro copié dans le presse-papier)' : ''}`)
      }
      return
    }

    // Sinon, récupérer les détails
    try {
      const details = await getGarageDetails(garage.id)
      if (details.phone) {
        // Mettre à jour le garage avec le numéro pour la prochaine fois
        setGarages(prev => prev.map(g => g.id === garage.id ? { ...g, phone: details.phone } : g))

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isMobile) {
          window.location.href = `tel:${details.phone.replace(/\s/g, '')}`
        } else {
          const copied = await navigator.clipboard.writeText(details.phone).then(() => true).catch(() => false)
          alert(`📞 ${details.phone}${copied ? '\n\n(Numéro copié dans le presse-papier)' : ''}`)
        }
      } else {
        alert('Numéro non disponible pour ce garage')
      }
    } catch {
      alert('Impossible de récupérer le numéro')
    }
  }

  function handleDirections(garage: Garage) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${garage.location.lat},${garage.location.lng}`
    window.open(url, '_blank')
  }

  function openAllOnMap() {
    if (garages.length === 0) return
    // Ouvrir Google Maps avec le premier garage centré
    const center = userLocation || garages[0].location
    const url = `https://www.google.com/maps/search/garage+automobile/@${center.lat},${center.lng},13z`
    window.open(url, '_blank')
  }

  // Filtrer les garages affichés
  const filteredGarages = garages.filter((g) => {
    if (distanceFilter && g.distance && g.distance * 1000 > distanceFilter) return false
    if (ratingFilter && g.rating < ratingFilter) return false
    if (openNowFilter && g.openNow !== true) return false
    return true
  })

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-24 md:pb-6">
          {/* Header sticky avec recherche */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 border-b shadow-sm">
            <div className="container mx-auto px-4 py-4">
              {/* Titre */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">Trouver un garage</h1>
              </div>

              {/* Barre de recherche */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Ville ou code postal..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="h-12 px-4 rounded-xl"
                >
                  {loading && query ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLocateMe}
                  disabled={locationLoading}
                  className="h-12 px-4 rounded-xl"
                  title="Me localiser"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Filtres en chips - scroll horizontal */}
            {searched && (
              <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {/* Filtres distance */}
                  {DISTANCE_FILTERS.map((f) => (
                    <FilterChip
                      key={f.label}
                      active={distanceFilter === f.value}
                      onClick={() => setDistanceFilter(f.value)}
                    >
                      {f.label}
                    </FilterChip>
                  ))}

                  <div className="w-px bg-border shrink-0" />

                  {/* Filtres note */}
                  {RATING_FILTERS.map((f) => (
                    <FilterChip
                      key={f.label}
                      active={ratingFilter === f.value}
                      onClick={() => setRatingFilter(f.value)}
                    >
                      {f.label}
                    </FilterChip>
                  ))}

                  <div className="w-px bg-border shrink-0" />

                  {/* Ouvert maintenant */}
                  <FilterChip
                    active={openNowFilter}
                    onClick={() => setOpenNowFilter(!openNowFilter)}
                  >
                    Ouvert maintenant
                  </FilterChip>
                </div>
              </div>
            )}
          </div>

          {/* Erreur de géolocalisation */}
          <AnimatePresence>
            {locationError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-4 mt-4"
              >
                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {locationError}
                      </p>
                    </div>
                    <button
                      onClick={clearLocationError}
                      className="text-amber-500 hover:text-amber-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton voir sur la carte */}
          {filteredGarages.length > 0 && (
            <div className="px-4 mt-4">
              <Button
                variant="outline"
                onClick={openAllOnMap}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <MapIcon className="h-4 w-4" />
                Voir les {filteredGarages.length} garages sur la carte
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Contenu principal */}
          <div className="px-4 mt-4">
            {/* Erreur */}
            {error && (
              <div className="text-center text-red-500 mb-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="space-y-4">
                <GarageCardSkeleton />
                <GarageCardSkeleton />
                <GarageCardSkeleton />
              </div>
            ) : filteredGarages.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredGarages.length} garage
                  {filteredGarages.length > 1 ? 's' : ''} trouvé
                  {filteredGarages.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {filteredGarages.map((garage) => (
                    <GarageCard
                      key={garage.id}
                      garage={garage}
                      onCall={() => handleCall(garage)}
                      onDirections={() => handleDirections(garage)}
                    />
                  ))}
                </div>
              </>
            ) : searched ? (
              /* Aucun résultat */
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12 px-6 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucun garage trouvé</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Essaie d'élargir ta zone de recherche ou modifie tes filtres.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDistanceFilter(20000)
                      setRatingFilter(null)
                      setOpenNowFilter(false)
                    }}
                    className="rounded-xl"
                  >
                    Élargir la recherche
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* État initial */
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-12 px-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Locate className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Trouve un garage près de toi
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Active ta géolocalisation ou entre une ville pour trouver des
                    garages automobiles de confiance.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      onClick={handleLocateMe}
                      disabled={locationLoading}
                      className="rounded-xl h-12 px-6"
                    >
                      {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Locate className="h-4 w-4 mr-2" />
                      )}
                      Me localiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section partenariat */}
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                <div>
                  <h3 className="font-semibold">Tu es garagiste ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Deviens partenaire MECAI et gagne en visibilité !
                  </p>
                </div>
                <Button variant="outline" className="rounded-xl shrink-0" asChild>
                  <a href="mailto:partenaires@mymecai.com?subject=Partenariat garage">
                    Devenir partenaire
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
