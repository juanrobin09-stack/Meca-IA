import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ShoppingCart, ExternalLink, Car, CheckCircle2 } from 'lucide-react'

const MARQUES = [
  'Peugeot',
  'Renault',
  'Citroën',
  'Dacia',
  'Volkswagen',
  'Toyota',
  'Ford',
  'Opel',
  'Fiat',
  'BMW',
  'Mercedes',
  'Audi',
  'Nissan',
  'Hyundai',
  'Kia',
  'Seat',
  'Skoda',
]

const PIECES_POPULAIRES = [
  'Plaquettes de frein',
  'Disques de frein',
  'Filtre à huile',
  'Filtre à air',
  'Bougies d\'allumage',
  'Courroie de distribution',
  'Amortisseurs',
  'Batterie',
  'Essuie-glaces',
  'Huile moteur',
]

export default function Pieces() {
  const [piece, setPiece] = useState('')
  const [marque, setMarque] = useState('')
  const [modele, setModele] = useState('')

  function buildSearchUrl(site: 'oscaro' | 'yakarouler') {
    const searchTerms = [piece, marque, modele].filter(Boolean).join(' ')
    const encoded = encodeURIComponent(searchTerms)

    if (site === 'oscaro') {
      // Format Oscaro: https://www.oscaro.com/catalogue/recherche?q=plaquettes+frein
      return `https://www.oscaro.com/catalogue/recherche?q=${encoded}`
    } else {
      // Format Yakarouler: https://www.yakarouler.com/recherche.html?searchText=plaquettes
      return `https://www.yakarouler.com/recherche.html?searchText=${encoded}`
    }
  }

  function handleSearch(site: 'oscaro' | 'yakarouler') {
    if (!piece.trim()) {
      alert('Entre le nom d\'une pièce')
      return
    }
    window.open(buildSearchUrl(site), '_blank')
  }

  function handleQuickSearch(pieceNom: string) {
    setPiece(pieceNom)
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Trouve tes pièces auto
            </h1>
            <p className="text-muted-foreground">
              Compare les prix sur Oscaro et Yakarouler
            </p>
          </div>

          {/* Formulaire de recherche */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recherche de pièces</CardTitle>
              <CardDescription>
                Entre les infos de ton véhicule pour trouver les bonnes pièces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pièce */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quelle pièce cherches-tu ?
                </label>
                <Input
                  placeholder="Ex: plaquettes de frein, filtre à huile..."
                  value={piece}
                  onChange={(e) => setPiece(e.target.value)}
                />
              </div>

              {/* Marque et Modèle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Marque</label>
                  <Select value={marque} onValueChange={setMarque}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionne" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARQUES.map((m) => (
                        <SelectItem key={m} value={m.toLowerCase()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modèle</label>
                  <Input
                    placeholder="Ex: 208, Clio, C3..."
                    value={modele}
                    onChange={(e) => setModele(e.target.value)}
                  />
                </div>
              </div>

              {/* Boutons recherche */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleSearch('oscaro')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Oscaro
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSearch('yakarouler')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Yakarouler
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pièces populaires */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Pièces les plus recherchées</h2>
            <div className="flex flex-wrap gap-2">
              {PIECES_POPULAIRES.map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSearch(p)}
                  className={piece === p ? 'border-primary bg-primary/10' : ''}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-5 w-5" />
                Conseils avant de commander
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Vérifie la compatibilité avec ton véhicule exact (année, motorisation)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Compare les prix entre Oscaro et Yakarouler
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Regarde les avis clients sur les pièces
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Privilégie les marques équipementiers (Bosch, Valeo, SKF...)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Groupe tes commandes pour économiser sur les frais de port
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
