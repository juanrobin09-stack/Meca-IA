import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSubscription } from '@/hooks/useSubscription'
import { getCustomerPortalUrlByUserId, createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  ExternalLink,
  CreditCard,
  User,
  Bell,
  Shield,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Settings() {
  useDocumentTitle('Paramètres')
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { isPremium, diagnosticsUsed, devisUsed } = useSubscription(profile)

  const [loading, setLoading] = useState<string | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    reminders: false,
  })

  async function handleManageSubscription() {
    if (!user) return

    setLoading('portal')
    try {
      const url = await getCustomerPortalUrlByUserId(user.id)
      window.location.href = url
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'NO_SUBSCRIPTION') {
        navigate('/pricing')
        return
      }
      console.error('Portal error:', error)
      toast.error('Erreur lors de l\'ouverture du portail')
    } finally {
      setLoading(null)
    }
  }

  async function handleUpgrade(priceId: string, isSubscription: boolean) {
    if (!user) return

    setLoading(priceId)
    try {
      await createCheckoutSession(priceId, isSubscription, user.id)
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Erreur lors du paiement')
    } finally {
      setLoading(null)
    }
  }

  function getSubscriptionStatus() {
    if (!isPremium) {
      return {
        status: 'Gratuit',
        statusColor: 'text-muted-foreground',
        description: `${diagnosticsUsed}/2 diagnostics utilisés ce mois`,
      }
    }

    return {
      status: 'Actif',
      statusColor: 'text-green-600',
      description: 'Accès illimité à toutes les fonctionnalités',
    }
  }

  const statusInfo = getSubscriptionStatus()

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-muted-foreground mb-8">
            Gère ton compte et ton abonnement
          </p>

          {/* Section Abonnement */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle>Mon Abonnement</CardTitle>
                </div>
                {isPremium ? (
                  <Badge variant="premium">
                    ✨ Premium
                  </Badge>
                ) : (
                  <Badge variant="secondary">Gratuit</Badge>
                )}
              </div>
              <CardDescription>
                Gère ton plan, annule ou modifie ton abonnement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className={`font-semibold ${statusInfo.statusColor}`}>
                    {statusInfo.status}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {statusInfo.description}
                  </p>
                </div>

                {isPremium ? (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading !== null}
                      className="w-full sm:w-auto"
                    >
                      {loading === 'portal' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Gérer mon abonnement
                    </Button>

                    <div className="p-4 bg-blue-950/30 rounded-lg border border-blue-800">
                      <p className="text-sm text-blue-200 flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          <strong>Portail Stripe :</strong> Tu seras redirigé vers une page sécurisée
                          pour annuler, changer de plan, mettre à jour ta carte ou télécharger tes factures.
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Separator />

                    <h4 className="font-medium">Passer Premium</h4>

                    {/* Monthly */}
                    <Card className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">9,99€/mois</p>
                            <p className="text-sm text-muted-foreground">Tout illimité</p>
                          </div>
                          <Button
                            onClick={() => handleUpgrade(STRIPE_PRICES.PREMIUM_MONTHLY, true)}
                            disabled={loading !== null}
                          >
                            {loading === STRIPE_PRICES.PREMIUM_MONTHLY && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Choisir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Yearly */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">89€/an</p>
                              <Badge variant="success">2 mois offerts</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Tout illimité</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade(STRIPE_PRICES.PREMIUM_YEARLY, true)}
                            disabled={loading !== null}
                          >
                            {loading === STRIPE_PRICES.PREMIUM_YEARLY && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Choisir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Features */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-2">Avantages Premium</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Diagnostics Pro illimités
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Diagnostic vidéo IA
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Analyseur de devis (anti-arnaque)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Prévision de pannes intelligente
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Chat mécanicien 24/7 illimité
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Véhicules illimités
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section Usage */}
          {!isPremium && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Utilisation ce mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Diagnostics Pro</span>
                    <span className="text-sm font-medium">{diagnosticsUsed}/2</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(diagnosticsUsed / 2) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Analyses de devis</span>
                    <span className="text-sm font-medium">{devisUsed}/1</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${devisUsed * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compteurs réinitialisés chaque mois
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Compte */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {profile?.display_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Prénom</p>
                  <p className="font-medium">{profile.display_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Membre depuis</p>
                <p className="font-medium">
                  {profile?.created_at ? formatDate(profile.created_at) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section Notifications */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gère tes préférences de communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emails promotionnels</p>
                  <p className="text-sm text-muted-foreground">
                    Nouveautés et offres spéciales
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rappels d'entretien</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour tes véhicules
                  </p>
                </div>
                <Switch
                  checked={notifications.reminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, reminders: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/app/account')}
              >
                Gérer mon compte
              </Button>
              <p className="text-xs text-muted-foreground">
                Changer de mot de passe, supprimer le compte...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </PageTransition>
  )
}
