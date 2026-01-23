-- MecaIA Premium Tier Database Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX: Atomic increment functions for counters
-- ============================================

-- Atomic increment for diagnostic counter (prevents race conditions)
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

-- Atomic increment for devis counter
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

-- Check and reset counters if new month (atomic operation)
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

  -- Check if different month
  IF v_reset_date IS NULL OR
     DATE_TRUNC('month', v_reset_date) < DATE_TRUNC('month', NOW()) THEN
    -- Reset counters
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

-- ============================================
-- PREMIUM FEATURE: Vehicle limit based on subscription
-- Free: 1 vehicle, Premium: 5 vehicles
-- ============================================
CREATE OR REPLACE FUNCTION check_vehicle_limit()
RETURNS TRIGGER AS $$
DECLARE
  vehicle_count INTEGER;
  user_status TEXT;
  max_vehicles INTEGER;
BEGIN
  -- Get user's subscription status
  SELECT COALESCE(subscription_status, 'free') INTO user_status
  FROM public.profiles WHERE id = NEW.user_id;

  -- Count existing vehicles
  SELECT COUNT(*) INTO vehicle_count
  FROM public.vehicles WHERE user_id = NEW.user_id;

  -- Set max based on status (Free: 1, Premium: 5)
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

DROP TRIGGER IF EXISTS enforce_vehicle_limit ON vehicles;
CREATE TRIGGER enforce_vehicle_limit
BEFORE INSERT ON vehicles
FOR EACH ROW EXECUTE FUNCTION check_vehicle_limit();

-- Table for vehicles (Premium: up to 5, Free: 1)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  fuel_type TEXT,
  mileage INTEGER,
  plate TEXT,
  last_service_date DATE,
  next_service_mileage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for maintenance reminders (Premium feature)
CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  due_date DATE,
  due_mileage INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON maintenance_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON maintenance_reminders(vehicle_id);

-- Row Level Security (RLS) policies

-- Vehicles: users can only access their own vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

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

-- Maintenance reminders: users can only access their own reminders
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON maintenance_reminders;
CREATE POLICY "Users can view own reminders" ON maintenance_reminders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminders" ON maintenance_reminders;
CREATE POLICY "Users can insert own reminders" ON maintenance_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON maintenance_reminders;
CREATE POLICY "Users can update own reminders" ON maintenance_reminders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON maintenance_reminders;
CREATE POLICY "Users can delete own reminders" ON maintenance_reminders
  FOR DELETE USING (auth.uid() = user_id);
