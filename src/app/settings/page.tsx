"use client";

import { useAuth } from "@/hooks/useAuth";
import { APP_NAME } from "@/lib/constants";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();

  return (
    <main className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="type-meta">Preferences</p>
        <h1 className="type-h1">Settings</h1>
        <p className="type-lead">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-lg">
        <h2 className="text-lg font-semibold">Profile</h2>
        {profile ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Name
              </p>
              <p className="text-sm text-slate-900">
                {profile.full_name || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Email
              </p>
              <p className="text-sm text-slate-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Plan
              </p>
              <p className="text-sm text-slate-900 capitalize">
                {profile.subscription_tier}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Loading profile...</p>
        )}
      </div>

      {/* Account */}
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-lg">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign out of your account.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200"
        >
          Sign Out
        </button>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm max-w-lg">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="mt-2 text-sm text-slate-600">
          {APP_NAME} is built with Next.js, TypeScript, Tailwind CSS, and
          Supabase.
        </p>
      </div>
    </main>
  );
}
