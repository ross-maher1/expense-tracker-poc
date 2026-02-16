-- ============================================================================
-- DEMO APP TABLE — demo_notes
-- ============================================================================
-- This creates the table for the demo CRUD page included in the template.
-- It demonstrates the pattern for adding app-specific tables.
--
-- >>> DELETE THIS FILE when building your real app. <<<
-- >>> Replace it with your own app-specific migration. <<<
--
-- Safe to re-run (idempotent).
-- Run AFTER 004_triggers.sql
-- ============================================================================

-- ============================================================================
-- 1. TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.demo_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT
);

COMMENT ON TABLE public.demo_notes IS 'Demo table — delete when building your real app';

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.demo_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_notes_select_own" ON public.demo_notes;
CREATE POLICY "demo_notes_select_own" ON public.demo_notes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "demo_notes_insert_own" ON public.demo_notes;
CREATE POLICY "demo_notes_insert_own" ON public.demo_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "demo_notes_update_own" ON public.demo_notes;
CREATE POLICY "demo_notes_update_own" ON public.demo_notes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "demo_notes_delete_own" ON public.demo_notes;
CREATE POLICY "demo_notes_delete_own" ON public.demo_notes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_demo_notes_user_id ON public.demo_notes(user_id);

-- ============================================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_demo_notes ON public.demo_notes;
CREATE TRIGGER set_updated_at_demo_notes
    BEFORE UPDATE ON public.demo_notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
