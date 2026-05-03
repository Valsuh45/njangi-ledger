# Njangi Ledger — Agent Guidelines

> **Purpose:** This document defines the rules, conventions, and guardrails that any AI coding agent must follow when contributing to the **njangi-ledger** project. Treat every section as mandatory unless explicitly marked *optional*.

---

## 1. Project Overview

Njangi Ledger is a **Vite + React + TypeScript** single-page application for managing rotating savings groups (commonly called "njangi" or "tontine"). Users authenticate via **Supabase Auth**, and all data (groups, members, contributions, payouts) lives in a **Supabase Postgres** database accessed through the Supabase JS client.

### Key Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Framework       | React 18, React Router v6                        |
| Build           | Vite 5 (SWC plugin)                              |
| Language        | TypeScript 5 (strict-ish, see tsconfig notes)    |
| Styling         | Tailwind CSS 3 + shadcn/ui components            |
| State / Data    | TanStack React Query v5                          |
| Backend / Auth  | Supabase (JS client, RLS, Postgres)              |
| Testing         | Vitest + Testing Library                         |
| Linting         | ESLint 9 (flat config) + typescript-eslint        |
| CI              | GitHub Actions (`.github/workflows/ci.yml`)      |

---

## 2. Directory Structure

```
njangi-ledger/
├── .github/workflows/   # CI pipeline
├── agents/              # Agent guidelines (this file)
├── public/              # Static assets
├── src/
│   ├── components/      # Shared / layout components
│   │   └── ui/          # shadcn/ui primitives (DO NOT hand-edit)
│   ├── features/        # Feature modules (groups, members, contributions, payouts)
│   │   └── <feature>/
│   │       └── api.ts   # React Query hooks for that feature
│   ├── hooks/           # Shared custom hooks (useAuth, useMobile, useToast)
│   ├── integrations/    # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts   # Supabase singleton — auto-generated, DO NOT edit
│   │       └── types.ts    # DB types — auto-generated, DO NOT edit
│   ├── lib/             # Pure utility functions (cycle math, CSV, cn)
│   ├── pages/           # Route-level page components
│   └── test/            # Test setup & test files
├── supabase/            # Supabase project config & migrations
├── package.json
├── tsconfig.json        # Project references root
├── tsconfig.app.json    # App-level TS config (src/)
├── tsconfig.node.json   # Node tooling TS config (vite.config.ts)
├── eslint.config.js     # Flat ESLint config
├── vite.config.ts
└── vitest.config.ts
```

---

## 3. Golden Rules

### ✅ DO

1. **Run the CI checks locally before proposing changes.**
   ```bash
   npm run typecheck   # TypeScript
   npm run lint         # ESLint
   npm run test         # Vitest
   npm run build        # Vite production build
   ```
   All four must pass. If any fails, fix the issue before committing.

2. **Follow the existing feature module pattern.**
   - Data hooks live in `src/features/<domain>/api.ts`.
   - Each file exports custom hooks that wrap `useQuery` / `useMutation`.
   - Hooks handle their own query-key invalidation via `useQueryClient`.

3. **Use the `@/` path alias** for all imports from `src/`. Never use relative paths that climb more than one directory (`../../`).

4. **Use shadcn/ui components** from `src/components/ui/` for all UI primitives (buttons, inputs, dialogs, etc.). If you need a component that doesn't exist yet, add it via the shadcn CLI:
   ```bash
   npx shadcn-ui@latest add <component-name>
   ```

5. **Use Tailwind utility classes** for styling. Do not create custom CSS files unless truly necessary.

6. **Keep components small and focused.** If a page component exceeds ~200 lines, extract sub-components.

7. **Type everything.** Use the generated Supabase types from `@/integrations/supabase/types` for all database row shapes. Prefer explicit return types on async functions.

8. **Write tests for new utility functions and non-trivial logic.** Place tests alongside the source file or in `src/test/`.

9. **Protect new routes** by wrapping them with the `<ProtectedRoute>` component in `App.tsx`.

10. **Commit atomic, focused changes.** One logical change per commit. Write clear commit messages describing *why*, not just *what*.

11. **Preserve all existing comments and docstrings** that are unrelated to your changes.

12. **Use `date-fns`** for all date manipulation (already a dependency). Do not add Moment.js, Day.js, or other date libraries.

13. **Use `sonner` (Sonner) or `useToast`** for user-facing notifications — both are already set up. Pick one consistently within a feature.

14. **Use `zod`** for runtime input validation (form schemas, API payloads). It's already a dependency.

### ❌ DO NOT

1. **DO NOT edit auto-generated files:**
   - `src/integrations/supabase/client.ts`
   - `src/integrations/supabase/types.ts`
   - Any file in `src/components/ui/` (these are managed by shadcn/ui)

   If Supabase types are stale, regenerate them via the Supabase CLI, don't hand-edit.

2. **DO NOT add new dependencies without explicit approval.** This project intentionally keeps its dependency surface small. If you believe a library is necessary, state the case and wait for confirmation.

3. **DO NOT use `any` type.** The tsconfig currently has `noImplicitAny: false` and `strict: false`, but we are progressively tightening these. New code must not introduce new `any` casts.

4. **DO NOT store secrets or credentials in code.** All environment variables go in `.env` (git-ignored) and are documented in `.env.example`. Use `import.meta.env.VITE_*` for client-side env vars.

