import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  ShoppingCart,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Package,
  ChevronRight,
  AlertCircle,
  Tag
} from 'lucide-react'

interface SearchResult {
  title: string
  url: string
  description: string
  price?: string
  site: string
  thumbnail?: string
}

const MARQUES = [
  'Peugeot', 'Renault', 'Citroën', 'Dacia', 'Volkswagen', 'Toyota', 'Ford',
  'Opel', 'Fiat', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Seat', 'Skoda'
]

const PIECES_POPULAIRES = [
  { nom: 'Plaquettes de frein', icon: '🛞' },
  { nom: 'Filtre à huile', icon: '🛢️' },
  { nom: 'Filtre à air', icon: '💨' },
  { nom: 'Batterie', icon: '🔋' },
  { nom: 'Bougies', icon: '⚡' },
  { nom: 'Amortisseurs', icon: '🔧' },
  { nom: 'Courroie distribution', icon: '⚙️' },
  { nom: 'Essuie-glaces', icon: '🌧️' },
]

const SITE_COLORS: Record<string, string> = {
  'Oscaro': 'bg-orange-500',
  'Yakarouler': 'bg-blue-600',
  'Mister-auto': 'bg-red-500',
  'Autodoc': 'bg-emerald-500',
  'Carter-cash': 'bg-yellow-500',
  'Norauto': 'bg-blue-500',
  'Feuvert': 'bg-green-500',
  'Spareka': 'bg-purple-500',
}

export default function Pieces() {
  const navigate = useNavigate()
  const [piece, setPiece] = useState('')
  const [marque, setMarque] = useState('')
  const [modele, setModele] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!piece.trim()) {
      setError('Entre le nom d\'une pièce')
      return
    }

    setIsSearching(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/.netlify/functions/search-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piece: piece.trim(),
          marque: marque || undefined,
          modele: modele.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de recherche')
      }

      setResults(data.results || [])
      setHasSearched(true)
    } catch (err: unknown) {
      console.error('Search error:', err)
      const error = err as { message?: string }
      setError(error?.message || 'Erreur lors de la recherche')
    } finally {
      setIsSearching(false)
    }
  }

  function handleQuickSearch(pieceNom: string) {
    setPiece(pieceNom)
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  function getSiteColor(site: string): string {
    return SITE_COLORS[site] || 'bg-neutral-500'
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />

        <main className="md:pl-64">
          <div className="min-h-screen pb-20 md:pb-0">
            {/* Header */}
            <header className="border-b border-neutral-900 bg-neutral-950 sticky top-0 z-10">
              <div className="px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/app')}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-900 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-neutral-400" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-white">Pièces Auto</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-6">
              {/* Search Form */}
              <div className="mb-6">
                {/* Piece Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Quelle pièce cherches-tu ?"
                    value={piece}
                    onChange={(e) => setPiece(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full h-12 pl-4 pr-12 text-base bg-neutral-900 border-0 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !piece.trim()}
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <Select value={marque || '_all'} onValueChange={(val) => setMarque(val === '_all' ? '' : val)}>
                    <SelectTrigger className="flex-1 h-10 text-sm border-0 bg-neutral-900 rounded-xl">
                      <SelectValue placeholder="Marque" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="_all">Toutes marques</SelectItem>
                      {MARQUES.map((m) => (
                        <SelectItem key={m} value={m.toLowerCase()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <input
                    type="text"
                    placeholder="Modèle"
                    value={modele}
                    onChange={(e) => setModele(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 h-10 px-3 text-sm bg-neutral-900 border-0 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Pieces */}
              {!hasSearched && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Pièces populaires</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PIECES_POPULAIRES.map((p) => (
                      <button
                        key={p.nom}
                        onClick={() => handleQuickSearch(p.nom)}
                        className={`p-3 text-left text-sm bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-2 ${
                          piece === p.nom ? 'ring-2 ring-emerald-500' : ''
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span className="truncate text-neutral-300">{p.nom}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6 p-3 bg-red-950/30 border border-red-900 rounded-xl flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Loading */}
              {isSearching && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                  <p className="text-sm text-neutral-500">Recherche en cours...</p>
                </div>
              )}

              {/* Results */}
              <AnimatePresence>
                {hasSearched && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {results.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500">Aucun résultat trouvé</p>
                        <p className="text-sm text-neutral-400 mt-1">Essaie avec d'autres mots-clés</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-neutral-500">
                            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={() => {
                              setHasSearched(false)
                              setResults([])
                            }}
                            className="text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            Nouvelle recherche
                          </button>
                        </div>

                        <div className="space-y-3">
                          {results.map((result, index) => (
                            <motion.a
                              key={index}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="block p-4 bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                {/* Site Badge */}
                                <div className={`w-10 h-10 rounded-lg ${getSiteColor(result.site)} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white text-xs font-bold">
                                    {result.site.charAt(0)}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                                        {result.title}
                                      </p>
                                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                        {result.description}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>

                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-neutral-800 rounded-full text-neutral-400">
                                      {result.site}
                                    </span>
                                    {result.price && (
                                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {result.price}
                                      </span>
                                    )}
                                    <ExternalLink className="h-3 w-3 text-neutral-400 ml-auto" />
                                  </div>
                                </div>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tips - shown when no search */}
              {!hasSearched && !isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl"
                >
                  <p className="text-sm font-medium text-emerald-300 mb-2">
                    💡 Conseils
                  </p>
                  <ul className="text-xs text-emerald-400 space-y-1">
                    <li>• Vérifie la compatibilité avec ton véhicule (année, motorisation)</li>
                    <li>• Compare les prix entre plusieurs sites</li>
                    <li>• Privilégie les marques équipementiers (Bosch, Valeo, SKF...)</li>
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
