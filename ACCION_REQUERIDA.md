╔════════════════════════════════════════════════════════════════╗
║  RLS FIX STATUS — ACCIÓN REQUERIDA                              ║
╚════════════════════════════════════════════════════════════════╝

┌─ ESTADO ACTUAL
│
├─ ❌ RLS Fix: NO APLICADO (confirmado por test CRUD)
├─ ✅ Código: Correcto (Boarding.js no requiere cambios)
├─ ✅ SQL: Listo (migrations/002_fix_rls_embarque_list_users.sql)
├─ ✅ Git: Commitado (todos los archivos en repositorio)
├─ ❌ Supabase Console: Requiere ejecución manual
│
└─ 🔴 BLOQUEADOR: INSERT en list_users bloqueado para EMBARQUE

┌─ LO QUE FALLA
│
├─ EMBARQUE intenta crear entregador en Boarding.js
├─ RLS bloquea: "new row violates row-level security policy"
├─ Causa: Políticas RLS solo permiten ADMIN (no EMBARQUE)
│
└─ Test confirmó: ❌ CREATE, ❌ UPDATE, ❌ DELETE todos bloqueados

┌─ SOLUCIÓN REQUERIDA (2 minutos)
│
├─1️⃣  Abre: https://supabase.com/dashboard
├─2️⃣  Proyecto: palletgo
├─3️⃣  SQL Editor → New Query
├─4️⃣  Pega este SQL exactamente:
│
│    DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
│    DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
│    DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;
│
│    CREATE POLICY "list_users_insert_admin_embarque"
│      ON public.list_users FOR INSERT TO authenticated
│      WITH CHECK ((SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE'));
│
│    CREATE POLICY "list_users_update_admin_embarque"
│      ON public.list_users FOR UPDATE TO authenticated
│      USING ((SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE'))
│      WITH CHECK ((SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE'));
│
│    CREATE POLICY "list_users_delete_admin_embarque"
│      ON public.list_users FOR DELETE TO authenticated
│      USING ((SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE'));
│
├─5️⃣  Click: RUN button
├─6️⃣  Espera: ✅ "Query executed successfully"
│
└─ Listo ✅

┌─ VALIDAR RESULTADO
│
├─ Terminal:
│   cd c:\Proyectos\palletgo
│   node _internal/scripts/test-crud-authenticated.js
│
├─ Resultado esperado (después del fix):
│   ✅ CREATE   - Insertar entregador (ahora funciona)
│   ✅ UPDATE   - Actualizar nombre
│   ✅ DELETE   - Eliminar entregador
│
├─ O manualmente:
│   1. http://localhost:3000/Boarding
│   2. Login: embarque_els / Yazakiels25
│   3. + Agregar → "TEST" → Guardar → ✅ Debe aparecer
│
└─ Listo ✅

┌─ ARCHIVOS DE REFERENCIA
│
├─ RLS_FIX_APPLY_NOW.md .......................... Guía completa
├─ migrations/002_fix_rls_embarque_list_users.sql  SQL limpio
├─ _internal/docs/TEST_CRUD_HALLAZGOS.md ......... Hallazgos técnicos
├─ _internal/docs/FIX_EMBARQUE_CRUD_APLICAR_AHORA.md  Instrucciones
│
└─ Todos los archivos ya están en Git ✅

┌─ CASOS DE ERROR COMÚN
│
├─ "Policy already exists"
│   → Solución: Asegúrate de ejecutar DROP antes de CREATE
│
├─ "Insufficient privilege"
│   → Solución: Intenta nuevamente, espera 30s, recarga navegador
│
├─ Boarding.js muestra error después del fix
│   → Solución: Espera 30s (demora en Supabase), F5 en navegador
│
└─ ¿Sigue fallando? Revisa: RLS_FIX_APPLY_NOW.md (sección Troubleshooting)

╔════════════════════════════════════════════════════════════════╗
║  PRÓXIMO PASO: Ejecuta el SQL en Supabase Console ☝️           ║
║  TIEMPO: 2 minutos                                             ║
║  RIESGO: Ninguno (solo cambia permisos, no datos)              ║
╚════════════════════════════════════════════════════════════════╝
