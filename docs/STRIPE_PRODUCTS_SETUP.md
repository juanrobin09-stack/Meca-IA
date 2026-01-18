# Configuration Produits Stripe

**Date :** Janvier 2026

---

## 1. Créer les produits dans Stripe Dashboard

### Mode Test (pour dev)

1. Aller sur https://dashboard.stripe.com/test/products
2. Cliquer "Add product"

**Produit 1 : MecaIA Premium Mensuel**
- Name: `MecaIA Premium - Mensuel`
- Description: `Accès illimité à toutes les fonctionnalités Premium`
- Pricing model: `Recurring`
- Price: `9.99 EUR`
- Billing period: `Monthly`
- Currency: `EUR`
- Tax behavior: `Inclusive`
→ Copier le Price ID : `price_xxxxx` (pour mensuel)

**Produit 2 : MecaIA Premium Annuel**
- Name: `MecaIA Premium - Annuel`
- Description: `Accès illimité à toutes les fonctionnalités Premium (2 mois offerts)`
- Pricing model: `Recurring`
- Price: `89.00 EUR`
- Billing period: `Yearly`
- Currency: `EUR`
- Tax behavior: `Inclusive`
→ Copier le Price ID : `price_yyyyy` (pour annuel)

---

## 2. Mode Production (avant launch)

Répéter les étapes ci-dessus sur https://dashboard.stripe.com/products

---

## 3. Variables d'environnement

### Local (.env)

```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx

# Stripe Price IDs (test)
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_YEARLY=price_yyyyy
```

### Netlify (production)

Site settings → Environment variables

```
STRIPE_SECRET_KEY=sk_live_xxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_STRIPE_PRICE_MONTHLY=price_live_monthly
VITE_STRIPE_PRICE_YEARLY=price_live_yearly
```

---

## 4. Cartes de Test

### Paiement réussi
| Carte | Numéro |
|-------|--------|
| Visa | 4242 4242 4242 4242 |
| Mastercard | 5555 5555 5555 4444 |

### Paiement échoué
| Scénario | Numéro |
|----------|--------|
| Refusé | 4000 0000 0000 0002 |
| Fonds insuffisants | 4000 0000 0000 9995 |

### 3D Secure
| Scénario | Numéro |
|----------|--------|
| Auth requise | 4000 0025 0000 3155 |

**Pour tous :**
- Date : n'importe quelle date future (ex: 12/28)
- CVV : n'importe quel 3 chiffres (ex: 123)

---

## 5. Prix recommandés

| Plan | Prix | Économie |
|------|------|----------|
| Mensuel | 9,99€/mois | - |
| Annuel | 89€/an | 25% (~2 mois offerts) |

---

## 6. Checklist

- [ ] Produit mensuel créé (test)
- [ ] Produit annuel créé (test)
- [ ] Price IDs copiés
- [ ] Variables env locales configurées
- [ ] Test checkout fonctionnel
- [ ] Produits créés en production
- [ ] Variables env Netlify configurées

---

*Dernière mise à jour: 2026-01-18*
