import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { createCheckoutSession, getCustomerPortalUrl, STRIPE_PRICES } from '@/lib/stripe'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Sparkles, ExternalLink, Trash2, CheckCircle2, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Account() {
  const navigate = useNavigate()
  const { user, profile, deleteAccount, refreshProfile: _refreshProfile } = useAuth()
  const { isPremium, diagnosticsUsed, diagnosticsRemaining } = useSubscription(profile)

  const [loading, setLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleUpgrade(priceId: string, isSubscription: boolean) {
    if (!user) return

    setLoading(priceId)
    try {
      await createCheckoutSession(priceId, isSubscription, user.id)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur lors du paiement. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return

    setLoading('portal')
    try {
      const url = await getCustomerPortalUrl(profile.stripe_customer_id)
      window.location.href = url
    } catch (error) {
      console.error('Portal error:', error)
      alert('Erreur. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return

    setLoading('delete')
    try {
      await deleteAccount()
      navigate('/')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Erreur lors de la suppression. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  async function handleSyncSubscription() {
    if (!user) return

    setLoading('sync')
    setSyncMessage(null)

    try {
      const response = await fetch('/.netlify/functions/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.status === 'premium') {
          setSyncMessage({ type: 'success', text: 'Abonnement Premium activé ! Rafraîchissement...' })
          // Force reload immediately to get fresh profile data
          setTimeout(() => {
            window.location.href = '/app'  // Redirect to dashboard with full reload
          }, 1000)
        } else {
          setSyncMessage({ type: 'error', text: data.message || 'Aucun abonnement actif trouvé' })
        }
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Erreur de synchronisation' })
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncMessage({ type: 'error', text: 'Erreur de connexion. Réessaie.' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />

      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Mon compte</h1>

          {/* Profile Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informations</CardTitle>
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

          {/* Subscription Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="premium">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tu as accès à tous les diagnostics en illimité.
                  </p>
                  {profile?.stripe_customer_id && (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loading !== null}
                    >
                      {loading === 'portal' && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Gérer mon abonnement
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Gratuit</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSyncSubscription}
                      disabled={loading !== null}
                      className="text-primary"
                    >
                      {loading === 'sync' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Vérifier mon abonnement
                    </Button>
                  </div>

                  {syncMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      syncMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {syncMessage.text}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Tu as utilisé {diagnosticsUsed}/2 diagnostics ce mois-ci.
                    <br />
                    Il te reste {diagnosticsRemaining} diagnostic{diagnosticsRemaining !== 1 ? 's' : ''}.
                  </p>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Passer Premium</h4>

                    {/* Monthly */}
                    <Card className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">9.99€/mois</p>
                            <p className="text-sm text-muted-foreground">Diagnostics illimités</p>
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
                            <p className="text-sm text-muted-foreground">Diagnostics illimités</p>
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
                          Diagnostics illimités
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Historique permanent
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Support prioritaire
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
              <CardDescription>
                Ces actions sont irréversibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer mon compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes tes données seront supprimées définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Pour confirmer, tape <strong>SUPPRIMER</strong> ci-dessous:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="SUPPRIMER"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'SUPPRIMER' || loading === 'delete'}
            >
              {loading === 'delete' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
