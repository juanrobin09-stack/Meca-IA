-- Migration: Create user_events table for conversion tracking
-- Date: 2026-02-01
-- Purpose: Track user events through the conversion funnel

-- ============================================
-- 1. CREATE USER_EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE user_events IS 'Tracks user events for conversion funnel analytics';

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(session_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_events_user_type_date
  ON user_events(user_id, event_type, created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 4. ANALYTICS VIEWS (for admin dashboard)
-- ============================================

-- Daily conversion funnel view
CREATE OR REPLACE VIEW daily_conversion_funnel AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'signup_completed' THEN user_id END) as signups,
  COUNT(DISTINCT CASE WHEN event_type = 'onboarding_completed' THEN user_id END) as onboarded,
  COUNT(DISTINCT CASE WHEN event_type = 'first_diagnostic_completed' THEN user_id END) as first_diagnostic,
  COUNT(DISTINCT CASE WHEN event_type = 'freemium_limit_reached' THEN user_id END) as limit_reached,
  COUNT(DISTINCT CASE WHEN event_type = 'paywall_viewed' THEN user_id END) as paywall_views,
  COUNT(DISTINCT CASE WHEN event_type = 'stripe_checkout_opened' THEN user_id END) as checkout_opened,
  COUNT(DISTINCT CASE WHEN event_type = 'subscription_created' THEN user_id END) as subscribed
FROM user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Event counts by type (last 7 days)
CREATE OR REPLACE VIEW event_summary AS
SELECT
  event_type,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_occurrence
FROM user_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total_count DESC;

-- ============================================
-- 5. ADD last_activity_at TO PROFILES
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- Update last_activity_at on login
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_activity_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update activity on login event
DROP TRIGGER IF EXISTS on_user_login ON user_events;
CREATE TRIGGER on_user_login
  AFTER INSERT ON user_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'login_completed')
  EXECUTE FUNCTION update_last_activity();

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT ON user_events TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- DONE
-- ============================================
