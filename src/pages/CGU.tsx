import PageTransition from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CGU() {
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
              <CardTitle className="text-2xl">Conditions Générales d'Utilisation</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Acceptation des conditions</h2>
              <p>
                En utilisant MecaIA, vous acceptez sans réserve les présentes
                conditions générales d'utilisation. Si vous n'acceptez pas ces
                conditions, veuillez ne pas utiliser notre service.
              </p>

              <h2>2. Description du service</h2>
              <p>
                MecaIA est un service en ligne proposant des diagnostics automobiles
                assistés par intelligence artificielle. Le service permet aux
                utilisateurs de décrire un problème automobile et d'obtenir une
                analyse probable des causes et solutions.
              </p>

              <h2>3. Inscription et compte</h2>
              <p>
                L'utilisation du service nécessite la création d'un compte. Vous
                vous engagez à fournir des informations exactes et à maintenir la
                confidentialité de vos identifiants de connexion.
              </p>

              <h2>4. Utilisation du service</h2>
              <p>Vous vous engagez à :</p>
              <ul>
                <li>Utiliser le service conformément à sa destination</li>
                <li>Ne pas tenter de contourner les limitations techniques</li>
                <li>Ne pas utiliser le service à des fins illégales</li>
                <li>Respecter les droits de propriété intellectuelle</li>
              </ul>

              <h2>5. Limitation de responsabilité</h2>
              <p>
                <strong>Important :</strong> MecaIA fournit des diagnostics à titre
                informatif uniquement. Ces diagnostics ne remplacent en aucun cas
                l'expertise d'un mécanicien professionnel. MecaIA décline toute
                responsabilité pour les dommages résultant de l'utilisation des
                diagnostics fournis.
              </p>

              <h2>6. Tarification</h2>
              <p>
                MecaIA propose différentes formules d'abonnement :
              </p>
              <ul>
                <li><strong>Gratuit :</strong> 2 diagnostics par mois</li>
                <li><strong>Premium :</strong> 9,99€/mois - diagnostics illimités</li>
                <li><strong>À l'unité :</strong> 2,99€ par diagnostic</li>
              </ul>

              <h2>7. Résiliation</h2>
              <p>
                Vous pouvez résilier votre compte à tout moment depuis les paramètres
                de votre compte. Les abonnements sont résiliables sans frais. Aucun
                remboursement ne sera effectué pour la période en cours.
              </p>

              <h2>8. Modification des CGU</h2>
              <p>
                MecaIA se réserve le droit de modifier les présentes conditions à
                tout moment. Les utilisateurs seront informés des modifications
                significatives par email.
              </p>

              <h2>9. Droit applicable</h2>
              <p>
                Les présentes CGU sont régies par le droit français. En cas de litige,
                les tribunaux français seront seuls compétents.
              </p>

              <h2>10. Contact</h2>
              <p>
                Pour toute question relative aux présentes CGU : contact@mecaia.fr
              </p>

              <p className="text-muted-foreground text-sm mt-8">
                Dernière mise à jour : Janvier 2025
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
