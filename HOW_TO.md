# How To: Build a Mini-App

This guide explains the unified-user architecture and walks you through building a new mini-app from this template. Written for both human developers and AI coding agents.

---

## Table of Contents

1. [What Is This?](#1-what-is-this)
2. [Prerequisites](#2-prerequisites)
3. [Setup Step-by-Step](#3-setup-step-by-step)
4. [How Auth Works](#4-how-auth-works)
5. [How to Add Your App's Feature](#5-how-to-add-your-apps-feature)
6. [Database Conventions](#6-database-conventions)
7. [Removing the Demo](#7-removing-the-demo)
8. [Deploying](#8-deploying)
9. [Common Pitfalls](#9-common-pitfalls)
10. [For AI Agents](#10-for-ai-agents)

---

## 1. What Is This?

### The Unified-User Architecture

This template enables a platform where:

- **One Supabase project** holds all user data (auth + database)
- **Multiple mini-apps** (invoices, timesheets, setlists, etc.) each run as standalone Next.js applications
- **Every app shares the same login** — a user creates one account and can access all apps
- **Each app only sees its own data** — an invoices app only shows invoice tables, a timesheets app only shows timesheet tables
- **A "Pro" app** can later query across ALL data, because it's all in the same database

The power of this architecture: each mini-app is simple and focused, but the combined data is exponentially more valuable when viewed together.

### What the Template Provides

- Full authentication system (signup, login, logout, password reset)
- Cookie-based session management with automatic token refresh
- Shared `profiles` table extending Supabase Auth
- Row Level Security (RLS) ensuring users only see their own data
- A working demo CRUD page proving the full stack works
- Idempotent SQL migrations safe to re-run

### What You Add

- Your app-specific database tables (with migrations)
- Your app-specific pages and components
- Your app-specific types and business logic

---

## 2. Prerequisites

- **Node.js** 18+ and **npm**
- A **Supabase project** (free tier works fine)
  - Go to [supabase.com](https://supabase.com) and create a project
  - Note your project URL and API keys (Settings > API)
- **Supabase Auth email confirmation** configured:
  - Go to Authentication > URL Configuration
  - Add redirect URLs: `http://localhost:3000/**`
  - For production, add: `https://your-domain.com/**`

---

## 3. Setup Step-by-Step

### 3.1 Clone and Install

```bash
git clone <this-repo> my-app-name
cd my-app-name
npm install
```

### 3.2 Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

Find these at: **Supabase Dashboard > Settings > API**

### 3.3 Run Database Migrations

Go to **Supabase Dashboard > SQL Editor > New Query**.

Run each migration file in order. Copy and paste the SQL from:

1. `database/migrations/001_shared_schema.sql` — Creates profiles table
2. `database/migrations/002_rls_policies.sql` — Enables row-level security
3. `database/migrations/003_indexes.sql` — Adds performance indexes
4. `database/migrations/004_triggers.sql` — Auto-creates profile on signup (**critical**)
5. `database/migrations/005_demo_notes.sql` — Creates the demo table

**Important:**
- Migrations 001–004 are **shared** across all mini-apps. If another mini-app has already run them against this Supabase project, they are safe to re-run (idempotent) but not required again.
- Migration 005 is for the **demo page only**. Delete it when building your real app.

### 3.4 Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to the login page.

### 3.5 Test the Full Flow

1. Click "Sign up" and create an account
2. Check your email for the confirmation link
3. Click the link — you'll be redirected to the dashboard
4. Navigate to the Notes demo page — create, edit, delete notes
5. Go to Settings — see your profile info
6. Sign out — confirm you're redirected to login
7. Try accessing `/demo` directly — confirm you're redirected to login

If all of this works, the template is functioning correctly.

---

## 4. How Auth Works

Understanding the auth flow is essential for building on this template. This section explains it thoroughly so both developers and AI agents can work with it confidently.

### 4.1 The Token Lifecycle

Supabase Auth uses JWTs (JSON Web Tokens) stored in **HTTP-only cookies**:

- **Access token** — Short-lived (~1 hour), used for API calls
- **Refresh token** — Long-lived (~1 week), used to get new access tokens

The tokens are stored as cookies by the `@supabase/ssr` library. Because they are HTTP-only, JavaScript cannot access them directly — this prevents XSS attacks.

### 4.2 The Middleware Refresh Pattern

The most critical piece of the auth system is the **middleware** (`src/middleware.ts`). It runs on **every request** and:

1. Reads the auth cookies from the request
2. Creates a Supabase server client with those cookies
3. Calls `supabase.auth.getUser()` which:
   - Checks if the access token is expired
   - If expired, uses the refresh token to get a new access token
   - Updates the cookies with the new tokens
4. Sets the updated cookies on the response

**This is why auth "just works"** — tokens are silently refreshed on every page navigation, so users never experience surprise logouts.

### 4.3 Key Auth Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Runs on every request: refreshes tokens, protects routes |
| `src/lib/supabase/middleware.ts` | `updateSession()` function that does the actual token refresh |
| `src/lib/supabase/client.ts` | Browser-side Supabase client (for client components) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (for API routes, server actions) |
| `src/contexts/AuthContext.tsx` | React context providing user/session/profile state |
| `src/hooks/useAuth.ts` | Hook to access auth state in components |
| `src/app/auth/signout/route.ts` | Server-side sign out (clears cookies + redirects) |

### 4.4 Route Protection

Protected routes are defined in `src/lib/supabase/middleware.ts`:

```typescript
const protectedPaths = ["/", "/demo", "/settings"];
```

**When you add new pages**, update this array. If a path is not in this array, unauthenticated users can access it.

### 4.5 What NOT to Change

Do not modify the following without understanding the implications:

- The order of operations in `updateSession()` — there must be no code between `createServerClient` and `supabase.auth.getUser()`
- The cookie `getAll`/`setAll` handlers — they are the bridge between Next.js and Supabase
- The middleware matcher pattern — it must exclude static assets but run on all page routes
- The `AuthProvider` wrapping in `layout.tsx` — all pages need auth context

---

## 5. How to Add Your App's Feature

This is the step-by-step process for adding a new feature (e.g., "invoices") to the template.

### Step 1: Create the Database Migration

Create a new file: `database/migrations/006_invoices.sql`

Follow this pattern:

```sql
-- Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid'))
);

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
CREATE POLICY "invoices_insert_own" ON public.invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
CREATE POLICY "invoices_update_own" ON public.invoices
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_delete_own" ON public.invoices;
CREATE POLICY "invoices_delete_own" ON public.invoices
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

Run this in Supabase SQL Editor.

### Step 2: Add TypeScript Types

In `src/types/database.ts`, add:

```typescript
export interface InvoiceRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: "draft" | "sent" | "paid";
}

export interface InvoiceInsert {
  user_id: string;
  invoice_number: string;
  client_name: string;
  amount?: number;
  status?: "draft" | "sent" | "paid";
}

export interface InvoiceUpdate {
  invoice_number?: string;
  client_name?: string;
  amount?: number;
  status?: "draft" | "sent" | "paid";
}
```

Update the `Database` interface to include the new table.

In `src/lib/types.ts`, add a convenience type:

```typescript
export type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: "draft" | "sent" | "paid";
  created_at: string;
  updated_at: string;
};
```

### Step 3: Create the Page

Create `src/app/invoices/page.tsx`. Follow the pattern in `src/app/demo/page.tsx`:
- Use `"use client"` directive
- Import `useAuth` for the current user
- Import `createClient` from `@/lib/supabase/client`
- Use React Hook Form + Zod for form validation
- Fetch data with `.from("invoices").select("*").eq("user_id", user.id)`

### Step 4: Update Navigation

In `src/components/ui/BottomBar.tsx`, update the `navItems` array:

```typescript
const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/settings", icon: Settings, label: "Settings" },
];
```

### Step 5: Update Protected Routes

In `src/lib/supabase/middleware.ts`, add the new route:

```typescript
const protectedPaths = ["/", "/invoices", "/settings"];
```

### Step 6: Update Metadata

In `src/app/layout.tsx`, update the title and description.

In `src/lib/constants.ts`, update `APP_NAME`.

---

## 6. Database Conventions

Follow these conventions for all app-specific tables:

### Table Structure

Every table must have:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — auto-generated unique ID
- `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` — links to user
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` — auto-set on insert
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` — auto-updated by trigger

### Row Level Security

Every table must have RLS enabled with at minimum:
- `SELECT` policy: `USING (auth.uid() = user_id)`
- `INSERT` policy: `WITH CHECK (auth.uid() = user_id)`
- `UPDATE` policy: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- `DELETE` policy: `USING (auth.uid() = user_id)`

### Idempotent SQL

All migration SQL must be safe to re-run:
- Tables: `CREATE TABLE IF NOT EXISTS`
- Functions: `CREATE OR REPLACE FUNCTION`
- Triggers: `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`
- Policies: `DROP POLICY IF EXISTS ... ; CREATE POLICY ...`
- Indexes: `CREATE INDEX IF NOT EXISTS`

### Naming Convention

- Tables: `snake_case`, plural (e.g., `invoices`, `set_lists`)
- Columns: `snake_case` (e.g., `user_id`, `client_name`)
- Policies: `tablename_operation_scope` (e.g., `invoices_select_own`)
- Indexes: `idx_tablename_column` (e.g., `idx_invoices_user_id`)
- Triggers: `set_updated_at_tablename` (e.g., `set_updated_at_invoices`)

---

## 7. Removing the Demo

When you're ready to build your real app, remove the demo components:

1. **Delete** `src/app/demo/` (the demo page)
2. **Delete** `database/migrations/005_demo_notes.sql`
3. **Optionally** drop the demo table: `DROP TABLE IF EXISTS public.demo_notes CASCADE;`
4. **Update** `src/components/ui/BottomBar.tsx` — replace demo nav item with your app's route
5. **Update** `src/lib/supabase/middleware.ts` — replace `/demo` with your protected route
6. **Update** `src/app/page.tsx` — replace demo note counts with your app's dashboard
7. **Update** `src/types/database.ts` — remove `DemoNote` types, add your own
8. **Update** `src/lib/types.ts` — remove `DemoNote` type, add your own

---

## 8. Deploying

### Vercel (Recommended)

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Supabase Auth Redirect URLs

For production, add your domain to Supabase:
- Go to **Authentication > URL Configuration**
- Add: `https://your-domain.com/**`

---

## 9. Common Pitfalls

### "Profile not found after signup"
**Cause:** The `handle_new_user` trigger in migration 004 was not run.
**Fix:** Run `database/migrations/004_triggers.sql` in Supabase SQL Editor.

### "Migrations fail on re-run"
**Cause:** SQL is not idempotent (e.g., `CREATE TRIGGER` without `DROP IF EXISTS`).
**Fix:** Always use the idempotent patterns described in section 6.

### "401 errors or unexpected logouts"
**Cause:** Middleware is not refreshing tokens.
**Fix:** Ensure `src/middleware.ts` is calling `updateSession()` and the matcher pattern is correct.

### "Users can see other users' data"
**Cause:** RLS policies are missing or incorrect.
**Fix:** Every table must have `ENABLE ROW LEVEL SECURITY` and appropriate policies.

### "Sign out doesn't work properly"
**Cause:** Missing server-side signout route.
**Fix:** Ensure `src/app/auth/signout/route.ts` exists and calls `supabase.auth.signOut()`.

### "Page not protected"
**Cause:** Route not in the `protectedPaths` array.
**Fix:** Add your route to `src/lib/supabase/middleware.ts` > `isProtectedPath()`.

---

## 10. For AI Agents

If you are an AI coding agent (Claude, Codex, Cursor, etc.) building on this template, read this section carefully.

### Key Files to Read First

1. `src/lib/supabase/middleware.ts` — Understand the session refresh pattern
2. `src/middleware.ts` — Understand route protection
3. `src/contexts/AuthContext.tsx` — Understand auth state management
4. `src/app/demo/page.tsx` — The reference CRUD pattern to follow
5. `database/migrations/005_demo_notes.sql` — The reference migration pattern

### What NOT to Change

- **Do not modify** the `updateSession()` function in `src/lib/supabase/middleware.ts`
- **Do not modify** the cookie handlers in `src/lib/supabase/client.ts` or `server.ts`
- **Do not remove** the `AuthProvider` from `src/app/layout.tsx`
- **Do not remove** the `signout` route at `src/app/auth/signout/route.ts`
- **Do not use localStorage** for any user data — always use Supabase
- **Do not skip RLS policies** when creating tables

### Patterns to Follow

When creating a new feature:

1. **Migration pattern:** Copy `005_demo_notes.sql` and modify table name/columns
2. **Type pattern:** Copy the `DemoNote*` types in `database.ts` and modify
3. **Page pattern:** Copy `src/app/demo/page.tsx` and modify the form fields and queries
4. **Always scope queries to user:** `.eq("user_id", user.id)`
5. **Always update protected routes** when adding new pages
6. **Always update the bottom bar** when adding new navigation items

### Architecture Invariants

These must always be true:

- Every database table has `user_id` FK to `profiles(id)` with `ON DELETE CASCADE`
- Every table has RLS enabled with user-scoped policies
- Every table has an `updated_at` trigger using `handle_updated_at()`
- The middleware runs on every request and refreshes auth tokens
- All auth state comes from `useAuth()` hook, never from direct Supabase calls in components
- Sign out happens via server-side route, not client-side only
