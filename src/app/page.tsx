"use client";

/**
 * Dashboard / Home Page
 *
 * >>> Replace this with your app's dashboard. <<<
 * This demo shows note counts and quick actions.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [noteCount, setNoteCount] = useState(0);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("demo_notes")
        .select("id")
        .eq("user_id", user.id);

      if (!cancelled && data) {
        setNoteCount(data.length);
      }
    })();

    return () => { cancelled = true; };
  }, [user, supabase]);

  return (
    <main className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="type-meta">Dashboard</p>
        <h1 className="type-h1">
          {profile?.full_name ? `Welcome, ${profile.full_name}` : "Welcome"}
        </h1>
        <p className="type-lead">
          This is the mini-app template. Data is stored in Supabase.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/demo"
          className="group rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notes</h2>
            <span className="text-2xl font-bold text-slate-900">
              {noteCount}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Total notes created
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Plan</h2>
            <span className="text-2xl font-bold text-emerald-600 capitalize">
              {profile?.subscription_tier || "free"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Current subscription tier
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            Add Note
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400"
          >
            Settings
          </Link>
        </div>
      </div>
    </main>
  );
}
