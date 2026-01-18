# Configuration Stripe Webhooks

**Date :** Janvier 2026

---

## 1. Configurer Webhook Endpoint

### Mode Test (développement)

**Option A : Stripe CLI (recommandé pour local)**

```bash
# Installer Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Login
stripe login

# Forward webhooks vers local
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

# Copier le webhook signing secret qui s'affiche
# whsec_xxxxx
```

**Option B : Stripe Dashboard Test**

1. https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.netlify.app/.netlify/functions/stripe-webhook`
4. Events to send:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copier le "Signing secret" : `whsec_xxxxx`

---

### Mode Production

1. https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://mymecai.com/.netlify/functions/stripe-webhook`
4. Sélectionner les mêmes events
5. Copier le "Signing secret"

---

## 2. Variables d'Environnement

### Local (.env)

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Netlify (production)

```
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
```

---

## 3. Events Gérés

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Active premium, stocke customer_id + subscription_id |
| `invoice.payment_succeeded` | Confirme paiement, maintient status active |
| `invoice.payment_failed` | Log erreur, Stripe retente automatiquement |
| `customer.subscription.created` | Active premium |
| `customer.subscription.updated` | Update status (active/cancelled) |
| `customer.subscription.deleted` | Downgrade vers free |

---

## 4. Tester Webhooks

### Avec Stripe CLI (local)

```bash
# Terminal 1 : Lancer Netlify Dev
netlify dev

# Terminal 2 : Forward webhooks
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

# Terminal 3 : Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Avec Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Click sur votre endpoint
3. Tab "Send test webhook"
4. Sélectionner event type
5. Click "Send test webhook"
6. Vérifier logs Netlify

---

## 5. Vérifier Fonctionnement

### Checklist

- [ ] Webhook endpoint visible dans Stripe Dashboard
- [ ] Signing secret configuré
- [ ] Function déployée sur Netlify
- [ ] Test webhook reçu avec succès (status 200)
- [ ] DB updated après test event
- [ ] Logs clean (pas d'erreurs)

### Vérifier DB après webhook

```sql
-- Vérifier profile mis à jour
SELECT id, subscription_status, stripe_customer_id, stripe_subscription_id
FROM profiles
WHERE id = 'user-uuid';

-- Devrait montrer:
-- subscription_status = 'premium'
-- stripe_customer_id = 'cus_xxx'
-- stripe_subscription_id = 'sub_xxx'
```

---

## 6. Monitoring

### Stripe Dashboard

- Webhooks → Votre endpoint → Tab "Events"
- Voir tous events reçus + status (succeeded/failed)

### Netlify Functions

- Functions → stripe-webhook → Logs
- Voir toutes invocations + errors

---

## 7. Troubleshooting

### Webhook failed signature

**Causes :**
- `STRIPE_WEBHOOK_SECRET` incorrect
- Trailing spaces dans la variable
- Mauvais environment (test vs live)

**Solution :**
1. Vérifier secret dans Stripe Dashboard
2. Copier-coller à nouveau sans espaces
3. Redéployer function

### Events not received

**Vérifications :**
1. URL endpoint correcte
2. Function déployée
3. Events sélectionnés dans Dashboard
4. Check Stripe Dashboard → Webhooks → Tab "Logs"

### DB not updated

**Vérifications :**
1. `SUPABASE_SERVICE_KEY` configuré
2. `user_id` présent dans metadata
3. Table profiles existe avec bonnes colonnes

---

## 8. Sécurité

### Points clés

- Toujours vérifier signature webhook
- Ne jamais exposer webhook secret
- Logger les events pour debug
- Gérer les erreurs gracieusement

### Code de vérification

```typescript
const sig = event.headers['stripe-signature']
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

try {
  stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret)
} catch (err) {
  return { statusCode: 400, body: 'Invalid signature' }
}
```

---

*Dernière mise à jour: 2026-01-18*
