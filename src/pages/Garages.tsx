import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Navigation, Star, Search, Wrench, Loader2, Clock, Locate, X } from 'lucide-react'
import { searchGarages, getGarageDetails, type Garage } from '@/services/garages'
import { cn } from '@/lib/utils'

// Types pour les filtres
type FilterType = 'all' | 'open' | 'rating' | 'price'

interface FilterChip {
  id: FilterType
  label: string
  icon?: string
}

const filters: FilterChip[] = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouvert' },
  { id: 'rating', label: '4+', icon: '⭐' },
  { id: 'price', label: '€', icon: '💰' },
]

// Composant FilterChip
function FilterChipButton({
  filter,
  active,
  onClick,
}: {
  filter: FilterChip
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
        'min-h-[44px] touch-manipulation',
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-muted hover:bg-muted/80 text-foreground'
      )}
    >
      {filter.icon && <span>{filter.icon}</span>}
      {filter.label}
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
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header: Nom + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {garage.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 line-clamp-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{garage.address}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {garage.openNow !== undefined && (
              <Badge
                variant={garage.openNow ? 'default' : 'secondary'}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                {garage.openNow ? 'Ouvert' : 'Fermé'}
              </Badge>
            )}
            {garage.priceLevel && (
              <span className="text-xs text-muted-foreground">
                {'€'.repeat(garage.priceLevel)}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4',
                  star <= Math.round(garage.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="font-medium text-sm">{garage.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({garage.reviewCount} avis)
          </span>
        </div>

        {/* Actions - Full width buttons on mobile */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-12 text-sm font-medium"
            onClick={onCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Appeler
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-12 text-sm font-medium"
            onClick={onDirections}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Itinéraire
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Garages() {
  const [query, setQuery] = useState('')
  const [garages, setGarages] = useState<Garage[]>([])
  const [filteredGarages, setFilteredGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (garages.length === 0) {
      setFilteredGarages([])
      return
    }

    let result = [...garages]

    switch (activeFilter) {
      case 'open':
        result = result.filter((g) => g.openNow === true)
        break
      case 'rating':
        result = result.filter((g) => g.rating >= 4)
        break
      case 'price':
        result = result.filter((g) => g.priceLevel === 1 || g.priceLevel === 2)
        break
      default:
        break
    }

    setFilteredGarages(result)
  }, [garages, activeFilter])

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)
    setActiveFilter('all')

    try {
      const results = await searchGarages(q)
      setGarages(results)
    } catch {
      setError('Impossible de trouver des garages. Vérifie ta recherche.')
      setGarages([])
    } finally {
      setLoading(false)
    }
  }

  async function handleLocateMe() {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ton navigateur.')
      return
    }

    setLocating(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        // Recherche par coordonnées (le backend peut gérer ça)
        const locationQuery = `${latitude},${longitude}`
        setQuery('Ma position')
        await handleSearch(locationQuery)
        setLocating(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Impossible d\'accéder à ta position. Vérifie les permissions.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleCall(garage: Garage) {
    if (garage.phone) {
      window.location.href = `tel:${garage.phone.replace(/\s/g, '')}`
    } else {
      try {
        const details = await getGarageDetails(garage.id)
        if (details.phone) {
          window.location.href = `tel:${details.phone.replace(/\s/g, '')}`
        } else {
          alert('Numéro non disponible')
        }
      } catch {
        alert('Numéro non disponible')
      }
    }
  }

  function handleDirections(garage: Garage) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${garage.location.lat},${garage.location.lng}`
    window.open(url, '_blank')
  }

  function clearSearch() {
    setQuery('')
    setGarages([])
    setFilteredGarages([])
    setSearched(false)
    setError('')
    inputRef.current?.focus()
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-24 md:pb-0">
          {/* Sticky Header */}
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b">
            <div className="container mx-auto px-4 py-4">
              {/* Title - Desktop only */}
              <div className="hidden md:block mb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  Trouve un garage de confiance
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Garages vérifiés avec avis Google près de chez toi
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Ville ou code postal..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-10 h-12 text-base"
                  />
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={handleLocateMe}
                  disabled={locating}
                  title="Utiliser ma position"
                >
                  {locating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Locate className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  className="h-12 px-4 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Rechercher</span>
                </Button>
              </div>

              {/* Filter Chips - Only show when we have results */}
              {garages.length > 0 && (
                <div className="mt-3 -mx-4 px-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filters.map((filter) => (
                      <FilterChipButton
                        key={filter.id}
                        filter={filter}
                        active={activeFilter === filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Title */}
            <div className="md:hidden mb-4">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Trouver un garage
              </h1>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"
                >
                  <X className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Recherche des garages...</p>
              </div>
            ) : filteredGarages.length > 0 ? (
              <>
                {/* Results count */}
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredGarages.length} garage{filteredGarages.length > 1 ? 's' : ''} trouvé{filteredGarages.length > 1 ? 's' : ''}
                  {activeFilter !== 'all' && garages.length !== filteredGarages.length && (
                    <span className="text-primary"> (filtré sur {garages.length})</span>
                  )}
                </p>

                {/* Garage List */}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredGarages.map((garage, index) => (
                      <motion.div
                        key={garage.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <GarageCard
                          garage={garage}
                          onCall={() => handleCall(garage)}
                          onDirections={() => handleDirections(garage)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : searched && garages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun garage trouvé</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-4">
                      Essaie une autre ville ou code postal.
                    </p>
                    <Button variant="outline" onClick={clearSearch}>
                      Nouvelle recherche
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : searched && filteredGarages.length === 0 && garages.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun résultat avec ce filtre</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-4">
                      {garages.length} garage{garages.length > 1 ? 's' : ''} disponible{garages.length > 1 ? 's' : ''} sans filtre.
                    </p>
                    <Button variant="outline" onClick={() => setActiveFilter('all')}>
                      Voir tous les garages
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card>
                  <CardContent className="flex flex-col items-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Recherche un garage</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-4">
                      Entre ta ville ou utilise ta position GPS pour trouver des garages près de chez toi.
                    </p>
                    <Button onClick={handleLocateMe} disabled={locating}>
                      {locating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Locate className="h-4 w-4 mr-2" />
                      )}
                      Utiliser ma position
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Partner CTA */}
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold">Tu es garagiste ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Deviens partenaire MECAI et gagne en visibilité !
                  </p>
                </div>
                <Button variant="outline" className="shrink-0" asChild>
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
