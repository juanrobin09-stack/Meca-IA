-- ============================================
-- Migration: Add diagnostic_pro_sessions table
-- Date: 2026-01-21
-- Description: Table for PRO diagnostic sessions with
--              web search, image analysis, and TSB lookup
-- ============================================

-- ============================================
-- TABLE: diagnostic_pro_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS diagnostic_pro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session info
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),

  -- Conversation
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,

  -- Diagnosis results
  diagnosis_summary TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('faible', 'moyen', 'urgent')),
  estimated_cost_min NUMERIC(10,2),
  estimated_cost_max NUMERIC(10,2),

  -- Full diagnosis data (includes all fields)
  final_diagnosis JSONB,

  -- Sources collected during web searches
  sources_collected JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_pro_sessions_user ON diagnostic_pro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_pro_sessions_created ON diagnostic_pro_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_pro_sessions_status ON diagnostic_pro_sessions(status);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE diagnostic_pro_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Service role bypass for functions
-- ============================================
CREATE POLICY "Service role can manage all diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Updated at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_diagnostic_pro_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_diagnostic_pro_sessions_updated_at
  BEFORE UPDATE ON diagnostic_pro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_pro_sessions_updated_at();
