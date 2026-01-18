import PageTransition from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Laptop, UserCheck, AlertTriangle, CreditCard, XCircle, RefreshCw, Scale, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { Badge } from '@/components/ui/badge'

export default function CGU() {
  const sections = [
    {
      icon: CheckCircle2,
      title: "Acceptation des conditions",
      content: (
        <p className="text-muted-foreground">
          En utilisant MECAI, vous acceptez sans réserve les présentes
          conditions générales d'utilisation. Si vous n'acceptez pas ces
          conditions, veuillez ne pas utiliser notre service.
        </p>
      )
    },
    {
      icon: Laptop,
      title: "Description du service",
      content: (
        <div className="space-y-2">
          <p className="text-muted-foreground">
            MECAI est un service en ligne proposant des diagnostics automobiles
            assistés par intelligence artificielle.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Le service permet aux utilisateurs de décrire un problème automobile
              et d'obtenir une analyse probable des causes et solutions.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: UserCheck,
      title: "Inscription et compte",
      content: (
        <p className="text-muted-foreground">
          L'utilisation du service nécessite la création d'un compte. Vous
          vous engagez à fournir des informations exactes et à maintenir la
          confidentialité de vos identifiants de connexion.
        </p>
      )
    },
    {
      icon: FileText,
      title: "Utilisation du service",
      content: (
        <div className="space-y-3">
          <p className="text-muted-foreground">Vous vous engagez à :</p>
          <div className="grid gap-2">
            {[
              "Utiliser le service conformément à sa destination",
              "Ne pas tenter de contourner les limitations techniques",
              "Ne pas utiliser le service à des fins illégales",
              "Respecter les droits de propriété intellectuelle"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: AlertTriangle,
      title: "Limitation de responsabilité",
      badge: "Important",
      content: (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-amber-800 dark:text-amber-200">
            MECAI fournit des diagnostics à titre informatif uniquement. Ces diagnostics
            ne remplacent en aucun cas l'expertise d'un mécanicien professionnel.
            MECAI décline toute responsabilité pour les dommages résultant de
            l'utilisation des diagnostics fournis.
          </p>
        </div>
      )
    },
    {
      icon: CreditCard,
      title: "Tarification",
      content: (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="font-semibold">Gratuit</p>
            <p className="text-2xl font-bold text-primary">0€</p>
            <p className="text-xs text-muted-foreground">2 diagnostics/mois</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 text-center border-2 border-primary">
            <p className="font-semibold">Premium</p>
            <p className="text-2xl font-bold text-primary">9,99€</p>
            <p className="text-xs text-muted-foreground">/mois - illimité</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="font-semibold">À l'unité</p>
            <p className="text-2xl font-bold text-primary">2,99€</p>
            <p className="text-xs text-muted-foreground">par diagnostic</p>
          </div>
        </div>
      )
    },
    {
      icon: XCircle,
      title: "Résiliation",
      content: (
        <p className="text-muted-foreground">
          Vous pouvez résilier votre compte à tout moment depuis les paramètres
          de votre compte. Les abonnements sont résiliables sans frais. Aucun
          remboursement ne sera effectué pour la période en cours.
        </p>
      )
    },
    {
      icon: RefreshCw,
      title: "Modification des CGU",
      content: (
        <p className="text-muted-foreground">
          MECAI se réserve le droit de modifier les présentes conditions à
          tout moment. Les utilisateurs seront informés des modifications
          significatives par email.
        </p>
      )
    },
    {
      icon: Scale,
      title: "Droit applicable",
      content: (
        <p className="text-muted-foreground">
          Les présentes CGU sont régies par le droit français. En cas de litige,
          les tribunaux français seront seuls compétents.
        </p>
      )
    },
    {
      icon: Mail,
      title: "Contact",
      content: (
        <a
          href="mailto:contact@mymecai.com"
          className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
        >
          <Mail className="h-4 w-4" />
          contact@mymecai.com
        </a>
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
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
                <p className="text-muted-foreground">Les règles d'utilisation de MECAI</p>
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
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        {'badge' in section && section.badge && (
                          <Badge variant="destructive" className="text-xs">{section.badge}</Badge>
                        )}
                      </div>
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
