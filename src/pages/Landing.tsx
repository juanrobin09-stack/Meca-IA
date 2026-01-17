import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Zap, MessageSquare, Euro, CheckCircle2, X, AlertTriangle, Star, Car, Bell, History, MapPin, ShoppingCart, FileText } from 'lucide-react'
import { PLANS } from '@/config/plans'

export default function Landing() {
  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button>Commencer</Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Ton mécanicien de poche
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Diagnostic auto par IA en 2 minutes.
            <br />
            Décris ton problème, obtiens un diagnostic expert.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8">
                Commencer gratuitement
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            2 diagnostics gratuits par mois • Sans carte bancaire
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi MecaIA ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Réponse instantanée</CardTitle>
                <CardDescription>
                  Diagnostic en 2 min chrono via chat IA
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Simple et intuitif</CardTitle>
                <CardDescription>
                  Décris ton problème en français naturel
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Euro className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Prix français réels</CardTitle>
                <CardDescription>
                  Estimations basées sur garages français
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Toutes les fonctionnalités
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            MecaIA t'accompagne dans tous tes besoins automobiles
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, title: "Diagnostic IA", desc: "Analyse intelligente de tes problèmes auto" },
              { icon: FileText, title: "Analyse de devis", desc: "Vérifie si ton devis garage est honnête" },
              { icon: Car, title: "Gestion véhicules", desc: "Enregistre et suis tes voitures", premium: true },
              { icon: Bell, title: "Rappels entretien", desc: "Ne rate plus tes révisions", premium: true },
              { icon: MapPin, title: "Recherche garages", desc: "Trouve des garages de confiance près de toi" },
              { icon: ShoppingCart, title: "Recherche pièces", desc: "Compare les prix sur Oscaro et Yakarouler" },
              { icon: History, title: "Historique", desc: "Retrouve tous tes diagnostics passés" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{feature.title}</h3>
                    {feature.premium && (
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Décris ton problème</h3>
              <p className="text-muted-foreground text-sm">
                "Ma voiture fait un bruit bizarre" ou "Voyant moteur allumé"
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">L'IA analyse</h3>
              <p className="text-muted-foreground text-sm">
                Questions précises pour comprendre le contexte
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Diagnostic complet</h3>
              <p className="text-muted-foreground text-sm">
                Cause probable, urgence, prix estimé, faisable soi-même ?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Commence gratuitement, upgrade quand tu veux
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <Card className="relative">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle>Gratuit</CardTitle>
                <div className="text-3xl font-bold">0€<span className="text-base font-normal text-muted-foreground">/mois</span></div>
                <CardDescription>Pour découvrir MecaIA</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {PLANS.free.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {PLANS.free.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <X className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full mt-6">
                    Commencer gratuitement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="relative border-2 border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                <Star className="h-3 w-3 mr-1" />
                RECOMMANDÉ
              </Badge>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Premium</CardTitle>
                <div className="text-3xl font-bold">9,99€<span className="text-base font-normal text-muted-foreground">/mois</span></div>
                <CardDescription>Pour les passionnés d'auto</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {PLANS.premium.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className="w-full mt-6">
                    Passer Premium
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ou 89€/an (2 mois offerts)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-4 max-w-3xl mx-auto">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Avertissement important
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                MecaIA est un outil d'aide au diagnostic utilisant l'intelligence artificielle.
                Les informations fournies sont données <strong>à titre indicatif uniquement</strong> et
                ne remplacent en aucun cas l'avis d'un mécanicien professionnel qualifié.
                En cas de doute ou de problème grave, consultez toujours un garage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à diagnostiquer ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Un diagnostic peut t'économiser 200-500€ de réparations inutiles.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
              <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
              <a href="mailto:contact@mecaia.fr" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MecaIA
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">
            MecaIA fournit des diagnostics à titre informatif uniquement et ne remplace pas l'avis d'un professionnel.
          </p>
        </div>
      </footer>
    </div>
    </PageTransition>
  )
}
