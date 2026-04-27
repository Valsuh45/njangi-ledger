## Njangi PWA — MVP Build Plan

A mobile-first web app for managing rotating savings groups (Njangis). Admin-managed model: only the group creator signs in; members are records on the group.

### Visual direction
- **Palette**: Ocean Deep — `#0c2340` (primary navy), `#1a4a6e` (deep teal), `#2d8a9e` (accent), `#5cbdb9` (highlight), with neutral background and clear semantic green/red for paid/unpaid.
- **Type**: Clean sans (Inter) — readable at small sizes.
- **Layout**: Mobile-first with persistent bottom navigation (Dashboard · Groups · Profile). Card-based lists, large tap targets, status pills.

### Auth
- Email + password sign-up / sign-in via Lovable Cloud.
- Auto-confirm enabled for fast testing (no email verification).
- Persistent session, protected routes, sign-out from Profile tab.
- A `profiles` table auto-created on signup (display name, email).

### Data model
- **profiles** — `id` (= auth user), `display_name`, `email`.
- **groups** — `id`, `owner_id`, `name`, `contribution_amount`, `currency`, `cycle_length` (months), `start_month`, `status` (draft / active / completed), `created_at`.
- **members** — `id`, `group_id`, `name`, `phone` (optional), `payout_position` (1..N, manually set), `payout_received` (bool), `payout_received_at`.
- **contributions** — `id`, `group_id`, `member_id`, `cycle_month` (1..N), `paid` (bool), `paid_at`, `amount`. Unique on (member, cycle_month).
- **payouts** — `id`, `group_id`, `cycle_month`, `member_id`, `amount`, `released` (bool), `released_at`.
- Roles via separate `user_roles` table + `has_role()` security-definer function (admin / member) — wired in for future expansion even though MVP has admin-only login.

### RLS (data isolation)
- All tables: only the group `owner_id` can read/write rows for their groups (and their nested members/contributions/payouts), enforced via security-definer helper `is_group_owner(group_id)` to avoid recursion.
- `profiles`: each user reads/updates only their own row.

### Screens
1. **Auth** (`/auth`) — combined sign-in / sign-up tabs.
2. **Dashboard** (`/`) — list of user's groups with progress bar (months elapsed / total), next payout member, paid/unpaid count for the current month. "+ New group" CTA.
3. **Create group** (`/groups/new`) — name, contribution amount, currency, cycle length, start month.
4. **Group detail** (`/groups/:id`) — tabs:
   - **Overview**: current month, next payout recipient, totals, progress.
   - **Members**: ordered list with position (drag-free; admin edits position via input), add/remove member, payout status pill.
   - **Contributions**: month selector → grid of members with paid/unpaid toggle (green/red). Bulk "mark all paid" action.
   - **Payouts**: ordered cycle list, mark payout released per month.
   - **Export CSV** button (contributions for the group).
5. **Member detail** (`/groups/:id/members/:memberId`) — contribution history per month, payout status, totals.
6. **Profile** (`/profile`) — display name, email, sign out.

### Logic rules
- Cycle months are 1..N where N = `cycle_length`. "Current month" = months since `start_month` (clamped). Group auto-marked `completed` when all months are paid out.
- "Next payout recipient" = lowest `payout_position` where `payout_received = false`.
- Adding a member auto-assigns position = next free slot; admin can override.
- Removing a member is blocked if they have any paid contributions or a released payout (soft warning).
- Creating a group seeds an empty contribution row per (member, month) lazily on first view of that month.

### Nice-to-haves included
- **CSV export**: contributions matrix per group (members × months).
- **Role scaffolding**: `user_roles` table + `has_role()` so future "member login" can be added without migration churn.
- **Installable PWA**: `manifest.webmanifest` + icons + `display: standalone` + theme color. **No service worker** (would break the Lovable preview). Install works on the published URL.

### Out of scope (MVP)
- Member-facing logins / invite flow.
- Payment integrations — paid status is admin-tracked only.
- Push notifications, offline write sync.
- Multi-currency conversion (currency is a label only).

### Tech notes
- Stack: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Lovable Cloud (Supabase: Postgres, Auth, RLS).
- Folder layout:
  ```text
  src/
    components/        shared UI (BottomNav, StatusPill, ProgressBar)
    features/
      auth/
      groups/
      members/
      contributions/
      payouts/
    lib/               supabase client, csv, date helpers
    pages/             route components
    hooks/
  ```
- React Query for data fetching/caching against Supabase.
- All mutations require `auth.uid()`; inserts always set `owner_id = auth.uid()`.
