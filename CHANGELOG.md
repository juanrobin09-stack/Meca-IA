# Changelog MecaIA

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

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
