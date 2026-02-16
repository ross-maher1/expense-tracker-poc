-- ============================================================================
-- SHARED TRIGGERS — Auto-create profile on signup
-- ============================================================================
-- When a new user signs up via Supabase Auth, automatically creates a
-- corresponding profile record with their email and name.
--
-- CRITICAL: Without this trigger, signup creates an auth.users record
-- but no profile row, breaking the app's profile fetching.
--
-- Safe to re-run (idempotent).
-- Run AFTER 003_indexes.sql
-- ============================================================================

-- CREATE OR REPLACE is inherently idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (idempotent: drop first, then create)
-- Note: SECURITY DEFINER is required because auth.users is in a different schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
