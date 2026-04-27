
-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('admin', 'member');
create type public.group_status as enum ('draft', 'active', 'completed');

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- =========================================================
-- USER ROLES (kept separate to avoid privilege escalation)
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own roles"
  on public.user_roles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =========================================================
-- GROUPS
-- =========================================================
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contribution_amount numeric(12,2) not null check (contribution_amount > 0),
  currency text not null default 'USD',
  cycle_length integer not null check (cycle_length between 1 and 60),
  start_month date not null default (date_trunc('month', now())::date),
  status public.group_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- Security definer helper to check group ownership without recursion
create or replace function public.is_group_owner(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = _group_id and owner_id = auth.uid()
  )
$$;

create policy "Owners can view their groups"
  on public.groups for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can create groups"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update their groups"
  on public.groups for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can delete their groups"
  on public.groups for delete
  to authenticated
  using (auth.uid() = owner_id);

-- =========================================================
-- MEMBERS
-- =========================================================
create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  phone text,
  payout_position integer not null check (payout_position >= 1),
  payout_received boolean not null default false,
  payout_received_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, payout_position)
);

create index members_group_id_idx on public.members(group_id);

alter table public.members enable row level security;

create policy "Owners can view group members"
  on public.members for select
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can insert group members"
  on public.members for insert
  to authenticated
  with check (public.is_group_owner(group_id));

create policy "Owners can update group members"
  on public.members for update
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can delete group members"
  on public.members for delete
  to authenticated
  using (public.is_group_owner(group_id));

-- =========================================================
-- CONTRIBUTIONS
-- =========================================================
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  cycle_month integer not null check (cycle_month >= 1),
  paid boolean not null default false,
  paid_at timestamptz,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (member_id, cycle_month)
);

create index contributions_group_idx on public.contributions(group_id);
create index contributions_group_month_idx on public.contributions(group_id, cycle_month);

alter table public.contributions enable row level security;

create policy "Owners can view contributions"
  on public.contributions for select
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can insert contributions"
  on public.contributions for insert
  to authenticated
  with check (public.is_group_owner(group_id));

create policy "Owners can update contributions"
  on public.contributions for update
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can delete contributions"
  on public.contributions for delete
  to authenticated
  using (public.is_group_owner(group_id));

-- =========================================================
-- PAYOUTS
-- =========================================================
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  cycle_month integer not null check (cycle_month >= 1),
  amount numeric(12,2) not null default 0,
  released boolean not null default false,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, cycle_month)
);

create index payouts_group_idx on public.payouts(group_id);

alter table public.payouts enable row level security;

create policy "Owners can view payouts"
  on public.payouts for select
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can insert payouts"
  on public.payouts for insert
  to authenticated
  with check (public.is_group_owner(group_id));

create policy "Owners can update payouts"
  on public.payouts for update
  to authenticated
  using (public.is_group_owner(group_id));

create policy "Owners can delete payouts"
  on public.payouts for delete
  to authenticated
  using (public.is_group_owner(group_id));

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Auto-create profile + default admin role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'admin')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger groups_touch_updated_at
  before update on public.groups
  for each row execute function public.touch_updated_at();
