# AUDIT COMPLET — MECAI (mymecai.com)

> **Date :** 16 février 2026
> **Stack :** React 19 + Vite 7 + TypeScript + Tailwind CSS 3 + Framer Motion + Supabase + Claude AI
> **Hébergement :** Netlify (fonctions serverless) + Supabase (BDD/Auth)
> **Monétisation :** Stripe — 9,99€/mois ou 89€/an

---

## RÉSUMÉ EXÉCUTIF

MECAI est une PWA fonctionnelle avec un product-market fit prometteur dans le diagnostic auto IA pour le marché français. L'architecture est solide (lazy-loading, code splitting), mais l'audit révèle **12 problèmes critiques** et **23 améliorations prioritaires** qui impactent directement la rétention, la conversion et la confiance utilisateur.

### Chiffres clés

| Métrique | Valeur | Cible |
|----------|--------|-------|
| JS total | ~1.9 MB | < 1 MB |
| Chunk principal | 362 KB | < 200 KB |
| PDF libs (eager) | 577 KB | 0 KB (lazy) |
| Service Worker | ❌ Absent | ✅ Requis PWA |
| robots.txt / sitemap | ❌ Absents | ✅ Requis SEO |
| alert() natifs | 18 appels | 0 (toast) |
| Couverture analytics | TikTok Pixel seul | +GA4 minimum |
| Accessibilité WCAG | Multiple échecs Niveau A | Conformité AA |

### Top 5 actions à fort impact

1. **🔴 CRITIQUE** — Corriger le lien `/register` → `/signup` sur la page Pricing (perte directe de conversion)
2. **🔴 CRITIQUE** — Lazy-loader jsPDF + html2canvas (-577 KB au chargement initial)
3. **🔴 CRITIQUE** — Ajouter un Service Worker (PWA non-fonctionnelle sans)
4. **🟠 HAUT** — Remplacer les 18 `alert()` par des toasts (UX mobile cassée)
5. **🟠 HAUT** — Ajouter ErrorBoundary (crash = écran blanc total)

---

## PHASE 1 : PERFORMANCE, SEO & PWA

### 1.1 Performance — Bundle & Chargement

#### Analyse des chunks

| Chunk | Taille | Verdict |
|-------|--------|---------|
| `react-vendor` | ~140 KB | ✅ OK (React 19) |
| `router` | ~50 KB | ✅ OK |
| `animations` (Framer Motion) | ~120 KB | ⚠️ Gros mais utilisé partout |
| `ui` (Lucide React) | ~52 KB | ✅ OK (tree-shaken) |
| `pdfDownload` (jsPDF) | 380 KB | 🔴 CRITIQUE — eager-loaded |
| `html2canvas` | 197 KB | 🔴 CRITIQUE — eager-loaded |
| Entry chunk principal | 362 KB | 🟠 Trop gros |
| **Total JS** | **~1.9 MB** | 🔴 Objectif < 1 MB |

#### Problèmes identifiés

| # | Problème | Impact | Effort | Priorité |
|---|----------|--------|--------|----------|
| P1 | jsPDF + html2canvas chargés eager (577 KB) | 🔴 Critique | Faible | **P0** |
| P2 | `canvas-confetti` importé statiquement | 🟠 Haut | Faible | P1 |
| P3 | Google Font Inter = render-blocking stylesheet | 🟠 Haut | Faible | P1 |
| P4 | `date-fns` (24 MB) dans dependencies (0 imports côté client) | 🟡 Moyen | Faible | P2 |
| P5 | `stripe` SDK serveur dans dependencies (devrait être dans functions/) | 🟡 Moyen | Faible | P2 |
| P6 | 196 console.log/warn/error en production | 🟡 Moyen | Faible | P2 |
| P7 | Pages mortes : Chat.tsx (730L), DiagnosticPro.tsx (885L), PrevisionPannes.tsx (694L) = 2,309 lignes de code mort | 🟡 Moyen | Faible | P2 |
| P8 | Landing.tsx : 40+ animations particules simultanées sans `prefers-reduced-motion` | 🟠 Haut | Moyen | P1 |

