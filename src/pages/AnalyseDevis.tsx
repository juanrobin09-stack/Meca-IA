import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useDevis } from '@/hooks/useDevis'
import { useConfetti } from '@/hooks/useConfetti'
import { DevisHashService } from '@/services/devisHashService'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import PremiumDisclaimer from '@/components/PremiumDisclaimer'
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
  const { user, profile, refreshProfile } = useAuth()
  const { isPremium, devisRemaining, purchasedDevisCredits, checkDevisLimit, incrementDevisCount } = useSubscription(profile)
  const userLimits = useUserLimits()
  const { saveDevis, devisList } = useDevis(user?.id)
  const { celebrateSuccess } = useConfetti()

  const [selectedFile, setSelectedFile] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [savedDevisId, setSavedDevisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [currentRemaining, setCurrentRemaining] = useState<number>(devisRemaining as number)
  const [currentPurchasedCredits, setCurrentPurchasedCredits] = useState<number>(purchasedDevisCredits as number)
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

  // Refresh user limits on mount
  useEffect(() => {
    userLimits.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const limitCheckedRef = useRef(false)

  // Check limit on page load - wait for profile to be loaded
  useEffect(() => {
    async function checkLimit() {
      // Wait for profile to be loaded and avoid multiple checks
      if (!profile || limitCheckedRef.current) return
      limitCheckedRef.current = true

      // Refresh profile to get latest data (important after returning from payment)
      if (refreshProfile) {
        await refreshProfile()
      }

      // Always check from database to get fresh status
      const status = await checkDevisLimit()

      // Only show paywall if user is NOT premium and can't analyze
      if (status.isPremium) {
        setCurrentRemaining(Infinity)
        setShowPaywall(false) // Ensure paywall is hidden for premium
        return
      }

      setCurrentRemaining(status.remaining as number)
      setCurrentPurchasedCredits(status.purchasedCredits || 0)

      // Only show paywall if user truly cannot analyze (no free remaining AND no purchased credits)
      if (!status.canAnalyze) {
        setShowPaywall(true)
      }
    }
    checkLimit()
  }, [profile, checkDevisLimit, refreshProfile])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📁 Fichier sélectionné:', file.name, file.type, file.size)

    // Reset both refs
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    setError(null)
    setAnalysisResult(null)
    setFromCache(false)

    // Validate
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.error('❌ Validation échouée:', validation.error)
      setError(validation.error || 'Fichier invalide')
      return
    }

    try {
      setAnalysisStep('Préparation de l\'image...')
      const compressed = await compressImage(file)
      console.log('✅ Image prête, taille base64:', compressed.base64.length)

      // Vérifier que l'image n'est pas trop grosse pour Netlify (max ~4MB base64)
      if (compressed.base64.length > 4000000) {
        setError('Image trop volumineuse. Utilise le bouton "Prendre photo" pour capturer une nouvelle image.')
        setAnalysisStep('')
        return
      }

      setSelectedFile({
        dataUrl: compressed.dataUrl,
        base64: compressed.base64,
      })
      setAnalysisStep('')
    } catch (err: unknown) {
      console.error('❌ Erreur compression:', err)
      // Message d'erreur plus clair pour mobile
      const error = err as { message?: string }
      const errorMsg = error?.message || "Erreur lors du traitement de l'image."
      if (errorMsg.includes('Format') || errorMsg.includes('supporté')) {
        setError('📸 Cette image ne peut pas être lue. Utilise le bouton "Prendre photo" pour capturer directement ton devis.')
      } else {
        setError(errorMsg)
      }
      setAnalysisStep('')
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
    setAnalysisStep('Vérification...')

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

      setAnalysisStep('Analyse IA en cours...')

      // Créer un AbortController pour le timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 secondes timeout

      const response = await fetch('/.netlify/functions/analyze-devis-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedFile.base64,
          userId: user.id
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Service temporairement indisponible. Réessaie dans quelques minutes.')
        }
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 429) {
          throw new Error('Trop de requêtes. Attends 1 minute et réessaie.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Erreur d\'authentification. Reconnecte-toi et réessaie.')
        } else if (response.status >= 500) {
          throw new Error('Erreur serveur. Réessaie dans quelques minutes.')
        }

        throw new Error(errorData.error || 'Erreur lors de l\'analyse. Réessaie.')
      }

      const result = await response.json()
      console.log('✅ Analyse réussie')

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
        // Determine which credit type will be used BEFORE incrementing
        const willUsePurchasedCredit = currentRemaining <= 0 && currentPurchasedCredits > 0

        await incrementDevisCount()

        // Update the correct counter based on which credit was used
        if (willUsePurchasedCredit) {
          setCurrentPurchasedCredits(prev => Math.max(0, prev - 1))
        } else {
          setCurrentRemaining(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err: unknown) {
      console.error('❌ Erreur analyse:', err)
      const error = err as { name?: string; message?: string }
      if (error?.name === 'AbortError') {
        setError('L\'analyse prend trop de temps. Réessaie avec une photo plus nette.')
      } else {
        setError(error?.message || "Erreur lors de l'analyse. Réessaie.")
      }
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

      <main className="md:pl-64">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 md:pb-8 max-w-3xl">
          <motion.div
            className="mb-4 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                <motion.div whileHover={{ rotate: 10 }}>
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </motion.div>
                <span className="hidden sm:inline">Analyseur de Devis</span>
                <span className="sm:hidden">Analyse Devis</span>
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {devisList.length > 0 && (
                  <Link to="/app/history?tab=devis">
                    <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                      <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Historique ({devisList.length})</span>
                      <span className="sm:hidden">{devisList.length}</span>
                    </Button>
                  </Link>
                )}
                <Badge variant={isPremium ? "premium" : "secondary"} className="text-[10px] sm:text-sm px-2 py-0.5">
                  {isPremium ? (
                    <>✨ <span className="hidden sm:inline">Illimité</span><span className="sm:hidden">∞</span></>
                  ) : (
                    <>
                      <span className="hidden sm:inline">{displayRemaining}/1 analyse gratuite</span>
                      <span className="sm:hidden">{displayRemaining}/1</span>
                      {currentPurchasedCredits > 0 && <span className="text-emerald-500"> +{currentPurchasedCredits}</span>}
                    </>
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

          {/* Premium Disclaimer - shown only when no analysis yet */}
          {!analysisResult && !userLimits.isPremium && (
            <PremiumDisclaimer feature="devis" className="mb-6" />
          )}

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
                  className="w-full h-16 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25"
                  size="lg"
                  onClick={handleAnalyzeQuote}
                  disabled={!selectedFile || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{analysisStep || 'Analyse professionnelle en cours...'}</span>
                      </div>
                      <span className="text-xs opacity-80">Cela peut prendre 30-60 secondes</span>
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

      <PaywallModal
        open={showPaywall}
        onOpenChange={async (open) => {
          setShowPaywall(open)
          // When closing the paywall, refresh profile to get updated credits (in case user purchased)
          if (!open && refreshProfile) {
            const freshProfile = await refreshProfile()
            if (freshProfile) {
              const freeRemaining = Math.max(0, 1 - (freshProfile.free_devis_used || 0))
              const purchasedCredits = freshProfile.purchased_devis_credits || 0
              setCurrentRemaining(freeRemaining)
              setCurrentPurchasedCredits(purchasedCredits)
            }
          }
        }}
        mode="devis"
      />
    </div>
    </PageTransition>
  )
}
