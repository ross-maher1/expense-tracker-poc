# Building Mini-Apps with mini-app-template-v2

A practical guide based on building and deploying the Expense Tracker POC.

**Template repo:** `ross-maher1/mini-app-template-v2`
**Example POC:** `ross-maher1/expense-tracker-poc` (live at `expense-tracker-poc.vercel.app`)

---

## What Is This?

`mini-app-template-v2` is a production-ready Next.js starter for building small, focused apps that share a single Supabase backend. The idea is a **unified-user architecture**:

- One Supabase project holds all user accounts and data
- Multiple mini-apps (expense tracker, invoice tracker, timesheets, etc.) each run as their own standalone Next.js app
- Every app shares the same login — one account, all apps
- Each app only sees its own tables — full data isolation via Row Level Security (RLS)
- A future "Pro" dashboard can query across all tables because they all live in the same database

Each mini-app takes roughly a day to build and deploy from this template.

### What the template gives you out of the box

- Full auth system: signup, login, logout, forgot/reset password
- Cookie-based session management with automatic token refresh
- Shared `profiles` table auto-created on signup (via database trigger)
- Row Level Security on all tables
- A working demo CRUD page (`/demo`) proving the full stack works end-to-end
- Mobile-first layout with bottom navigation
- TypeScript, Tailwind CSS v4, React Hook Form + Zod

### What you add

- Your app-specific database table(s) and migration SQL
- Your app-specific page(s) and form(s)
- Your app-specific TypeScript types
- Updated app name, navigation, and protected routes

---

## Prerequisites

Before you start, you need:

