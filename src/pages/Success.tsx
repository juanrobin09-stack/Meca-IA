import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Sparkles, MessageSquare, FileText, Wrench } from 'lucide-react'

type PaymentType = 'subscription' | 'diagnostic' | 'devis' | 'chat' | 'video'

interface SessionData {
  payment_status: string
  mode: 'subscription' | 'payment'
  productType: PaymentType
}

const paymentMessages: Record<PaymentType, {
  icon: React.ReactNode
  title: string
  description: string
  buttonText: string
  buttonPath: string
}> = {
  subscription: {
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    title: 'Bienvenue en Premium !',
    description: 'Tu as maintenant accès à toutes les fonctionnalités en illimité.',
    buttonText: 'Nouveau diagnostic',
    buttonPath: '/app/chat',
  },
  diagnostic: {
    icon: <Wrench className="h-5 w-5 text-blue-500" />,
    title: '+1 Crédit Diagnostic',
    description: 'Ton crédit diagnostic a été ajouté. Tu peux maintenant effectuer un diagnostic.',
    buttonText: 'Faire un diagnostic',
    buttonPath: '/app/chat',
  },
  video: {
    icon: <Wrench className="h-5 w-5 text-purple-500" />,
    title: '+1 Crédit Diagnostic Vidéo',
    description: 'Ton crédit a été ajouté. Tu peux maintenant analyser une vidéo.',
    buttonText: 'Diagnostic vidéo',
    buttonPath: '/app/diagnostic-video',
  },
  devis: {
    icon: <FileText className="h-5 w-5 text-green-500" />,
    title: '+1 Crédit Analyse Devis',
    description: 'Ton crédit a été ajouté. Tu peux maintenant analyser un devis.',
    buttonText: 'Analyser un devis',
    buttonPath: '/app/analyse-devis',
  },
  chat: {
    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
    title: '+10 Crédits Chat',
    description: 'Tes 10 messages ont été ajoutés. Continue ta conversation avec MECAI !',
    buttonText: 'Chat Mécanicien',
    buttonPath: '/app/mechanic-chat',
  },
}

export default function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

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
          setSessionData(session)
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

  // Determine payment type
  const paymentType: PaymentType = sessionData?.mode === 'subscription'
    ? 'subscription'
    : (sessionData?.productType || 'diagnostic')

  const message = paymentMessages[paymentType] || paymentMessages.subscription

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
              Si tu as été débité, contacte-nous à contact@mymecai.com
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
            {message.icon}
            <span className="font-medium">{message.title}</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {message.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button className="flex-1" onClick={() => navigate(message.buttonPath)}>
              {message.buttonText}
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
