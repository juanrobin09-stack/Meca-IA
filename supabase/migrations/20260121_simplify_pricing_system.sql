-- ============================================
-- MIGRATION: Simplification du système de tarification
-- Date: 2026-01-21
-- ============================================
--
-- SYSTÈME DE TARIFICATION SIMPLIFIÉ:
--
-- GRATUIT:
--   - 2 diagnostics complets/mois (conversation illimitée DANS le diagnostic)
--   - 10 messages chat mécanicien/jour
--   - 1 analyse devis/mois
--
-- PREMIUM (9,99€/mois):
--   - Diagnostics illimités
--   - Chat illimité
--   - Analyses devis illimitées
--
-- IMPORTANT: PAS de limite "messages par diagnostic" !
-- 1 diagnostic = 1 session = conversation complète illimitée
-- Le compteur +1 se fait seulement à la CRÉATION d'un nouveau diagnostic
--
-- ============================================

-- Cette migration est informative, le schéma actuel est déjà correct.
-- Les compteurs existants dans la table profiles sont:
--
-- free_diagnostics_used: Nombre de diagnostics créés ce mois (+1 à chaque NOUVELLE session)
-- free_devis_used: Nombre d'analyses de devis ce mois
-- free_chat_messages_today: Nombre de messages chat mécanicien aujourd'hui
--
-- Le reset se fait:
-- - Mensuellement pour: free_diagnostics_used, free_devis_used
-- - Journalièrement pour: free_chat_messages_today

-- Ajouter un commentaire sur la table pour documentation
COMMENT ON COLUMN profiles.free_diagnostics_used IS
  'Nombre de diagnostics créés ce mois. +1 à la CRÉATION d''un diagnostic, pas par message. Illimité pour premium.';

COMMENT ON COLUMN profiles.free_devis_used IS
  'Nombre d''analyses de devis ce mois. Limite: 1 gratuit/mois, illimité pour premium.';

COMMENT ON COLUMN profiles.free_chat_messages_today IS
  'Nombre de messages envoyés au chat mécanicien aujourd''hui. Limite: 10 gratuits/jour, illimité pour premium.';

-- ============================================
-- RÉSUMÉ DU SYSTÈME (pour référence)
-- ============================================
--
-- Page Chat.tsx (Diagnostic IA):
--   - Compteur: free_diagnostics_used
--   - Limite gratuit: 2/mois
--   - Messages DANS un diagnostic: ILLIMITÉS
--   - Reset: mensuel (free_diagnostics_reset_at)
--
-- Page MechanicChat.tsx (Chat mécanicien):
--   - Compteur: free_chat_messages_today
--   - Limite gratuit: 10/jour
--   - Reset: journalier (free_chat_reset_at)
--
-- Page AnalyseDevis.tsx:
--   - Compteur: free_devis_used
--   - Limite gratuit: 1/mois
--   - Reset: mensuel (free_diagnostics_reset_at - partagé avec diagnostics)
--
-- ============================================
