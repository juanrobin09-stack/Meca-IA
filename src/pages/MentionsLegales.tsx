import PageTransition from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MentionsLegales() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container max-w-3xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Mentions Légales</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Éditeur du site</h2>
              <p>
                <strong>MecaIA</strong><br />
                Entreprise individuelle<br />
                SIREN : 994 221 653<br />
                Propriétaire : Juan Robin<br />
                Email : contact@mecaia.fr
              </p>

              <h2>2. Hébergement</h2>
              <p>
                Ce site est hébergé par :<br />
                <strong>Netlify, Inc.</strong><br />
                44 Montgomery Street, Suite 300<br />
                San Francisco, California 94104, États-Unis
              </p>

              <h2>3. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus présents sur MecaIA (textes, images, logos,
                interface utilisateur) sont protégés par le droit d'auteur. Toute
                reproduction, représentation ou diffusion, totale ou partielle, du
                contenu de ce site par quelque procédé que ce soit, sans autorisation
                expresse de MecaIA, est interdite.
              </p>

              <h2>4. Responsabilité</h2>
              <p>
                MecaIA est un service d'aide au diagnostic automobile utilisant
                l'intelligence artificielle. Les informations fournies sont données
                à titre indicatif et ne remplacent pas l'avis d'un professionnel
                qualifié. MecaIA ne peut être tenu responsable des décisions prises
                sur la base des diagnostics fournis.
              </p>

              <h2>5. Données personnelles</h2>
              <p>
                Pour toute information sur le traitement de vos données personnelles,
                veuillez consulter notre{' '}
                <Link to="/confidentialite" className="text-primary hover:underline">
                  Politique de confidentialité
                </Link>.
              </p>

              <h2>6. Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales, vous
                pouvez nous contacter à l'adresse : contact@mecaia.fr
              </p>

              <p className="text-muted-foreground text-sm mt-8">
                Dernière mise à jour : Janvier 2026
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
