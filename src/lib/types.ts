/**
 * Core type definitions for the Expense Tracker app.
 */

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};
