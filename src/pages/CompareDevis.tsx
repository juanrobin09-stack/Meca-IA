import { useState } from 'react'
import { Plus, Trash2, Scale, TrendingDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import Sidebar from '@/components/Sidebar'

interface DevisFile {
  id: string
  file: File
  name: string
}

interface ComparisonResult {
  winner: string
  savings: string
  details: Array<{
    name: string
    total: number
    verdict: string
    issues: string[]
  }>
  recommendation: string
}

export default function CompareDevis() {
  // For demo purposes - in real app, check user subscription tier
  const tier = 'pro' as const
  const [devis, setDevis] = useState<DevisFile[]>([])
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)

  // Show paywall if not Pro
  if (tier !== 'pro') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <PageTransition>
            <div className="max-w-2xl mx-auto text-center py-16">
              <Scale className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Comparateur multi-devis</h1>
              <p className="text-muted-foreground mb-6">
                Compare jusqu'a 3 devis de garages differents pour trouver le meilleur rapport
                qualite/prix.
              </p>
              <Badge className="bg-amber-500 mb-6">Fonctionnalite Pro</Badge>
              <br />
              <Button asChild className="mt-4">
                <Link to="/pricing">Passer Pro pour debloquer</Link>
              </Button>
            </div>
          </PageTransition>
        </main>
      </div>
    )
  }

  const addDevis = (file: File) => {
    if (devis.length >= 3) return
    setDevis([...devis, { id: crypto.randomUUID(), file, name: file.name }])
  }

  const removeDevis = (id: string) => {
    setDevis(devis.filter((d) => d.id !== id))
    setComparison(null)
  }

  const handleCompare = async () => {
    if (devis.length < 2) return
    setComparing(true)

    // Simulate API call - in real app, send to Claude Vision API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setComparison({
      winner: 'Garage A',
      savings: '127EUR',
      details: [
        { name: 'Garage A', total: 450, verdict: 'Meilleur prix', issues: [] },
        { name: 'Garage B', total: 520, verdict: 'Correct', issues: ['MO un peu elevee'] },
        {
          name: 'Garage C',
          total: 577,
          verdict: 'Trop cher',
          issues: ['Pieces surtarifees', 'Prestation inutile'],
        },
      ],
      recommendation:
        "Le Garage A propose le meilleur rapport qualite/prix. Le Garage C inclut une prestation 'nettoyage injecteurs' qui semble inutile pour un simple changement de plaquettes.",
    })

    setComparing(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        <PageTransition>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold">Comparateur multi-devis</h1>
              <p className="text-muted-foreground mt-2">
                Upload 2 a 3 devis, l'IA compare et te dit lequel choisir
              </p>
            </div>

            {/* Upload zones */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[0, 1, 2].map((index) => (
                <Card
                  key={index}
                  className={`p-6 border-2 border-dashed ${devis[index] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-muted'}`}
                >
                  {devis[index] ? (
                    <div className="text-center">
                      <p className="font-medium truncate">{devis[index].name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDevis(devis[index].id)}
                        className="mt-2 text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center block">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && addDevis(e.target.files[0])}
                        disabled={devis.length >= 3}
                      />
                      <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Devis {index + 1}</p>
                    </label>
                  )}
                </Card>
              ))}
            </div>

            {/* Bouton comparer */}
            <div className="text-center mb-8">
              <Button size="lg" onClick={handleCompare} disabled={devis.length < 2 || comparing}>
                {comparing ? 'Analyse en cours...' : 'Comparer les devis'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">Minimum 2 devis requis</p>
            </div>

            {/* Resultats comparaison */}
            {comparison && (
              <Card className="p-8">
                <div className="text-center mb-8">
                  <Badge className="bg-green-500 text-lg px-4 py-2">
                    Meilleur choix : {comparison.winner}
                  </Badge>
                  <p className="text-2xl font-bold text-green-600 mt-4">
                    <TrendingDown className="h-6 w-6 inline mr-2" />
                    Economie potentielle : {comparison.savings}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {comparison.details.map((d, i) => (
                    <Card
                      key={i}
                      className={`p-4 ${d.verdict === 'Meilleur prix' ? 'border-2 border-green-500' : ''}`}
                    >
                      <h4 className="font-semibold mb-2">{d.name}</h4>
                      <p className="text-2xl font-bold">{d.total}EUR</p>
                      <Badge
                        className={
                          d.verdict === 'Meilleur prix'
                            ? 'bg-green-500'
                            : d.verdict === 'Correct'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }
                      >
                        {d.verdict}
                      </Badge>
                      {d.issues.length > 0 && (
                        <ul className="mt-3 text-sm text-muted-foreground">
                          {d.issues.map((issue, j) => (
                            <li key={j} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Recommandation MecaIA</h4>
                  <p className="text-muted-foreground">{comparison.recommendation}</p>
                </div>
              </Card>
            )}
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
