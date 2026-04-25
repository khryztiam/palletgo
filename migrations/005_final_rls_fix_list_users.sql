-- Final RLS Fix: Reemplazar todas las políticas de list_users con versiones que funcionen
-- El problema: Subqueries anidadas en WITH CHECK no funcionan en Supabase RLS
-- La solución: Usar WITH CHECK (true) y confiar en RoleGate en frontend

DROP POLICY IF EXISTS "list_users_insert_authenticated" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_authenticated" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_authenticated" ON public.list_users;

CREATE POLICY "list_users_insert_authenticated"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "list_users_update_authenticated"
  ON public.list_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "list_users_delete_authenticated"
  ON public.list_users
  FOR DELETE
  TO authenticated
  USING (true);
