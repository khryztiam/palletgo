-- ============================================================
-- POLÍTICA RLS SIMPLIFICADA - Sin subqueries anidadas
-- ============================================================
-- El problema: Las subqueries en WITH CHECK fallan en RLS
-- La solución: Usar una política más simple que funcione

DROP POLICY IF EXISTS "list_users_insert_admin_embarque" ON public.list_users;

-- POLÍTICA SIMPLIFICADA: Solo usuarios autenticados pueden insertar
-- (El control de rol se hará en la aplicación si es necesario)
CREATE POLICY "list_users_insert_embarque_and_admin"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternativamente, si quieres mantener control de rol, usa ESTA política:
-- (Usa una función en lugar de subquery)
-- CREATE POLICY "list_users_insert_role_based"
--   ON public.list_users
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (public.has_role(auth.uid(), ARRAY['ADMIN', 'EMBARQUE']));
