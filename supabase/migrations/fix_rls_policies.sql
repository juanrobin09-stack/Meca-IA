-- ============================================
-- MIGRATION: Fix RLS Policies
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Add missing DELETE policy for diagnostics
-- ============================================
DROP POLICY IF EXISTS "Users can delete own diagnostics" ON diagnostics;
CREATE POLICY "Users can delete own diagnostics" ON diagnostics
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. Add missing UPDATE/DELETE policies for devis_analyses
-- ============================================
DROP POLICY IF EXISTS "Users can update own devis" ON devis_analyses;
CREATE POLICY "Users can update own devis" ON devis_analyses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own devis" ON devis_analyses;
CREATE POLICY "Users can delete own devis" ON devis_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Create video_diagnostics table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS video_diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Diagnostic info
  probleme_identifie TEXT NOT NULL,
  description_visuelle TEXT,
  causes_possibles JSONB DEFAULT '[]'::jsonb,
  urgence TEXT CHECK (urgence IN ('faible', 'moyenne', 'élevée', 'critique')),
  pieces_concernees JSONB DEFAULT '[]'::jsonb,
  estimation_cout_min NUMERIC(10,2),
  estimation_cout_max NUMERIC(10,2),
  recommandations TEXT,

  -- Media
  thumbnail_url TEXT,
  video_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for video_diagnostics
CREATE INDEX IF NOT EXISTS idx_video_diagnostics_user ON video_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_diagnostics_created ON video_diagnostics(created_at DESC);

-- Enable RLS
ALTER TABLE video_diagnostics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Add RLS policies for video_diagnostics
-- ============================================
DROP POLICY IF EXISTS "Users can view own video diagnostics" ON video_diagnostics;
CREATE POLICY "Users can view own video diagnostics" ON video_diagnostics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own video diagnostics" ON video_diagnostics;
CREATE POLICY "Users can insert own video diagnostics" ON video_diagnostics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own video diagnostics" ON video_diagnostics;
CREATE POLICY "Users can update own video diagnostics" ON video_diagnostics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own video diagnostics" ON video_diagnostics;
CREATE POLICY "Users can delete own video diagnostics" ON video_diagnostics
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. Add verdict_type column to devis_analyses if not exists
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis_analyses' AND column_name = 'verdict_type'
  ) THEN
    ALTER TABLE devis_analyses ADD COLUMN verdict_type TEXT;
  END IF;
END $$;

-- ============================================
-- END OF MIGRATION
-- ============================================
