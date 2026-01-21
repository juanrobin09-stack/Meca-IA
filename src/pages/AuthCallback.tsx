import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

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
              'URL à ajouter : https://dgcryodwrwqdxgghrjpp.supabase.co/auth/v1/callback'
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

          // Vérifier/créer le profil
          const { error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profil n'existe pas, le créer
            const displayName = session.user.user_metadata?.full_name ||
                               session.user.user_metadata?.name ||
                               session.user.email?.split('@')[0]

            await supabase.from('profiles').insert({
              id: session.user.id,
              display_name: displayName,
            })
            console.log('Profil créé pour:', displayName)
          }

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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
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
