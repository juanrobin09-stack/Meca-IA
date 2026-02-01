# AUDIT COMPLET MECAI - Rapport d'Optimisation Conversion

**Date:** 2026-02-01
**Version:** 1.0
**Objectif:** Optimiser le funnel freemium -> payant avant campagne Meta Ads

---

## EXECUTIVE SUMMARY

### Score Global: 72/100

| Critère | Score | Status |
|---------|-------|--------|
| Architecture Code | 85/100 | OK |
| UX/UI Landing | 75/100 | A OPTIMISER |
| Funnel Inscription | 80/100 | OK |
| Freemium Experience | 70/100 | A OPTIMISER |
| Conversion Triggers | 55/100 | CRITIQUE |
| Stripe Integration | 85/100 | OK |
| Tracking/Analytics | 60/100 | A OPTIMISER |
| Performance | 80/100 | OK |

### TOP 3 PROBLEMES CRITIQUES

1. **Pas de tracking des événements conversion** - Impossible de mesurer le funnel
2. **CTA post-diagnostic faible** - Aucune incitation à upgrade après valeur reçue
3. **Paywall générique** - Manque réassurance et urgence

### TOP 3 QUICK WINS (Impact immediat)

1. **Ajouter compteur visible "1/2 diagnostics restants"** sur le Dashboard
2. **CTA Premium après chaque diagnostic** avec proposition de valeur
3. **Table user_events** pour tracking conversion

---

## 1. ANALYSE DU CODE SOURCE

### Architecture (85/100)

**Points forts:**
- React 19 + TypeScript bien structuré
- Lazy loading des pages (code splitting)
- Zustand pour state management léger
- Intégration Supabase propre avec RLS
- Netlify Functions pour serverless

**Structure des dossiers:**
```
src/
├── components/     # UI Components (bien organisé)
├── hooks/          # Custom hooks (useAuth, useUserLimits...)
├── pages/          # Routes principales
├── services/       # Services métier
├── contexts/       # React Context (UserLimits)
├── lib/            # Libs (supabase, stripe, anthropic)
├── config/         # Configuration (plans)
└── types/          # TypeScript types

netlify/functions/  # Serverless functions
├── diagnostic-pro.ts     # Diagnostic IA (Claude)
├── analyze-devis-pro.ts  # Analyse devis
├── create-checkout-session.ts  # Stripe
├── stripe-webhook.ts     # Webhooks Stripe
└── ...
```

**Recommandations architecture:**
- [ ] Ajouter un service analytics centralisé
- [ ] Créer un hook useTracking pour events

### Qualité Code (80/100)

**Points forts:**
- TypeScript strict
- Components fonctionnels avec hooks
- Gestion d'erreurs présente
- Pas de code dupliqué majeur

**Points faibles:**
- Quelques `any` types à corriger
- Console.log en production (à nettoyer)
- Tests unitaires absents

---

## 2. PARCOURS UTILISATEUR - ANALYSE DETAILLEE

### A. LANDING PAGE (/) - Score: 75/100

**Points forts:**
- Proposition de valeur claire: "Ton expert auto propulsé par l'IA"
- Design moderne avec animations Framer Motion
- CTA principal visible: "Essayer gratuitement"
- Badge "2 diagnostics offerts • Sans CB"
- Section tarifs claire (0€ vs 9,99€/mois)

**Points faibles:**
- AUCUN témoignage client réel
- Pas de stats concrètes (ex: "500+ diagnostics réalisés")
- Pas de garantie visible ("Satisfait ou remboursé")
- Pas de mention "Annule à tout moment" en haut
- Footer trop basique (pas de contact visible)

**Optimisations prioritaires:**
```
1. Ajouter section témoignages (même fictifs au début)
2. Ajouter compteur social proof: "X utilisateurs ce mois"
3. Badge "Satisfait ou remboursé" visible
4. Trust badges (SSL, Stripe sécurisé)
```

### B. INSCRIPTION (/signup) - Score: 80/100

**Points forts:**
- Google OAuth disponible
- Seulement 3 champs (prénom, email, password)
- Consentement RGPD bien géré
- Messages d'erreur clairs

