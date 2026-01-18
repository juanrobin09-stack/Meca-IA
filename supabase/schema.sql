-- ============================================
-- MECAI - Schémas SQL pour Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles (utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  city TEXT,

  -- Freemium limits
  free_diagnostics_used INTEGER DEFAULT 0 NOT NULL,
  free_diagnostics_reset_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  free_devis_used INTEGER DEFAULT 0 NOT NULL,
  free_chat_messages_today INTEGER DEFAULT 0 NOT NULL,
  free_chat_reset_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Purchased credits (one-time purchases)
  purchased_diagnostic_credits INTEGER DEFAULT 0 NOT NULL,
  purchased_devis_credits INTEGER DEFAULT 0 NOT NULL,
  purchased_chat_credits INTEGER DEFAULT 0 NOT NULL,

  -- Subscription
  subscription_status TEXT DEFAULT 'free' NOT NULL CHECK (subscription_status IN ('free', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_ends_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche rapide par email et stripe
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ============================================
-- TABLE: vehicles (véhicules)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Infos véhicule
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  license_plate TEXT,
  vin TEXT,
  mileage INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('essence', 'diesel', 'hybride', 'electrique', 'gpl', 'autre')),

  -- Métadonnées
  is_primary BOOLEAN DEFAULT false,
  nickname TEXT,
  image_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

-- ============================================
-- TABLE: diagnostics (historique des diagnostics IA)
-- ============================================
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Infos véhicule (snapshot au moment du diagnostic)
  car_brand TEXT,
  car_model TEXT,
  car_year INTEGER,
  car_mileage INTEGER,

  -- Diagnostic
  problem_description TEXT NOT NULL,
  conversation JSONB DEFAULT '[]'::jsonb NOT NULL,
  diagnosis_summary TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high')),
  estimated_cost_min NUMERIC(10,2),
  estimated_cost_max NUMERIC(10,2),

  -- Type de diagnostic
  diagnostic_type TEXT DEFAULT 'text' CHECK (diagnostic_type IN ('text', 'image', 'video')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_user ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created ON diagnostics(created_at DESC);

-- ============================================
-- TABLE: chat_conversations (conversations chat mécanicien)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Métadonnées
  title TEXT,
  is_resolved BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

-- ============================================
-- TABLE: chat_messages (messages du chat mécanicien)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Message
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- ============================================
-- TABLE: devis_analyses (analyses de devis)
-- ============================================
CREATE TABLE IF NOT EXISTS devis_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Infos devis
  garage_name TEXT,
  original_amount NUMERIC(10,2),
  analyzed_amount NUMERIC(10,2),
  potential_savings NUMERIC(10,2),

  -- Analyse
  image_url TEXT,
  analysis_result JSONB,
  recommendation TEXT,
  is_fair_price BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devis_user ON devis_analyses(user_id);

-- ============================================
-- TABLE: mechanic_chats (conversations chat mécanicien)
-- ============================================
CREATE TABLE IF NOT EXISTS mechanic_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Conversation
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  topic TEXT,
  is_resolved BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mechanic_chats_user ON mechanic_chats(user_id);

-- ============================================
-- TABLE: payments (paiements Stripe)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe
  stripe_payment_id TEXT NOT NULL UNIQUE,
  stripe_invoice_id TEXT,

  -- Montant
  amount INTEGER NOT NULL, -- en centimes
  currency TEXT DEFAULT 'eur' NOT NULL,

  -- Type et statut
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'one_time')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Description
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_id);

-- ============================================
-- TABLE: pannes_predictions (prévisions de pannes - Premium)
-- ============================================
CREATE TABLE IF NOT EXISTS pannes_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Prédiction
  component TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predicted_failure_km INTEGER,
  predicted_failure_date DATE,
  confidence_score NUMERIC(3,2),

  -- Recommandation
  recommendation TEXT,
  estimated_repair_cost_min NUMERIC(10,2),
  estimated_repair_cost_max NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_acknowledged BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_predictions_vehicle ON pannes_predictions(vehicle_id);

-- ============================================
-- FONCTIONS RPC pour incréments atomiques
-- ============================================

-- Incrémenter le compteur de diagnostics
CREATE OR REPLACE FUNCTION increment_diagnostic_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET
    free_diagnostics_used = free_diagnostics_used + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING free_diagnostics_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter le compteur de devis
CREATE OR REPLACE FUNCTION increment_devis_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET
    free_devis_used = free_devis_used + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING free_devis_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter le compteur de messages chat
CREATE OR REPLACE FUNCTION increment_chat_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  current_reset TIMESTAMPTZ;
BEGIN
  -- Vérifier si on doit reset (nouveau jour)
  SELECT free_chat_reset_at INTO current_reset FROM profiles WHERE id = p_user_id;

  IF current_reset::date < CURRENT_DATE THEN
    -- Reset le compteur
    UPDATE profiles
    SET
      free_chat_messages_today = 1,
      free_chat_reset_at = NOW(),
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING free_chat_messages_today INTO new_count;
  ELSE
    -- Incrémenter
    UPDATE profiles
    SET
      free_chat_messages_today = free_chat_messages_today + 1,
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING free_chat_messages_today INTO new_count;
  END IF;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réinitialiser les compteurs mensuels
CREATE OR REPLACE FUNCTION reset_monthly_counters(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    free_diagnostics_used = 0,
    free_devis_used = 0,
    free_diagnostics_reset_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTIONS RPC pour crédits achetés
-- ============================================

-- Ajouter un crédit diagnostic
CREATE OR REPLACE FUNCTION add_diagnostic_credit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE profiles
  SET
    purchased_diagnostic_credits = purchased_diagnostic_credits + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_diagnostic_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter un crédit devis
CREATE OR REPLACE FUNCTION add_devis_credit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE profiles
  SET
    purchased_devis_credits = purchased_devis_credits + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_devis_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter des crédits chat
CREATE OR REPLACE FUNCTION add_chat_credits(p_user_id UUID, p_credits INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE profiles
  SET
    purchased_chat_credits = purchased_chat_credits + p_credits,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_chat_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utiliser un crédit diagnostic (retourne true si ok, false si pas de crédit)
CREATE OR REPLACE FUNCTION use_diagnostic_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_diagnostic_credits INTO current_credits
  FROM profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE profiles
    SET
      purchased_diagnostic_credits = purchased_diagnostic_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utiliser un crédit devis (retourne true si ok, false si pas de crédit)
CREATE OR REPLACE FUNCTION use_devis_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_devis_credits INTO current_credits
  FROM profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE profiles
    SET
      purchased_devis_credits = purchased_devis_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utiliser un crédit chat (retourne true si ok, false si pas de crédit)
CREATE OR REPLACE FUNCTION use_chat_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_chat_credits INTO current_credits
  FROM profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE profiles
    SET
      purchased_chat_credits = purchased_chat_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Créer un profil quand un user s'inscrit
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: Mettre à jour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables avec updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diagnostics_updated_at ON diagnostics;
CREATE TRIGGER update_diagnostics_updated_at
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mechanic_chats_updated_at ON mechanic_chats;
CREATE TRIGGER update_mechanic_chats_updated_at
  BEFORE UPDATE ON mechanic_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pannes_predictions ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour vehicles
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour diagnostics
DROP POLICY IF EXISTS "Users can view own diagnostics" ON diagnostics;
CREATE POLICY "Users can view own diagnostics" ON diagnostics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own diagnostics" ON diagnostics;
CREATE POLICY "Users can insert own diagnostics" ON diagnostics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own diagnostics" ON diagnostics;
CREATE POLICY "Users can update own diagnostics" ON diagnostics
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour devis_analyses
DROP POLICY IF EXISTS "Users can view own devis" ON devis_analyses;
CREATE POLICY "Users can view own devis" ON devis_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devis" ON devis_analyses;
CREATE POLICY "Users can insert own devis" ON devis_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour chat_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON chat_conversations;
CREATE POLICY "Users can insert own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;
CREATE POLICY "Users can delete own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour chat_messages
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour payments (lecture seule)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Policies pour pannes_predictions
DROP POLICY IF EXISTS "Users can view own predictions" ON pannes_predictions;
CREATE POLICY "Users can view own predictions" ON pannes_predictions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- GRANT permissions aux fonctions RPC
-- ============================================
GRANT EXECUTE ON FUNCTION increment_diagnostic_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_devis_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_chat_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_counters(UUID) TO authenticated;

-- Grants pour les crédits achetés
GRANT EXECUTE ON FUNCTION add_diagnostic_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_devis_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chat_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_diagnostic_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_devis_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_chat_credit(UUID) TO authenticated;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Pour vérifier que tout est bien créé:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
