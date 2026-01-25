-- ============================================
-- MECAI - IP Tracking pour anti-abus
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- ============================================
-- TABLE: ip_tracking (suivi des IPs par compte)
-- ============================================
CREATE TABLE IF NOT EXISTS ip_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,

  -- Compteurs d'activité
  request_count INTEGER DEFAULT 1 NOT NULL,
  last_request_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Métadonnées
  user_agent TEXT,
  country_code TEXT,
  is_suspicious BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Contrainte d'unicité: une IP ne peut être liée qu'une fois à un user
  UNIQUE(user_id, ip_address)
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_ip_tracking_ip ON ip_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_user ON ip_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_suspicious ON ip_tracking(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_ip_tracking_last_request ON ip_tracking(last_request_at DESC);

-- ============================================
-- TABLE: ip_abuse_logs (logs des tentatives d'abus)
-- ============================================
CREATE TABLE IF NOT EXISTS ip_abuse_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Type d'abus détecté
  abuse_type TEXT NOT NULL CHECK (abuse_type IN (
    'too_many_accounts',      -- Trop de comptes par IP
    'rate_limit_exceeded',    -- Trop de requêtes
    'suspicious_activity',    -- Activité suspecte
    'vpn_detected',          -- VPN/Proxy détecté
    'blocked'                -- IP bloquée
  )),

  -- Détails
  details JSONB DEFAULT '{}'::jsonb,
  accounts_count INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abuse_logs_ip ON ip_abuse_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_created ON ip_abuse_logs(created_at DESC);

-- ============================================
-- TABLE: blocked_ips (IPs bloquées)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL UNIQUE,

  -- Raison du blocage
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ, -- NULL = permanent

  -- Qui a bloqué
  blocked_by TEXT DEFAULT 'system',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);

-- ============================================
-- Ajouter colonne last_ip au profil
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_ip INET;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ip_flags JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- FONCTIONS RPC pour le tracking IP
-- ============================================

-- Configuration des limites
-- MAX_ACCOUNTS_PER_IP: 3 comptes gratuits par IP
-- MAX_REQUESTS_PER_MINUTE: 30 requêtes/minute (rate limiting)
-- ABUSE_THRESHOLD_DAILY: 5 comptes/jour = flag suspicious

-- Fonction: Enregistrer/mettre à jour un accès IP
CREATE OR REPLACE FUNCTION track_ip_access(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_accounts_count INTEGER;
  v_is_blocked BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier si l'IP est bloquée
  SELECT EXISTS(
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
    AND (blocked_until IS NULL OR blocked_until > NOW())
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_blocked',
      'message', 'Cette adresse IP a été temporairement bloquée pour activité suspecte.'
    );
  END IF;

  -- Compter le nombre de comptes utilisant cette IP
  SELECT COUNT(DISTINCT user_id) INTO v_accounts_count
  FROM ip_tracking
  WHERE ip_address = p_ip_address;

  -- Insérer ou mettre à jour le tracking
  INSERT INTO ip_tracking (user_id, ip_address, user_agent, request_count, last_request_at)
  VALUES (p_user_id, p_ip_address, p_user_agent, 1, NOW())
  ON CONFLICT (user_id, ip_address) DO UPDATE SET
    request_count = ip_tracking.request_count + 1,
    last_request_at = NOW(),
    user_agent = COALESCE(p_user_agent, ip_tracking.user_agent);

  -- Mettre à jour le profil utilisateur
  UPDATE profiles SET
    last_ip = p_ip_address,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'allowed', true,
    'accounts_on_ip', v_accounts_count,
    'is_new_account_on_ip', v_accounts_count = 0
  );

  -- Vérifier si abus potentiel (plus de 3 comptes sur cette IP)
  IF v_accounts_count >= 3 THEN
    -- Marquer comme suspect
    UPDATE ip_tracking SET is_suspicious = true
    WHERE ip_address = p_ip_address;

    -- Logger l'abus
    INSERT INTO ip_abuse_logs (ip_address, user_id, abuse_type, accounts_count, details)
    VALUES (
      p_ip_address,
      p_user_id,
      'too_many_accounts',
      v_accounts_count,
      jsonb_build_object('timestamp', NOW(), 'user_agent', p_user_agent)
    );

    v_result := v_result || jsonb_build_object(
      'warning', 'multiple_accounts_detected',
      'message', 'Plusieurs comptes détectés sur cette connexion.'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fonction: Vérifier si une IP peut créer un nouveau compte
CREATE OR REPLACE FUNCTION check_ip_can_register(
  p_ip_address INET
)
RETURNS JSONB AS $$
DECLARE
  v_accounts_count INTEGER;
  v_accounts_today INTEGER;
  v_is_blocked BOOLEAN;
BEGIN
  -- Vérifier si l'IP est bloquée
  SELECT EXISTS(
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
    AND (blocked_until IS NULL OR blocked_until > NOW())
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'ip_blocked'
    );
  END IF;

  -- Compter le nombre total de comptes sur cette IP
  SELECT COUNT(DISTINCT user_id) INTO v_accounts_count
  FROM ip_tracking
  WHERE ip_address = p_ip_address;

  -- Compter les comptes créés aujourd'hui depuis cette IP
  SELECT COUNT(DISTINCT user_id) INTO v_accounts_today
  FROM ip_tracking
  WHERE ip_address = p_ip_address
  AND first_seen_at >= CURRENT_DATE;

  -- Limite: max 3 comptes par IP au total
  IF v_accounts_count >= 3 THEN
    -- Logger la tentative
    INSERT INTO ip_abuse_logs (ip_address, abuse_type, accounts_count, details)
    VALUES (
      p_ip_address,
      'too_many_accounts',
      v_accounts_count,
      jsonb_build_object('action', 'registration_blocked', 'timestamp', NOW())
    );

    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'too_many_accounts',
      'accounts_count', v_accounts_count,
      'message', 'Limite de comptes atteinte pour cette connexion.'
    );
  END IF;

  -- Limite: max 2 comptes par jour par IP
  IF v_accounts_today >= 2 THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'daily_limit_reached',
      'accounts_today', v_accounts_today,
      'message', 'Trop de comptes créés aujourd''hui. Réessayez demain.'
    );
  END IF;

  RETURN jsonb_build_object(
    'can_register', true,
    'accounts_on_ip', v_accounts_count,
    'accounts_today', v_accounts_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fonction: Obtenir les stats d'abus pour une IP
CREATE OR REPLACE FUNCTION get_ip_stats(
  p_ip_address INET
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_accounts', COUNT(DISTINCT user_id),
    'total_requests', SUM(request_count),
    'first_seen', MIN(first_seen_at),
    'last_seen', MAX(last_request_at),
    'is_suspicious', BOOL_OR(is_suspicious),
    'is_blocked', EXISTS(
      SELECT 1 FROM blocked_ips
      WHERE ip_address = p_ip_address
      AND (blocked_until IS NULL OR blocked_until > NOW())
    )
  ) INTO v_result
  FROM ip_tracking
  WHERE ip_address = p_ip_address;

  RETURN COALESCE(v_result, jsonb_build_object(
    'total_accounts', 0,
    'total_requests', 0,
    'is_suspicious', false,
    'is_blocked', false
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fonction: Vérifier si l'utilisateur est potentiellement un abuseur
CREATE OR REPLACE FUNCTION check_user_abuse_status(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_ip_count INTEGER;
  v_suspicious_ips INTEGER;
  v_result JSONB;
BEGIN
  -- Compter les IPs différentes utilisées par cet utilisateur
  SELECT
    COUNT(DISTINCT ip_address),
    COUNT(DISTINCT ip_address) FILTER (WHERE is_suspicious)
  INTO v_ip_count, v_suspicious_ips
  FROM ip_tracking
  WHERE user_id = p_user_id;

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'ips_used', v_ip_count,
    'suspicious_ips', v_suspicious_ips,
    'is_potential_abuser', v_suspicious_ips > 0
  );

  -- Ajouter un flag si beaucoup d'IPs différentes (VPN?)
  IF v_ip_count >= 5 THEN
    v_result := v_result || jsonb_build_object(
      'warning', 'many_different_ips',
      'might_use_vpn', true
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE ip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_abuse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne peuvent voir que leur propre tracking IP
DROP POLICY IF EXISTS "Users can view own ip tracking" ON ip_tracking;
CREATE POLICY "Users can view own ip tracking" ON ip_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Seul le service role peut écrire dans ces tables (via les fonctions RPC)
-- Les tables abuse_logs et blocked_ips ne sont pas accessibles aux utilisateurs

-- ============================================
-- GRANTS pour les fonctions RPC
-- ============================================
GRANT EXECUTE ON FUNCTION track_ip_access(UUID, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ip_can_register(INET) TO anon;
GRANT EXECUTE ON FUNCTION check_ip_can_register(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ip_stats(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_abuse_status(UUID) TO authenticated;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
