import PageTransition from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Confidentialite() {
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
              <CardTitle className="text-2xl">Politique de Confidentialité</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD),
                cette politique décrit comment MecaIA collecte, utilise et protège vos
                données personnelles.
              </p>

              <h2>1. Responsable du traitement</h2>
              <p>
                <strong>MecaIA</strong><br />
                SIREN : 994 221 653<br />
                Juan Robin<br />
                Email : contact@mecaia.fr
              </p>

              <h2>2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul>
                <li><strong>Données d'inscription :</strong> email, prénom (optionnel)</li>
                <li><strong>Données d'utilisation :</strong> historique des diagnostics, préférences</li>
                <li><strong>Données techniques :</strong> adresse IP, type de navigateur, appareil</li>
                <li><strong>Données de paiement :</strong> traitées par Stripe (nous ne stockons pas vos coordonnées bancaires)</li>
              </ul>

              <h2>3. Finalités du traitement</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul>
                <li>Fournir le service de diagnostic automobile</li>
                <li>Gérer votre compte utilisateur</li>
                <li>Améliorer la qualité des diagnostics IA</li>
                <li>Vous envoyer des communications relatives au service</li>
                <li>Assurer la sécurité et prévenir les fraudes</li>
              </ul>

              <h2>4. Base légale</h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul>
                <li>L'exécution du contrat (fourniture du service)</li>
                <li>Votre consentement (cookies non essentiels, newsletters)</li>
                <li>Notre intérêt légitime (amélioration du service, sécurité)</li>
              </ul>

              <h2>5. Durée de conservation</h2>
              <ul>
                <li><strong>Données de compte :</strong> jusqu'à suppression du compte + 3 ans</li>
                <li><strong>Historique diagnostics :</strong> 30 jours (gratuit) ou permanent (premium)</li>
                <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
              </ul>

              <h2>6. Vos droits</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul>
                <li><strong>Accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Portabilité :</strong> récupérer vos données dans un format lisible</li>
                <li><strong>Opposition :</strong> vous opposer à certains traitements</li>
                <li><strong>Limitation :</strong> limiter l'utilisation de vos données</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : contact@mecaia.fr
              </p>

              <h2>7. Cookies</h2>
              <p>
                MecaIA utilise des cookies pour le fonctionnement du site et
                l'amélioration de l'expérience utilisateur. Vous pouvez gérer
                vos préférences via le bandeau cookies.
              </p>
              <ul>
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement (authentification)</li>
                <li><strong>Cookies analytiques :</strong> mesure d'audience (avec consentement)</li>
              </ul>

              <h2>8. Transferts de données</h2>
              <p>
                Certaines données peuvent être transférées vers des prestataires
                situés hors UE (hébergement Vercel, IA Anthropic). Ces transferts
                sont encadrés par les clauses contractuelles types de la Commission
                européenne.
              </p>

              <h2>9. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles
                appropriées pour protéger vos données : chiffrement, accès restreint,
                sauvegardes régulières.
              </p>

              <h2>10. Contact et réclamation</h2>
              <p>
                Pour toute question sur vos données : contact@mecaia.fr
              </p>
              <p>
                Vous pouvez également introduire une réclamation auprès de la CNIL :
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  www.cnil.fr
                </a>
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
