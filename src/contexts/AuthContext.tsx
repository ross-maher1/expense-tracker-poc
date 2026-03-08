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

  // Fetch profile with a timeout so it never hangs forever
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (!supabase) return null;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
          .abortSignal(controller.signal);

        clearTimeout(timeout);

        if (error) {
          console.error("Error fetching profile:", error.message);
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

  // Initialize auth on mount — this is the ONLY place that sets up the
  // initial session. No race conditions with onAuthStateChange.
  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (error) {
          setState({ user: null, session: null, profile: null, loading: false, error });
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (cancelled) return;
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
        if (cancelled) return;
        setState({
          user: null,
          session: null,
          profile: null,
          error: err instanceof Error ? err : new Error("Failed to initialize auth"),
          loading: false,
        });
      }
    };

    initializeAuth();

    // Listen for auth changes (e.g. token refresh, sign out in another tab).
    // IMPORTANT: Keep this handler synchronous — do NOT await fetchProfile here.
    // Profile fetching is handled by initializeAuth after page reload.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return;

        // Only handle SIGNED_OUT here. For SIGNED_IN, we rely on the
        // page reload (window.location.href) which triggers initializeAuth.
        // This avoids the race condition between onAuthStateChange and
        // the redirect in the login page.
        if (!session) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        } else if (_event === "TOKEN_REFRESHED") {
          // Update session on token refresh without re-fetching profile
          setState((prev) => ({
            ...prev,
            session,
            user: session.user,
          }));
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // signIn: Just calls Supabase. Does NOT set state or trigger profile fetch.
  // The login page will do window.location.href after this returns,
  // which causes a full page reload → initializeAuth runs on the new page.
  const signIn = useCallback(
    async ({ email, password }: SignInCredentials) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    },
    [supabase]
  );

  // signUp: Just calls Supabase.
  const signUp = useCallback(
    async ({ email, password, fullName }: SignUpCredentials) => {
      if (!supabase) {
        const error = new Error("Supabase not initialized") as AuthError;
        return { error };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
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
