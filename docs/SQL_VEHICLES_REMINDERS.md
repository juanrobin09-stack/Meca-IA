# SQL Schema - Vehicles & Reminders

Execute ces scripts dans Supabase SQL Editor pour créer les tables `vehicles` et `maintenance_reminders`.

## Table `vehicles`

```sql
-- ============================================
-- TABLE VEHICLES
-- ============================================
DROP TABLE IF EXISTS vehicles CASCADE;

CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL')),
  mileage INTEGER DEFAULT 0,
  plate TEXT,
  vin TEXT,
  color TEXT,
  purchase_date DATE,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Table `maintenance_reminders`

```sql
-- ============================================
-- TABLE MAINTENANCE REMINDERS
-- ============================================
DROP TABLE IF EXISTS maintenance_reminders CASCADE;

CREATE TABLE maintenance_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vidange', 'ct', 'pneus', 'freins', 'distribution', 'climatisation', 'batterie', 'autre')),
  due_date DATE NOT NULL,
  due_mileage INTEGER,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_reminders_user_id ON maintenance_reminders(user_id);
CREATE INDEX idx_reminders_vehicle_id ON maintenance_reminders(vehicle_id);
CREATE INDEX idx_reminders_due_date ON maintenance_reminders(due_date);
CREATE INDEX idx_reminders_not_completed ON maintenance_reminders(user_id) WHERE NOT is_completed;

-- RLS
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON maintenance_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON maintenance_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON maintenance_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON maintenance_reminders;

CREATE POLICY "Users can view own reminders" ON maintenance_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON maintenance_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON maintenance_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON maintenance_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_reminders_updated_at ON maintenance_reminders;
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON maintenance_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Fonctions RPC pour compteurs atomiques

```sql
-- ============================================
-- FONCTIONS RPC POUR COMPTEURS ATOMIQUES
-- ============================================

-- Fonction pour incrémenter le compteur de diagnostics
CREATE OR REPLACE FUNCTION increment_diagnostic_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET free_diagnostics_used = free_diagnostics_used + 1
  WHERE id = p_user_id
  RETURNING free_diagnostics_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de devis
CREATE OR REPLACE FUNCTION increment_devis_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET free_devis_used = free_devis_used + 1
  WHERE id = p_user_id
  RETURNING free_devis_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Script complet (tout en une fois)

```sql
-- EXÉCUTER CE SCRIPT EN UNE FOIS DANS SUPABASE

-- Vehicles
DROP TABLE IF EXISTS maintenance_reminders CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  fuel_type TEXT NOT NULL,
  mileage INTEGER DEFAULT 0,
  plate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- Maintenance Reminders
CREATE TABLE maintenance_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_mileage INTEGER,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON maintenance_reminders(user_id);
CREATE INDEX idx_reminders_vehicle_id ON maintenance_reminders(vehicle_id);
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON maintenance_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON maintenance_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON maintenance_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON maintenance_reminders FOR DELETE USING (auth.uid() = user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_reminders_updated_at ON maintenance_reminders;
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON maintenance_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_diagnostic_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE profiles SET free_diagnostics_used = free_diagnostics_used + 1 WHERE id = p_user_id RETURNING free_diagnostics_used INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_devis_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE profiles SET free_devis_used = free_devis_used + 1 WHERE id = p_user_id RETURNING free_devis_used INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
