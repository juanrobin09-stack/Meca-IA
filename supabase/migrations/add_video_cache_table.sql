-- ============================================
-- MIGRATION: Add video_diagnostic cache table
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Create video_diagnostic table (cache for consistency)
-- This is DIFFERENT from video_diagnostics (user history)
-- ============================================
CREATE TABLE IF NOT EXISTS video_diagnostic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_hash TEXT NOT NULL,
  video_url TEXT,
  analyse_resultat JSONB NOT NULL,
  confiance_score NUMERIC(3,2),
  cree_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint to ensure one analysis per user per video
  CONSTRAINT unique_user_video_hash UNIQUE (utilisateur_id, video_hash)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_video_diagnostic_user ON video_diagnostic(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_video_diagnostic_hash ON video_diagnostic(video_hash);
CREATE INDEX IF NOT EXISTS idx_video_diagnostic_created ON video_diagnostic(cree_at DESC);

-- Enable RLS
ALTER TABLE video_diagnostic ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_diagnostic cache
DROP POLICY IF EXISTS "Users can view own video cache" ON video_diagnostic;
CREATE POLICY "Users can view own video cache" ON video_diagnostic
  FOR SELECT USING (auth.uid() = utilisateur_id);

DROP POLICY IF EXISTS "Users can insert own video cache" ON video_diagnostic;
CREATE POLICY "Users can insert own video cache" ON video_diagnostic
  FOR INSERT WITH CHECK (auth.uid() = utilisateur_id);

DROP POLICY IF EXISTS "Users can update own video cache" ON video_diagnostic;
CREATE POLICY "Users can update own video cache" ON video_diagnostic
  FOR UPDATE USING (auth.uid() = utilisateur_id);

DROP POLICY IF EXISTS "Users can delete own video cache" ON video_diagnostic;
CREATE POLICY "Users can delete own video cache" ON video_diagnostic
  FOR DELETE USING (auth.uid() = utilisateur_id);

-- ============================================
-- 2. Ensure video_diagnostics table has all necessary policies
-- ============================================
ALTER TABLE video_diagnostics ENABLE ROW LEVEL SECURITY;

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
-- 3. Ensure devis_analyses has DELETE policy
-- ============================================
ALTER TABLE devis_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devis" ON devis_analyses;
CREATE POLICY "Users can view own devis" ON devis_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devis" ON devis_analyses;
CREATE POLICY "Users can insert own devis" ON devis_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own devis" ON devis_analyses;
CREATE POLICY "Users can update own devis" ON devis_analyses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own devis" ON devis_analyses;
CREATE POLICY "Users can delete own devis" ON devis_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- END OF MIGRATION
-- ============================================
