-- ============================================================================
-- SHARED INDEXES — Performance indexes for profiles
-- ============================================================================
-- Safe to re-run (CREATE INDEX IF NOT EXISTS is inherently idempotent).
--
-- Run AFTER 002_rls_policies.sql
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
