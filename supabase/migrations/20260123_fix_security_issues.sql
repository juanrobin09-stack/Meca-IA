-- ============================================
-- MIGRATION: Fix Security Issues
-- Date: 2026-01-23
-- Fixes:
--   1. Enable RLS on tables missing it
--   2. Fix functions with mutable search_path
--   3. Create missing tables referenced in code
-- ============================================

-- ============================================
-- 1. CREATE MISSING TABLES
-- ============================================

-- Create mechanic_conversations if it doesn't exist
-- (Referenced in aiMemoryService.ts but missing from schema)
CREATE TABLE IF NOT EXISTS mechanic_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  topic TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mechanic_conversations_user ON mechanic_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_mechanic_conversations_updated ON mechanic_conversations(updated_at DESC);

-- Create entretiens table if it doesn't exist
-- (Referenced in aiMemoryService.ts)
CREATE TABLE IF NOT EXISTS entretiens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  garage TEXT,
  cout NUMERIC(10,2),
  kilometrage INTEGER,
  pieces_changees JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  garantie_jusqu_a DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entretiens_user ON entretiens(user_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_vehicle ON entretiens(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_date ON entretiens(date DESC);

-- Create interactions_history table if it doesn't exist
-- (Referenced in aiMemoryService.ts)
CREATE TABLE IF NOT EXISTS interactions_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('diagnostic', 'chat', 'video', 'devis')),
  probleme TEXT NOT NULL,
  solution TEXT,
  cout NUMERIC(10,2),
  resolu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_history_user ON interactions_history(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_history_created ON interactions_history(created_at DESC);

-- ============================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable RLS on mechanic_chats
ALTER TABLE mechanic_chats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mechanic_conversations
ALTER TABLE mechanic_conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on entretiens
ALTER TABLE entretiens ENABLE ROW LEVEL SECURITY;

-- Enable RLS on interactions_history
ALTER TABLE interactions_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES FOR mechanic_chats
-- ============================================

DROP POLICY IF EXISTS "Users can view own mechanic_chats" ON mechanic_chats;
CREATE POLICY "Users can view own mechanic_chats" ON mechanic_chats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mechanic_chats" ON mechanic_chats;
CREATE POLICY "Users can insert own mechanic_chats" ON mechanic_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mechanic_chats" ON mechanic_chats;
CREATE POLICY "Users can update own mechanic_chats" ON mechanic_chats
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mechanic_chats" ON mechanic_chats;
CREATE POLICY "Users can delete own mechanic_chats" ON mechanic_chats
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. CREATE RLS POLICIES FOR mechanic_conversations
-- ============================================

DROP POLICY IF EXISTS "Users can view own mechanic_conversations" ON mechanic_conversations;
CREATE POLICY "Users can view own mechanic_conversations" ON mechanic_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mechanic_conversations" ON mechanic_conversations;
CREATE POLICY "Users can insert own mechanic_conversations" ON mechanic_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mechanic_conversations" ON mechanic_conversations;
CREATE POLICY "Users can update own mechanic_conversations" ON mechanic_conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mechanic_conversations" ON mechanic_conversations;
CREATE POLICY "Users can delete own mechanic_conversations" ON mechanic_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE RLS POLICIES FOR entretiens
-- ============================================

DROP POLICY IF EXISTS "Users can view own entretiens" ON entretiens;
CREATE POLICY "Users can view own entretiens" ON entretiens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own entretiens" ON entretiens;
CREATE POLICY "Users can insert own entretiens" ON entretiens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own entretiens" ON entretiens;
CREATE POLICY "Users can update own entretiens" ON entretiens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own entretiens" ON entretiens;
CREATE POLICY "Users can delete own entretiens" ON entretiens
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. CREATE RLS POLICIES FOR interactions_history
-- ============================================

DROP POLICY IF EXISTS "Users can view own interactions_history" ON interactions_history;
CREATE POLICY "Users can view own interactions_history" ON interactions_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions_history" ON interactions_history;
CREATE POLICY "Users can insert own interactions_history" ON interactions_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions_history" ON interactions_history;
CREATE POLICY "Users can update own interactions_history" ON interactions_history
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interactions_history" ON interactions_history;
CREATE POLICY "Users can delete own interactions_history" ON interactions_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- All SECURITY DEFINER functions need SET search_path = ''
-- ============================================

-- Fix increment_diagnostic_count
CREATE OR REPLACE FUNCTION increment_diagnostic_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET free_diagnostics_used = COALESCE(free_diagnostics_used, 0) + 1
  WHERE id = p_user_id
  RETURNING free_diagnostics_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix increment_devis_count
CREATE OR REPLACE FUNCTION increment_devis_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET free_devis_used = COALESCE(free_devis_used, 0) + 1
  WHERE id = p_user_id
  RETURNING free_devis_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix increment_chat_count
CREATE OR REPLACE FUNCTION increment_chat_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
  current_reset TIMESTAMPTZ;
BEGIN
  SELECT free_chat_reset_at INTO current_reset FROM public.profiles WHERE id = p_user_id;

  IF current_reset::date < CURRENT_DATE THEN
    UPDATE public.profiles
    SET
      free_chat_messages_today = 1,
      free_chat_reset_at = NOW(),
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING free_chat_messages_today INTO new_count;
  ELSE
    UPDATE public.profiles
    SET
      free_chat_messages_today = free_chat_messages_today + 1,
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING free_chat_messages_today INTO new_count;
  END IF;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix reset_monthly_counters
CREATE OR REPLACE FUNCTION reset_monthly_counters(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    free_diagnostics_used = 0,
    free_devis_used = 0,
    free_diagnostics_reset_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix check_and_reset_monthly_counters
CREATE OR REPLACE FUNCTION check_and_reset_monthly_counters(p_user_id UUID)
RETURNS TABLE(
  diagnostics_used INTEGER,
  devis_used INTEGER,
  was_reset BOOLEAN
) AS $$
DECLARE
  v_reset_date TIMESTAMP WITH TIME ZONE;
  v_diagnostics INTEGER;
  v_devis INTEGER;
  v_was_reset BOOLEAN := FALSE;
BEGIN
  SELECT
    free_diagnostics_reset_at,
    COALESCE(free_diagnostics_used, 0),
    COALESCE(free_devis_used, 0)
  INTO v_reset_date, v_diagnostics, v_devis
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_reset_date IS NULL OR
     DATE_TRUNC('month', v_reset_date) < DATE_TRUNC('month', NOW()) THEN
    UPDATE public.profiles
    SET
      free_diagnostics_used = 0,
      free_devis_used = 0,
      free_diagnostics_reset_at = NOW()
    WHERE id = p_user_id;

    v_diagnostics := 0;
    v_devis := 0;
    v_was_reset := TRUE;
  END IF;

  RETURN QUERY SELECT v_diagnostics, v_devis, v_was_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix add_diagnostic_credit
CREATE OR REPLACE FUNCTION add_diagnostic_credit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    purchased_diagnostic_credits = purchased_diagnostic_credits + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_diagnostic_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix add_devis_credit
CREATE OR REPLACE FUNCTION add_devis_credit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    purchased_devis_credits = purchased_devis_credits + 1,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_devis_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix add_chat_credits
CREATE OR REPLACE FUNCTION add_chat_credits(p_user_id UUID, p_credits INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    purchased_chat_credits = purchased_chat_credits + p_credits,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING purchased_chat_credits INTO new_credits;

  RETURN new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix use_diagnostic_credit
CREATE OR REPLACE FUNCTION use_diagnostic_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_diagnostic_credits INTO current_credits
  FROM public.profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE public.profiles
    SET
      purchased_diagnostic_credits = purchased_diagnostic_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix use_devis_credit
CREATE OR REPLACE FUNCTION use_devis_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_devis_credits INTO current_credits
  FROM public.profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE public.profiles
    SET
      purchased_devis_credits = purchased_devis_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix use_chat_credit
CREATE OR REPLACE FUNCTION use_chat_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT purchased_chat_credits INTO current_credits
  FROM public.profiles WHERE id = p_user_id;

  IF current_credits > 0 THEN
    UPDATE public.profiles
    SET
      purchased_chat_credits = purchased_chat_credits - 1,
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, display_name, subscription_status,
    free_diagnostics_used, free_devis_used,
    free_diagnostics_reset_at, created_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'free', 0, 0, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(
      public.profiles.display_name,
      EXCLUDED.display_name
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix check_vehicle_limit
CREATE OR REPLACE FUNCTION check_vehicle_limit()
RETURNS TRIGGER AS $$
DECLARE
  vehicle_count INTEGER;
  user_status TEXT;
  max_vehicles INTEGER;
BEGIN
  SELECT COALESCE(subscription_status, 'free') INTO user_status
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT COUNT(*) INTO vehicle_count
  FROM public.vehicles WHERE user_id = NEW.user_id;

  max_vehicles := CASE user_status
    WHEN 'premium' THEN 5
    ELSE 1
  END;

  IF vehicle_count >= max_vehicles THEN
    RAISE EXCEPTION 'Limite de % vehicule(s) atteinte pour votre plan', max_vehicles;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_updated_at_column (not SECURITY DEFINER but good practice)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================
-- 8. ADD TRIGGER FOR updated_at ON NEW TABLES
-- ============================================

DROP TRIGGER IF EXISTS update_mechanic_conversations_updated_at ON mechanic_conversations;
CREATE TRIGGER update_mechanic_conversations_updated_at
  BEFORE UPDATE ON mechanic_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

-- Grant execute on all functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_diagnostic_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_devis_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_chat_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_reset_monthly_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_diagnostic_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_devis_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chat_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_diagnostic_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_devis_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_chat_credit(UUID) TO authenticated;

-- ============================================
-- END OF SECURITY FIX MIGRATION
-- ============================================
