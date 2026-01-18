# Stripe Customer Portal - Guide

**Date :** Janvier 2026
**Version :** 1.0

---

## Configuration Stripe Dashboard

### 1. Activer le Portal

1. Aller sur https://dashboard.stripe.com/settings/billing/portal
2. Cliquer "Activate test link" (mode test) ou "Activate" (prod)
3. Configurer les options :
   - ✅ Allow customers to cancel subscriptions
   - ✅ Cancel at period end (recommandé)
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to view invoices
4. Branding :
   - Uploader logo MecaIA
   - Couleurs brand (#3B82F6 primary)
5. Return URL : `https://mymecai.com/app/settings`
6. Save

### 2. Variables d'environnement

**Netlify (production) :**
```env
STRIPE_SECRET_KEY=sk_live_xxx
URL=https://mymecai.com
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
```

**Local (.env) :**
```env
STRIPE_SECRET_KEY=sk_test_xxx
URL=http://localhost:5173
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
```

---

## Architecture

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `netlify/functions/create-portal-session.ts` | Crée session Stripe Portal |
| `src/lib/stripe.ts` | Helpers frontend Stripe |
| `src/pages/Settings.tsx` | Page paramètres avec gestion abo |
| `netlify/functions/stripe-webhook.ts` | Gère webhooks Stripe |

### Flow Utilisateur

```
User clique "Gérer mon abonnement"
    ↓
Frontend appelle create-portal-session
    ↓
Backend récupère stripe_customer_id depuis profiles
    ↓
Backend crée session Stripe Portal
    ↓
User redirigé vers portal.stripe.com
    ↓
User effectue action (annuler, MAJ carte, etc)
    ↓
Stripe envoie webhook
    ↓
stripe-webhook.ts met à jour DB
    ↓
User retourne sur /app/settings
```

---

## Flows détaillés

### Annulation d'abonnement

1. User clique "Gérer mon abonnement"
2. Redirect vers portal.stripe.com
3. User clique "Annuler l'abonnement"
4. Stripe demande confirmation
5. Stripe marque `cancel_at_period_end = true`
6. Webhook `customer.subscription.updated` envoyé
7. `stripe-webhook.ts` met à jour DB :
   ```sql
   UPDATE profiles
   SET subscription_status = 'cancelled'
   WHERE stripe_customer_id = 'cus_xxx'
   ```
8. User retourne sur MecaIA
9. User garde accès Premium jusqu'à date expiration
10. À expiration, webhook `customer.subscription.deleted`
11. DB updated :
    ```sql
    UPDATE profiles
    SET subscription_status = 'free',
        stripe_subscription_id = NULL
    WHERE stripe_customer_id = 'cus_xxx'
    ```
12. User voit limites gratuit

### Changement de plan (mensuel ↔ annuel)

1. User sur Stripe Portal
2. Clique "Update plan"
3. Sélectionne mensuel ou annuel
4. Webhook `customer.subscription.updated`
5. DB mise à jour automatiquement (status reste 'premium')

### MAJ carte bancaire

1. User sur Stripe Portal
2. Clique "Update payment method"
3. Entre nouvelle carte
4. Stripe update le customer
5. Prochaine facturation sur nouvelle carte

---

## Webhooks gérés

Les webhooks suivants sont gérés par `/netlify/functions/stripe-webhook.ts` :

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Active premium, stocke customer_id |
| `customer.subscription.updated` | Met à jour status (active/cancelled) |
| `customer.subscription.deleted` | Downgrade vers free |
| `invoice.payment_failed` | Log erreur (à améliorer) |

### Configuration Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint : `https://mymecai.com/.netlify/functions/stripe-webhook`
3. Events à sélectionner :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Récupérer signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Tests

### Test annulation (mode test)

1. Créer subscription test avec carte `4242 4242 4242 4242`
2. Aller sur Settings
3. Cliquer "Gérer mon abonnement"
4. Vérifier redirect Stripe Portal
5. Annuler subscription
6. Vérifier DB updated :
   ```sql
   SELECT subscription_status, stripe_customer_id
   FROM profiles WHERE id = 'xxx';
   -- subscription_status devrait être 'free' après expiration
   ```
7. Vérifier user garde accès jusqu'à expiration

### Tester avec Stripe CLI

```bash
# Installation
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks en local
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Trigger events
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger checkout.session.completed
```

---

## Troubleshooting

### Erreur "NO_SUBSCRIPTION"

**Cause :** User n'a pas de `stripe_customer_id` en DB

**Solution :**
- Vérifier que le user a bien souscrit via Checkout
- Vérifier que le webhook `checkout.session.completed` a été reçu
- Vérifier dans Stripe Dashboard que le customer existe

### Portal ne s'ouvre pas

**Causes possibles :**
1. Portal pas activé dans Stripe Dashboard
2. Variables d'env manquantes
3. `stripe_customer_id` invalide

**Debug :**
```bash
# Vérifier logs Netlify
netlify functions:invoke create-portal-session --payload '{"userId":"xxx"}'

# Vérifier customer existe
stripe customers retrieve cus_xxx
```

### Webhook pas reçu

**Vérifications :**
1. Endpoint correct dans Stripe Dashboard
2. Events sélectionnés
3. Signing secret correct (`STRIPE_WEBHOOK_SECRET`)
4. Logs Netlify Functions

**Test local :**
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook --log-level debug
```

---

## Sécurité

### Points clés

| Contrôle | Status |
|----------|--------|
| Webhook signature vérifiée | ✅ |
| userId validé en DB | ✅ |
| Pas de customer_id côté client | ✅ |
| CORS configuré | ✅ |

### Bonnes pratiques

1. **Ne jamais exposer `stripe_customer_id` côté client**
   - Toujours passer `userId` et lookup côté serveur

2. **Toujours vérifier signature webhook**
   ```typescript
   stripe.webhooks.constructEvent(body, sig, webhookSecret)
   ```

3. **Gérer les erreurs gracieusement**
   - User voit message générique, pas de stack trace

---

## Checklist déploiement

### Stripe Dashboard
- [ ] Customer Portal activé
- [ ] Options configurées (cancel, update payment)
- [ ] Branding configuré (logo, couleurs)
- [ ] Return URL configurée
- [ ] Webhook endpoint ajouté
- [ ] Events sélectionnés

### Netlify
- [ ] `STRIPE_SECRET_KEY` (live)
- [ ] `STRIPE_WEBHOOK_SECRET` (live)
- [ ] `URL` = `https://mymecai.com`
- [ ] Function déployée

### Test prod
- [ ] Créer subscription test
- [ ] Vérifier redirect Portal
- [ ] Vérifier annulation
- [ ] Vérifier webhook reçu
- [ ] Vérifier DB mise à jour

---

*Dernière mise à jour: 2026-01-18*