#### Corrections recommandées

```typescript
// P1 — Lazy-load jsPDF + html2canvas
const generatePDF = async () => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])
  // ... génération PDF
}

// P2 — Lazy-load confetti
const fireConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default
  confetti({ particleCount: 100 })
}

// P3 — Google Fonts → preload + font-display
// Remplacer dans index.html :
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'" />

// P6 — Vite drop console en production
// vite.config.ts → esbuild:
esbuild: {
  drop: ['console', 'debugger'],
  legalComments: 'none',
  treeShaking: true,
}
```

### 1.2 SEO

#### État actuel

| Élément | Status | Impact SEO |
|---------|--------|------------|
| `<html lang="fr">` | ✅ OK | — |
| `<meta name="description">` | ✅ OK | — |
| `<meta name="robots" content="index, follow">` | ✅ OK | — |
| Open Graph (og:title, og:image, etc.) | ✅ OK | — |
| Twitter Card | ✅ OK | — |
| `<link rel="canonical">` | ❌ **Absent** | 🔴 Critique |
| JSON-LD / Schema.org | ❌ **Absent** | 🟠 Haut |
| `robots.txt` | ❌ **Absent** | 🔴 Critique |
| `sitemap.xml` | ❌ **Absent** | 🔴 Critique |
| Page 404 `<meta noindex>` | ❌ **Absent** | 🟡 Moyen |
| Accents français sur Landing | ❌ **Manquants** (dizaines de mots) | 🟠 Haut |

#### Fichiers à créer

```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /app/
Disallow: /auth/
Sitemap: https://mymecai.com/sitemap.xml
```

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
  <url><loc>https://mymecai.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://mymecai.com/pricing</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://mymecai.com/login</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://mymecai.com/signup</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://mymecai.com/mentions-legales</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://mymecai.com/cgu</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://mymecai.com/confidentialite</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

```html
<!-- index.html — ajouter dans <head> -->
<link rel="canonical" href="https://mymecai.com/" />
```

### 1.3 Accessibilité (WCAG 2.1)

| # | Problème | Niveau WCAG | Impact |
|---|----------|-------------|--------|
| A1 | Pas de lien "Skip to content" | A (2.4.1) | 🔴 Critique |
| A2 | Boutons icon-only sans `aria-label` (Sidebar X, password toggle, search, etc.) | A (4.1.2) | 🔴 Critique |
| A3 | Pas de `aria-live` regions pour contenu dynamique (chat, résultats) | A (4.1.3) | 🟠 Haut |
| A4 | Logo SVG sans `aria-hidden` ou `<title>` | A (1.1.1) | 🟡 Moyen |
| A5 | `text-gray-600` sur fond sombre = contraste insuffisant (AA) | AA (1.4.3) | 🟠 Haut |
| A6 | Vehicles.tsx : 6+ labels sans `htmlFor`, inputs sans `id` | A (1.3.1) | 🔴 Critique |
| A7 | MechanicChat : sélecteur véhicule sans label | A (1.3.1) | 🟡 Moyen |
| A8 | Landing.tsx : pas de landmark `<main>` | A (1.3.1) | 🟡 Moyen |

### 1.4 PWA

| Critère | Status | Note |
|---------|--------|------|
| `manifest.json` | ✅ OK | Complet avec icônes, lang, theme_color |
| `display: standalone` | ✅ OK | — |
| Service Worker | ❌ **ABSENT** | Pas de fichier sw.js, pas de registration |
| Offline support | ❌ **AUCUN** | App inutilisable hors-ligne |
| `apple-mobile-web-app-capable` | ✅ OK | Corrigé dans cette session |
| Splash screens iOS | ❌ Absent | Pas de apple-touch-startup-image |

**Verdict PWA :** Le manifest est correctement configuré mais **sans Service Worker, l'app ne passe pas l'audit PWA Lighthouse.** L'installabilité peut fonctionner sur certains navigateurs mais aucune fonctionnalité hors-ligne n'est disponible.

