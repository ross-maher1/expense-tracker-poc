"use client";

/**
 * Dashboard / Home Page
 *
 * Shows expense count, total spent, and quick actions.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const { user, profile } = useAuth();
  const [expenseCount, setExpenseCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

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
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id);

      if (!cancelled && data) {
        setExpenseCount(data.length);
        setTotalSpent(
          data.reduce(
            (sum: number, e: { amount: number }) => sum + Number(e.amount),
            0
          )
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  return (
    <main className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="type-meta">Dashboard</p>
        <h1 className="type-h1">
          {profile?.full_name
            ? `Welcome, ${profile.full_name}`
            : "Expense Tracker"}
        </h1>
        <p className="type-lead">Track and manage your expenses.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/expenses"
          className="group rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Expenses</h2>
            <span className="text-2xl font-bold text-slate-900">
              {expenseCount}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Total expenses recorded
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Total Spent</h2>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalSpent)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">Across all categories</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/expenses"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            Add Expense
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
