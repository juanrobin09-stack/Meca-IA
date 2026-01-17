import { useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Navigation, Star, Search, Wrench } from 'lucide-react'
import { GARAGES, SPECIALTIES, type Garage } from '@/data/garages'

export default function Garages() {
  const [search, setSearch] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Toutes marques')

  const filteredGarages = useMemo(() => {
    let result = GARAGES

    // Filter by search (city or postal code)
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      result = result.filter(
        (g) =>
          g.city.toLowerCase().includes(searchLower) ||
          g.postalCode.includes(searchLower) ||
          g.name.toLowerCase().includes(searchLower)
      )
    }

    // Filter by specialty
    if (selectedSpecialty !== 'Toutes marques') {
      result = result.filter((g) =>
        g.specialties.includes(selectedSpecialty) || g.specialties.includes('Toutes marques')
      )
    }

    // Sort: recommended first, then by rating
    result = [...result].sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return b.rating - a.rating
    })

    return result
  }, [search, selectedSpecialty])

  function getGoogleMapsUrl(garage: Garage) {
    const query = encodeURIComponent(`${garage.name} ${garage.address} ${garage.postalCode} ${garage.city}`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              Trouve un garage de confiance
            </h1>
            <p className="text-muted-foreground">
              Garages recommandés par la communauté MecaIA
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ville ou code postal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SPECIALTIES.map((specialty) => (
                <Button
                  key={specialty}
                  variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpecialty(specialty)}
                >
                  {specialty}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {filteredGarages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun garage trouvé</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Essaie une autre ville ou un autre filtre.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredGarages.map((garage) => (
                <Card key={garage.id} className={garage.recommended ? 'border-primary/50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{garage.name}</CardTitle>
                          {garage.recommended && (
                            <Badge variant="premium" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Recommandé
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {garage.address}, {garage.postalCode} {garage.city}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {garage.priceLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(garage.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{garage.rating}</span>
                      <span className="text-sm text-muted-foreground">({garage.reviews} avis)</span>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2">
                      {garage.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${garage.phone.replace(/\s/g, '')}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={getGoogleMapsUrl(garage)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Itinéraire
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Suggest garage */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="font-semibold">Tu connais un bon garage ?</h3>
                <p className="text-sm text-muted-foreground">
                  Aide la communauté en nous le suggérant !
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="mailto:contact@mecaia.fr?subject=Suggestion de garage">
                  Suggérer un garage
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