#### Solution recommandée

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
      ],
    },
  }),
]
```

### 1.5 Headers & Sécurité

| Header | Status | Note |
|--------|--------|------|
| X-Frame-Options: DENY | ✅ OK | — |
| X-Content-Type-Options: nosniff | ✅ OK | — |
| X-XSS-Protection | ✅ OK | — |
| Referrer-Policy | ✅ OK | strict-origin-when-cross-origin |
| Content-Security-Policy | ❌ **Absent** | 🟠 Haut — pas de CSP |
| Permissions-Policy | ⚠️ **Conflit** | `_headers` bloque geolocation, `netlify.toml` l'autorise |

**Conflit Permissions-Policy :**
- `public/_headers` : `geolocation=()` → **BLOQUE la géolocalisation**
- `netlify.toml` : `geolocation=(self)` → autorise pour le domaine

Résultat : `_headers` a priorité sur Netlify → **la fonctionnalité "Trouver un Garage" est potentiellement cassée** car elle nécessite la géolocalisation.

**Fix :** Aligner `_headers` avec `netlify.toml` :
```
Permissions-Policy: geolocation=(self), microphone=(self), camera=(self), payment=(self)
```

---

## PHASE 2 : UX/UI & DESIGN SYSTEM

### 2.1 Design System — État actuel

#### Palette de couleurs

| Usage | Couleur | Code |
|-------|---------|------|
| Brand primaire | Violet | `#7C3AED` (violet-600) |
| Brand secondaire | Cyan | `#06B6D4` (cyan-500) |
| Background | Slate très sombre | `#09090b` (gray-950) |
| Surface glass | Blanc transparent | `bg-white/[0.03]` + `backdrop-blur-xl` |
| Bordures | Blanc transparent | `border-white/10` |
| Texte primaire | Blanc | `text-white` / `text-slate-100` |
| Texte secondaire | Gris | `text-slate-400` |
| Texte tertiaire | Gris foncé | `text-slate-500` |
| Accent succès | Émeraude | `text-emerald-400` |
| Accent erreur | Rouge | `text-red-400` |

#### Tokens existants (dans `tailwind.config.js`)

- **Couleurs sémantiques :** `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover` — via CSS variables
- **Couleurs brand :** échelle complète violet 50-950 + cyan 50-950
- **Ombres custom :** `glow-sm`, `glow`, `glow-lg`, `glow-cyan`, `glass`, `glass-lg`
- **Animations custom :** 10 animations définies (gradient-x, float, pulse-glow, shimmer, etc.)
- **Breakpoints :** xs(375), sm(640), md(768), lg(1024), xl(1280), 2xl(1536)

#### Problèmes de cohérence identifiés

| # | Problème | Fichiers concernés |
|---|----------|-------------------|
| D1 | Gradients de fond de page inconsistants — certaines pages utilisent encore `bg-muted/40` | Vérifié et corrigé dans cette session |
| D2 | Mode sombre seul mais `darkMode: ["class"]` encore dans config → inutile | `tailwind.config.js` |
| D3 | Glass card pas standardisé — `bg-white/[0.03]` vs `bg-white/5` vs `bg-white/[0.02]` | Multiple pages |
| D4 | Boutons CTA : inconsistance entre violet-600 plein et gradient violet-to-cyan | Landing vs Pricing vs Sidebar |
| D5 | Texte placeholder : `text-muted-foreground` vs `text-slate-400` vs `text-gray-500` | Multiple |

### 2.2 Composants UI

#### Bibliothèque utilisée
- **Radix UI** : Dialog, Avatar, Label, Select, Separator, Slot, Tooltip
- **Lucide React** : Icônes (562+)
- **Framer Motion** : Animations et gestures
- **Custom** : Logo, PremiumBadge, LoadingSkeleton, PageTransition, PaywallModal, CookieBanner, Onboarding

#### Composants manquants

| Composant | Besoin | Priorité |
|-----------|--------|----------|
| **Toast/Notification** | Remplacer 18 `alert()` | 🔴 P0 |
| **ErrorBoundary** | Crash global → écran blanc | 🔴 P0 |
| **OfflineIndicator** | Détection réseau | 🟠 P1 |
| **ConfirmDialog** | Remplacer `confirm()` pour suppressions | 🟡 P2 |
| **EmptyState** (réutilisable) | Plusieurs pages ont des empty states ad-hoc | 🟡 P2 |