1. **Node.js 18+** and **npm**
2. **A Supabase project** — free tier is fine. Create one at [supabase.com](https://supabase.com)
3. **A GitHub account** with access to `ross-maher1/mini-app-template-v2`
4. **Vercel account** (for deployment)

---

## Step-by-Step: Creating a New Mini-App

### Step 1: Create the repo

> **Important:** The template is not configured as a GitHub template repo, so you cannot use `gh repo create --template`. Clone it manually instead.

```bash
git clone https://github.com/ross-maher1/mini-app-template-v2.git my-app-name
cd my-app-name
rm -rf .git
git init
git add .
git commit -m "Initial commit from mini-app-template-v2"
gh repo create my-app-name --public --source=. --remote=origin --push
```

Then install dependencies:

```bash
npm install
```

### Step 2: Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials. Find these at **Supabase Dashboard → Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Step 3: Configure Supabase Auth

In the Supabase Dashboard, go to **Authentication → Sign In / Providers → Email** and:

- **Disable "Confirm email"** — This means signup immediately creates an active session. Without this, users have to click a confirmation email before they can log in. For local development, disabling it is much simpler. You can re-enable it for production if you need it.

Also go to **Authentication → URL Configuration** and add to **Redirect URLs**:
```
http://localhost:3000/**
```

### Step 4: Run the database migrations

Go to **Supabase Dashboard → SQL Editor → New Query** and run each file in order:

| File | What it does |
|------|-------------|
| `database/migrations/001_shared_schema.sql` | Creates the `profiles` table |
| `database/migrations/002_rls_policies.sql` | Enables Row Level Security on profiles |
| `database/migrations/003_indexes.sql` | Performance indexes |
| `database/migrations/004_triggers.sql` | Auto-creates a profile row when a user signs up **(critical)** |
| `database/migrations/005_demo_notes.sql` | Demo table — delete when building your real app |

Copy/paste each file's SQL into the SQL Editor and click **Run**.

> Migrations 001–004 are **shared** across all mini-apps on the same Supabase project. If you've already run them for another mini-app, you don't need to run them again — they're idempotent (safe to re-run, but not required).

### Step 5: Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to `/auth/login`. Sign up, and you'll land on the dashboard. Navigate to `/demo` to test add/delete.

> **Stale cookie warning:** If you've previously run other Supabase projects on `localhost:3000`, your browser may have stale `sb-` auth cookies from those projects. These will cause auth to silently fail — middleware picks up the old cookie, validates it against the wrong project, and behaves unpredictably. Fix: open DevTools → Application → Cookies → `http://localhost:3000` → delete all cookies starting with `sb-`.

---

## Building Your Feature

Once the template is running, replace the demo with your real app. Here's the pattern, using "expenses" as the example (see `ross-maher1/expense-tracker-poc` for the full working version).

### 1. Write the database migration

Create `database/migrations/005_yourfeature.sql` (replace `005_demo_notes.sql`). Follow this exact pattern:

```sql
-- Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('Food', 'Transport', 'Entertainment', 'Other')),
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select_own" ON public.expenses;
CREATE POLICY "expenses_select_own" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_insert_own" ON public.expenses;
CREATE POLICY "expenses_insert_own" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_update_own" ON public.expenses;
CREATE POLICY "expenses_update_own" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_delete_own" ON public.expenses;
CREATE POLICY "expenses_delete_own" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- Updated_at trigger (uses function from migration 004)
DROP TRIGGER IF EXISTS set_updated_at_expenses ON public.expenses;
CREATE TRIGGER set_updated_at_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

Run this in Supabase SQL Editor.

### 2. Add TypeScript types

**`src/types/database.ts`** — add your table's row/insert/update interfaces:

```typescript
export interface ExpenseRow {
  id: string;
  user_id: string;
  amount: number;
  category: "Food" | "Transport" | "Entertainment" | "Other";
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  user_id: string;
  amount: number;
  category: "Food" | "Transport" | "Entertainment" | "Other";
  note?: string | null;
  date?: string;
}

export interface ExpenseUpdate {
  amount?: number;
  category?: "Food" | "Transport" | "Entertainment" | "Other";
  note?: string | null;
  date?: string;
}
```

Also update the `Database` interface at the bottom of that file to include your table.

**`src/lib/types.ts`** — add a convenience type for use in components:

```typescript
export const EXPENSE_CATEGORIES = ["Food", "Transport", "Entertainment", "Other"] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

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
```

### 3. Create the page

Create `src/app/expenses/page.tsx`. Follow this structure (copy from `src/app/demo/page.tsx` and adapt):

```typescript
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// 1. Zod schema for your form
const schema = z.object({
  amount: z.string().min(1).refine((v) => Number(v) > 0),
  // ... your fields
});

export default function ExpensesPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [items, setItems] = useState([]);

  // 2. Fetch — always scope to user.id
  const fetchItems = useCallback(async () => {
    if (!user || !supabase) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    setItems(data || []);
  }, [user, supabase]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // 3. Insert — always include user_id
  const onSubmit = async (values) => {
    if (!user || !supabase) return;
    await supabase.from("expenses").insert({ user_id: user.id, ...values });
    fetchItems();
  };

  // 4. Delete
  const deleteItem = async (id: string) => {
    if (!supabase) return;
    await supabase.from("expenses").delete().eq("id", id);
    fetchItems();
  };

  return <main className="space-y-10">...</main>;
}
```

### 4. Update navigation

**`src/components/ui/BottomBar.tsx`** — replace the demo nav item:

```typescript
import { DollarSign } from "lucide-react"; // or whatever icon fits

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: DollarSign, label: "Expenses" }, // your route
  { href: "/settings", icon: Settings, label: "Settings" },
];
```

### 5. Update protected routes

**`src/lib/supabase/middleware.ts`** — add your new route:

```typescript
const protectedPaths = ["/", "/expenses", "/settings"];
```

### 6. Update app identity

**`src/lib/constants.ts`**:
```typescript
export const APP_NAME = "Expense Tracker";
```

**`src/app/layout.tsx`**:
```typescript
export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses",
};
```

### 7. Delete the demo

- Delete `src/app/demo/page.tsx`
- Delete `database/migrations/005_demo_notes.sql`
- Optionally drop the table: `DROP TABLE IF EXISTS public.demo_notes CASCADE;` in SQL Editor

### 8. Update the dashboard

**`src/app/page.tsx`** — replace the demo note stats with your app's summary. Query your table and show relevant counts/totals.

---

## Deploying to Vercel

### 1. Push to GitHub

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Add expenses feature"
git push
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Before clicking **Deploy**, add the three environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**

Vercel auto-detects Next.js — no build configuration needed.

### 3. Add your production domain to Supabase

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** Add `https://your-app.vercel.app/**`

