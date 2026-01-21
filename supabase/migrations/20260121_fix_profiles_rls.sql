-- ============================================
-- Migration: Fix profiles RLS policies
-- Date: 2026-01-21
-- Description: Add INSERT policy for profiles table
--              to allow user signup upsert to work
-- ============================================

-- Drop existing policies and recreate with ALL permissions
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- Single policy that covers SELECT, INSERT, UPDATE for user's own profile
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
