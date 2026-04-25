# 🔐 GUÍA FINAL - Aplicar RLS Fix para EMBARQUE

**Status:** ⏳ **Pendiente aplicación manual en Supabase Console**  
**Estimado:** 2 minutos  
**Criticidad:** 🔴 **Alto** - Sin este fix, EMBARQUE no puede crear entregadores

---

## 📋 Resumen Ejecutivo

Se identificó y solucionó un conflicto en las políticas RLS de la tabla `list_users`:

| Aspecto | Status |
|---------|--------|
| Código (Boarding.js) | ✅ Correcto |
| BD (tabla list_users) | ✅ Estructura correcta |
| RLS Actual | ❌ Bloquea EMBARQUE |
| RLS Corregido | ✅ Permite EMBARQUE |
| Archivos actualizados | ✅ En Git |
| **Próximo paso** | 📌 Ejecutar SQL en Supabase |

---

## 🚀 Paso 1: Ejecutar SQL (2 minutos)

### Opción A: Supabase Console (Recomendado)

1. **Abre Supabase**
   ```
   https://supabase.com/dashboard
   ```

2. **Selecciona proyecto**
   - Proyecto: **palletgo**

3. **SQL Editor**
   - Menú: "SQL Editor"
   - Click: "New Query"

4. **Copia este SQL exactamente:**

```sql
-- Drop old policies (que bloqueaban EMBARQUE)
DROP POLICY IF EXISTS "list_users_insert_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_update_admin_only" ON public.list_users;
DROP POLICY IF EXISTS "list_users_delete_admin_only" ON public.list_users;

-- Create new policies (ADMIN + EMBARQUE)
CREATE POLICY "list_users_insert_admin_embarque"
  ON public.list_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  );

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

CREATE POLICY "list_users_delete_admin_embarque"
  ON public.list_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT rol_name FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'EMBARQUE')
  );
```

5. **Ejecuta**
   - Click: Botón **"RUN"** (o Ctrl+Enter)
   - Espera: ✅ **"Query executed successfully"**

6. **Verifica en Policies**
   - Menú: "Authentication"
   - Opción: "Policies"
   - Tabla: `list_users`
   - Debes ver 4 políticas:
     - ✅ `list_users_select_authenticated`
     - ✅ `list_users_insert_admin_embarque` (NUEVA)
     - ✅ `list_users_update_admin_embarque` (NUEVA)
     - ✅ `list_users_delete_admin_embarque` (NUEVA)

---

### Opción B: Vía psql (si tienes acceso a terminal)

```bash
psql postgresql://[usuario]:[pass]@db.rhkhpigphjlccbscijms.supabase.co:5432/postgres < migrations/002_fix_rls_embarque_list_users.sql
```

---

## 🧪 Paso 2: Testear Resultado (1 minuto)

### Test Automático
```bash
cd c:\Proyectos\palletgo
node _internal/scripts/test-crud-authenticated.js
```

**Resultado esperado después del fix:**
```
✅ LOGIN   - embarque_els@yazaki.com
✅ VERIFY  - Rol: EMBARQUE
✅ CREATE  - Insertar entregador ← Esto debe cambiar de ❌ a ✅
✅ UPDATE  - Actualizar nombre
✅ DELETE  - Eliminar entregador
```

### Test Manual en UI

1. **Abre** http://localhost:3000/Boarding
2. **Login** con: **embarque_els** / **[contraseña]**
3. **Crea entregador:**
   - Click: "+ Agregar"
   - Ingresa: "TEST DEMO"
   - Click: "Guardar"
   - ✅ Debe aparecer en la lista (ahora funciona)
4. **Modifica:**
   - Click: entregador creado
   - Cambia nombre
   - Click: "Guardar"
   - ✅ Debe actualizarse
5. **Elimina:**
   - Click: entregador
   - Click: "Eliminar"
   - Confirma
   - ✅ Debe desaparecer

---

## 📁 Archivos Referencia

**Cambios realizados:**
- `migrations/001_enable_rls.sql` - Actualizado
- `migrations/002_fix_rls_embarque_list_users.sql` - Nuevo (SQL limpio)
- `_internal/docs/FIX_EMBARQUE_CRUD_APLICAR_AHORA.md` - Instrucciones
- `_internal/docs/TEST_CRUD_HALLAZGOS.md` - Hallazgos completos

**Scripts de test:**
- `_internal/scripts/test-crud-authenticated.js` - Test completo CRUD
- `_internal/scripts/test-crud-entregadores.js` - Test directo
- `_internal/scripts/apply-rls-via-api.js` - Intenta vía API

---

## ✨ Qué Cambia Después del Fix

**ANTES:**
```
EMBARQUE intenta crear entregador
↓
RLS bloquea: "new row violates row-level security policy"
↓
❌ No puede crear
```

**DESPUÉS:**
```
EMBARQUE intenta crear entregador
↓
RLS permite: rol IN ('ADMIN', 'EMBARQUE')
↓
✅ Puede crear, modificar, eliminar entregadores
```

---

## 🎯 Impacto

| Rol | CREATE | UPDATE | DELETE | READ |
|-----|--------|--------|--------|------|
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| **EMBARQUE** | **✅** | **✅** | **✅** | ✅ |
| LINEA | ❌ | ❌ | ❌ | ✅ |
| SUPERVISOR | ❌ | ❌ | ❌ | ✅ |

---

## ✅ Checklist Post-Implementación

- [ ] SQL ejecutado en Supabase Console
- [ ] "Query executed successfully" mostrado
- [ ] Políticas visibles en Authentication > Policies
- [ ] Test automático ejecutado: `test-crud-authenticated.js`
- [ ] Test manual en UI realizado
- [ ] Commit en Git hecho

---

## 📞 Si Algo Falla

**Error: "Policy already exists"**
→ Las antiguas políticas no se borraron  
→ Solución: DROP POLICY debe ejecutarse ANTES de CREATE

**Error: "Insufficient privilege"**
→ Las nuevas políticas aún no existen  
→ Solución: Ejecuta nuevamente el SQL completo

**Código en Boarding.js aún muestra error**
→ Supabase tarda ~30 segundos en aplicar cambios  
→ Solución: Espera, recarga navegador (F5), reintenta

---

## 📝 Resumen Técnico

**Problema:**
- Tabla `list_users` tenía políticas RLS que solo aceptaban rol = 'ADMIN'
- Bloqueaba INSERT, UPDATE, DELETE para rol EMBARQUE
- Documentación esperaba que EMBARQUE pudiera hacer CRUD

**Solución:**
- Cambiar condición de `= 'ADMIN'` a `IN ('ADMIN', 'EMBARQUE')`
- Aplica a INSERT, UPDATE, DELETE
- SELECT ya permitía todos los autenticados (sin cambios)

**Archivos tocados:**
- migrations/001_enable_rls.sql (actualizado)
- migrations/002_fix_rls_embarque_list_users.sql (nuevo)

**Commits:**
- ✅ `fix: actualizar RLS para permitir EMBARQUE hacer CRUD en list_users`

---

**Próximo paso:** Ejecuta el SQL en Supabase Console arriba 👆

**Tiempo estimado:** 2 minutos  
**Complejidad:** Muy baja (copy-paste y click)  
**Riesgo:** Ninguno (solo modifica permisos de acceso, no datos)
