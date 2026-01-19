import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDevis } from '@/hooks/useDevis'
import { useConfetti } from '@/hooks/useConfetti'
import { DevisHashService } from '@/services/devisHashService'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import PageTransition from '@/components/PageTransition'
import ResultatAnalysePro from '@/components/ResultatAnalysePro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Info,
  History,
  Shield,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import { Link } from 'react-router-dom'

export default function AnalyseDevis() {
  const { user, profile } = useAuth()
  const { isPremium, devisRemaining, checkDevisLimit, incrementDevisCount } = useSubscription(profile)
  const { saveDevis, devisList } = useDevis(user?.id)
  const { celebrateSuccess } = useConfetti()

  const [selectedFile, setSelectedFile] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [savedDevisId, setSavedDevisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [currentRemaining, setCurrentRemaining] = useState<number>(devisRemaining as number)
  const [fromCache, setFromCache] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check limit on page load - wait for profile to be loaded
  useEffect(() => {
    async function checkLimit() {
      // Wait for profile to be loaded
      if (!profile) return

      // Always check from database to get fresh status
      const status = await checkDevisLimit()

      // Only show paywall if user is NOT premium and can't analyze
      if (status.isPremium) {
        setCurrentRemaining(Infinity)
        setShowPaywall(false) // Ensure paywall is hidden for premium
        return
      }

      if (!status.canAnalyze) {
        setShowPaywall(true)
      }
      setCurrentRemaining(status.remaining as number)
    }
    checkLimit()
  }, [profile, checkDevisLimit])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset both refs
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    setError(null)
    setAnalysisResult(null)
    setFromCache(false)

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

  async function handleAnalyzeQuote() {
    if (!selectedFile || !user) return

    // Check limits for free users
    if (!isPremium) {
      const limitStatus = await checkDevisLimit()
      if (!limitStatus.canAnalyze) {
        setShowPaywall(true)
        return
      }
    }

    setIsAnalyzing(true)
    setError(null)
    setFromCache(false)
    setAnalysisStep('Extraction du devis...')

    try {
      // Générer hash pour vérifier si déjà analysé
      const devisHash = await DevisHashService.generateDevisHash(selectedFile.base64)

      // Vérifier si analyse existante
      const existingAnalysis = await DevisHashService.checkExistingAnalysis(user.id, devisHash)

      if (existingAnalysis) {
        console.log('✅ Analyse existante trouvée - Même résultat garanti')
        setAnalysisResult({ ...existingAnalysis.analysis_result, fromCache: true })
        setFromCache(true)
        celebrateSuccess()
        setIsAnalyzing(false)
        return
      }

      setAnalysisStep('Analyse IA professionnelle...')

      // Nouvelle analyse professionnelle
      const response = await fetch('/.netlify/functions/analyze-devis-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedFile.base64,
          userId: user.id
        })
      })

      if (!response.ok) {
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Service d\'analyse temporairement indisponible. Veuillez réessayer plus tard.')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur serveur')
      }

      const result = await response.json()
      setAnalysisResult(result)
      celebrateSuccess()

      // Sauvegarder pour cohérence future
      setAnalysisStep('Sauvegarde...')
      await DevisHashService.saveAnalysis(
        user.id,
        devisHash,
        result.ocrText || selectedFile.base64,
        result
      )

      // Determine verdict type for history
      let verdictType: 'good' | 'warning' | 'bad' | 'neutral' = 'neutral'
      if (result.verdict.statut === 'honnete') verdictType = 'good'
      else if (result.verdict.statut === 'reserve') verdictType = 'warning'
      else if (result.verdict.statut === 'arnaque') verdictType = 'bad'

      // Save to devis history (non-blocking)
      try {
        const saved = await saveDevis({
          analysis_result: JSON.stringify(result),
          image_url: selectedFile.dataUrl,
          verdict_type: verdictType,
          potential_savings: result.economiesPotentielles?.montant,
          is_fair_price: verdictType === 'good',
        })
        setSavedDevisId(saved.id)
      } catch (saveErr) {
        console.warn('History save skipped:', saveErr)
        // Non-blocking - analysis still works
      }

      // Increment counter after successful analysis (for free users)
      if (!isPremium) {
        await incrementDevisCount()
        setCurrentRemaining(prev => Math.max(0, prev - 1))
      }
    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || "Erreur lors de l'analyse. Réessaie.")
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  function reset() {
    setSelectedFile(null)
    setAnalysisResult(null)
    setSavedDevisId(null)
    setError(null)
    setFromCache(false)
    setAnalysisStep('')
  }

  // Display remaining from fresh check if available
  const displayRemaining = currentRemaining

  return (
    <PageTransition>
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <motion.div whileHover={{ rotate: 10 }}>
                  <FileText className="h-8 w-8 text-primary" />
                </motion.div>
                Analyseur de Devis Pro
              </h1>
              <div className="flex items-center gap-2">
                {devisList.length > 0 && (
                  <Link to="/app/history?tab=devis">
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Historique ({devisList.length})
                    </Button>
                  </Link>
                )}
                <Badge variant={isPremium ? "premium" : "secondary"} className="text-sm">
                  {isPremium ? (
                    <>✨ Illimité</>
                  ) : (
                    <>{displayRemaining}/1 analyse gratuite</>
                  )}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Détection d'arnaques • Comparaison prix marché • Analyse experte
            </p>
          </motion.div>

          {/* Disclaimer */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium mb-1">Analyse professionnelle garantie</p>
              <p className="text-blue-700 dark:text-blue-300">
                Même devis = Même résultat. Prix comparés aux tarifs marché 2026.
              </p>
            </div>
          </div>

          {/* Analysis Result - Professional Design */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Saved confirmation */}
              {savedDevisId && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Analyse sauvegardée dans ton historique</span>
                  <Link to="/app/history?tab=devis" className="ml-auto text-emerald-600 hover:underline font-medium">
                    Voir →
                  </Link>
                </motion.div>
              )}

              <ResultatAnalysePro data={{ ...analysisResult, fromCache }} />

              {/* Original Quote Preview */}
              {selectedFile?.dataUrl && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5" />
                      Devis original
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl overflow-hidden border-2 border-dashed border-muted bg-muted/30">
                      <img
                        src={selectedFile.dataUrl}
                        alt="Devis original"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Analysis Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={reset}
              >
                Analyser un autre devis
              </Button>
            </motion.div>
          )}

          {!analysisResult && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload ton devis
                </CardTitle>
                <CardDescription>
                  Photo ou scan de ton devis garage (JPG, PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hidden inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Preview if file selected */}
                {selectedFile ? (
                  <div className="border-2 border-dashed rounded-xl p-6 text-center">
                    <img
                      src={selectedFile.dataUrl}
                      alt="Devis"
                      className="max-h-64 mx-auto rounded-lg shadow-md mb-4"
                    />
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Reprendre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Changer
                      </Button>
                    </div>
                  </div>
                ) : isMobile ? (
                  /* Mobile: Two separate buttons */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-32 flex-col gap-3 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="font-medium">Prendre photo</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-32 flex-col gap-3 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-violet-600" />
                        </div>
                        <span className="font-medium">Galerie</span>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      JPG, PNG, HEIC (max 15MB)
                    </p>
                  </div>
                ) : (
                  /* Desktop: Click zone */
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium text-lg">Clique ou glisse ton devis ici</p>
                    <p className="text-sm text-muted-foreground mt-1">JPG, PNG (max 15MB)</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25"
                  size="lg"
                  onClick={handleAnalyzeQuote}
                  disabled={!selectedFile || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{analysisStep || 'Analyse professionnelle en cours...'}</span>
                    </div>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Analyser le devis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {!analysisResult && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Conseils pour un bon devis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    Demande toujours un devis écrit détaillé avant intervention
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    Compare au moins 2-3 garages pour les grosses réparations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    N'hésite pas à négocier, surtout sur la main d'œuvre
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} mode="devis" />
    </div>
    </PageTransition>
  )
}
