import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Mail, ArrowLeft } from 'lucide-react'

export default function EmailConfirmation() {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </Link>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vérifie ton email !</CardTitle>
            <CardDescription>
              Un email de confirmation a été envoyé à ton adresse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Clique sur le lien dans l'email pour activer ton compte et commencer à utiliser MECAI.
            </p>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Astuce :</span> Pense à vérifier tes spams si tu ne reçois rien dans les prochaines minutes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  )
}
