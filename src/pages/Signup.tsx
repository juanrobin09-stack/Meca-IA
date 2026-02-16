import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTikTokTracking } from '@/hooks/useTikTokTracking'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Loader2 } from 'lucide-react'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'

export default function Signup() {
  useDocumentTitle('Inscription')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { trackCompleteRegistration } = useTikTokTracking()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation consentement RGPD
    if (!acceptedTerms) {
      setError('Tu dois accepter les conditions d\'utilisation et la politique de confidentialité')
      return
    }

    // Validation du prénom
    const trimmedName = displayName.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setError('Le prénom est obligatoire (minimum 2 caractères)')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, trimmedName, true)
      // Track successful registration for TikTok Pixel
      trackCompleteRegistration('MECAI Free Account')
      // Marquer que c'est une nouvelle inscription pour afficher l'onboarding
      localStorage.setItem('mecaia_show_onboarding', 'true')
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950 px-4 py-8">
      <Card className="w-full max-w-md border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <CardHeader className="text-center">
          <Link to="/" className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </Link>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Inscris-toi pour commencer à diagnostiquer
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}

            {/* Google OAuth */}
            <GoogleAuthButton />

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jean"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Ce prénom sera affiché dans l'app
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>

            {/* Consentement RGPD */}
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-foreground flex-1">
                  J'accepte les{' '}
                  <Link
                    to="/cgu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    Conditions Générales d'Utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link
                    to="/confidentialite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    Politique de Confidentialité
                  </Link>
                  {' '}de MECAI. <span className="text-red-500">*</span>
                </span>
              </label>

              <p className="text-xs text-muted-foreground mt-3 ml-8">
                En cochant cette case, tu consens au traitement de tes données personnelles
                conformément au RGPD. Tu peux retirer ton consentement à tout moment.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary text-center">
              ← Retour à l'accueil
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
    </PageTransition>
  )
}
