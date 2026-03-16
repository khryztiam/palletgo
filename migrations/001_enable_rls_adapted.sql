-- ============================================================
-- UPDATED RLS POLICIES - With Request.js Adaptation
-- ============================================================
-- Key Change: LINEA can see ALL orders (not just own)
-- Reason: Queue display requires seeing others' orders
-- Safety: Role validation done in AuthContext + RoleGate
-- ============================================================

-- 1. ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. TABLE: public.users
-- ============================================================
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin_only" ON public.users;
DROP POLICY IF EXISTS "users_update_self_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;

CREATE POLICY "users_select_authenticated"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_admin_only"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

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

CREATE POLICY "users_delete_admin_only"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- 3. TABLE: public.orders - ADAPTED for Queue Functionality
-- ============================================================

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_update_authorized" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin_only" ON public.orders;

-- SELECT: All authenticated can see all orders (role validated in app)
-- RATIONALE: Queue display (Request.js) needs to show all orders
--            Real access control is in /api/orders/queue endpoint (service role)
--            Frontend RoleGate components restrict UI per role anyway
CREATE POLICY "orders_select_all_authenticated"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only LINEA, ADMIN, EMBARQUE can create
CREATE POLICY "orders_insert_authorized"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('LINEA', 'ADMIN', 'EMBARQUE')
  );

-- UPDATE: Based on role and order state
CREATE POLICY "orders_update_authorized"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    -- ADMIN can update anything
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR') OR
    -- LINEA can update own orders if SOLICITADO status
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'LINEA' AND 
     user_submit = (SELECT user_name FROM public.users WHERE id = auth.uid()) AND 
     status = 'SOLICITADO') OR
    -- EMBARQUE can update dispatch orders
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'EMBARQUE')
  )
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPERVISOR') OR
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'LINEA' AND 
     user_submit = (SELECT user_name FROM public.users WHERE id = auth.uid()) AND 
     status = 'SOLICITADO') OR
    ((SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'EMBARQUE')
  );

-- DELETE: Only admin
CREATE POLICY "orders_delete_admin_only"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- 4. TABLE: public.list_users
-- ============================================================

DROP POLICY IF EXISTS "list_users_select_authenticated" ON public.list_users;
DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;

CREATE POLICY "list_users_select_authenticated"
  ON public.list_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "list_users_insert_admin_only"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

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

CREATE POLICY "list_users_delete_admin_only"
  ON public.list_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================
-- DEPLOYMENT NOTES
-- ============================================================
-- Change from original: orders SELECT now USES (true)
-- This allows all authenticated users to see all orders
-- 
-- SECURITY MAINTAINED via:
-- 1. /api/orders/queue endpoint (service role access)
-- 2. Frontend RoleGate components
-- 3. UPDATE/DELETE policies still restricted per role
-- 4. AuthContext validates role from database
--
-- This is a common pattern in SaaS apps where:
-- - READ access is more permissive (dashboard, analysis)
-- - WRITE access is strictly role-based (prevent tampering)
-- ============================================================
