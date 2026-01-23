-- ============================================
-- MIGRATION: Fix RLS Performance Issues
-- Date: 2026-01-23
-- Fixes:
--   1. auth_rls_initplan: Wrap auth functions in subqueries for performance
--   2. multiple_permissive_policies: Consolidate duplicate policies
--   3. duplicate_index: Remove duplicate indexes
-- ============================================

-- ============================================
-- 1. FIX DUPLICATE INDEXES
-- ============================================

-- Drop duplicate indexes on diagnostics table
DROP INDEX IF EXISTS idx_diagnostics_created;
DROP INDEX IF EXISTS idx_diagnostics_user;

-- Drop duplicate indexes on payments table
DROP INDEX IF EXISTS idx_payments_stripe;
DROP INDEX IF EXISTS idx_payments_user;

-- ============================================
-- 2. FIX diagnostic_pro_sessions POLICIES
-- Issue: Multiple permissive policies + auth functions not in subqueries
-- Solution: Remove service_role policy (bypasses RLS anyway) and fix auth functions
-- ============================================

DROP POLICY IF EXISTS "Users can read own diagnostic_pro_sessions" ON diagnostic_pro_sessions;
DROP POLICY IF EXISTS "Users can insert own diagnostic_pro_sessions" ON diagnostic_pro_sessions;
DROP POLICY IF EXISTS "Users can update own diagnostic_pro_sessions" ON diagnostic_pro_sessions;
DROP POLICY IF EXISTS "Users can delete own diagnostic_pro_sessions" ON diagnostic_pro_sessions;
DROP POLICY IF EXISTS "Service role can manage all diagnostic_pro_sessions" ON diagnostic_pro_sessions;

CREATE POLICY "Users can read own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own diagnostic_pro_sessions"
  ON diagnostic_pro_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. FIX entretiens POLICIES
-- Issue: Multiple permissive policies (individual + FOR ALL)
-- Solution: Keep only FOR ALL policy with optimized auth function
-- ============================================

DROP POLICY IF EXISTS "Users can view own entretiens" ON entretiens;
DROP POLICY IF EXISTS "Users can insert own entretiens" ON entretiens;
DROP POLICY IF EXISTS "Users can update own entretiens" ON entretiens;
DROP POLICY IF EXISTS "Users can delete own entretiens" ON entretiens;
DROP POLICY IF EXISTS "Users can manage own entretiens" ON entretiens;

CREATE POLICY "Users can manage own entretiens"
  ON entretiens FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 4. FIX interactions_history POLICIES
-- Issue: Multiple permissive policies (individual + FOR ALL)
-- Solution: Keep only FOR ALL policy with optimized auth function
-- ============================================

DROP POLICY IF EXISTS "Users can view own interactions_history" ON interactions_history;
DROP POLICY IF EXISTS "Users can insert own interactions_history" ON interactions_history;
DROP POLICY IF EXISTS "Users can update own interactions_history" ON interactions_history;
DROP POLICY IF EXISTS "Users can delete own interactions_history" ON interactions_history;
DROP POLICY IF EXISTS "Users can manage own interactions" ON interactions_history;

CREATE POLICY "Users can manage own interactions"
  ON interactions_history FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 5. FIX profiles POLICIES
-- Issue: Multiple permissive policies + service role policy
-- Solution: Keep only FOR ALL policy with optimized auth function
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- 6. FIX payments POLICIES
-- Issue: Multiple permissive policies (service role + user view)
-- Solution: Remove service role policy, fix auth function
-- ============================================

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 7. FIX video_diagnoses POLICIES
-- (If table exists - might be video_diagnostics)
-- ============================================

-- Try to fix if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_diagnoses' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own video_diagnoses" ON video_diagnoses';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own video_diagnoses" ON video_diagnoses';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own video_diagnoses" ON video_diagnoses';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own video_diagnoses" ON video_diagnoses';

    EXECUTE 'CREATE POLICY "Users can manage own video_diagnoses" ON video_diagnoses FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================
-- 8. FIX video_diagnostics POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own video diagnostics" ON video_diagnostics;
DROP POLICY IF EXISTS "Users can insert own video diagnostics" ON video_diagnostics;
DROP POLICY IF EXISTS "Users can update own video diagnostics" ON video_diagnostics;
DROP POLICY IF EXISTS "Users can delete own video diagnostics" ON video_diagnostics;

CREATE POLICY "Users can manage own video diagnostics"
  ON video_diagnostics FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 9. FIX video_diagnostic (cache table) POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own video cache" ON video_diagnostic;
DROP POLICY IF EXISTS "Users can insert own video cache" ON video_diagnostic;
DROP POLICY IF EXISTS "Users can update own video cache" ON video_diagnostic;
DROP POLICY IF EXISTS "Users can delete own video cache" ON video_diagnostic;

CREATE POLICY "Users can manage own video cache"
  ON video_diagnostic FOR ALL
  USING ((select auth.uid()) = utilisateur_id)
  WITH CHECK ((select auth.uid()) = utilisateur_id);

-- ============================================
-- 10. FIX mechanic_chats POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own mechanic_chats" ON mechanic_chats;
DROP POLICY IF EXISTS "Users can insert own mechanic_chats" ON mechanic_chats;
DROP POLICY IF EXISTS "Users can update own mechanic_chats" ON mechanic_chats;
DROP POLICY IF EXISTS "Users can delete own mechanic_chats" ON mechanic_chats;

CREATE POLICY "Users can manage own mechanic_chats"
  ON mechanic_chats FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 11. FIX mechanic_conversations POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own mechanic_conversations" ON mechanic_conversations;
DROP POLICY IF EXISTS "Users can insert own mechanic_conversations" ON mechanic_conversations;
DROP POLICY IF EXISTS "Users can update own mechanic_conversations" ON mechanic_conversations;
DROP POLICY IF EXISTS "Users can delete own mechanic_conversations" ON mechanic_conversations;

CREATE POLICY "Users can manage own mechanic_conversations"
  ON mechanic_conversations FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 12. FIX vehicles POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

CREATE POLICY "Users can manage own vehicles"
  ON vehicles FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 13. FIX diagnostics POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can insert own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can update own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can delete own diagnostics" ON diagnostics;

CREATE POLICY "Users can manage own diagnostics"
  ON diagnostics FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 14. FIX devis_analyses POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own devis" ON devis_analyses;
DROP POLICY IF EXISTS "Users can insert own devis" ON devis_analyses;
DROP POLICY IF EXISTS "Users can update own devis" ON devis_analyses;
DROP POLICY IF EXISTS "Users can delete own devis" ON devis_analyses;

CREATE POLICY "Users can manage own devis"
  ON devis_analyses FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 15. FIX chat_conversations POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;

CREATE POLICY "Users can manage own conversations"
  ON chat_conversations FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 16. FIX chat_messages POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;

CREATE POLICY "Users can manage own messages"
  ON chat_messages FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- 17. FIX pannes_predictions POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own predictions" ON pannes_predictions;

CREATE POLICY "Users can view own predictions"
  ON pannes_predictions FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================
-- END OF MIGRATION
-- ============================================
