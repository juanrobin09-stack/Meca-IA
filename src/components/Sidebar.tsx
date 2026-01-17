import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { Tooltip } from '@/components/ui/tooltip'
import Logo from '@/components/Logo'
import {
  Home,
  MessageSquarePlus,
  History,
  User,
  LogOut,
  Sparkles,
  FileText,
  MapPin,
  ShoppingCart,
  HelpCircle,
  Car,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  tier?: 'premium'
}

const navItems: NavItem[] = [
  { href: '/app', icon: Home, label: 'Accueil' },
  { href: '/app/chat', icon: MessageSquarePlus, label: 'Nouveau diagnostic' },
  { href: '/app/analyser-devis', icon: FileText, label: 'Analyser un devis' },
  { href: '/app/vehicules', icon: Car, label: 'Mes vehicules', tier: 'premium' },
  { href: '/app/rappels', icon: Bell, label: 'Rappels entretien', tier: 'premium' },
  { href: '/app/garages', icon: MapPin, label: 'Trouver un garage' },
  { href: '/app/pieces', icon: ShoppingCart, label: 'Chercher une piece' },
  { href: '/app/history', icon: History, label: 'Historique' },
  { href: '/app/account', icon: User, label: 'Mon compte' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { isPremium, diagnosticsRemaining } = useSubscription(profile)

  async function handleSignOut() {
    await signOut()
    navigate('/')
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
            {isPremium ? (
              <Badge variant="premium" className="w-full justify-center py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Tooltip content="Passe Premium pour des diagnostics illimités !">
                <Badge variant="secondary" className="w-full justify-center py-1 cursor-help">
                  Gratuit: {diagnosticsRemaining}/2 restants
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
              const isLocked = item.tier === 'premium' && !isPremium

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
                    {item.tier === 'premium' && !isPremium && (
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                        Premium
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
