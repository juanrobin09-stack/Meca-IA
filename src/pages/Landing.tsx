import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Zap, MessageSquare, Euro, CheckCircle2, X, AlertTriangle, Star, Car, Bell, MapPin, ShoppingCart, FileText, Wrench, Gauge, Shield } from 'lucide-react'
import { PLANS } from '@/config/plans'

export default function Landing() {
  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Moderne et impactant */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/30 dark:via-background dark:to-emerald-950/20" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Wrench className="h-3.5 w-3.5 mr-1.5" />
                Diagnostic auto intelligent
              </Badge>
            </motion.div>

            {/* Titre principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                Ton expert auto
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                propulsé par l'IA
              </span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Décris ton problème en 30 secondes, obtiens un diagnostic complet
              avec estimation des coûts. Plus besoin de stresser avant d'aller au garage.
            </motion.p>

            {/* CTA unique */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/signup">
                <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow">
                  Essayer gratuitement
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                2 diagnostics offerts • Sans CB
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              {[
                { value: '2 min', label: 'par diagnostic' },
                { value: '200€+', label: "d'économies en moyenne" },
                { value: '24/7', label: 'disponible' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pourquoi MecaIA */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi MecaIA ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              L'IA au service de ta tranquillité automobile
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Gauge className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Diagnostic rapide</CardTitle>
                <CardDescription>
                  Résultat en 2 minutes chrono avec causes probables et niveau d'urgence
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <Euro className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Prix réels français</CardTitle>
                <CardDescription>
                  Estimations basées sur les tarifs des garages en France
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Fini les arnaques</CardTitle>
                <CardDescription>
                  Analyse tes devis et détecte les prix gonflés ou travaux inutiles
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un assistant complet pour gérer ta voiture au quotidien
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, title: "Diagnostic IA", desc: "Décris ton problème, l'IA analyse", color: "blue" },
              { icon: FileText, title: "Analyse de devis", desc: "Vérifie si ton devis est honnête", color: "emerald" },
              { icon: Car, title: "Mes véhicules", desc: "Enregistre et suis tes voitures", premium: true, color: "violet" },
              { icon: Bell, title: "Rappels entretien", desc: "Ne rate plus tes révisions", premium: true, color: "amber" },
              { icon: MapPin, title: "Trouver un garage", desc: "Garages de confiance près de toi", color: "rose" },
              { icon: ShoppingCart, title: "Comparer les pièces", desc: "Meilleurs prix Oscaro, Yakarouler", color: "cyan" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-muted/50 hover:bg-muted transition-all hover:scale-[1.02]"
              >
                <div className={`h-11 w-11 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{feature.title}</h3>
                    {feature.premium && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple comme bonjour
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Décris ton souci', desc: '"Ma voiture fait un bruit bizarre au freinage"' },
              { step: '2', title: "L'IA analyse", desc: 'Questions ciblées pour affiner le diagnostic' },
              { step: '3', title: 'Diagnostic complet', desc: 'Cause, urgence, prix estimé, faisable soi-même ?' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/25">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tarifs transparents
            </h2>
            <p className="text-muted-foreground">
              Commence gratuitement, upgrade si tu veux plus
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Gratuit */}
            <Card className="relative border-2 hover:border-gray-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-gray-600" />
                  </div>
                  Gratuit
                </CardTitle>
                <div className="text-3xl font-bold">0€</div>
                <CardDescription>Pour découvrir</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {PLANS.free.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {PLANS.free.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="relative border-2 border-blue-500 shadow-xl shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 hover:bg-blue-600">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  Premium
                </CardTitle>
                <div className="text-3xl font-bold">9,99€<span className="text-base font-normal text-muted-foreground">/mois</span></div>
                <CardDescription>Pour les passionnés</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {PLANS.premium.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Ou 89€/an (2 mois offerts)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-900">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-4 max-w-3xl mx-auto">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-1">
                Avertissement
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                MecaIA fournit des diagnostics à titre informatif. Les résultats ne remplacent pas
                l'avis d'un mécanicien professionnel. En cas de doute, consultez un garage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
              <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MecaIA
            </p>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  )
}
