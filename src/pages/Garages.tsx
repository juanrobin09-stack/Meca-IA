import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Navigation, Star, Search, Wrench, Loader2, Clock } from 'lucide-react'
import { searchGarages, getGarageDetails, type Garage } from '@/services/garages'

export default function Garages() {
  const [query, setQuery] = useState('')
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

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

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  function renderPriceLevel(level?: number) {
    if (!level) return null
    return '€'.repeat(level)
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.1 }}>
                <MapPin className="h-8 w-8 text-primary" />
              </motion.div>
              Trouve un garage de confiance
            </h1>
            <p className="text-muted-foreground">
              Garages vérifiés avec avis Google près de chez toi
            </p>
          </motion.div>

          {/* Search */}
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ville ou code postal (ex: Bordeaux, 33000)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Rechercher</span>
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center text-red-500 mb-4 p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Recherche des garages...</p>
            </div>
          ) : garages.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {garages.length} garage{garages.length > 1 ? 's' : ''} trouvé{garages.length > 1 ? 's' : ''}
              </p>
              <div className="grid gap-4">
                {garages.map((garage, index) => (
                  <motion.div
                    key={garage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg">{garage.name}</CardTitle>
                            {garage.openNow !== undefined && (
                              <Badge variant={garage.openNow ? 'default' : 'secondary'}>
                                <Clock className="h-3 w-3 mr-1" />
                                {garage.openNow ? 'Ouvert' : 'Fermé'}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {garage.address}
                          </CardDescription>
                        </div>
                        {garage.priceLevel && (
                          <Badge variant="outline" className="shrink-0">
                            {renderPriceLevel(garage.priceLevel)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        {renderStars(garage.rating)}
                        <span className="font-medium">{garage.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({garage.reviewCount} avis)
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCall(garage)}>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDirections(garage)}>
                          <Navigation className="h-4 w-4 mr-2" />
                          Itinéraire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
              </div>
            </>
          ) : searched ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun garage trouvé</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Essaie une autre ville ou code postal.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Recherche un garage</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Entre ta ville ou code postal pour trouver des garages automobiles près de chez toi.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Suggest garage */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="font-semibold">Tu es garagiste ?</h3>
                <p className="text-sm text-muted-foreground">
                  Deviens partenaire MECAI et gagne en visibilité !
                </p>
              </div>
              <Button variant="outline" asChild>
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
