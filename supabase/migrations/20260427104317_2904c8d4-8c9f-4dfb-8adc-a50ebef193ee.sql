
-- Fix mutable search_path on remaining functions
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

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles.
-- These are only called from RLS policies / triggers, never from the client.
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.is_group_owner(uuid) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
