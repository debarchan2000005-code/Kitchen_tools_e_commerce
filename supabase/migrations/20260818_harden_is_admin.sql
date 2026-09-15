-- Hardens the database-side admin check used by the frontend's admin-login
-- verification (and by RLS policies once those are reviewed - see note at
-- the bottom).
--
-- This migration is purely ADDITIVE and safe to run any number of times:
--  - is_admin() is created with CREATE OR REPLACE (redefines the function
--    if it already exists; never drops it)
--  - no tables are created, altered, or dropped
--  - no rows are inserted, updated, or deleted
--  - no existing RLS policies are touched
--
-- SECURITY DEFINER + SET search_path = public:
--  - SECURITY DEFINER lets the function read `customers` to answer "is the
--    calling user an admin", even from a caller whose own RLS grants don't
--    otherwise allow reading that table.
--  - SET search_path = public pins the function to the public schema so it
--    can't be tricked by a caller-controlled search_path into resolving
--    `customers` to a different, attacker-created object.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.customers
    where auth_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Any authenticated user must be able to CALL this (it's how they find out
-- they are NOT an admin); it does not grant them any table access beyond
-- what the function itself returns.
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- NOTE ON RLS POLICIES (products, orders, customers, reviews, settings,
-- homepage_sections, dashboard_widgets, product_images, etc.):
--
-- I have NOT modified any RLS policies in this migration. Rewriting them
-- blind risks breaking checkout/cart/wishlist/guest flows I can't see, or
-- leaving a gap that looks fixed but isn't. Before touching RLS, I need
-- your actual current policies - e.g. the output of:
--
--   select schemaname, tablename, policyname, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--
-- Once I have that, I can send a second, equally minimal migration that
-- only tightens the specific policies that are actually unsafe (e.g. any
-- `USING (true)` on an admin-managed table), using
-- `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` so it's idempotent.
-- ---------------------------------------------------------------------