import { AlertCircle, WifiOff, ServerCrash, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ErrorType = 'network' | 'server' | 'generic' | 'notfound'

interface ErrorMessageProps {
  type?: ErrorType
  title?: string
  message?: string
  onRetry?: () => void
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: 'Problème de connexion',
    message: 'Vérifie ta connexion internet et réessaie.'
  },
  server: {
    icon: ServerCrash,
    title: 'Erreur serveur',
    message: 'Un problème est survenu de notre côté. Réessaie dans quelques instants.'
  },
  notfound: {
    icon: FileQuestion,
    title: 'Introuvable',
    message: 'Cette ressource n\'existe pas ou a été supprimée.'
  },
  generic: {
    icon: AlertCircle,
    title: 'Une erreur est survenue',
    message: 'Quelque chose s\'est mal passé. Réessaie plus tard.'
  }
}

export default function ErrorMessage({ type = 'generic', title, message, onRetry }: ErrorMessageProps) {
  const config = errorConfig[type]
  const Icon = config.icon

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center text-center py-8">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title || config.title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{message || config.message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
