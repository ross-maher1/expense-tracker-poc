"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

/**
 * Hook to access authentication state and methods.
 *
 * Usage:
 *   const { user, profile, signIn, signOut } = useAuth();
 *
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
