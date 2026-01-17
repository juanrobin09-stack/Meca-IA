import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import ReactMarkdown from 'react-markdown'

const QUOTE_ANALYSIS_PROMPT = `Tu es un expert en tarification automobile française. Analyse ce devis de garage.

Pour chaque ligne identifiable sur le devis:
- Identifie la pièce ou prestation
- Compare au prix marché français (garage indépendant)
- Donne un verdict: ✅ Prix correct / ⚠️ Négociable / ❌ Trop cher

FORMAT DE RÉPONSE:

## 📊 VERDICT GLOBAL
[Correct ✅ / Négociable ⚠️ / Trop cher ❌]
[Explication en 1-2 phrases]

## 📋 ANALYSE DÉTAILLÉE

| Élément | Prix devis | Prix marché | Verdict |
|---------|-----------|-------------|---------|
| [Élément 1] | [X]€ | [Y-Z]€ | ✅/⚠️/❌ |
| [Élément 2] | [X]€ | [Y-Z]€ | ✅/⚠️/❌ |

## 💰 ÉCONOMIE POTENTIELLE
[X]€ à [Y]€ si tu négocies bien

## 💬 SCRIPT DE NÉGOCIATION
"[Phrase polie mais ferme à utiliser avec le garagiste]"

## 💡 CONSEILS
- [Conseil 1]
- [Conseil 2]

Si le devis n'est pas lisible ou n'est pas un devis auto, dis-le poliment.`

export default function AnalyseDevis() {
  const { user, profile } = useAuth()
  const { isPremium, checkDiagnosticLimit } = useSubscription(profile)

  const [selectedFile, setSelectedFile] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    setAnalysis(null)

    // Validate
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    try {
      const compressed = await compressImage(file)
      setSelectedFile({
        dataUrl: compressed.dataUrl,
        base64: compressed.base64,
      })
    } catch {
      setError("Erreur lors du traitement de l'image")
    }
  }

  async function analyzeQuote() {
    if (!selectedFile || !user) return

    // Check limits for free users
    if (!isPremium) {
      const limitStatus = await checkDiagnosticLimit()
      if (!limitStatus.canDiagnose) {
        setShowPaywall(true)
        return
      }
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('API key not configured')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: selectedFile.base64,
                },
              },
              {
                type: 'text',
                text: QUOTE_ANALYSIS_PROMPT,
              },
            ],
          }],
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      const data = await response.json()
      setAnalysis(data.content[0].text)
    } catch (err) {
      console.error('Analysis error:', err)
      setError("Erreur lors de l'analyse. Réessaie.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function reset() {
    setSelectedFile(null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Analyse ton devis garage
            </h1>
            <p className="text-muted-foreground">
              Upload ton devis, l'IA te dit si c'est le bon prix et comment négocier.
            </p>
          </div>

          {!analysis ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload ton devis</CardTitle>
                <CardDescription>
                  Photo ou scan de ton devis garage (JPG, PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload zone */}
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-4">
                      <img
                        src={selectedFile.dataUrl}
                        alt="Devis"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Clique pour changer d'image
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Clique ou glisse ton devis ici</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG (max 10MB)</p>
                    </>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={analyzeQuote}
                  disabled={!selectedFile || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyser le devis
                    </>
                  )}
                </Button>

                {!isPremium && (
                  <p className="text-xs text-center text-muted-foreground">
                    L'analyse de devis utilise 1 de tes diagnostics gratuits
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Result */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Analyse terminée
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={reset}>
                      Nouveau devis
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mt-6 mb-3 first:mt-0">{children}</h2>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-border text-sm">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-border px-3 py-2">{children}</td>
                        ),
                        p: ({ children }) => (
                          <p className="my-2 text-sm">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-2 space-y-1 text-sm">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 my-4 italic bg-muted/50 py-2">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Preview of original */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Devis analysé</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={selectedFile?.dataUrl}
                    alt="Devis original"
                    className="max-h-48 rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Conseils pour un bon devis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Demande toujours un devis écrit détaillé avant intervention
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  Compare au moins 2-3 garages pour les grosses réparations
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  N'hésite pas à négocier, surtout sur la main d'œuvre
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
    </div>
  )
}