### 2.3 Mobile UX

| Aspect | Status | Note |
|--------|--------|------|
| Bottom nav (4 items + Menu) | ✅ Bien | Items pertinents, taille touch OK |
| Slide-over menu (swipe to close) | ✅ Ajouté | Framer Motion drag + velocity |
| Pull-to-refresh (Dashboard) | ✅ Ajouté | Hook custom `usePullToRefresh` |
| Safe area (notch) | ✅ OK | `pb-safe` sur nav et menu |
| Touch targets (min 44px) | ✅ OK | `min-h-[64px]` sur nav items |
| Haptic feedback | ✅ OK | `navigator.vibrate()` via `useSoundEffects` |
| Scroll prevention during gestures | ⚠️ Partiel | Touch events en `passive: true` |
| Keyboard avoidance (chat input) | ⚠️ Non vérifié | MechanicChat input peut être masqué par clavier |

### 2.4 Animations & Transitions

| Animation | Implémentation | Performance |
|-----------|---------------|-------------|
| Page transitions | Framer Motion `AnimatePresence` | ✅ OK |
| Message bubbles (chat) | CSS `animate-message-in` | ✅ OK (léger) |
| Dashboard cards | Framer Motion `staggerChildren` | ✅ OK |
| History panel (chat) | Framer Motion spring slide | ✅ OK |
| Landing particles | 40+ instances simultanées | 🔴 **PROBLÈME** |
| Sidebar hover | Framer Motion `whileHover` x4 | ✅ OK |
| Pull indicator | Inline style transform | ✅ OK |
| Confetti (success) | canvas-confetti | ⚠️ Importé statiquement |

---

## PHASE 3 : FONCTIONNALITÉS

### 3.1 Inventaire des fonctionnalités

| Fonctionnalité | Route | Status | Backend |
|----------------|-------|--------|---------|
| Chat Mécanicien | `/app/mechanic-chat` | ✅ Fonctionnel | Netlify Function `mechanic-chat` |
| Scanner un Devis | `/app/analyser-devis` | ✅ Fonctionnel | Netlify Function `analyze-quote` |
| Diagnostic Vidéo | `/app/diagnostic-video` | ⚠️ **Crash Safari** | Netlify Function `analyze-video-pro` |
| SoundScan | `/app/sound-scan` | 🔴 **SIMULÉ** | Aucun (fake delay + "coming soon") |
| Mes Véhicules | `/app/vehicules` | ✅ Fonctionnel | Supabase direct |
| Trouver un Garage | `/app/garages` | ✅ Fonctionnel | API tiers (Google Places?) |
| Pièces Auto | `/app/pieces` | ✅ Fonctionnel | API tiers |
| Historique | `/app/history` | ✅ Fonctionnel | Supabase direct |
| Paramètres | `/app/settings` | ✅ Fonctionnel | Supabase + Stripe Portal |
| Mon Compte | `/app/account` | ✅ Fonctionnel | Supabase + Stripe |
| Historique Véhicule | `/app/vehicle-history` | ✅ Fonctionnel | Supabase |

### 3.2 Bugs critiques

#### 🔴 BUG 1 : SoundScan — Fonctionnalité entièrement simulée
**Fichier :** `src/pages/SoundScan.tsx` (lignes 547-583)
**Impact :** Les utilisateurs Premium payant 9,99€/mois voient une animation de chargement fake pendant plusieurs secondes, puis reçoivent `status: 'coming_soon'`. Le `ResultCard` retourne `null` pour ce status (ligne 356).
**Risque :** Déception utilisateur, demandes de remboursement, perte de confiance.
**Recommandation :** Soit implémenter le vrai backend, soit retirer de la navigation et de la page Pricing, soit marquer clairement "Bientôt disponible" AVANT que l'utilisateur ne commence l'enregistrement.

