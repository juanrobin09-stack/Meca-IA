import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import { Zap, MessageSquare, Euro, CheckCircle2, X, AlertTriangle, Star, Car, Bell, MapPin, ShoppingCart, FileText, Sparkles, Gauge, Shield } from 'lucide-react'
import { PLANS } from '@/config/plans'

// Composant pour le fond blanc animé ultra moderne
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grille animée subtile */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59,130,246,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
        animate={{
          backgroundPosition: ['0px 0px', '60px 60px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Gradient blobs animés */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
          top: '-20%',
          right: '-15%',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)',
          bottom: '0%',
          left: '-10%',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 60%)',
          top: '30%',
          left: '40%',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Lignes flottantes décoratives */}
      <motion.div
        className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent"
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scaleX: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Points flottants */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-blue-400/30 rounded-full"
          style={{
            top: `${15 + i * 10}%`,
            left: `${5 + i * 12}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Cercles décoratifs animés */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 border border-blue-100 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-32 left-16 w-24 h-24 border border-indigo-100 rounded-full"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
    </div>
  )
}

export default function Landing() {
  return (
    <PageTransition>
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400">Connexion</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Ultra moderne */}
      <section className="relative min-h-[90vh] md:min-h-[85vh] flex items-center">
        <AnimatedBackground />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge animé */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                Diagnostic auto intelligent
              </span>
            </motion.div>

            {/* Titre principal avec animation lettre par lettre effet */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-gray-900 dark:text-white">
                Ton expert auto
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                propulsé par l'IA
              </span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed px-4"
            >
              Décris ton problème en 30 secondes, obtiens un diagnostic complet
              avec estimation des coûts. <span className="text-gray-900 dark:text-white font-medium">Plus besoin de stresser.</span>
            </motion.p>

            {/* CTA avec effet glow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="lg"
                    className="text-base px-8 h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all rounded-xl"
                  >
                    Essayer gratuitement
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </Button>
                </motion.div>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                2 diagnostics offerts • Sans CB
              </div>
            </motion.div>

            {/* Stats avec animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-md sm:max-w-lg mx-auto"
            >
              {[
                { value: '2 min', label: 'par diagnostic' },
                { value: '200€+', label: "d'économies" },
                { value: '24/7', label: 'disponible' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center p-3 sm:p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Dégradé de transition vers la section suivante */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none" />
      </section>

      {/* Pourquoi MecaIA */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Pourquoi MecaIA ?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              L'IA au service de ta tranquillité automobile
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {[
              { icon: Gauge, title: 'Diagnostic rapide', desc: 'Résultat en 2 minutes avec causes probables', color: 'blue' },
              { icon: Euro, title: 'Prix réels français', desc: 'Estimations basées sur les garages en France', color: 'emerald' },
              { icon: Shield, title: 'Fini les arnaques', desc: 'Détecte les prix gonflés et travaux inutiles', color: 'amber' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center mb-4`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Tout ce dont tu as besoin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Un assistant complet pour gérer ta voiture
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {[
              { icon: MessageSquare, title: "Diagnostic IA", desc: "Décris ton problème, l'IA analyse", color: "blue" },
              { icon: FileText, title: "Analyse de devis", desc: "Vérifie si ton devis est honnête", color: "emerald" },
              { icon: Car, title: "Mes véhicules", desc: "Enregistre tes voitures", premium: true, color: "violet" },
              { icon: Bell, title: "Rappels entretien", desc: "Ne rate plus tes révisions", premium: true, color: "amber" },
              { icon: MapPin, title: "Trouver un garage", desc: "Garages de confiance près de toi", color: "rose" },
              { icon: ShoppingCart, title: "Comparer les pièces", desc: "Meilleurs prix Oscaro, Yakarouler", color: "cyan" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-default"
              >
                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center shrink-0`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{feature.title}</h3>
                    {feature.premium && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 border-0">Premium</Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Simple comme bonjour
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Décris ton souci', desc: '"Ma voiture fait un bruit au freinage"' },
              { step: '2', title: "L'IA analyse", desc: 'Questions ciblées pour affiner le diagnostic' },
              { step: '3', title: 'Diagnostic complet', desc: 'Cause, urgence, prix, faisable soi-même ?' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {item.step}
                </motion.div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Tarifs transparents
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Commence gratuitement, upgrade si tu veux plus
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Gratuit */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="relative h-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors bg-white dark:bg-gray-900">
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
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                    {PLANS.free.notIncluded.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                        <X className="h-4 w-4 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="relative h-full border-2 border-blue-500 shadow-xl shadow-blue-500/10 bg-white dark:bg-gray-900">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 hover:bg-blue-600 shadow-lg">
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
                  <div className="text-3xl font-bold">9,99€<span className="text-base font-normal text-gray-500">/mois</span></div>
                  <CardDescription>Pour les passionnés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {PLANS.premium.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Ou 89€/an (2 mois offerts)
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 sm:py-10 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-100 dark:border-amber-900">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 sm:gap-4 max-w-3xl mx-auto">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
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
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <Link to="/mentions-legales" className="hover:text-gray-900 dark:hover:text-white transition-colors">Mentions légales</Link>
              <Link to="/cgu" className="hover:text-gray-900 dark:hover:text-white transition-colors">CGU</Link>
              <Link to="/confidentialite" className="hover:text-gray-900 dark:hover:text-white transition-colors">Confidentialité</Link>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              © {new Date().getFullYear()} MecaIA
            </p>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  )
}
