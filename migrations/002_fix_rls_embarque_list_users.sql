-- ============================================================
-- Fix RLS for list_users - Allow EMBARQUE role to manage deliverers
-- Migration: 002_fix_rls_embarque_list_users
-- Date: April 24, 2026
-- ============================================================

-- Drop old policies that only allowed ADMIN
DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;

-- ============================================================
-- New policies: Allow ADMIN and EMBARQUE to manage deliverers
-- ============================================================

-- INSERT: ADMIN and EMBARQUE can add deliverers
CREATE POLICY "list_users_insert_admin_embarque"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  );

-- UPDATE: ADMIN and EMBARQUE can update deliverers
CREATE POLICY "list_users_update_admin_embarque"
  ON public.list_users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  )
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  );

-- DELETE: ADMIN and EMBARQUE can delete deliverers
CREATE POLICY "list_users_delete_admin_embarque"
  ON public.list_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  );

-- ============================================================
-- End of migration
-- ============================================================