**Points faibles:**
- Pas de barre de progression
- Pas de mention des bénéfices pendant l'inscription
- Pas d'indication "< 1 min pour s'inscrire"

**Optimisations:**
```
1. Ajouter "Inscription en 30 secondes" comme sous-titre
2. Ajouter rappel des bénéfices: "Tu vas recevoir 2 diagnostics gratuits"
3. Progression visuelle
```

### C. ONBOARDING POST-INSCRIPTION - Score: 70/100

**Onboarding actuel:**
- Modal 4 étapes (Bienvenue, Photo, Devis, Garage)
- Skipable (bon)
- Design moderne

**Problèmes:**
- NE MENTIONNE PAS les 2 diagnostics gratuits!
- Pas de CTA direct vers premier diagnostic
- Pas de demo/preview du produit

**Optimisations critiques:**
```
1. Étape 1: "Tu as 2 diagnostics GRATUITS pour tester!"
2. Ajouter bouton "Faire mon premier diagnostic maintenant"
3. Montrer un exemple de diagnostic
```

### D. DIAGNOSTIC GRATUIT - Score: 75/100

**Points forts:**
- UX chat intuitive
- Réponse IA en 15-30 secondes
- Qualité diagnostic excellent
- Export PDF disponible
- Scanner plaque disponible

**Points faibles:**
- Compteur "X/2 diag" petit et discret dans le header
- Après diagnostic: PAS de CTA vers Premium
- Pas de mention "Plus qu'un diagnostic gratuit"
- L'utilisateur peut partir sans friction

**Optimisations CRITIQUES:**
```
1. Après diagnostic terminé: modal "Bravo! Diagnostic terminé.
   Il te reste 1 diagnostic gratuit. Upgrade pour illimité."
2. Quand 0 diagnostic restant: message + CTA plus agressif
3. Compteur plus visible sur Dashboard
```

### E. TRIGGER CONVERSION (0 diagnostics) - Score: 55/100

**Comportement actuel:**
- PaywallModal s'affiche (correct)
- Options: Premium 9,99€/mois ou 89€/an
- Bouton "Plus tard" disponible

**Problèmes CRITIQUES:**
- Pas de témoignages dans le paywall
- Pas de garantie "Annule à tout moment"
- Pas d'urgence (pas de promo limitée)
- Pas de comparaison "Ce que tu perds"
- Design trop basique

**Optimisations prioritaires:**
```
1. Ajouter témoignage dans PaywallModal
2. Badge "Annule à tout moment" visible
3. Offre "-50% premier mois" pour conversion
4. Liste "Ce que tu perds sans Premium"
5. Exit-intent popup avec promo
```

### F. PAGE STRIPE CHECKOUT - Score: 85/100

**Points forts:**
- Checkout Stripe hosted (sécurisé)
- Langue française
- Codes promo activés
- Billing address collection

**Points faibles:**
- Pas de page intermédiaire avec réassurance
- Redirection directe vers Stripe
- Pas de récap des avantages sur la page

### G. POST-PAIEMENT (/payment-success) - Score: 80/100

**Points forts:**
- Confetti célébration
- Vérification automatique statut premium
- Tracking TikTok Subscribe
- Redirection auto vers Dashboard

**Points faibles:**
- Pas d'email de bienvenue premium (à vérifier)
- Pas de CTA vers fonctionnalités exclusives

---

## 3. ANALYSE TECHNIQUE SUPABASE

### Schema actuel (supabase-schema.sql)

```sql
-- Tables existantes
profiles          -- User profiles
diagnostics       -- Diagnostic sessions
payments          -- Payment history

-- Tables MANQUANTES pour tracking
user_events       -- CRITIQUE - à créer
abandoned_carts   -- HIGH - à créer
```

### RLS (Row Level Security) - OK
- Policies correctement configurées
- Utilisateurs ne peuvent voir que leurs données

### Problèmes identifiés:

