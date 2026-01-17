import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react'

export default function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setStatus('error')
        return
      }

      try {
        // Verify session with backend
        const response = await fetch(`/.netlify/functions/get-session?session_id=${sessionId}`)

        if (response.ok) {
          const session = await response.json()
          if (session.payment_status === 'paid') {
            // Refresh profile to get updated subscription status
            refreshProfile?.()
            setStatus('success')
            return
          }
        }

        // If we can't verify, still show success (webhook will handle it)
        setStatus('success')
      } catch (error) {
        console.error('Session verification error:', error)
        // Still show success as webhook should handle the update
        setStatus('success')
      }
    }

    verifySession()
  }, [sessionId, refreshProfile])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Vérification du paiement...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Erreur</CardTitle>
            <CardDescription>
              Une erreur est survenue lors de la vérification du paiement.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Si tu as été débité, contacte-nous à contact@mecaia.fr
            </p>
            <Button onClick={() => navigate('/app')}>
              Retour à l'application
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
          <CardDescription>
            Merci pour ta confiance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="font-medium">Bienvenue en Premium !</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Tu as maintenant accès à tous les diagnostics en illimité.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button className="flex-1" onClick={() => navigate('/app/chat')}>
              Nouveau diagnostic
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/app')}>
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
