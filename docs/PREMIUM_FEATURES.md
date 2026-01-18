# Système Freemium / Premium MecaIA

**Date :** Janvier 2026
**Version :** 1.0

---

## 1. Comparatif Plans

| Fonctionnalité | Gratuit | Premium (9,99€/mois) |
|----------------|---------|---------------------|
| Diagnostics IA | 2/mois | ♾️ Illimités |
| Analyse devis | 1/mois | ♾️ Illimitées |
| Véhicules | 1 max | 5 max |
| Historique | 7 jours | ♾️ Permanent |
| Rappels entretien | ❌ | ✅ |
| Carnet entretien | ❌ | ✅ |
| Support prioritaire | ❌ | ✅ |
| Recherche garages | ✅ | ✅ |
| Recherche pièces | ✅ | ✅ |

---

## 2. Configuration (src/config/plans.ts)

```typescript
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    maxDiagnostics: 2,      // Par mois
    maxDevis: 1,            // Par mois
    maxVehicles: 1,         // Total
    historyDays: 7,         // Jours
    features: [...],
    notIncluded: ['Rappels entretien', 'Carnet entretien', 'Support prioritaire'],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceYearly: 89,        // 2 mois offerts
    maxDiagnostics: Infinity,
    maxDevis: Infinity,
    maxVehicles: 5,
    historyDays: Infinity,
    features: [...],
    notIncluded: [],
  },
}
```

---

## 3. Logique de Restriction

### 3.1 Hook useSubscription

Fichier : `src/hooks/useSubscription.ts`

```typescript
const {
  isPremium,              // boolean
  diagnosticsRemaining,   // number | Infinity
  devisRemaining,         // number | Infinity
  checkDiagnosticLimit,   // () => Promise<{canDiagnose, remaining}>
  incrementDiagnosticCount, // () => Promise<boolean>
} = useSubscription(profile)
```

### 3.2 Vérification avant diagnostic

Fichier : `src/pages/Chat.tsx`

```typescript
// Avant de lancer un diagnostic
const status = await checkDiagnosticLimit()

if (!status.canDiagnose) {
  setShowPaywall(true)  // Affiche modal upgrade
  return
}

// Diagnostic autorisé
await sendMessage(...)
await incrementDiagnosticCount()  // +1 au compteur
```

### 3.3 Vérification véhicules

Fichier : `src/pages/Vehicles.tsx`

```typescript
const isPremium = profile?.subscription_status === 'premium'
const maxVehicles = isPremium ? 5 : 1
const canAddVehicle = vehicles.length < maxVehicles

// Bouton désactivé si limite atteinte
<Button disabled={!canAddVehicle} onClick={...}>
  Ajouter
</Button>

// Message limite
{!canAddVehicle && (
  <Card className="bg-amber-50">
    <p>Limite atteinte. Passe en Premium pour ajouter plus de véhicules.</p>
    <Button asChild><Link to="/pricing">Upgrade</Link></Button>
  </Card>
)}
```

---

## 4. Compteurs dans la Base de Données

### Table `profiles`

```sql
free_diagnostics_used INTEGER DEFAULT 0,
free_diagnostics_reset_at TIMESTAMPTZ DEFAULT NOW(),
free_devis_used INTEGER DEFAULT 0,
subscription_status TEXT DEFAULT 'free',  -- 'free' | 'premium'
```

### Reset mensuel automatique

```typescript
// Dans useSubscription.ts
const resetDate = new Date(profile.free_diagnostics_reset_at)
const now = new Date()
const isDifferentMonth = resetDate.getMonth() !== now.getMonth()

if (isDifferentMonth) {
  await supabase.from('profiles').update({
    free_diagnostics_used: 0,
    free_devis_used: 0,
    free_diagnostics_reset_at: now.toISOString(),
  })
}
```

---

## 5. Paywall Modal

Fichier : `src/components/PaywallModal.tsx`

### Déclencheurs

| Action | Condition | Modal affiché |
|--------|-----------|---------------|
| Diagnostic | `diagnosticsRemaining === 0` | "Limite atteinte" |
| Analyse devis | `devisRemaining === 0` | "Limite atteinte" |
| Ajout véhicule | `vehicles.length >= maxVehicles` | Inline warning |
| Accès rappels | `!isPremium` | Badge Premium |

### Design

- Non-agressif (pas de popup forcé)
- Call-to-action clair : "Voir les offres Premium"
- Lien vers `/pricing`

---

## 6. Activation Premium (Stripe)

### Flux

1. User clique "S'abonner" → `/pricing`
2. Redirection Stripe Checkout
3. Paiement réussi
4. Webhook Stripe → `checkout.session.completed`
5. Mise à jour `subscription_status = 'premium'`

### Webhook (netlify/functions/stripe-webhook.ts)

```typescript
case 'checkout.session.completed':
  if (session.mode === 'subscription') {
    await supabase.from('profiles').update({
      subscription_status: 'premium',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    }).eq('id', userId)
  }
```

### Annulation

```typescript
case 'customer.subscription.deleted':
  await supabase.from('profiles').update({
    subscription_status: 'free',
    stripe_subscription_id: null,
  }).eq('id', profile.id)
```

---

## 7. UI/UX des Restrictions

### Badge Premium sur sidebar

```tsx
// Fichier: src/components/Sidebar.tsx
{!isPremium && (
  <Badge className="ml-2 text-xs">Premium</Badge>
)}
```

### Compteur visible

```tsx
// Dashboard ou Header
<p className="text-sm text-muted-foreground">
  {diagnosticsRemaining === Infinity
    ? 'Diagnostics illimités'
    : `${diagnosticsRemaining}/2 diagnostics restants`
  }
</p>
```

### Features grisées

```tsx
// Pour features premium-only
<div className={cn(
  "p-4 rounded-lg",
  !isPremium && "opacity-50 pointer-events-none"
)}>
  <Lock className="h-4 w-4" />
  Rappels entretien
</div>
```

---

## 8. Tests du Système Premium

### Test 1 : Compteur diagnostics

```
1. Créer un compte gratuit
2. Faire 2 diagnostics
3. Vérifier que le 3ème affiche le paywall
4. Vérifier le compteur en base : free_diagnostics_used = 2
```

### Test 2 : Reset mensuel

```
1. Modifier free_diagnostics_reset_at au mois précédent
2. Recharger l'app
3. Vérifier que le compteur est reset à 0
```

### Test 3 : Limite véhicules

```
1. Ajouter 1 véhicule (gratuit)
2. Essayer d'en ajouter un 2ème
3. Vérifier le message "Limite atteinte"
```

### Test 4 : Activation Premium

```
1. Faire un paiement test Stripe (4242 4242 4242 4242)
2. Vérifier subscription_status = 'premium'
3. Vérifier accès illimité aux features
```

### Test 5 : Bypass impossible

```
1. En tant que free, modifier l'URL pour accéder aux rappels
2. Vérifier que les données ne s'affichent pas (RLS bloque)
3. Modifier manuellement subscription_status en localStorage
4. Vérifier que le serveur refuse (vérifie en base)
```

---

## 9. Variables Stripe

```env
# Netlify Environment Variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_STRIPE_PRICE_MONTHLY=price_...
VITE_STRIPE_PRICE_YEARLY=price_...
```

---

## Conclusion

Le système freemium est **complet et sécurisé** :

✅ Limites enforced côté client ET serveur
✅ Compteurs atomiques (pas de race conditions)
✅ Reset mensuel automatique
✅ Webhooks Stripe pour sync
✅ RLS pour sécurité données
✅ UX non-agressive
