import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserLimits } from '@/hooks/useUserLimits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DarkModeToggle } from '@/components/DarkModeToggle'
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
  TrendingUp,
  MessageCircle,
  Settings,
  Menu,
  X,
  Microscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  { href: '/app/mechanic-chat', icon: MessageCircle, label: 'Chat Mécanicien 24/7', shortLabel: 'Chat', mobileShow: true },
  { href: '/app/diagnostic-pro', icon: Microscope, label: 'Diagnostic PRO', shortLabel: 'Diagnostic' }, // 2 free/month
  { href: '/app/analyser-devis', icon: FileText, label: 'Analyser un devis', shortLabel: 'Devis' },
  { href: '/app/diagnostic-video', icon: Video, label: 'Diagnostic vidéo', shortLabel: 'Vidéo', tier: 'premium' },
  { href: '/app/prevision-pannes', icon: TrendingUp, label: 'Prévision pannes', shortLabel: 'Prévision', tier: 'premium' },
  { href: '/app/vehicules', icon: Car, label: 'Mes véhicules', shortLabel: 'Véhicules', mobileShow: true },
  { href: '/app/garages', icon: MapPin, label: 'Trouver un garage', shortLabel: 'Garages', mobileShow: true },
  { href: '/app/pieces', icon: ShoppingCart, label: 'Chercher une pièce', shortLabel: 'Pièces' },
  { href: '/app/history', icon: History, label: 'Historique', shortLabel: 'Historique' },
  { href: '/app/settings', icon: Settings, label: 'Paramètres', shortLabel: 'Paramètres' },
  { href: '/app/account', icon: User, label: 'Mon compte', shortLabel: 'Compte' },
]

// Items shown in mobile bottom nav (4 items + menu button)
// Accueil, Chat Mécanicien, Garages, Véhicules
const mobileNavItems = [
  navItems.find(item => item.href === '/app')!,
  navItems.find(item => item.href === '/app/mechanic-chat')!,
  navItems.find(item => item.href === '/app/garages')!,
  navItems.find(item => item.href === '/app/vehicules')!,
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  useSubscription(profile) // Keep for any side effects
  const userLimits = useUserLimits()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Note: User limits are now managed globally via context
  // No need to refresh on route change - the context handles auto-refresh

  async function handleSignOut() {
    setMobileMenuOpen(false)
    await signOut()
    navigate('/')
  }

  function handleNavClick(href: string, isLocked: boolean) {
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Logo size="sm" linkTo="/app" />
            <DarkModeToggle />
          </div>

          {/* Status Badge */}
          <div className="px-4 py-4">
            {userLimits.isPremium ? (
              <PremiumBadge className="w-full justify-center py-1.5" />
            ) : (
              <Tooltip content="Passe Premium pour des diagnostics illimites !">
                <Badge variant="secondary" className="w-full justify-center py-1 cursor-help">
                  Gratuit: {Math.max(0, userLimits.diagnosticsLimit - userLimits.diagnosticsThisMonth)}/2 restants
                  <HelpCircle className="h-3 w-3 ml-1" />
                </Badge>
              </Tooltip>
            )}
          </div>

          <Separator />

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
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      isLocked && 'opacity-60'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.tier === 'premium' && !userLimits.isPremium && (
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
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
                <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Passer Premium
                </Button>
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav - 4 items + Menu button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t z-50 pb-safe">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] active:bg-muted/50 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[11px] font-medium leading-tight text-center',
                  isActive && 'text-primary'
                )}>
                  {item.shortLabel}
                </span>
              </Link>
            )
          })}

          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] active:bg-muted/50 transition-colors',
              mobileMenuOpen ? 'text-primary' : 'text-muted-foreground'
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
              className="md:hidden fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-over Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 right-0 w-[85%] max-w-sm bg-card z-[70] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Logo size="sm" />
                <div className="flex items-center gap-2">
                  <DarkModeToggle />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-muted"
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
                    <Badge variant="secondary" className="w-full justify-center py-2 text-sm">
                      Gratuit: {Math.max(0, userLimits.diagnosticsLimit - userLimits.diagnosticsThisMonth)}/2 restants
                    </Badge>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600"
                      onClick={() => handleNavClick('/pricing', false)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Passer Premium - 9,99€/mois
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

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
                          'flex items-center gap-4 px-4 py-3.5 w-full text-left transition-colors min-h-[56px]',
                          isActive
                            ? 'bg-primary/10 text-primary border-r-4 border-primary'
                            : 'text-foreground hover:bg-muted',
                          isLocked && 'opacity-60'
                        )}
                      >
                        <item.icon className={cn(
                          'h-6 w-6 shrink-0',
                          isActive && 'text-primary'
                        )} />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.tier === 'premium' && !userLimits.isPremium && (
                          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] px-2">
                            Premium
                          </Badge>
                        )}
                      </button>
                    )
                  })}
              </nav>

              {/* Footer - Logout */}
              <div className="border-t p-4 pb-safe">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground h-12"
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
