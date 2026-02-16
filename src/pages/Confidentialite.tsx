import PageTransition from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Building2, Database, Target, Clock, UserCheck, Cookie, Globe, Lock, Mail, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/Logo'
import { Badge } from '@/components/ui/badge'

export default function Confidentialite() {
  const sections = [
    {
      icon: Building2,
      title: "Responsable du traitement",
      content: (
        <div className="space-y-1">
          <p className="font-semibold text-lg">MECAI</p>
          <p><span className="text-muted-foreground">SIREN :</span> 994 221 653</p>
          <p><span className="text-muted-foreground">Responsable :</span> J.R</p>
          <p><span className="text-muted-foreground">Email :</span> contact@mymecai.com</p>
        </div>
      )
    },
    {
      icon: Database,
      title: "Données collectées",
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "Données d'inscription", desc: "Email, prénom (optionnel)" },
            { label: "Données d'utilisation", desc: "Historique diagnostics, préférences" },
            { label: "Données techniques", desc: "IP, navigateur, appareil" },
            { label: "Données de paiement", desc: "Via Stripe (non stockées)" },
          ].map((item, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: Target,
      title: "Finalités du traitement",
      content: (
        <div className="flex flex-wrap gap-2">
          {[
            "Fournir le service de diagnostic",
            "Gérer votre compte",
            "Améliorer l'IA",
            "Communications service",
            "Sécurité et anti-fraude"
          ].map((item, i) => (
            <Badge key={i} variant="secondary" className="px-3 py-1">
              {item}
            </Badge>
          ))}
        </div>
      )
    },
    {
      icon: Shield,
      title: "Base légale",
      content: (
        <div className="grid gap-2">
          {[
            { type: "Contrat", desc: "Exécution du service" },
            { type: "Consentement", desc: "Cookies non essentiels, newsletters" },
            { type: "Intérêt légitime", desc: "Amélioration du service, sécurité" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
              <Badge variant="outline" className="shrink-0">{item.type}</Badge>
              <span className="text-sm text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: Clock,
      title: "Durée de conservation",
      content: (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">3 ans</p>
            <p className="text-xs text-muted-foreground">après suppression compte</p>
            <p className="text-sm font-medium mt-1">Données compte</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">30j / ∞</p>
            <p className="text-xs text-muted-foreground">gratuit / premium</p>
            <p className="text-sm font-medium mt-1">Historique</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">10 ans</p>
            <p className="text-xs text-muted-foreground">obligation légale</p>
            <p className="text-sm font-medium mt-1">Facturation</p>
          </div>
        </div>
      )
    },
    {
      icon: UserCheck,
      title: "Vos droits RGPD",
      badge: "RGPD",
      content: (
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { right: "Accès", desc: "Obtenir une copie de vos données" },
            { right: "Rectification", desc: "Corriger vos données inexactes" },
            { right: "Effacement", desc: "Demander la suppression" },
            { right: "Portabilité", desc: "Récupérer vos données" },
            { right: "Opposition", desc: "Refuser certains traitements" },
            { right: "Limitation", desc: "Limiter l'utilisation" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-green-900/20 rounded-lg px-3 py-2">
              <Badge className="bg-green-600 shrink-0 mt-0.5">{item.right}</Badge>
              <span className="text-sm text-green-200">{item.desc}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: Cookie,
      title: "Cookies",
      content: (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            MECAI utilise des cookies pour le fonctionnement du site.
            Gérez vos préférences via le bandeau cookies.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="font-medium text-green-200 text-sm">Essentiels</p>
              <p className="text-xs text-green-300">Authentification, préférences</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <p className="font-medium text-blue-200 text-sm">Analytiques</p>
              <p className="text-xs text-blue-300">Avec consentement uniquement</p>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Globe,
      title: "Transferts de données",
      content: (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            Certaines données peuvent être transférées vers des prestataires
            situés hors UE (hébergement Netlify, IA Anthropic). Ces transferts
            sont encadrés par les clauses contractuelles types de la Commission européenne.
          </p>
        </div>
      )
    },
    {
      icon: Lock,
      title: "Sécurité",
      content: (
        <div className="flex flex-wrap gap-2">
          {["Chiffrement SSL/TLS", "Accès restreint", "Sauvegardes", "Audit régulier"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-2">
              <Lock className="h-3 w-3" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      icon: Mail,
      title: "Contact et réclamation",
      content: (
        <div className="space-y-3">
          <a
            href="mailto:contact@mymecai.com"
            className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
          >
            <Mail className="h-4 w-4" />
            contact@mymecai.com
          </a>
          <p className="text-sm text-muted-foreground">
            Vous pouvez également introduire une réclamation auprès de la CNIL :
          </p>
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            www.cnil.fr
            <ExternalLink className="h-3 w-3" />
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
                <p className="text-muted-foreground">Comment nous protégeons vos données</p>
              </div>
            </div>
          </div>
        </div>

        {/* RGPD Badge */}
        <div className="container max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-200">Conforme RGPD</p>
              <p className="text-sm text-green-300">
                Règlement Général sur la Protection des Données (UE) 2016/679
              </p>
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
                          <Badge className="bg-green-600">{section.badge}</Badge>
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