#### 🔴 BUG 2 : DiagnosticVideo crash sur Safari/iOS
**Fichier :** `src/pages/DiagnosticVideo.tsx` (ligne 71)
**Cause :** MIME type `video/webm;codecs=vp9` hardcodé sans fallback. Safari ne supporte pas WebM.
**Fix :**
```typescript
const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
  ? 'video/webm;codecs=vp9'
  : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4'
```

#### 🔴 BUG 3 : MechanicChat — Ordre des vérifications d'erreur cassé
**Fichier :** `src/pages/MechanicChat.tsx` (lignes 229-243)
**Cause :** `result.error === true` (ligne 229) est vérifié AVANT `LIMIT_REACHED` (ligne 243). Quand la limite est atteinte, l'API retourne `error: true` + `errorType: 'LIMIT_REACHED'`, mais le premier check capture l'erreur avant que le paywall puisse s'afficher.
**Impact :** Le paywall ne s'affiche jamais quand la limite chat est atteinte → perte de conversion.
**Fix :** Vérifier `LIMIT_REACHED` en premier.

#### 🔴 BUG 4 : Pricing.tsx → `/register` = 404
**Fichier :** `src/pages/Pricing.tsx` (ligne 204)
**Cause :** `navigate('/register')` — la route n'existe pas. La bonne route est `/signup`.
**Impact :** Perte directe de conversion — un utilisateur non connecté cliquant "Commencer gratuitement" arrive sur une page 404.

#### 🟠 BUG 5 : DiagnosticVideo fuite mémoire
**Fichier :** `src/pages/DiagnosticVideo.tsx` (ligne 169)
**Cause :** `URL.createObjectURL` n'est pas `revokeObjectURL` sur le path d'erreur.

#### 🟠 BUG 6 : MechanicChat — Messages utilisateur non persistés
**Cause :** Le message utilisateur n'est pas sauvegardé en DB avant l'appel API. Si timeout ou erreur, le message disparaît de l'UI sans trace.

#### 🟠 BUG 7 : Onboarding `layoutId="progress"` dupliqué
**Fichier :** `src/components/Onboarding.tsx`
**Cause :** `layoutId="progress"` utilisé sur TOUS les dots dans un `.map()`. Le layoutId doit être unique par élément.

#### 🟠 BUG 8 : AnalyseDevis — Drop zone desktop sans handlers
**Cause :** La zone de dépôt de fichier affiche "Glissez-déposez" mais n'a pas de `onDrop`/`onDragOver` → seul le bouton "Parcourir" fonctionne.

### 3.3 Fonctionnalités manquantes

| Fonctionnalité | Impact | Effort |
|----------------|--------|--------|
| ErrorBoundary global | 🔴 Critique | Faible |
| Détection hors-ligne | 🟠 Haut | Faible |
| Toast notifications (remplacer alert) | 🔴 Critique | Moyen |
| Confirmation dialog (suppressions) | 🟡 Moyen | Faible |
| `prefers-reduced-motion` respect | 🟠 Haut | Faible |

---

## PHASE 4 : CONVERSION & MONÉTISATION

### 4.1 Tunnel de conversion actuel

```
Landing (/) → Signup (/signup) → Onboarding (modal) → Dashboard (/app)
                                                         ↓
                                                  Utilisation gratuite
                                                         ↓
                                                  Limite atteinte
                                                         ↓
                                                  PaywallModal
                                                         ↓
                                                  Checkout Stripe
                                                         ↓
                                                  PaymentSuccess → Dashboard
```

### 4.2 Points de friction identifiés

