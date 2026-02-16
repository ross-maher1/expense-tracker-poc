-- ============================================================================
-- SHARED SCHEMA — profiles table + updated_at trigger
-- ============================================================================
-- This migration creates the shared foundation used by ALL mini-apps.
-- Safe to re-run (idempotent).
--
-- Run in: Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (shared across all mini-apps)
-- ============================================================================
-- Extends Supabase auth.users with application-specific user data.
-- Every authenticated user gets a profile record via the trigger in 004.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email TEXT NOT NULL,
    full_name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    preferences JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users — shared across all mini-apps';
COMMENT ON COLUMN public.profiles.subscription_tier IS 'User subscription level: free or premium';
COMMENT ON COLUMN public.profiles.preferences IS 'JSON object storing user preferences';

-- ============================================================================
-- 2. UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
-- Automatically updates the updated_at column on row changes.
-- CREATE OR REPLACE is inherently idempotent.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles (idempotent: drop first, then create)
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