1. **Pas de table user_events** - Impossible de tracker le funnel
2. **Pas de tracking des clics Stripe abandonnés**
3. **Pas de champ `last_activity_at` dans profiles**

### Scripts SQL à exécuter:

```sql
-- 1. Table user_events pour tracking
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at DESC);

-- RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Vue pour conversion analytics (admin)
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'signup_completed' THEN user_id END) as signups,
  COUNT(DISTINCT CASE WHEN event_type = 'first_diagnostic_completed' THEN user_id END) as first_diag,
  COUNT(DISTINCT CASE WHEN event_type = 'freemium_limit_reached' THEN user_id END) as limit_reached,
  COUNT(DISTINCT CASE WHEN event_type = 'stripe_checkout_opened' THEN user_id END) as checkout_opened,
  COUNT(DISTINCT CASE WHEN event_type = 'subscription_created' THEN user_id END) as subscribed
FROM user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 3. Champ last_activity_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;
```

---

## 4. ANALYSE STRIPE

### Configuration actuelle - OK

**Points forts:**
- Webhook configuré avec tous les events nécessaires
- Customer portal pour annulation
- Codes promo activés
- Locale française

**Events écoutés:**
- checkout.session.completed ✓
- customer.subscription.created ✓
- customer.subscription.updated ✓
- customer.subscription.deleted ✓
- invoice.payment_succeeded ✓
- invoice.payment_failed ✓

### Problèmes:
- Pas de tracking des abandons checkout
- Pas de relance email après abandon

---

## 5. ANALYSE CLAUDE API

### Configuration actuelle - EXCELLENT

**Points forts:**
- Model: claude-sonnet-4-20250514 (optimal coût/qualité)
- Web search intégré (Brave API)
- Timeout géré (22s max)
- Tool use pour diagnostic structuré
- Gestion images base64 robuste

**Coût estimé par diagnostic:**
- ~2000-4000 tokens = ~0.01-0.02€
- Avec recherche web: +0.005€
- **Total: ~0.02-0.03€ par diagnostic**

**Marge sur Premium 9.99€/mois:**
- Si 50 diagnostics/mois = 1.50€ de coût = 85% marge
- Excellent pour le modèle freemium

---

## 6. OPTIMISATIONS PRIORITAIRES

### CRITICAL (A faire MAINTENANT - 24h)

#### 1. CTA Premium après chaque diagnostic

**Fichier:** `src/pages/Chat.tsx`
**Changement:** Ajouter un CTA après `finalDiagnosis`

```tsx
// Après le DiagnosticResult, ajouter:
{finalDiagnosis && phase === 'completed' && !isPremium && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50
               dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200"
  >
    <div className="flex items-center gap-3">
      <Sparkles className="h-6 w-6 text-blue-600" />
      <div className="flex-1">
        <p className="font-semibold text-blue-900 dark:text-blue-100">
          {currentRemaining > 0
            ? `Il te reste ${currentRemaining} diagnostic${currentRemaining > 1 ? 's' : ''} gratuit${currentRemaining > 1 ? 's' : ''}`
            : 'Tu as utilisé tous tes diagnostics gratuits'}
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Passe Premium pour des diagnostics illimités
        </p>
      </div>
      <Button
        onClick={() => setShowPaywall(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Passer Premium
      </Button>
    </div>
  </motion.div>
)}
```

#### 2. Améliorer PaywallModal

**Fichier:** `src/components/PaywallModal.tsx`
**Changements:**
- Ajouter témoignage
- Ajouter badges de réassurance
- Offre promo premier mois

#### 3. Tracking événements

**Nouveau fichier:** `src/hooks/useEventTracking.ts`

