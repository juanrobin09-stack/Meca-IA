import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTikTokTracking } from '@/hooks/useTikTokTracking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/Logo'
import PageTransition from '@/components/PageTransition'
import {
  Sparkles,
  FileText,
  Video,
  MessageCircle,
  Mic,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Floating Particles
// ---------------------------------------------------------------------------
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
        opacity: Math.random() * 0.4 + 0.1,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background:
              p.id % 3 === 0
                ? 'rgba(124,58,237,0.6)'
                : p.id % 3 === 1
                  ? 'rgba(168,85,247,0.5)'
                  : 'rgba(6,182,212,0.5)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.id % 2 === 0 ? 10 : -10, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Animated Gradient Mesh Background
// ---------------------------------------------------------------------------
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient mesh */}
      <div className="gradient-mesh absolute inset-0" />

      {/* Animated grid lines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(124,58,237,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '80px 80px'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Primary violet blob - top right */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)',
          top: '-25%',
          right: '-10%',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Secondary purple blob - bottom left */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)',
          bottom: '-10%',
          left: '-15%',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cyan accent blob - center */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 60%)',
          top: '25%',
          left: '35%',
        }}
        animate={{
          x: [0, 70, 0],
          y: [0, -60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Extra violet glow - top left */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 60%)',
          top: '10%',
          left: '5%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Decorative animated gradient lines */}
      <motion.div
        className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
        animate={{ opacity: [0.2, 0.5, 0.2], scaleX: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent"
        animate={{ opacity: [0.15, 0.4, 0.15], scaleX: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Subtle animated rings */}
      <motion.div
        className="absolute top-20 right-24 w-40 h-40 border border-violet-500/10 rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-40 left-20 w-28 h-28 border border-cyan-500/10 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section entry animation variants
// ---------------------------------------------------------------------------
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
} as const

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} as const

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5 },
  },
} as const

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function Landing() {
  const { trackViewContent } = useTikTokTracking()

  useEffect(() => {
    trackViewContent('MECAI Landing Page', 'landing_page')
  }, [trackViewContent])

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#09090b] text-white selection:bg-violet-500/30">
        {/* ------------------------------------------------------------------ */}
        {/* HEADER                                                              */}
        {/* ------------------------------------------------------------------ */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090b]/70 backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="sm:hidden">
              <Logo size="sm" variant="dark" />
            </div>
            <div className="hidden sm:block">
              <Logo size="md" variant="dark" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-9 px-3 sm:h-10 sm:px-4"
                >
                  Connexion
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-600/25 h-9 px-4 sm:h-10 sm:px-5 rounded-xl border-0"
                >
                  S'inscrire
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* HERO                                                                */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          <AnimatedBackground />

          <div className="relative container mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="max-w-4xl mx-auto text-center">
              {/* Sparkle badge */}
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium backdrop-blur-sm">
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </motion.span>
                  Diagnostic auto intelligent
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] mb-7"
              >
                <span className="block text-white">L'IA qui comprend</span>
                <span className="block gradient-primary-text mt-1">ta voiture</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed px-4"
              >
                Diagnostic instantane, detection d'arnaques sur devis et conseils
                personnalises.{' '}
                <span className="text-white font-medium">Ton mecanicien IA, 24h/24.</span>
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 px-4"
              >
                <Link to="/signup" className="w-full sm:w-auto">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 h-14 sm:h-16 bg-gradient-to-r from-violet-600 via-violet-500 to-purple-500 hover:from-violet-500 hover:via-violet-400 hover:to-purple-400 text-white shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/40 transition-all rounded-2xl border-0 font-semibold"
                    >
                      Essayer gratuitement
                      <motion.span
                        className="ml-2 inline-block"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </Button>
                  </motion.div>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Gratuit, sans carte bancaire
                </div>
              </motion.div>

              {/* Social proof stats */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-16 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl mx-auto"
              >
                {[
                  { value: '12,847', label: 'diagnostics realises' },
                  { value: '342\u20AC', label: 'economises en moyenne' },
                  { value: '24/7', label: 'disponible' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center p-4 sm:p-5 rounded-2xl glass-card"
                    whileHover={{ scale: 1.05, y: -3 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Fade-out into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FEATURES                                                            */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              className="text-center mb-16"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/15 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Fonctionnalites
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white">
                Tout ce dont tu as{' '}
                <span className="gradient-primary-text">besoin</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Quatre outils puissants pour ne plus jamais se faire avoir au garage
              </p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {[
                {
                  icon: FileText,
                  title: 'Scan de Devis',
                  desc: 'Scanne ton devis, detecte les arnaques. Notre IA compare les prix et identifie les lignes suspectes.',
                  gradient: 'from-violet-600 to-purple-600',
                  glow: 'violet',
                },
                {
                  icon: Video,
                  title: 'Diagnostic Video',
                  desc: "Filme le probleme, l'IA diagnostique. Analyse visuelle en temps reel de l'etat de ta voiture.",
                  gradient: 'from-cyan-600 to-blue-600',
                  glow: 'cyan',
                },
                {
                  icon: MessageCircle,
                  title: 'Chat Mecanicien',
                  desc: 'Parle a Alex, ton mecanicien IA. Des reponses precises adaptees a ton vehicule, jour et nuit.',
                  gradient: 'from-violet-500 to-fuchsia-500',
                  glow: 'violet',
                },
                {
                  icon: Mic,
                  title: 'SoundScan',
                  desc: 'Enregistre le bruit, identifie la panne. Analyse audio intelligente pour detecter les anomalies.',
                  gradient: 'from-cyan-500 to-teal-500',
                  glow: 'cyan',
                  isNew: true,
                },
              ].map((feature, i) => (
                <motion.div key={i} variants={cardVariant}>
                  <motion.div
                    className="glass-card glass-card-hover relative group rounded-2xl p-6 sm:p-8 h-full cursor-default"
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {feature.isNew && (
                      <Badge className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 text-xs">
                        Nouveau
                      </Badge>
                    )}
                    <div
                      className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg ${feature.glow === 'violet' ? 'shadow-violet-600/25' : 'shadow-cyan-600/25'} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* HOW IT WORKS                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-24 sm:py-32">
          {/* Subtle background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />

          <div className="relative container mx-auto px-4 sm:px-6">
            <motion.div
              className="text-center mb-16"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/15 px-4 py-1.5 text-sm">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Simple et rapide
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white">
                Comment ca{' '}
                <span className="gradient-primary-text">marche</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Trois etapes, zero prise de tete
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              {[
                {
                  step: '1',
                  title: 'Decris ou montre ton probleme',
                  desc: 'Texte, photo, video ou meme un enregistrement audio du bruit suspect.',
                },
                {
                  step: '2',
                  title: "L'IA analyse en temps reel",
                  desc: "Notre modele specialise croise des milliers de cas pour identifier la panne.",
                },
                {
                  step: '3',
                  title: 'Diagnostic complet + prix estimes',
                  desc: 'Causes, urgence, estimation du cout et recommandation de garages.',
                },
              ].map((item, i) => (
                <motion.div key={i} variants={cardVariant} className="text-center relative">
                  {/* Connector line between steps on desktop */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-60px)] h-px bg-gradient-to-r from-violet-500/30 to-cyan-500/30" />
                  )}

                  <motion.div
                    className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 text-white flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-6 shadow-xl shadow-violet-600/30"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {item.step}
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                  </motion.div>

                  <h3 className="font-semibold text-lg sm:text-xl mb-3 text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PRICING                                                             */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              className="text-center mb-16"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/15 px-4 py-1.5 text-sm">
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Tarifs
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-white">
                Tarifs{' '}
                <span className="gradient-primary-text">transparents</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Commence gratuitement, passe Premium quand tu es pret
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto items-start">
              {/* Premium plan - FIRST, highlighted */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative order-first"
              >
                {/* Gradient glow behind card */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-500 opacity-70 blur-[1px]" />
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-500 opacity-20 blur-lg" />

                <Card className="relative border-0 bg-[#0f0f14] rounded-2xl shadow-2xl shadow-violet-600/10 overflow-hidden">
                  {/* Populaire badge */}
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-0 z-10">
                    <Badge className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 border-0 shadow-lg shadow-violet-600/30 text-white px-4 py-1 rounded-b-xl rounded-t-none">
                      <Star className="h-3 w-3 mr-1.5 fill-current" />
                      Recommande
                    </Badge>
                  </div>

                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

                  <CardHeader className="pb-4 pt-10">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <Star className="h-5 w-5 text-white fill-white/30" />
                      </div>
                      Premium
                    </CardTitle>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-bold text-white">9,99€</span>
                      <span className="text-base font-normal text-gray-500">/mois</span>
                    </div>
                    <CardDescription className="text-gray-400 mt-1">
                      Tout illimite, zero limite
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ul className="space-y-2.5">
                      {[
                        'Diagnostics Pro illimites',
                        'Chat mecanicien 24/7 illimite',
                        'Analyses de devis illimitees',
                        'Diagnostic video IA',
                        'SoundScan audio',
                        'Vehicules illimites',
                        'Prevision de pannes intelligente',
                        'Support prioritaire',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/signup" className="block">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white shadow-lg shadow-violet-600/25 border-0 font-semibold text-base">
                          Passer Premium
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      Ou{' '}
                      <span className="text-violet-400 font-medium">89€/an</span>{' '}
                      (2 mois offerts)
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Free plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="relative border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.12] transition-all duration-300 rounded-2xl shadow-none">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <div className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-gray-400" />
                      </div>
                      Gratuit
                    </CardTitle>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-bold text-white">0€</span>
                      <span className="text-base font-normal text-gray-500">/mois</span>
                    </div>
                    <CardDescription className="text-gray-500">
                      Pour decouvrir MECAI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ul className="space-y-2.5">
                      {[
                        '2 diagnostics par mois',
                        '10 messages chat/jour',
                        '1 analyse de devis/mois',
                        '1 vehicule enregistre',
                        'Recherche de garages',
                        'Recherche de pieces',
                        'Export PDF',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/signup" className="block">
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white hover:text-white"
                      >
                        Commencer gratuitement
                        <ChevronRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FINAL CTA                                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
                Pret a reprendre le{' '}
                <span className="gradient-primary-text">controle</span> ?
              </h2>
              <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto">
                Rejoins des milliers d'automobilistes qui ne se font plus avoir au garage.
              </p>
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-block"
                >
                  <Button
                    size="lg"
                    className="text-base sm:text-lg px-10 sm:px-12 h-14 sm:h-16 bg-gradient-to-r from-violet-600 via-violet-500 to-purple-500 hover:from-violet-500 hover:via-violet-400 hover:to-purple-400 text-white shadow-2xl shadow-violet-600/30 rounded-2xl border-0 font-semibold"
                  >
                    Essayer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <p className="text-sm text-gray-600 mt-4">
                Gratuit, sans engagement, sans carte bancaire
              </p>
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FOOTER                                                              */}
        {/* ------------------------------------------------------------------ */}
        <footer className="border-t border-white/[0.06] py-10 bg-[#09090b]">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <Logo size="sm" variant="dark" />
              <div className="flex flex-wrap justify-center gap-5 sm:gap-8 text-sm text-gray-500">
                <Link
                  to="/mentions-legales"
                  className="hover:text-white transition-colors duration-200"
                >
                  Mentions legales
                </Link>
                <Link
                  to="/cgu"
                  className="hover:text-white transition-colors duration-200"
                >
                  CGU
                </Link>
                <Link
                  to="/confidentialite"
                  className="hover:text-white transition-colors duration-200"
                >
                  Confidentialite
                </Link>
              </div>
              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} MECAI
              </p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
