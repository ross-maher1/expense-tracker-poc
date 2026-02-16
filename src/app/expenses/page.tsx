"use client";

/**
 * Expenses Page — Add, view, and delete expenses.
 *
 * Follows the template CRUD pattern:
 * - Client-side Supabase calls
 * - React Hook Form + Zod validation
 * - User-scoped data via RLS
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";

// ------------------------------------------------------------------
// Form Schema
// ------------------------------------------------------------------

const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.enum(["Food", "Transport", "Entertainment", "Other"]),
  note: z.string().max(500, "Note must be 500 characters or less").optional(),
  date: z.string().min(1, "Date is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "",
      category: "Food",
      note: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // ---- FETCH ----

  const fetchExpenses = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ---- CREATE ----

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!user || !supabase) return;
    setError(null);

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: parseFloat(values.amount),
      category: values.category,
      note: values.note || null,
      date: values.date,
    });

    if (error) {
      setError(error.message);
    } else {
      reset({
        amount: "",
        category: "Food",
        note: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchExpenses();
    }
  };

  // ---- DELETE ----

  const deleteExpense = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      fetchExpenses();
    }
  };

  // ---- RENDER ----

  return (
    <main className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="type-meta">Expenses</p>
        <h1 className="type-h1">Expense Tracker</h1>
        <p className="type-lead">Track your spending.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Add Expense Form --- */}
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Amount
              </label>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                min="0.01"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                {...register("category")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Note{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                {...register("note")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                placeholder="What was this for?"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                {...register("date")}
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>

        {/* --- Expense List --- */}
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Expenses</h2>
            <span className="text-xs text-slate-500">
              {expenses.length}{" "}
              {expenses.length === 1 ? "expense" : "expenses"}
            </span>
          </div>

          {loading ? (
            <p className="mt-4 type-lead">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="mt-4 type-lead">
              No expenses yet. Add one to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(expense.amount)}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {expense.category}
                      </span>
                    </div>
                    {expense.note && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                        {expense.note}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="shrink-0 p-2 text-slate-400 hover:text-red-500"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
