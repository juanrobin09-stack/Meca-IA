-- Migration: Ajout colonnes consentement RGPD dans la table profiles
-- Date: 2026-01-23
-- Description: Conforme RGPD - stockage du consentement explicite utilisateur

-- Ajouter colonnes consentement dans profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.terms_accepted IS 'Consentement CGU (RGPD) - true si accepté';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Date et heure du consentement CGU';
COMMENT ON COLUMN profiles.terms_version IS 'Version des CGU acceptées';
COMMENT ON COLUMN profiles.privacy_accepted IS 'Consentement traitement données personnelles (RGPD)';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Date et heure du consentement traitement données';
COMMENT ON COLUMN profiles.marketing_consent IS 'Consentement marketing (optionnel)';
COMMENT ON COLUMN profiles.marketing_consent_at IS 'Date et heure du consentement marketing';

-- Index pour requêtes de conformité RGPD (export données, etc.)
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted ON profiles(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON profiles(marketing_consent);
