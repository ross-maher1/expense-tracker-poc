# Architecture Reference

Technical reference for the mini-app template. For setup instructions, see [HOW_TO.md](./HOW_TO.md).

---

## Project Structure

```
mini-app-template-v2/
├── .env.example                          # Required environment variables
├── database/
│   └── migrations/
│       ├── 001_shared_schema.sql         # Shared profiles table
│       ├── 002_rls_policies.sql          # Row Level Security
│       ├── 003_indexes.sql               # Performance indexes
│       ├── 004_triggers.sql              # Auto-create profile on signup
│       └── 005_demo_notes.sql            # Demo table (delete for your app)
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root: AuthProvider + AppShell
│   │   ├── page.tsx                      # Dashboard
│   │   ├── globals.css                   # Tailwind + custom classes
│   │   ├── demo/page.tsx                 # Demo CRUD page
│   │   ├── settings/page.tsx             # Profile + sign out
│   │   └── auth/
│   │       ├── login/page.tsx            # Sign in form
│   │       ├── signup/page.tsx           # Registration form
│   │       ├── forgot-password/page.tsx  # Request password reset
│   │       ├── reset-password/page.tsx   # Set new password
│   │       ├── callback/route.ts         # OAuth code exchange
│   │       └── signout/route.ts          # Server-side sign out
│   ├── components/
│   │   ├── layout/AppShell.tsx           # Shell: blob + content + nav
│   │   └── ui/
│   │       ├── BottomBar.tsx             # Mobile bottom navigation
│   │       └── ListRow.tsx               # Reusable list item
│   ├── contexts/AuthContext.tsx           # Auth state + methods
│   ├── hooks/useAuth.ts                  # Auth context consumer
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser Supabase client
│   │   │   ├── server.ts                # Server Supabase client + admin
│   │   │   └── middleware.ts            # updateSession() + route config
│   │   ├── constants.ts                  # APP_NAME, STORAGE_KEYS
│   │   ├── types.ts                      # App domain types
│   │   └── utils.ts                      # formatDate, formatCurrency, etc.
│   ├── types/database.ts                 # Database schema types
│   └── middleware.ts                     # Next.js middleware entry point
```

---

## Auth Flow

### Request Lifecycle

```
Browser Request
    │
    ▼
┌─────────────────────────────────┐
│  Next.js Middleware              │
│  (src/middleware.ts)             │
│                                 │
│  1. Call updateSession()        │
│     ├─ Read cookies             │
│     ├─ Create Supabase client   │
│     ├─ auth.getUser()           │
│     │  └─ Auto-refresh if       │
│     │     token expired         │
│     └─ Write updated cookies    │
│                                 │
│  2. Route protection            │
│     ├─ No user + protected      │
│     │  → Redirect to /auth/login│
│     └─ User + auth page         │
│        → Redirect to dashboard  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  Page Render                    │
│                                 │
│  AuthProvider initialises:      │
│  1. auth.getSession() from      │
│     cookies                     │
│  2. Fetch profile from DB       │
│  3. Subscribe to auth changes   │
│                                 │
│  Components use useAuth() to    │
│  access user, profile, methods  │
└─────────────────────────────────┘
```

### Sign Up Flow

```
User submits signup form
    │
    ▼
AuthContext.signUp()
    │
    ├─ supabase.auth.signUp({ email, password, data: { full_name } })
    │
    ▼
Supabase creates auth.users record
    │
    ├─ Trigger: on_auth_user_created
    │  └─ handle_new_user() inserts into profiles
    │
    ▼
User receives confirmation email
    │
    ▼
User clicks link → /auth/callback
    │
    ├─ exchangeCodeForSession()
    │
    ▼
Session established → cookies set → redirect to dashboard
```

### Sign Out Flow

```
User clicks Sign Out
    │
    ▼
AuthContext.signOut()
    │
    ├─ supabase.auth.signOut()  (client-side, clears state)
    ├─ window.location.href = "/auth/login"
    │
    ▼
OR via server route: GET /auth/signout
    │
    ├─ supabase.auth.signOut()  (server-side, clears cookies)
    ├─ Redirect to /auth/login
```

---

## Data Flow

### Client Component → Supabase

```typescript
// In a "use client" component:
const supabase = createClient();        // Browser client (singleton)
const { user } = useAuth();             // Current user from context

// Read (RLS ensures only user's data)
const { data } = await supabase
  .from("demo_notes")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

// Write
await supabase.from("demo_notes").insert({
  user_id: user.id,
  title: "My note",
});
```

### Server Component / API Route → Supabase

```typescript
// In a server context:
const supabase = await createClient();  // Server client (per-request)

// Uses the user's session from cookies
const { data } = await supabase.from("profiles").select("*");

// Admin client (bypasses RLS — use carefully)
const admin = await createAdminClient();
const { data } = await admin.from("profiles").select("*");
```

---

## Type System

### Database Types (`src/types/database.ts`)

Three interfaces per table following Supabase conventions:

```typescript
interface FooRow     { ... }  // Full row (returned by SELECT)
interface FooInsert  { ... }  // Insert payload (required + optional fields)
interface FooUpdate  { ... }  // Update payload (all fields optional)
```

### Domain Types (`src/lib/types.ts`)

Convenience types for use in components:

```typescript
type Foo = {
  id: string;
  user_id: string;
  // ... fields
};
```

---

## Form Pattern

All forms use React Hook Form + Zod:

```typescript
// 1. Define schema
const fooSchema = z.object({
  title: z.string().min(1, "Required"),
  value: z.number().optional(),
});
type FooFormValues = z.infer<typeof fooSchema>;

// 2. Set up form
const { register, handleSubmit, reset, formState: { errors } } = useForm<FooFormValues>({
  resolver: zodResolver(fooSchema),
  defaultValues: { title: "", value: undefined },
});

// 3. Handle submit
const onSubmit = async (values: FooFormValues) => {
  const { error } = await supabase.from("foos").insert({
    user_id: user.id,
    ...values,
  });
  if (!error) reset();
};
```

---

## Component Patterns

### Page Component

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function MyPage() {
  const { user } = useAuth();
  // ... state, effects, handlers
  return <main className="space-y-10">...</main>;
}
```

### Layout

- `AppShell` wraps all content with the decorative blob and bottom nav
- `AuthProvider` wraps `AppShell` to ensure auth is available everywhere
- Pages use `<main className="space-y-10">` as their root element

### Styling

- Tailwind CSS v4 for all styling
- Custom utility classes in `globals.css`: `.type-meta`, `.type-h1`, `.type-lead`, `.type-item-title`
- Card pattern: `rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm`
- Button pattern: `rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`

---

## Configuration Points

When customising this template, update these files:

| What to Change | File(s) |
|----------------|---------|
| App name | `src/lib/constants.ts`, `src/app/layout.tsx` |
| Navigation items | `src/components/ui/BottomBar.tsx` |
| Protected routes | `src/lib/supabase/middleware.ts` |
| Database types | `src/types/database.ts`, `src/lib/types.ts` |
| Dashboard content | `src/app/page.tsx` |
| Theme colours | `src/app/globals.css` (`:root` and `.app-blob`) |
| Locale (date/currency) | `src/lib/utils.ts` |
