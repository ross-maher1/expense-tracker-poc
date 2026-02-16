/**
 * Database Types
 *
 * Shared types for the unified user model (profiles table)
 * plus app-specific tables.
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
// EXPENSES
// ============================================================================

export interface ExpenseRow {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  user_id: string;
  amount: number;
  category: string;
  note?: string | null;
  date?: string;
}

export interface ExpenseUpdate {
  amount?: number;
  category?: string;
  note?: string | null;
  date?: string;
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
      expenses: {
        Row: ExpenseRow;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
      };
    };
  };
}
