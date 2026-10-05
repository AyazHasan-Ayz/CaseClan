-- Admin RLS policies call this private helper for every authenticated request.
-- Keep it unavailable to anonymous users, but allow authenticated policies to
-- resolve the caller's current role from public.customers.
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;

revoke execute on function private.current_user_role() from public, anon;
