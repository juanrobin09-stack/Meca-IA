import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Home,
  MessageSquarePlus,
  History,
  User,
  LogOut,
  Wrench,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/app', icon: Home, label: 'Accueil' },
  { href: '/app/chat', icon: MessageSquarePlus, label: 'Nouveau diagnostic' },
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
          <div className="flex items-center gap-2 h-16 px-6 border-b">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">MecaIA</span>
          </div>

          {/* Status Badge */}
          <div className="px-4 py-4">
            {isPremium ? (
              <Badge variant="premium" className="w-full justify-center py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge variant="secondary" className="w-full justify-center py-1">
                Gratuit: {diagnosticsRemaining}/2 restants
              </Badge>
            )}
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
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
