# CHECKLIST DEPLOIEMENT OPTIMISATIONS MECAI

## Avant de déployer (validation locale)

### 1. Build et tests
```bash
# Vérifier que le build passe
npm run build

# Vérifier TypeScript
npm run type-check

# Lancer en local pour tester
npm run dev
```

### 2. Tester les optimisations en local

- [ ] Ouvrir http://localhost:5173/app/chat
- [ ] Faire un diagnostic complet
- [ ] Vérifier que le UpgradeCTA s'affiche après le diagnostic
- [ ] Vérifier que le compteur diagnostics est visible
- [ ] Cliquer sur "Passer Premium" et vérifier le PaywallModal amélioré
- [ ] Vérifier les badges de réassurance et le témoignage

---

## Appliquer la migration Supabase

### Option A: Via le Dashboard Supabase (recommandé)

1. Aller sur https://supabase.com/dashboard/project/dgcryodwrwqdxgghrjpp/sql
2. Copier le contenu de `supabase/migrations/20260201_user_events.sql`
3. Exécuter le script
4. Vérifier que les tables sont créées:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Doit inclure 'user_events'
```

### Option B: Via psql (si installé)

```bash
export SUPABASE_URL="postgresql://postgres:votre_password@db.dgcryodwrwqdxgghrjpp.supabase.co:5432/postgres"
psql $SUPABASE_URL < supabase/migrations/20260201_user_events.sql
```

---

## Déployer sur Netlify

```bash
# Commit les changements
git add .
git commit -m "feat: optimize conversion funnel with CTA, tracking, and improved paywall"

# Push sur la branche
git push origin claude/mobile-garage-finder-KHm03
```

---

## Vérifications post-déploiement

### 1. Vérifier le site en production

- [ ] Aller sur https://mymecai.com
- [ ] Créer un compte test
- [ ] Faire un diagnostic
- [ ] Vérifier le CTA Premium après diagnostic
- [ ] Vérifier le PaywallModal amélioré

### 2. Vérifier le tracking

```sql
-- Dans Supabase SQL Editor
SELECT * FROM user_events ORDER BY created_at DESC LIMIT 20;
```

### 3. Vérifier les logs Netlify

- Aller sur https://app.netlify.com (votre dashboard)
- Vérifier les logs des functions pour les erreurs

---

## Prochaines optimisations (cette semaine)

- [ ] Email automation pour abandon panier
- [ ] Exit-intent popup avec promo
- [ ] A/B test prix (9.99€ vs 7.99€)
- [ ] Témoignages sur landing page
- [ ] Compteur live "X utilisateurs actifs"

---

## Métriques à suivre

### Dashboard Supabase - Requêtes utiles

```sql
-- Funnel de conversion (derniers 7 jours)
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- Taux de conversion par jour
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'signup_completed' THEN user_id END) as signups,
  COUNT(DISTINCT CASE WHEN event_type = 'diagnostic_completed' THEN user_id END) as diagnostics,
  COUNT(DISTINCT CASE WHEN event_type = 'paywall_viewed' THEN user_id END) as paywall_views,
  COUNT(DISTINCT CASE WHEN event_type = 'subscription_created' THEN user_id END) as subscriptions
FROM user_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Contacts urgence

- Supabase Dashboard: https://supabase.com/dashboard/project/dgcryodwrwqdxgghrjpp
- Stripe Dashboard: https://dashboard.stripe.com
- Netlify Dashboard: https://app.netlify.com

---

*Dernière mise à jour: 2026-02-01*