5. **DO NOT bypass Supabase Row-Level Security (RLS).** All client-side queries go through the public anon key with RLS enforced. If a query needs elevated privileges, it belongs in a Supabase Edge Function or database function, not in client-side code.

6. **DO NOT use `console.log` in production code.** Use the toast/notification system for user-facing messages. Debugging logs must be removed before committing.

7. **DO NOT modify the CI pipeline** without discussing the change first. The CI is the quality gate for the project.

8. **DO NOT introduce global CSS or inline styles.** Use Tailwind classes. The only global CSS lives in `src/index.css` (Tailwind base + custom CSS variables for the design system).

9. **DO NOT break the existing import alias structure.** All `@/` imports resolve to `src/`. Do not add new aliases without discussion.

10. **DO NOT create barrel files** (`index.ts` that re-exports everything). They bloat bundle size and make tree-shaking harder. Import directly from the source module.

---

## 4. Coding Conventions

### TypeScript

- **Strict is the goal.** Even though the tsconfig is permissive today, write code *as if* `strict: true` were enabled. Explicit types, no implicit `any`, proper null checks.
- Prefer `interface` for object shapes that may be extended; use `type` for unions, intersections, and computed types.
- Use `const` assertions (`as const`) for constant arrays and objects.
- Never use `@ts-ignore` or `@ts-expect-error` without a comment explaining *why*.

### React

- **Functional components only.** No class components.
- Prefer named exports for components; default exports only for route-level pages.
- Hooks must follow the `useXxx` naming convention.
- Keep `useEffect` dependencies honest — no eslint-disable for exhaustive-deps.
- Use `React.memo` sparingly and only when you can demonstrate a measurable perf improvement.

### React Query

- Query keys must be descriptive arrays: `["groups"]`, `["group", id]`, `["members", groupId]`.
- Mutations must invalidate the relevant query keys in `onSuccess`.
- Keep `staleTime` and `refetchOnWindowFocus` consistent with the global defaults in `App.tsx` unless a feature explicitly needs different behavior.

### File Naming

- Components: `PascalCase.tsx` (e.g., `GroupDetail.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- Utilities: `camelCase.ts` (e.g., `cycle.ts`)
- Tests: `<source>.test.ts` or `<source>.test.tsx`

---

## 5. Database & Supabase

- **All schema changes must be done via Supabase migrations** in `supabase/migrations/`. Never modify the database schema manually in the dashboard for changes intended to be permanent.
- After any migration, regenerate the TypeScript types:
  ```bash
  npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
  ```
- **RLS policies are mandatory** on all tables. Every new table must have appropriate RLS policies before being used in the app.
- Use Supabase's built-in `auth.uid()` in policies — don't roll custom auth.

---

## 6. Testing

- Test runner: **Vitest** (with `jsdom` environment).
- Setup file: `src/test/setup.ts` (includes `@testing-library/jest-dom` matchers and `matchMedia` polyfill).
- Place unit tests for utilities in the same directory or in `src/test/`.
- For component tests, use `@testing-library/react`'s `render` and `screen` utilities.
- Mock Supabase calls when testing components — do not make real network requests in tests.

---

## 7. Environment Variables

| Variable                        | Purpose                         | Required |
| ------------------------------- | ------------------------------- | -------- |
| `VITE_SUPABASE_URL`             | Supabase project URL            | Yes      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key        | Yes      |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ID (for CLI)   | Optional |

- All client-side env vars must be prefixed with `VITE_`.
- The `.env` file is git-ignored. Copy `.env.example` and fill in real values locally.
- In CI, placeholder values are provided so the build step doesn't fail (they aren't used at runtime).

---

## 8. Git & CI Workflow

- **Default branch:** `main`
- **CI runs on:** every push to `main` and every pull request targeting `main`.
- **CI jobs (all must pass):**
  1. `lint` — ESLint
  2. `typecheck` — TypeScript (`tsc --noEmit`)
  3. `build` — Vite production build
  4. `test` — Vitest
- **Branch naming convention:** `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`
- **PR size:** Keep pull requests small and reviewable. < 400 lines changed is ideal.

---

## 9. Common Pitfalls to Avoid

| Pitfall | Why It's Bad | What to Do Instead |
|---|---|---|
| Editing `types.ts` by hand | Gets overwritten on regen | Regenerate with Supabase CLI |
| Adding a new table without RLS | Data is publicly accessible | Always add RLS policies |
| Using `useEffect` for data fetching | React Query handles caching, refetching, loading/error states | Use `useQuery` / `useMutation` |
| Hardcoding Supabase URL/key | Breaks across environments | Use `import.meta.env.VITE_*` |
| Importing from `../../../` | Fragile, hard to read | Use `@/` alias |
| Putting business logic in page components | Untestable, hard to reuse | Extract to hooks or `lib/` utilities |
| Skipping error handling on Supabase calls | Silent failures confuse users | Always check `error` and show toast |
| Creating new CSS files | Inconsistent with Tailwind approach | Use Tailwind utility classes |

---

## 10. Quick Reference — Scripts

```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build → dist/
npm run build:dev    # Dev-mode build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type-checking
npm run test         # Run Vitest (single run)
npm run test:watch   # Run Vitest in watch mode
```

---

## 11. Checklist Before Submitting Changes

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes  
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] No new `any` types introduced
- [ ] No auto-generated files modified
- [ ] No secrets committed
- [ ] New routes are wrapped in `<ProtectedRoute>`
- [ ] New database tables have RLS policies
- [ ] Commit messages are clear and descriptive
