"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Session,
  User,
  AuthError,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

// ============================================================================
// TYPES
// ============================================================================

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | Error | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return null;
        }

        return data;
      } catch (err) {
        console.error("Error fetching profile:", err);
        return null;
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setState((prev) => ({ ...prev, error, loading: false }));
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error ? err : new Error("Failed to initialize auth"),
          loading: false,
        }));
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = useCallback(
    async ({ email, password }: SignInCredentials) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }));
      }

      return { error };
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({ email, password, fullName }: SignUpCredentials) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }));
      }

      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setState((prev) => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    },
    [supabase]
  );

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
