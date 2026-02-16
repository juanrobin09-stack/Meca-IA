import { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserLimits } from '@/hooks/useUserLimits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { Tooltip } from '@/components/ui/tooltip'
import Logo from '@/components/Logo'
import PremiumBadge from '@/components/PremiumBadge'
import {
  Home,
  History,
  User,
  LogOut,
  Sparkles,
  FileText,
  MapPin,
  ShoppingCart,
  HelpCircle,
  Car,
  Video,
  MessageCircle,
  Settings,
  Menu,
  X,
  Mic,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSoundEffects } from '@/hooks/useSoundEffects'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortLabel?: string
  tier?: 'premium'
  mobileShow?: boolean
}

const navItems: NavItem[] = [
  { href: '/app', icon: Home, label: 'Accueil', shortLabel: 'Accueil', mobileShow: true },
  { href: '/app/mechanic-chat', icon: MessageCircle, label: 'Chat Mécanicien', shortLabel: 'Chat', mobileShow: true },
  { href: '/app/analyser-devis', icon: FileText, label: 'Scanner un Devis', shortLabel: 'Devis', mobileShow: true },
  { href: '/app/diagnostic-video', icon: Video, label: 'Diagnostic Vidéo', shortLabel: 'Vidéo', tier: 'premium' },
  { href: '/app/sound-scan', icon: Mic, label: 'SoundScan', shortLabel: 'Son', tier: 'premium' },
  { href: '/app/vehicules', icon: Car, label: 'Mes Véhicules', shortLabel: 'Auto', mobileShow: true },
  { href: '/app/garages', icon: MapPin, label: 'Trouver un Garage', shortLabel: 'Garages' },
  { href: '/app/pieces', icon: ShoppingCart, label: 'Pièces Auto', shortLabel: 'Pièces' },
  { href: '/app/history', icon: History, label: 'Historique', shortLabel: 'Historique' },
  { href: '/app/settings', icon: Settings, label: 'Paramètres', shortLabel: 'Param.' },
  { href: '/app/account', icon: User, label: 'Mon Compte', shortLabel: 'Compte' },
]

// Items shown in mobile bottom nav (4 items + menu button)
// Accueil, Chat, Devis, Auto
const mobileNavItems = [
  navItems.find(item => item.href === '/app')!,
  navItems.find(item => item.href === '/app/mechanic-chat')!,
  navItems.find(item => item.href === '/app/analyser-devis')!,
  navItems.find(item => item.href === '/app/vehicules')!,
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  useSubscription(profile) // Keep for any side effects
  const userLimits = useUserLimits()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { playClick, playNavigate } = useSoundEffects()

  // Note: User limits are now managed globally via context
  // No need to refresh on route change - the context handles auto-refresh

  const handleMenuDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close menu if dragged > 100px to the right or with enough velocity
    if (info.offset.x > 100 || info.velocity.x > 500) {
      setMobileMenuOpen(false)
    }
  }, [])

  async function handleSignOut() {
    setMobileMenuOpen(false)
    await signOut()
    navigate('/')
  }

  function handleNavClick(href: string, isLocked: boolean) {
    playNavigate()
    setMobileMenuOpen(false)
    if (isLocked) {
      navigate('/pricing')
    } else {
      navigate(href)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/10 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <Logo size="sm" linkTo="/app" />
          </div>

          {/* Status Badge */}
          <div className="px-4 py-4">
            {userLimits.isPremium ? (
              <PremiumBadge className="w-full justify-center py-1.5" />
            ) : (
              <Tooltip content="Passe Premium pour des diagnostics illimites !">
                <Badge variant="secondary" className="w-full justify-center py-1 cursor-help bg-white/5 border border-white/10 text-slate-300">
                  Gratuit: {Math.max(0, userLimits.diagnosticsLimit - userLimits.diagnosticsThisMonth)}/2 restants
                  <HelpCircle className="h-3 w-3 ml-1" />
                </Badge>
              </Tooltip>
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              const isLocked = item.tier === 'premium' && !userLimits.isPremium

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Link
                    to={isLocked ? '/pricing' : item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-violet-600/20 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-violet-500/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                      isLocked && 'opacity-50'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive && 'text-violet-400')} />
                    <span className="flex-1">{item.label}</span>
                    {item.tier === 'premium' && !userLimits.isPremium && (
                      <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0">
                        Premium
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Upgrade CTA for free users */}
          {!userLimits.isPremium && (
            <div className="px-3 pb-2">
              <Link to="/pricing">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.45)] transition-shadow duration-300 border-0">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Passer Premium
                </Button>
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-500 hover:text-slate-300 hover:bg-white/5"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav - 4 items + Menu button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => playNavigate()}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] active:bg-white/5 transition-colors',
                  isActive ? 'text-violet-400' : 'text-slate-500'
                )}
              >
                <item.icon className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[11px] font-medium leading-tight text-center',
                  isActive && 'text-violet-400'
                )}>
                  {item.shortLabel}
                </span>
              </Link>
            )
          })}

          {/* Menu Button */}
          <button
            onClick={() => { playClick(); setMobileMenuOpen(true) }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] active:bg-white/5 transition-colors',
              mobileMenuOpen ? 'text-violet-400' : 'text-slate-500'
            )}
          >
            <Menu className="h-6 w-6" />
            <span className="text-[11px] font-medium leading-tight text-center">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Full Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-over Menu (swipe right to close) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.4 }}
              onDragEnd={handleMenuDragEnd}
              className="md:hidden fixed inset-y-0 right-0 w-[85%] max-w-sm bg-slate-950/95 backdrop-blur-xl border-l border-white/10 z-[70] shadow-2xl shadow-violet-950/20 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Logo size="sm" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 text-slate-400"
                    aria-label="Fermer le menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-4 py-4">
                {userLimits.isPremium ? (
                  <PremiumBadge className="w-full justify-center py-2" />
                ) : (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full justify-center py-2 text-sm bg-white/5 border border-white/10 text-slate-300">
                      Gratuit: {Math.max(0, userLimits.diagnosticsLimit - userLimits.diagnosticsThisMonth)}/2 restants
                    </Badge>
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.45)] transition-shadow duration-300 border-0"
                      onClick={() => handleNavClick('/pricing', false)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Passer Premium - 9,99€/mois
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-white/10" />

              {/* Navigation - Scrollable (excluding items already in bottom nav) */}
              <nav className="flex-1 overflow-y-auto py-2">
                {navItems
                  .filter(item => !mobileNavItems.some(m => m.href === item.href))
                  .map((item) => {
                    const isActive = location.pathname === item.href
                    const isLocked = item.tier === 'premium' && !userLimits.isPremium

                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavClick(item.href, isLocked)}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3.5 w-full text-left transition-all duration-200 min-h-[56px]',
                          isActive
                            ? 'bg-violet-600/15 text-violet-300 border-r-4 border-violet-500 shadow-[inset_0_0_20px_rgba(139,92,246,0.08)]'
                            : 'text-slate-300 hover:bg-white/5 hover:text-slate-100',
                          isLocked && 'opacity-50'
                        )}
                      >
                        <item.icon className={cn(
                          'h-6 w-6 shrink-0',
                          isActive && 'text-violet-400'
                        )} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.tier === 'premium' && !userLimits.isPremium && (
                          <Badge className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[10px] px-2 border-0">
                            Premium
                          </Badge>
                        )}
                      </button>
                    )
                  })}
              </nav>

              {/* Footer - Logout */}
              <div className="border-t border-white/10 p-4 pb-safe">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-500 hover:text-slate-300 hover:bg-white/5 h-12"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Déconnexion
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
