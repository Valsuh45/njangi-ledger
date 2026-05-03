-- Restore EXECUTE on is_group_owner for the authenticated role.
-- Migration 20260427104317 incorrectly revoked this privilege, breaking all
-- RLS policies on members, contributions, and payouts that call this function.
grant execute on function public.is_group_owner(uuid) to authenticated;