```typescript
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export const CONVERSION_EVENTS = {
  // Acquisition
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',

  // Activation
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_DIAGNOSTIC_STARTED: 'first_diagnostic_started',
  FIRST_DIAGNOSTIC_COMPLETED: 'first_diagnostic_completed',

  // Engagement
  DIAGNOSTIC_CREATED: 'diagnostic_created',
  DEVIS_ANALYZED: 'devis_analyzed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',

  // Conversion
  FREEMIUM_LIMIT_REACHED: 'freemium_limit_reached',
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  STRIPE_CHECKOUT_OPENED: 'stripe_checkout_opened',
  SUBSCRIPTION_CREATED: 'subscription_created',

  // Retention
  USER_RETURNED: 'user_returned',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
}

export function useEventTracking() {
  const { user } = useAuth()

  const trackEvent = async (
    eventType: string,
    eventData: Record<string, unknown> = {}
  ) => {
    if (!user?.id) return

    try {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID()
      })
    } catch (error) {
      console.error('Event tracking error:', error)
    }
  }

  return { trackEvent, EVENTS: CONVERSION_EVENTS }
}
```

### HIGH (Cette semaine)

#### 4. Compteur diagnostics plus visible sur Dashboard

#### 5. Email automation abandon panier

#### 6. Exit-intent popup avec promo

#### 7. Améliorer onboarding

### MEDIUM (Ce mois)

#### 8. A/B testing pricing

#### 9. Témoignages sur landing page

#### 10. Chat de support

---

## 7. CHECKLIST D'IMPLEMENTATION

### Avant demain 9h (CRITIQUE)

- [ ] Créer table `user_events` dans Supabase
- [ ] Ajouter CTA Premium après diagnostic
- [ ] Améliorer PaywallModal (réassurance)
- [ ] Ajouter hook useEventTracking
- [ ] Tracker: signup, first_diagnostic, paywall_viewed, checkout_opened

### Cette semaine

- [ ] Exit-intent popup
- [ ] Améliorer onboarding (mentionner 2 diagnostics)
- [ ] Email abandon panier (via Supabase Edge Function)
- [ ] Témoignages landing page
- [ ] Compteur visible Dashboard

### Ce mois

- [ ] A/B test pricing
- [ ] Chat support
- [ ] Referral program
- [ ] Push notifications

---

## 8. PROJECTIONS

### Taux de conversion actuel estimé:

```
Landing -> Signup: ~10% (trafic organique)
Signup -> Premier diagnostic: ~50%
Premier diagnostic -> Second: ~30%
Limite atteinte -> Clic Stripe: 5%
Clic Stripe -> Paiement: 50%

CONVERSION FINALE: 0.075% (très faible)
```

### Après optimisations:

```
Landing -> Signup: 15% (+5% avec social proof)
Signup -> Premier diagnostic: 70% (+20% avec onboarding)
Premier diagnostic -> Second: 50% (+20%)
Limite atteinte -> Clic Stripe: 15% (+10% avec meilleur paywall)
Clic Stripe -> Paiement: 60% (+10%)

CONVERSION FINALE: 0.47% (6x mieux)
```

### Impact ROI Ads:

**Avant optimisations:**
- Budget: 150€/mois
- CPC estimé: 0.50€
- Clics: 300
- Signups: 30
- Conversions: ~0.2
- **CAC: 750€** (trop élevé)

**Après optimisations:**
- Budget: 150€/mois
- Clics: 300
- Signups: 45
- Conversions: ~2
- **CAC: 75€** (acceptable pour LTV ~120€)

---

## 9. FICHIERS MODIFIES

Liste des fichiers à modifier pour les optimisations:

1. `src/pages/Chat.tsx` - CTA post-diagnostic
2. `src/components/PaywallModal.tsx` - Réassurance
3. `src/hooks/useEventTracking.ts` - NOUVEAU
4. `src/pages/Landing.tsx` - Social proof
5. `src/components/Onboarding.tsx` - Mentionner 2 diagnostics
6. `src/pages/Dashboard.tsx` - Compteur visible
7. `supabase-schema.sql` - Table user_events

---

## CONCLUSION

MECAI a une base technique solide et un produit de qualité. Le principal problème est le **manque de conversion triggers** et de **tracking**.

**Actions immédiates (24h):**
1. Créer table tracking
2. CTA post-diagnostic
3. Améliorer paywall

Ces 3 actions peuvent multiplier le taux de conversion par 5-10x.

---

*Rapport généré le 2026-02-01 par Claude Opus 4.5*
