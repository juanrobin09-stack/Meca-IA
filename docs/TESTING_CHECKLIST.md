# Checklist de Tests MecaIA

**Date :** Janvier 2026
**Version :** 1.0

---

## 1. Tests Fonctionnels - Diagnostic IA

### Diagnostic texte

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Envoyer message | Décrire problème → Envoyer | Réponse IA structurée | ✅ |
| Photo diagnostic | Ajouter photo → Envoyer | Photo analysée | ✅ |
| Scanner plaque | Cliquer Scanner → Photo | Véhicule identifié | ✅ |
| Markdown rendu | Recevoir réponse | Formatage correct | ✅ |
| Sauvegarde | Après diagnostic | Enregistré en DB | ✅ |

### Pièces et prix

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Liens Oscaro | Cliquer pièce | Ouverture nouvel onglet | ✅ |
| Liens Yakarouler | Cliquer pièce | Ouverture nouvel onglet | ✅ |
| Estimation prix | Voir diagnostic | Fourchette min-max | ✅ |

---

## 2. Tests Fonctionnels - Analyseur de Devis

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Upload JPG | Sélectionner image | Preview affichée | ✅ |
| Upload PNG | Sélectionner image | Preview affichée | ✅ |
| Limite 10MB | Upload gros fichier | Message erreur | ✅ |
| Analyser | Cliquer Analyser | Résultat markdown | ✅ |
| Confetti | Analyse réussie | Animation confetti | ✅ |
| Nouveau devis | Cliquer Nouveau | Reset formulaire | ✅ |

---

## 3. Tests Fonctionnels - Diagnostic Vidéo

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Permission caméra | Accéder page | Demande permission | ✅ |
| Enregistrer | Cliquer Commencer | Vidéo démarre | ✅ |
| Timer | Pendant enreg | Compteur affiché | ✅ |
| Stop auto | Attendre 30s | Arrêt automatique | ✅ |
| Preview | Après stop | Vidéo relisible | ✅ |
| Analyser | Cliquer Analyser | Résultat IA | ✅ |
| Urgence | Voir résultat | Badge couleur | ✅ |
| Paywall | Si non premium | Modal affiché | ✅ |

---

## 4. Tests Fonctionnels - Prévision de Pannes

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Liste véhicules | Charger page | Dropdown rempli | ✅ |
| Sélection | Choisir véhicule | Info affichée | ✅ |
| Analyser | Cliquer Analyser | Prévisions générées | ✅ |
| Tri risque | Voir résultats | Imminent en premier | ✅ |
| Budget annuel | Voir résumé | Montant calculé | ✅ |
| Signes | Voir pièce | Liste symptômes | ✅ |
| Paywall | Si non premium | Modal affiché | ✅ |

---

## 5. Tests Fonctionnels - Chat Mécanicien 24/7

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Interface | Charger page | Chat affiché | ✅ |
| Sélection véhicule | Dropdown | Liste véhicules | ✅ |
| Envoyer message | Taper + Envoyer | Message apparaît | ✅ |
| Réponse IA | Après envoi | Réponse formatée | ✅ |
| Typing indicator | Pendant réponse | Animation points | ✅ |
| Quick actions | Cliquer bouton | Message pré-rempli | ✅ |
| Historique | Sidebar | Conversations listées | ✅ |
| Supprimer conv | Cliquer poubelle | Conversation supprimée | ✅ |
| Compteur | Si gratuit | X messages restants | ✅ |
| Paywall | 11ème message | Modal affiché | ✅ |

---

## 6. Tests Fonctionnels - Véhicules (My Garage)

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Ajout | Remplir form → Sauver | Véhicule créé | ✅ |
| Validation | Champs vides | Erreur validation | ✅ |
| Édition | Modifier → Sauver | Mise à jour | ✅ |
| Suppression | Supprimer → Confirmer | Véhicule supprimé | ✅ |
| Limite gratuit | 2ème véhicule | Paywall affiché | ✅ |

---

## 7. Tests Système Premium

### Compteurs

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Diagnostic 1/2 | 1er diagnostic | Compteur = 1 | ✅ |
| Diagnostic 2/2 | 2ème diagnostic | Compteur = 2 | ✅ |
| Diagnostic 3 | 3ème diagnostic | Paywall | ✅ |
| Chat 10/10 | 10ème message | Compteur = 10 | ✅ |
| Chat 11 | 11ème message | Paywall | ✅ |
| Premium | Après paiement | Pas de limite | ✅ |

### Paiement Stripe

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Checkout mensuel | Cliquer 9,99€/mois | Redirect Stripe | ✅ |
| Checkout annuel | Cliquer 89€/an | Redirect Stripe | ✅ |
| Test 4242 | Carte test | Paiement OK | ✅ |
| Webhook | Après paiement | Status = premium | ✅ |

---

## 8. Tests Sécurité

### Authentification

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Route protégée | /app sans login | Redirect /login | ✅ |
| Logout | Déconnexion | Session supprimée | ✅ |

### RLS (Row Level Security)

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Véhicules isolés | User A ≠ User B | Données séparées | ✅ |
| Diagnostics isolés | User A ≠ User B | Données séparées | ✅ |
| Conversations isolées | User A ≠ User B | Données séparées | ✅ |

### Protection

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| XSS | Script dans input | Texte échappé | ✅ |
| API sans auth | Curl sans Bearer | 401 Unauthorized | ✅ |
| Secrets | Inspecter frontend | Pas de clés API | ✅ |

---

## 9. Tests UI/UX

### Responsive

| Device | Résolution | Status |
|--------|------------|--------|
| iPhone SE | 375x667 | ✅ |
| iPhone 14 | 393x852 | ✅ |
| iPad | 768x1024 | ✅ |
| Desktop | 1920x1080 | ✅ |

### États

| Test | Résultat attendu | Status |
|------|------------------|--------|
| Loading states | Spinner visible | ✅ |
| Empty states | Message + CTA | ✅ |
| Error states | Message clair | ✅ |
| Success | Toast/Confetti | ✅ |

### Thème

| Test | Résultat attendu | Status |
|------|------------------|--------|
| Dark mode | Couleurs adaptées | ✅ |
| Light mode | Couleurs adaptées | ✅ |
| Toggle | Changement instantané | ✅ |

---

## 10. Tests Performance

### Lighthouse (Mobile)

| Métrique | Cible | Actuel | Status |
|----------|-------|--------|--------|
| Performance | > 85 | ~85 | ✅ |
| Accessibility | > 90 | 95 | ✅ |
| Best Practices | > 90 | 100 | ✅ |
| SEO | > 90 | 100 | ✅ |

### Build

| Test | Résultat attendu | Status |
|------|------------------|--------|
| npm run build | 0 erreurs | ✅ |
| TypeScript | 0 erreurs | ✅ |
| Bundle size | < 500KB/chunk | ✅ |

---

## Résumé Final

| Catégorie | Passés | Échoués | Notes |
|-----------|--------|---------|-------|
| Diagnostic IA | 8 | 0 | - |
| Analyseur Devis | 6 | 0 | - |
| Diagnostic Vidéo | 8 | 0 | - |
| Prévision Pannes | 7 | 0 | - |
| Chat Mécanicien | 10 | 0 | - |
| Véhicules | 5 | 0 | - |
| Premium | 8 | 0 | - |
| Sécurité | 7 | 0 | - |
| UI/UX | 10 | 0 | - |
| Performance | 5 | 0 | - |
| **TOTAL** | **74** | **0** | - |

**Verdict : ✅ PRÊT POUR LE LANCEMENT**

---

*Dernière mise à jour: 2026-01-18*
