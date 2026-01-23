import PageTransition from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Server, Copyright, Shield, Database, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'

export default function MentionsLegales() {
  const sections = [
    {
      icon: Building2,
      title: "Éditeur du site",
      content: (
        <div className="space-y-1">
          <p className="font-semibold text-lg">MECAI</p>
          <p className="text-muted-foreground">Entreprise individuelle</p>
          <p><span className="text-muted-foreground">SIREN :</span> 994 221 653</p>
          <p><span className="text-muted-foreground">Propriétaire :</span> J.R</p>
          <p><span className="text-muted-foreground">Email :</span> contact@mymecai.com</p>
        </div>
      )
    },
    {
      icon: Server,
      title: "Hébergement",
      content: (
        <div className="space-y-1">
          <p className="font-semibold">Netlify, Inc.</p>
          <p className="text-muted-foreground text-sm">
            44 Montgomery Street, Suite 300<br />
            San Francisco, California 94104<br />
            États-Unis
          </p>
        </div>
      )
    },
    {
      icon: Copyright,
      title: "Propriété intellectuelle",
      content: (
        <p className="text-muted-foreground">
          L'ensemble des contenus présents sur MECAI (textes, images, logos,
          interface utilisateur) sont protégés par le droit d'auteur. Toute
          reproduction, représentation ou diffusion, totale ou partielle, du
          contenu de ce site par quelque procédé que ce soit, sans autorisation
          expresse de MECAI, est interdite.
        </p>
      )
    },
    {
      icon: Shield,
      title: "Responsabilité",
      content: (
        <div className="space-y-2">
          <p className="text-muted-foreground">
            MECAI est un service d'aide au diagnostic automobile utilisant
            l'intelligence artificielle.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Les informations fournies sont données à titre indicatif et ne remplacent pas
              l'avis d'un professionnel qualifié. MECAI ne peut être tenu responsable des
              décisions prises sur la base des diagnostics fournis.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Database,
      title: "Données personnelles",
      content: (
        <p className="text-muted-foreground">
          Pour toute information sur le traitement de vos données personnelles,
          veuillez consulter notre{' '}
          <Link to="/confidentialite" className="text-primary hover:underline font-medium">
            Politique de confidentialité
          </Link>.
        </p>
      )
    },
    {
      icon: Mail,
      title: "Contact",
      content: (
        <div className="flex items-center gap-3">
          <a
            href="mailto:contact@mymecai.com"
            className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
          >
            <Mail className="h-4 w-4" />
            contact@mymecai.com
          </a>
        </div>
      )
    },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        {/* Header */}
        <div className="bg-primary/5 border-b">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Mentions Légales</h1>
                <p className="text-muted-foreground">Informations légales sur MECAI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="grid gap-6">
            {sections.map((section, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                      {section.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : Janvier 2026
            </p>
            <div className="mt-4">
              <Logo size="sm" linkTo="/" />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
