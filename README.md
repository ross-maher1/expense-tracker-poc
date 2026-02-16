# Mini App Template v2

A production-ready template for building mini-apps on the unified-user architecture. Each mini-app is a standalone Next.js application that connects to a shared Supabase project, sharing authentication and user profiles across all apps.

## Quick Start

```bash
# 1. Clone this template
git clone <this-repo> my-app-name
cd my-app-name

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run database migrations
# Go to Supabase Dashboard > SQL Editor > New Query
# Run each file in database/migrations/ in order (001, 002, 003, 004, 005)
# Migrations 001-004 are shared — only run once per Supabase project
# Migration 005 is the demo table — delete it when building your real app

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up to test.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL + RLS)
- **React Hook Form** + **Zod** (form validation)
- **Lucide React** (icons)

## Project Structure

```
src/
  app/
    auth/           # Login, signup, password reset, signout
    demo/           # Demo CRUD page (delete and replace)
    settings/       # Profile + sign out
    page.tsx        # Dashboard
    layout.tsx      # Root layout (AuthProvider + AppShell)
  components/
    layout/         # AppShell wrapper
    ui/             # BottomBar, ListRow
  contexts/         # AuthContext (auth state management)
  hooks/            # useAuth hook
  lib/
    supabase/       # Browser client, server client, middleware helper
    constants.ts    # APP_NAME and config
    types.ts        # App domain types
    utils.ts        # Utility functions
  types/
    database.ts     # Database schema types
database/
  migrations/       # SQL migration files (run in Supabase SQL Editor)
```

## Documentation

- **[HOW_TO.md](./HOW_TO.md)** — Full guide: architecture, setup, adding features, deploying
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Technical reference: auth flow, patterns, conventions

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
