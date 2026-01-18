# Changelog MecaIA

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

## v1.2.0 - Stripe Checkout & Webhooks Complet (2026-01-18)

### Ajouté
- **Stripe Checkout intégré** - Paiement sécurisé pour abonnement Premium
- **Webhooks complets** - Synchronisation automatique avec la DB :
  - `checkout.session.completed` - Active premium
  - `invoice.payment_succeeded` - Confirme renouvellement
  - `invoice.payment_failed` - Gestion échec paiement
  - `customer.subscription.created` - Nouvelle souscription
  - `customer.subscription.updated` - Modification/annulation
  - `customer.subscription.deleted` - Expiration définitive
- **Customer création automatique** - Stripe customer créé si inexistant
- **Codes promo** - Support des codes promotionnels Stripe

### Amélioré
- `create-checkout-session.ts` - CORS, validation, création customer auto
- `stripe-webhook.ts` - Handlers complets pour tous events
- `Pricing.tsx` - Boutons checkout avec loading states
- `stripe.ts` - Support du paramètre plan (monthly/yearly)

### Documentation
- `STRIPE_PRODUCTS_SETUP.md` - Guide création produits Stripe
- `STRIPE_WEBHOOK_SETUP.md` - Configuration webhooks complète

---

## v1.1.0 - Gestion Abonnement Stripe Portal (2026-01-18)

### Ajouté
- **Page Paramètres** (`/app/settings`) - Nouvelle page de gestion du compte
- **Stripe Customer Portal** - Gestion complète des abonnements :
  - Annuler l'abonnement
  - Changer de plan (mensuel/annuel)
  - Mettre à jour la carte bancaire
  - Télécharger les factures
- **Indicateurs d'utilisation** - Barres de progression pour diagnostics et devis
- **Lien Sidebar** - Accès rapide aux paramètres

### Amélioré
- `create-portal-session.ts` - Lookup user par userId avec validation DB
- `stripe.ts` - Nouvelle fonction `getCustomerPortalUrlByUserId`
- Navigation - Icône Settings dans la sidebar

### Documentation
- `STRIPE_PORTAL.md` - Guide complet de configuration et tests

---

## v1.0.0 - Lancement Production (2026-01-18)

### Ajouté

**Features Principales:**
- **Diagnostic IA** - Scan de plaque + description problème pour diagnostic automatique
- **Analyseur de Devis IA** - Upload photo/PDF de devis pour détecter les arnaques
- **Diagnostic Vidéo IA** - Capture vidéo 15-30s pour analyse visuelle et sonore
- **Prévision de Pannes** - Analyse prédictive basée sur kilométrage et historique
- **Chat Mécanicien 24/7** - Assistant IA disponible pour toutes questions auto
- **My Garage** - Gestion de véhicules avec suivi personnalisé
- **Recherche Pièces** - Comparaison prix multi-retailers (Oscaro, Yakarouler)
- **Recherche Garages** - Localisation via Google Places API

**Système Freemium:**
- Plan Gratuit: 2 diagnostics/mois, 1 véhicule, 10 messages chat/mois
- Plan Premium (9,99€/mois ou 89€/an): Tout illimité

**Interface:**
- Design responsive mobile-first
- Thème sombre/clair
- Animations Framer Motion
- Code splitting pour performance optimale

**Sécurité:**
- RLS Supabase sur toutes les tables
- Validation inputs
- Error handling sécurisé
- Secrets protégés côté serveur

### Technique

**Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- Backend: Netlify Functions
- BDD: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Paiement: Stripe
- IA: Anthropic Claude API

**Optimisations:**
- Lazy loading des pages
- Compression images
- Code splitting automatique
- Cache optimisé

### Retiré
- Feature "Rappels d'entretien" (supprimée pour simplifier)

### Sécurité
- RLS activé sur 9 tables
- 36 policies de sécurité
- Validation inputs sur tous les formulaires
- Pas de secrets exposés au frontend

---

## Notes de version

### Versioning
Ce projet suit le [Semantic Versioning](https://semver.org/).

### Contact
Pour toute question: contact@mymecai.com
