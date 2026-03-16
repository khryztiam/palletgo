-- ============================================================
-- PalletGo RLS Security Implementation
-- Execution: Supabase Console > SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. TABLE: public.users - User Profiles
-- ============================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin_only" ON public.users;
DROP POLICY IF EXISTS "users_update_self_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;

-- SELECT: All authenticated users can view
CREATE POLICY "users_select_authenticated"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only admin can create users
CREATE POLICY "users_insert_admin_only"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- UPDATE: Users can update themselves, admin can update anyone
CREATE POLICY "users_update_self_or_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR 
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  )
  WITH CHECK (
    id = auth.uid() OR 
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- DELETE: Only admin can delete users
CREATE POLICY "users_delete_admin_only"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- 3. TABLE: public.orders - Order Management
-- ============================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_update_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin_only" ON public.orders;

-- SELECT: View own orders or all if ADMIN/SUPERVISOR
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- ADMIN and SUPERVISOR can see all orders
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR') OR
    -- LINEA users see only their own orders (submitted by them)
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'LINEA' AND 
     user_submit = (SELECT user_name FROM public.users WHERE id = auth.uid())) OR
    -- EMBARQUE users see all orders (will handle filtering in UI or separate policy)
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'EMBARQUE'
  );

-- INSERT: LINEA and ADMIN and EMBARQUE can create orders
CREATE POLICY "orders_insert_authorized"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('LINEA', 'ADMIN', 'EMBARQUE')
  );

-- UPDATE: Different rules per role
CREATE POLICY "orders_update_authorized"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    -- ADMIN can update anything
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR') OR
    -- LINEA can update own orders if status is SOLICITADO
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'LINEA' AND 
     user_submit = (SELECT user_name FROM public.users WHERE id = auth.uid()) AND 
     status = 'SOLICITADO') OR
    -- EMBARQUE can update orders assigned to them
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'EMBARQUE')
  )
  WITH CHECK (
    -- ADMIN can update anything
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR') OR
    -- LINEA can update own orders if status is SOLICITADO
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'LINEA' AND 
     user_submit = (SELECT user_name FROM public.users WHERE id = auth.uid()) AND 
     status = 'SOLICITADO') OR
    -- EMBARQUE can update orders
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'EMBARQUE')
  );

-- DELETE: Only ADMIN can delete orders
CREATE POLICY "orders_delete_admin_only"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- 4. TABLE: public.list_users - Deliverers List
-- ============================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "list_users_select_authenticated" ON public.list_users;
DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;

-- SELECT: All authenticated users can view (public list within app)
CREATE POLICY "list_users_select_authenticated"
  ON public.list_users
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only ADMIN can add deliverers
CREATE POLICY "list_users_insert_admin_only"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- UPDATE: Only ADMIN can update
CREATE POLICY "list_users_update_admin_only"
  ON public.list_users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  )
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- DELETE: Only ADMIN can delete
CREATE POLICY "list_users_delete_admin_only"
  ON public.list_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- END OF RLS SETUP
-- ============================================================