| # | Friction | Impact conversion | Fix |
|---|----------|-------------------|-----|
| C1 | **`/register` = 404** sur Pricing page CTA | 🔴 Bloquant | `/register` → `/signup` |
| C2 | **Onboarding sans upsell** — 4 étapes terminent sans CTA Premium | 🟠 Haut | Ajouter étape 5 "Passe Premium" |
| C3 | **PaywallModal ne track pas `InitiateCheckout`** — conversions in-app invisibles | 🟠 Haut | Ajouter tracking TikTok |
| C4 | **MechanicChat paywall jamais déclenché** (bug ordre erreur) | 🔴 Bloquant | Réordonner les checks |
| C5 | **SoundScan fake** — Premium déçoit | 🔴 Haut | Retirer ou implémenter |
| C6 | **"OFFRE LIMITÉE" toujours affiché** dans PaywallModal | 🟡 Moyen | Retirer ou rendre temporaire |
| C7 | **"500+ utilisateurs"** hardcodé dans PaywallModal | 🟡 Moyen | Dynamiser ou retirer |
| C8 | **Stats Landing hardcodées** (12,847 diagnostics, 342€) | 🟡 Moyen | Dynamiser ou actualiser |
| C9 | **Pas de GA4** — aucune visibilité sur le parcours utilisateur | 🟠 Haut | Ajouter GA4 |
| C10 | **2 pages de succès** (`/success` + `/payment-success`) — flux incohérent | 🟡 Moyen | Unifier |

### 4.3 Pricing

| Plan | Prix | Features clés | Verdict |
|------|------|---------------|---------|
| Gratuit | 0€ | 2 diagnostics/mois, 10 msg chat/jour, 1 devis/mois, 1 véhicule | ✅ Bon pour acquisition |
| Premium mensuel | 9,99€/mois | Tout illimité + Vidéo + SoundScan + Prioritaire | ✅ Prix correct pour le marché |
| Premium annuel | 89€/an (7,42€/mois) | Idem | ✅ -25%, "2 mois offerts" |
| Devis à l'unité | 1,99€ | 1 analyse de devis | ✅ Bon entry point |

**Observation :** Le pricing est bien structuré. Le problème n'est pas le prix mais le **funnel cassé** (bugs C1, C4) et les **opportunités ratées** (C2, C3).

### 4.4 Analytics & Tracking

| Plateforme | Installée | Events trackés |
|------------|-----------|----------------|
| TikTok Pixel | ✅ | ViewContent, CompleteRegistration, InitiateCheckout, Subscribe |
| Google Analytics | ❌ | — |
| Hotjar / PostHog | ❌ | — |
| Facebook Pixel | ❌ | — |

**Lacunes tracking :**
- `InitiateCheckout` pas appelé depuis PaywallModal (seul Pricing.tsx le track)
- `CompletePayment` et `ClickButton` définis mais jamais utilisés
- `/success` (ancien) ne track rien
- Aucun event tracking sur les fonctionnalités core (diagnostic, chat, devis)
- Pas de funnel analytics → impossible de mesurer les taux de conversion par étape

### 4.5 RGPD / Consentement

| Élément | Status |
|---------|--------|
| Cookie Banner | ✅ OK (lazy-loaded) |
| Consentement avant tracking | ✅ OK (vérifié dans `useTikTokTracking`) |
| Mentions légales | ✅ OK (`/mentions-legales`) |
| CGU | ✅ OK (`/cgu`) |
| Politique de confidentialité | ✅ OK (`/confidentialite`) |

---

## PHASE 5 : PLAN D'ACTION PRIORISÉ

### Matrice Impact / Effort

```
                    IMPACT
           Faible      Moyen       Fort
        ┌──────────┬──────────┬──────────┐
 Faible │ D2,D5    │ P6,P7    │ P1,C1,C4 │ ← QUICK WINS
        │ A4,A8    │ P5,A7    │ BUG2,BUG3│
 EFFORT ├──────────┼──────────┼──────────┤
 Moyen  │ C6,C7    │ A1,A2,A6 │ Toast,EB │
        │ C10      │ P3,P8    │ C2,C3,C9 │
        ├──────────┼──────────┼──────────┤
  Fort  │          │ BUG6,BUG8│ SW(PWA)  │
        │          │          │ SoundScan│
        └──────────┴──────────┴──────────┘
```

### Roadmap 4 semaines

#### Semaine 1 — Quick Wins & Bugs critiques
> **Objectif : Débloquer la conversion et éliminer les crashs**

