/**
 * Database Types
 *
 * Shared types for the unified user model (profiles table)
 * plus app-specific tables.
 *
 * >>> Update this file when you add your own app-specific tables. <<<
 */

// ============================================================================
// PROFILES (shared across all mini-apps)
// ============================================================================

export type SubscriptionTier = "free" | "premium";

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  onboarding_completed: boolean;
  preferences: Record<string, unknown> | null;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  subscription_tier?: SubscriptionTier;
  onboarding_completed?: boolean;
  preferences?: Record<string, unknown> | null;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  subscription_tier?: SubscriptionTier;
  onboarding_completed?: boolean;
  preferences?: Record<string, unknown> | null;
}

// ============================================================================
// DEMO NOTES (delete when building your real app)
// ============================================================================

export interface DemoNoteRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string | null;
}

export interface DemoNoteInsert {
  user_id: string;
  title: string;
  content?: string | null;
}

export interface DemoNoteUpdate {
  title?: string;
  content?: string | null;
}

// ============================================================================
// DATABASE SCHEMA TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      demo_notes: {
        Row: DemoNoteRow;
        Insert: DemoNoteInsert;
        Update: DemoNoteUpdate;
      };
    };
  };
}
