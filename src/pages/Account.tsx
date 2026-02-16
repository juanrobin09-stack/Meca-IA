import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import PageTransition from '@/components/PageTransition'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSubscription } from '@/hooks/useSubscription'
import { createCheckoutSession, getCustomerPortalUrl, STRIPE_PRICES } from '@/lib/stripe'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, ExternalLink, Trash2, CheckCircle2, RefreshCw, Key, Eye, EyeOff, Pencil, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Account() {
  useDocumentTitle('Mon compte')
  const navigate = useNavigate()
  const { user, profile, deleteAccount, updatePassword, updateProfile } = useAuth()
  const { isPremium, diagnosticsUsed, diagnosticsRemaining } = useSubscription(profile)

  const [loading, setLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Display name edit state
  const [editingName, setEditingName] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState(profile?.display_name || '')
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return

    setLoading('portal')
    try {
      const url = await getCustomerPortalUrl(profile.stripe_customer_id)
      window.location.href = url
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Erreur lors de l\'ouverture du portail')
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
      toast.error('Erreur lors de la suppression du compte')
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

  async function handleChangePassword() {
    setPasswordMessage(null)

    // Validation
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }

    setLoading('password')

    try {
      await updatePassword(newPassword)
      setPasswordMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès !' })
      // Reset fields
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors du changement' })
    } finally {
      setLoading(null)
    }
  }

  async function handleSaveDisplayName() {
    const trimmedName = displayNameInput.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setNameMessage({ type: 'error', text: 'Le prénom doit contenir au moins 2 caractères' })
      return
    }

    setLoading('name')
    setNameMessage(null)

    try {
      await updateProfile({ display_name: trimmedName })
      setNameMessage({ type: 'success', text: 'Prénom mis à jour !' })
      setEditingName(false)
    } catch (error) {
      console.error('Name update error:', error)
      setNameMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    } finally {
      setLoading(null)
    }
  }

  function handleCancelEditName() {
    setEditingName(false)
    setDisplayNameInput(profile?.display_name || '')
    setNameMessage(null)
  }

  function handleStartEditName() {
    setEditingName(true)
    setDisplayNameInput(profile?.display_name || '')
    setNameMessage(null)
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-gray-950 to-gray-950">
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
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prénom</p>
                {editingName ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="Ton prénom"
                        className="max-w-[200px]"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSaveDisplayName}
                        disabled={loading === 'name'}
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        {loading === 'name' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEditName}
                        disabled={loading === 'name'}
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {nameMessage && (
                      <p className={`text-xs ${nameMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {nameMessage.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {profile?.display_name || <span className="text-muted-foreground italic">Non renseigné</span>}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleStartEditName}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
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
                      ✨ Premium
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
                        ? 'bg-green-100 bg-green-950 dark:text-green-300'
                        : 'bg-red-100 bg-red-950 dark:text-red-300'
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

          {/* Change Password */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Modifier mon mot de passe
              </CardTitle>
              <CardDescription>
                Change ton mot de passe pour sécuriser ton compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-100 bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-100 bg-red-950 dark:text-red-300'
                }`}>
                  {passwordMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 inline mr-2" />}
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={loading !== null || !newPassword || !confirmPassword}
              >
                {loading === 'password' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Changer le mot de passe
              </Button>
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
    </PageTransition>
  )
}