| # | Tâche | Type | Effort | Impact |
|---|-------|------|--------|--------|
| 1 | Fix `/register` → `/signup` dans Pricing.tsx | Bug | 5 min | 🔴 Conversion |
| 2 | Fix ordre error check dans MechanicChat.tsx | Bug | 15 min | 🔴 Conversion |
| 3 | Lazy-load jsPDF + html2canvas (−577 KB) | Perf | 30 min | 🔴 Performance |
| 4 | Ajouter ErrorBoundary global | Feature | 30 min | 🔴 Stabilité |
| 5 | Fix DiagnosticVideo MIME type Safari | Bug | 15 min | 🔴 Compatibilité |
| 6 | Lazy-load canvas-confetti | Perf | 10 min | 🟠 Performance |
| 7 | Créer robots.txt + sitemap.xml | SEO | 15 min | 🔴 SEO |
| 8 | Ajouter `<link rel="canonical">` | SEO | 5 min | 🔴 SEO |
| 9 | Fix Permissions-Policy conflit (geolocation) | Bug | 5 min | 🟠 Fonctionnel |
| 10 | Ajouter `esbuild.drop: ['console']` | Perf | 5 min | 🟡 Propreté |

#### Semaine 2 — UX & Accessibilité
> **Objectif : Polir l'expérience mobile et l'accessibilité**

| # | Tâche | Type | Effort | Impact |
|---|-------|------|--------|--------|
| 11 | Installer `sonner` et remplacer 18 `alert()` | UX | 2h | 🔴 UX |
| 12 | Ajouter skip-to-content link | A11y | 15 min | 🔴 WCAG A |
| 13 | Ajouter aria-labels sur boutons icon-only | A11y | 1h | 🔴 WCAG A |
| 14 | Fix labels/htmlFor dans Vehicles.tsx | A11y | 30 min | 🔴 WCAG A |
| 15 | Ajouter `prefers-reduced-motion` check | A11y | 30 min | 🟠 A11y |
| 16 | Fix Landing.tsx accents français manquants | Contenu | 1h | 🟠 SEO |
| 17 | Google Font → preload async | Perf | 15 min | 🟠 Performance |
| 18 | Ajouter `<main>` landmark sur Landing | A11y | 10 min | 🟡 WCAG |
| 19 | Fix Onboarding layoutId dupliqué | Bug | 10 min | 🟡 UX |
| 20 | Nettoyer pages mortes (Chat, DiagnosticPro, PrevisionPannes) | Maintenabilité | 30 min | 🟡 Code |

#### Semaine 3 — Conversion & Tracking
> **Objectif : Maximiser la monétisation et la visibilité analytics**

| # | Tâche | Type | Effort | Impact |
|---|-------|------|--------|--------|
| 21 | Ajouter étape upsell dans Onboarding | Conversion | 1h | 🟠 Revenue |
| 22 | Ajouter `trackInitiateCheckout` dans PaywallModal | Tracking | 15 min | 🟠 Analytics |
| 23 | Ajouter GA4 (ou PostHog) | Analytics | 2h | 🟠 Visibilité |
| 24 | Tracker events core (diagnostic, chat, devis) | Analytics | 1h | 🟠 Mesurabilité |
| 25 | Unifier pages success → `/payment-success` seul | UX | 1h | 🟡 Cohérence |
| 26 | SoundScan : afficher "Bientôt" AVANT enregistrement | UX/Honnêteté | 30 min | 🔴 Confiance |
| 27 | Fix AnalyseDevis drag-and-drop handlers | Bug | 30 min | 🟡 UX |
| 28 | Persister messages MechanicChat avant API call | Bug | 1h | 🟠 Fiabilité |
| 29 | Ajouter détection hors-ligne | UX | 1h | 🟡 UX |
| 30 | Déplacer `date-fns` + `stripe` (server) hors dependencies | Perf | 15 min | 🟡 Bundle |

#### Semaine 4 — PWA & Polish
> **Objectif : PWA complète, performance optimale**

