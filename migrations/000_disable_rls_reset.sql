-- ============================================================
-- DISABLE RLS AND DROP ALL POLICIES (RESET)
-- ============================================================
-- Run this FIRST to clean up the broken RLS
-- Then run 001_enable_rls.sql with the fixed version

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_users DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin_only" ON public.users;
DROP POLICY IF EXISTS "users_update_self_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_update_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin_only" ON public.orders;

DROP POLICY IF EXISTS "list_users_select_authenticated" ON public.list_users;
DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;

-- Confirm
SELECT 'RLS DISABLED AND CLEANED' as status;