This ensures password reset emails and auth callbacks redirect correctly in production.

---

## End-to-End Test Checklist

Run through these after every deployment to verify everything works:

| Test | Expected |
|------|----------|
| Visit `/` without being logged in | Redirected to `/auth/login` |
| Sign up with email + password | Immediately redirected to dashboard (no email confirmation) |
| Navigate to your feature page | See empty state + form |
| Submit the form | New item appears in list |
| Delete an item | Item removed from list |
| Sign out | Redirected to `/auth/login` |
| Sign back in | Previous data still there |
| Dashboard | Shows correct counts/totals |

---

## How the Auth System Works

Understanding this saves you hours of debugging.

### The token lifecycle

Supabase Auth uses JWTs stored in **HTTP-only cookies** (JavaScript can't access them directly — prevents XSS). There are two tokens:
- **Access token** — expires in ~1 hour, used for API calls
- **Refresh token** — expires in ~1 week, used to silently get a new access token

### The middleware refresh pattern

`src/middleware.ts` runs on **every request**. It calls `updateSession()` which:
1. Reads auth cookies from the incoming request
2. Calls `supabase.auth.getUser()` — if the access token is expired, this automatically uses the refresh token to get a new one
3. Writes the updated cookies onto the response

This is why tokens silently refresh and users never get unexpected logouts.

### The AuthContext

`src/contexts/AuthContext.tsx` manages auth state in React:
- On mount, `initializeAuth()` runs: calls `getSession()`, then fetches the user's profile
- `onAuthStateChange` listens for changes but only handles `SIGNED_OUT` and `TOKEN_REFRESHED` — it does **not** do async work like fetching profiles. This is intentional and important (see below)
- `signIn()` / `signUp()` just call Supabase and return. They do **not** update React state directly

### Why `window.location.href` instead of `router.push`

After a successful login or signup, pages use `window.location.href = "/"` (full page reload) rather than `router.push("/")` (client-side navigation). This is required because:

- `router.push` does a client-side navigation — Next.js middleware does **not** re-run
- Without middleware running, the new auth cookies don't get set on the response
- `window.location.href` triggers a full HTTP request → middleware runs → cookies are set → `initializeAuth()` fires on the new page with a valid session

**Never use `router.push` for post-auth redirects.**

---

## Critical Pitfalls

### Auth hangs or loops forever on localhost

**Cause:** Stale `sb-` cookies in your browser from a previous Supabase project on `localhost:3000`.

**Symptoms:** You sign in, middleware finds a valid token from an old project, auth appears to work but profile fetch fails, or you get stuck in a redirect loop.

**Fix:** Open DevTools → Application → Cookies → `http://localhost:3000` → delete all cookies starting with `sb-`. Then sign in fresh.

**Prevention:** Each time you start a new POC with a different Supabase project, clear these cookies first.

---

### Signup works but user can't log in immediately

**Cause:** Email confirmation is enabled in Supabase. The user needs to click a link in their email before their account is active.

**Fix:** Go to Supabase Dashboard → Authentication → Sign In / Providers → Email → toggle off **"Confirm email"**. Signup then creates an active session immediately.

---

### Profile not created after signup

**Cause:** Migration 004 (`004_triggers.sql`) was not run. The `handle_new_user()` trigger is what automatically inserts a row into `profiles` when a new user signs up.

**Fix:** Run `database/migrations/004_triggers.sql` in Supabase SQL Editor.

---

### Page is accessible without being logged in

**Cause:** Your new route is not in the `protectedPaths` array.

**Fix:** Add it to `src/lib/supabase/middleware.ts`:
```typescript
const protectedPaths = ["/", "/your-route", "/settings"];
```

---

### "Users can see each other's data"

**Cause:** Missing or incorrect RLS policies on your table.

**Fix:** Every table must have:
1. `ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;`
2. SELECT/INSERT/UPDATE/DELETE policies each scoped to `auth.uid() = user_id`

---

### TypeScript build errors after adding a table

**Cause:** The `Database` interface in `src/types/database.ts` wasn't updated to include the new table.

**Fix:** Add your table to the `Database` interface and ensure `Row`, `Insert`, and `Update` types are all defined.

---

## File Reference

| File | Purpose | Change when... |
|------|---------|----------------|
| `src/middleware.ts` | Runs on every request, refreshes tokens, protects routes | Never — don't modify |
| `src/lib/supabase/middleware.ts` | `updateSession()` + `protectedPaths` | Adding new protected routes |
| `src/contexts/AuthContext.tsx` | Auth state, signIn/signUp/signOut methods | Never — don't modify |
| `src/hooks/useAuth.ts` | Hook to access auth context | Never |
| `src/lib/supabase/client.ts` | Browser Supabase client | Never |
| `src/lib/supabase/server.ts` | Server Supabase client | Never |
| `src/components/ui/BottomBar.tsx` | Bottom navigation | Adding new nav items |
| `src/lib/constants.ts` | `APP_NAME`, storage keys | Every new app |
| `src/app/layout.tsx` | Root layout, metadata | Every new app |
| `src/app/page.tsx` | Dashboard | Every new app |
| `src/lib/types.ts` | Domain types | Adding new features |
| `src/types/database.ts` | Database schema types | Adding new tables |
| `database/migrations/` | SQL migration files | Adding new tables |

---

## For AI Coding Agents

If you are an AI agent (Claude, Cursor, etc.) building a new mini-app from this template:

### Read these files first

1. `src/lib/supabase/middleware.ts` — the session refresh pattern
2. `src/middleware.ts` — route protection
3. `src/contexts/AuthContext.tsx` — auth state management
4. `src/app/demo/page.tsx` — the CRUD pattern to follow
5. `database/migrations/005_demo_notes.sql` — the migration pattern to follow

### Hard rules

- **Do not modify** `updateSession()` in `src/lib/supabase/middleware.ts` — the order of operations is critical
- **Do not modify** `AuthContext.tsx` — the sync/async split in `onAuthStateChange` is intentional
- **Do not use** `router.push` for post-auth redirects — always use `window.location.href`
- **Do not skip** RLS policies when creating tables
- **Do not use** `localStorage` for user data — always use Supabase

### The pattern for every new feature

1. SQL migration → run in Supabase SQL Editor
2. `database.ts` → add `FooRow`, `FooInsert`, `FooUpdate` interfaces
3. `types.ts` → add `Foo` convenience type
4. `src/app/foo/page.tsx` → create CRUD page following demo pattern
5. `BottomBar.tsx` → add nav item
6. `middleware.ts` (lib) → add to `protectedPaths`
7. `constants.ts` + `layout.tsx` → update app name/metadata
8. `page.tsx` (dashboard) → show your feature's stats

### Architecture invariants that must always hold

- Every table has `user_id` FK → `profiles(id)` with `ON DELETE CASCADE`
- Every table has RLS enabled with user-scoped policies for all four operations
- Every table has an `updated_at` trigger using `handle_updated_at()`
- All auth state flows through `useAuth()` — never call Supabase auth directly in components
- Post-auth redirects always use `window.location.href`, never `router.push`