| # | Tâche | Type | Effort | Impact |
|---|-------|------|--------|--------|
| 31 | Installer `vite-plugin-pwa` + configurer Service Worker | PWA | 3h | 🔴 PWA |
| 32 | Cache strategies (fonts, assets, API responses) | PWA | 2h | 🟠 Offline |
| 33 | Ajouter JSON-LD Schema.org sur Landing | SEO | 1h | 🟠 SEO |
| 34 | Ajouter CSP header | Sécurité | 1h | 🟠 Sécurité |
| 35 | Ajouter `<meta noindex>` sur page 404 | SEO | 5 min | 🟡 SEO |
| 36 | Ajouter splash screens iOS (apple-touch-startup-image) | PWA | 1h | 🟡 iOS |
| 37 | Audit Lighthouse final + corrections | QA | 2h | ✅ Validation |

---

## MÉTRIQUES DE SUCCÈS

| Métrique | Avant audit | Objectif S4 |
|----------|-------------|-------------|
| Lighthouse Performance | ~55-65 (estimé) | > 85 |
| Lighthouse SEO | ~70 (estimé) | > 95 |
| Lighthouse Accessibility | ~60 (estimé) | > 90 |
| Lighthouse PWA | ❌ Fail | ✅ Pass |
| Bundle JS initial | ~1.9 MB | < 1.2 MB |
| Conversion Pricing → Signup | 0% (lien cassé) | Mesurable |
| Paywall → Checkout (chat) | 0% (bug) | Mesurable |
| alert() natifs | 18 | 0 |
| Pages mortes | 2,309 lignes | 0 |

---

## ANNEXE : ARCHITECTURE ROUTES

```
/                        → Landing (public, AuthRedirect)
/login                   → Login (public, AuthRedirect)
/signup                  → Signup (public, AuthRedirect)
/pricing                 → Pricing (public)
/auth/callback           → AuthCallback (public)
/reset-password          → ResetPassword (public)
/email-confirmation      → EmailConfirmation (public)
/mentions-legales        → MentionsLegales (public)
/cgu                     → CGU (public)
/confidentialite         → Confidentialite (public)
/app                     → Dashboard (protected)
/app/mechanic-chat       → MechanicChat (protected)
/app/analyser-devis      → AnalyseDevis (protected)
/app/diagnostic-video    → DiagnosticVideo (protected, premium)
/app/sound-scan          → SoundScan (protected, premium)
/app/vehicules           → Vehicles (protected)
/app/garages             → Garages (protected)
/app/pieces              → Pieces (protected)
/app/history             → History (protected)
/app/settings            → Settings (protected)
/app/account             → Account (protected)
/app/vehicle-history     → VehicleHistory (protected)
/success                 → Success (protected)
/payment-success         → PaymentSuccess (protected)
/app/chat                → Redirect → /app/mechanic-chat
/app/chat/:id            → Redirect → /app/mechanic-chat
/app/diagnostic-pro      → Redirect → /app
/app/prevision-pannes    → Redirect → /app
*                        → NotFound (404)
```

## ANNEXE : DEPENDENCIES (28 prod + 14 dev)

<details>
<summary>Liste complète des dépendances</summary>

**Production (28):**
- @anthropic-ai/sdk ^0.71.2
- @netlify/functions ^5.1.2
- @radix-ui/react-avatar, dialog, label, select, separator, slot, tooltip
- @stripe/stripe-js ^8.6.1
- @supabase/supabase-js ^2.90.1
- canvas-confetti ^1.9.4
- class-variance-authority ^0.7.1
- clsx ^2.1.1
- date-fns ^4.1.0 ⚠️ (inutilisé côté client)
- framer-motion ^12.26.2
- jspdf ^4.0.0 🔴 (à lazy-loader)
- leaflet ^1.9.4 + react-leaflet ^5.0.0
- lucide-react ^0.562.0
- react ^19.2.0 + react-dom ^19.2.0
- react-markdown ^10.1.0
- react-router-dom ^7.12.0
- stripe ^20.2.0 ⚠️ (SDK serveur dans prod deps)
- tailwind-merge ^3.4.0
- zustand ^5.0.10

**Développement (14):**
- @vitejs/plugin-react, eslint, typescript, vite, postcss, autoprefixer, tailwindcss, tailwindcss-animate, sharp, types/*

</details>

---

*Rapport généré le 16/02/2026 — Audit MECAI v1.0*
*Branch : `claude/redesign-mecai-app-shr02`*
