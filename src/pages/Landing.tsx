import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Zap, MessageSquare, Euro, CheckCircle2 } from 'lucide-react'

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
            2 diagnostics gratuits par mois
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

      {/* How it works */}
      <section className="py-20">
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
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tarifs simples
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <Card>
              <CardHeader>
                <CardTitle>Gratuit</CardTitle>
                <div className="text-3xl font-bold">0€</div>
                <CardDescription>Pour tester</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">2 diagnostics/mois</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Historique 30 jours</span>
                  </li>
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full mt-6">
                    Essayer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-primary ring-2 ring-primary">
              <CardHeader>
                <div className="text-xs font-semibold text-primary mb-2">POPULAIRE</div>
                <CardTitle>Premium</CardTitle>
                <div className="text-3xl font-bold">9.99€<span className="text-base font-normal text-muted-foreground">/mois</span></div>
                <CardDescription>Pour les passionnés</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Diagnostics illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Historique permanent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>
                <Link to="/signup">
                  <Button className="w-full mt-6">
                    Commencer
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Ou 89€/an (2 mois offerts)
                </p>
              </CardContent>
            </Card>

            {/* Pay per use */}
            <Card>
              <CardHeader>
                <CardTitle>À l'unité</CardTitle>
                <div className="text-3xl font-bold">2.99€</div>
                <CardDescription>Paiement unique</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">1 diagnostic</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Pas d'abonnement</span>
                  </li>
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full mt-6">
                    Acheter
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-foreground transition-colors">CGU</a>
              <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="mailto:contact@mecaia.fr" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 MecaIA
            </p>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  )
}
