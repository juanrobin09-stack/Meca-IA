import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'consent'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [consentLoading, setConsentLoading] = useState(false)

  const handleAcceptTerms = async () => {
    if (!acceptedTerms || !userId) return

    setConsentLoading(true)
    try {
      const now = new Date().toISOString()
      // Enregistrer le consentement dans le profil
      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted: true,
          terms_accepted_at: now,
          privacy_accepted: true,
          privacy_accepted_at: now,
          terms_version: '1.0',
        })
        .eq('id', userId)

      if (error) {
        console.error('Error saving consent:', error)
        setStatus('error')
        setErrorMessage('Erreur lors de l\'enregistrement du consentement')
        return
      }

      // Marquer que c'est une nouvelle inscription pour afficher l'onboarding
      localStorage.setItem('mecaia_show_onboarding', 'true')

      setStatus('success')
      setTimeout(() => {
        navigate('/app')
      }, 1000)
    } catch (error) {
      console.error('Error saving consent:', error)
      setStatus('error')
      setErrorMessage('Erreur lors de l\'enregistrement du consentement')
    } finally {
      setConsentLoading(false)
    }
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth error in URL params (Google returns errors this way)
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (errorParam) {
          console.error('OAuth Error:', errorParam, errorDescription)
          setStatus('error')

          // Handle specific OAuth errors
          if (errorParam === 'access_denied') {
            setErrorMessage('Connexion annulée')
            setErrorDetails('Tu as annulé la connexion Google.')
          } else if (errorDescription?.includes('redirect_uri_mismatch') || errorParam === 'redirect_uri_mismatch') {
            setErrorMessage('Erreur de configuration OAuth')
            setErrorDetails(
              'L\'URL de redirection Supabase doit être ajoutée dans Google Cloud Console → ' +
              'APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs. ' +
              'URL à ajouter : https://hkcpeamosgkzavxffgri.supabase.co/auth/v1/callback'
            )
          } else {
            setErrorMessage(errorDescription || 'Erreur lors de la connexion')
            setErrorDetails(`Code erreur: ${errorParam}`)
          }

          setTimeout(() => navigate('/login'), 5000)
          return
        }

        // Supabase gère automatiquement le callback OAuth via detectSessionInUrl
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Erreur session:', error)
          setStatus('error')
          setErrorMessage(error.message || 'Erreur lors de la connexion')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        if (session) {
          console.log('Connecté avec Google:', session.user.email)
          setUserId(session.user.id)

          // Vérifier/créer le profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profil n'existe pas, le créer (sans consentement pour l'instant)
            const displayName = session.user.user_metadata?.full_name ||
                               session.user.user_metadata?.name ||
                               session.user.email?.split('@')[0]

            await supabase.from('profiles').insert({
              id: session.user.id,
              display_name: displayName,
            })
            console.log('Profil créé pour:', displayName)

            // Nouvel utilisateur Google → demander consentement
            setStatus('consent')
            return
          }

          // Vérifier si l'utilisateur a déjà accepté les CGU
          if (!profile?.terms_accepted) {
            // Utilisateur existant sans consentement → demander consentement
            setStatus('consent')
            return
          }

          // Consentement déjà donné → rediriger
          setStatus('success')

          // Rediriger vers le dashboard
          setTimeout(() => {
            navigate('/app')
          }, 1000)
        } else {
          setStatus('error')
          setErrorMessage('Aucune session trouvée')
          setErrorDetails('La connexion n\'a pas pu être établie. Réessaie.')
          setTimeout(() => navigate('/login'), 3000)
        }
      } catch (err) {
        console.error('Erreur callback:', err)
        setStatus('error')
        setErrorMessage('Une erreur est survenue')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950 px-4">
      <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full text-center border">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText={false} />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
            <p className="text-muted-foreground">
              Veuillez patienter pendant que nous vous connectons.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">Connexion réussie !</h2>
            <p className="text-muted-foreground">
              Redirection vers votre tableau de bord...
            </p>
          </>
        )}

        {status === 'consent' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Dernière étape !</h2>
            <p className="text-muted-foreground mb-6">
              Pour finaliser ton inscription, tu dois accepter nos conditions.
            </p>

            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 text-left">
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
                    className="text-primary hover:underline font-semibold"
                  >
                    Conditions Générales d'Utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link
                    to="/confidentialite"
                    target="_blank"
                    className="text-primary hover:underline font-semibold"
                  >
                    Politique de Confidentialité
                  </Link>
                  {' '}de MECAI.
                </span>
              </label>

              <p className="text-xs text-muted-foreground mt-3 ml-8">
                En cochant cette case, tu consens au traitement de tes données personnelles
                conformément au RGPD.
              </p>
            </div>

            <Button
              onClick={handleAcceptTerms}
              disabled={!acceptedTerms || consentLoading}
              className="w-full"
            >
              {consentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuer
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Erreur de connexion</h2>
            <p className="text-muted-foreground mb-2">{errorMessage}</p>
            {errorDetails && (
              <p className="text-sm text-muted-foreground/80 mb-4 bg-muted/50 p-3 rounded-lg">
                {errorDetails}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Redirection vers la page de connexion...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
