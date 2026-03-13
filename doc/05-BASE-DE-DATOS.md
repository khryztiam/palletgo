# 🗄️ Base de Datos - PostgreSQL en Supabase

> **Documentación de Esquema y Operaciones**
> 
> Audiencia: Desarrolladores, DBAs
> Tiempo: 25 minutos

---

## 📋 Tabla de Contenidos

1. [Esquema General](#esquema-general)
2. [Tablas Detalladas](#tablas-detalladas)
3. [Relaciones](#relaciones)
4. [Operaciones CRUD](#operaciones-crud)
5. [Realtime](#realtime)
6. [Optimizaciones](#optimizaciones)
7. [Backup y Recovery](#backup-y-recovery)

---

## 🏛️ Esquema General

```sql
DATABASE: rhkhpigphjlccbscijms (Supabase)

SCHEMAS:
├── auth (Supabase managed)
│   └── users (JWT authentication)
│
└── public (Nuestra aplicación)
    ├── users (app users + roles)
    ├── orders (solicitudes de embarque) ← REALTIME
    ├── deliveryPersons (vacío - pendiente)
    └── orderDetails (vacío - pendiente)
```

---

## 📋 Tablas Detalladas

### 1. **auth.users** (Manejado por Supabase)

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  last_sign_in_at TIMESTAMP,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB
);
```

**Propiedades:**
- `id` - UUID, generado por Supabase
- `email` - Email único (ej: embarque_els@yazaki.com)
- `encrypted_password` - bcrypt hash (NUNCA leer)
- `created_at` - Timestamp de registro
- `last_sign_in_at` - Último login

**Nota:** No modificar directamente. Usar `supabaseAdmin.auth.admin.*`

---

### 2. **public.users** (Datos de aplicación)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,      -- Nombre mostrado
  email TEXT UNIQUE NOT NULL,   -- Denormalizado (para referencia)
  id_rol INTEGER,               -- FK a roles (si existe tabla)
  rol_name TEXT NOT NULL,       -- ADMIN | LINEA | EMBARQUE | SUPERVISOR
  created_at TIMESTAMP DEFAULT now()
);
```

**Ejemplo de datos:**
```json
{
  "id": "12eddbb1-cd64-4e15-9926-ee8439ac33cc",
  "user_name": "Embarque",
  "email": "embarque_els@yazaki.com",
  "rol_name": "EMBARQUE",
  "created_at": "2025-04-08T01:31:20+00:00"
}
```

**Registros actuales:** 27 usuarios

---

### 3. **public.orders** (Solicitudes de embarque)

```sql
CREATE TABLE public.orders (
  id_order SERIAL PRIMARY KEY,          -- Auto-incremento
  date_order TIMESTAMP DEFAULT now(),   -- Cuándo se creó
  area TEXT NOT NULL,                   -- "Linea 29", "Linea 15", etc
  user_submit TEXT,                     -- Quién creó (nombre)
  details TEXT[] NOT NULL,              -- Array de items
  destiny TEXT,                         -- "EMBARQUE" | "EPC"
  status TEXT NOT NULL,                 -- SOLICITADO | EN PROGRESO | ENTREGADO
  date_delivery TIMESTAMP,              -- Cuándo se entregó
  user_deliver TEXT,                    -- Quién entregó
  comments TEXT,                        -- Notas adicionales
  duration INTEGER,                     -- Minutos para procesar
  print_label BOOLEAN,                  -- ¿Se imprimió etiqueta?
  multilabel BOOLEAN,                   -- ¿Multilabel?
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Ejemplo de registro:**
```json
{
  "id_order": 1,
  "date_order": "2025-08-14T22:55:23.802Z",
  "area": "Linea 29",
  "user_submit": "Elba",
  "details": ["CAJA GRANDE P/AEREO", "RETIRO DE CONTENEDOR"],
  "destiny": "EMBARQUE",
  "status": "ENTREGADO",
  "date_delivery": "2025-08-14T22:56:35.637Z",
  "user_deliver": "WILBER ESCOBAR",
  "comments": "",
  "duration": 1,
  "print_label": null,
  "multilabel": null
}
```

**Estadísticas:**
- Registros totales: **25,124 órdenes**
- Rango de fechas: 2025-08-14 hasta hoy
- Estados: SOLICITADO (0), EN PROGRESO (~5), ENTREGADO (~25000)

**Índices recomendados:**
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date_order ON orders(date_order DESC);
CREATE INDEX idx_orders_area ON orders(area);
CREATE INDEX idx_orders_user_submit ON orders(user_submit);
```

---

### 4. **public.deliveryPersons** (Vacío - Pendiente)

```sql
CREATE TABLE public.deliveryPersons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',  -- ACTIVE | INACTIVE
  created_at TIMESTAMP DEFAULT now()
);
```

**Estado actual:** Tabla creada pero vacía
**Para usar:** Implementar en Boarding.js

---

### 5. **public.orderDetails** (Vacío - Pendiente)

```sql
CREATE TABLE public.orderDetails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id INTEGER REFERENCES orders(id_order),
  item_type TEXT,
  quantity INTEGER,
  weight DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT now()
);
```

**Estado actual:** Tabla creada pero vacía
**Para usar:** Detalles granulares de cada orden

---

## 🔗 Relaciones

```
auth.users (1) ─────────────────────────── (1) public.users
  id (PK)                                     id (FK → auth.users.id)
  email                                       email, rol_name
  password_hash                              user_name

public.users (1) ─────────────────────────── (N) public.orders
  id                                          ~
                                              (No hay FK, pero user_submit 
                                               es nombre del usuario)

public.orders (1) ─────────────────────────── (N) public.orderDetails
  id_order (PK)                               order_id (FK → orders.id_order)
  [linea 1:N con detalles]                   [pendiente de usar]
```

---

## 🔄 Operaciones CRUD

### CREATE (INSERT orden)

```javascript
// Desde Request.js
const { data, error } = await supabase
  .from('orders')
  .insert([
    {
      area: "Linea 29",
      user_submit: "Elba",
      details: ["CAJA GRANDE", "RETIRO"],
      destiny: "EMBARQUE",
      status: "SOLICITADO",
      comments: "",
      // date_order: auto (NOW())
      // date_delivery: null (se asigna después)
    }
  ])
  .select();

if (error) console.error("Insert failed:", error);
```

### READ (SELECT órdenes)

```javascript
// Listar todas del día
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .gte('date_order', today)
  .lte('date_order', tomorrow)
  .order('date_order', { ascending: false });

// Listar solo SOLICITADAS
const { data: pending } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'SOLICITADO')
  .order('date_order', { ascending: true });

// Contar por área
const { data: summary } = await supabase
  .from('orders')
  .select('area, count(*)', { head: false })
  .group_by('area');
```

### UPDATE (Cambiar estado)

```javascript
// Marcar como EN PROGRESO
const { data, error } = await supabase
  .from('orders')
  .update({
    status: 'EN PROGRESO',
    user_deliver: currentUser.name
  })
  .eq('id_order', orderId)
  .select();

// Marcar como ENTREGADO
await supabase
  .from('orders')
  .update({
    status: 'ENTREGADO',
    date_delivery: new Date().toISOString(),
    duration: Math.round((Date.now() - order.date_order) / 60000)
  })
  .eq('id_order', orderId);
```

### DELETE (Eliminar orden)

```javascript
// Eliminar una orden
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('id_order', orderId);

if (error) {
  console.error("Delete failed:", error);
  // Mostrar toast de error
}
```

---

## 📡 Realtime (WebSockets)

### Configuración

```javascript
// En Supabase Dashboard:
// Replication → orders → Habilitar realtime
// (Ya está habilitado ✅)
```

### Subscription a cambios

```javascript
const channel = supabase
  .channel('orders_channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('Nueva orden:', payload.new);
      setOrders(prev => [payload.new, ...prev]);
      playVoiceNotification(`Nueva orden de ${payload.new.area}`);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('Orden actualizada:', payload.new);
      setOrders(prev => prev.map(o => 
        o.id_order === payload.new.id_order ? payload.new : o
      ));
    }
  )
  .subscribe();

// Cleanup en unmount
return () => supabase.removeChannel(channel);
```

### Eventos disparados

```json
{
  "type": "postgres_changes",
  "event": "INSERT|UPDATE|DELETE",
  "schema": "public",
  "table": "orders",
  "commit_timestamp": "2026-03-13T20:30:45.123Z",
  "new": { ...nuevo registro... },
  "old": { ...registro anterior... } // Solo en UPDATE/DELETE
}
```

---

## ⚡ Optimizaciones

### Índices Críticos

```sql
-- Crear para mejorar performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date_order ON orders(date_order DESC);
CREATE INDEX idx_orders_area ON orders(area);
CREATE INDEX idx_users_rol_name ON users(rol_name);

-- Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes;
```

### Queries Optimizadas

```javascript
// ❌ LENTO: Traer todas las órdenes
const { data } = await supabase
  .from('orders')
  .select('*');

// ✅ RÁPIDO: Con limit y filtro
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'SOLICITADO')
  .order('date_order')
  .limit(50);

// ✅ RÁPIDO: Contar sin traer datos
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'SOLICITADO');
```

### Paginación

```javascript
// Implementaar en Control.js y Dashboard.js
const PAGE_SIZE = 50;
const [page, setPage] = useState(0);

const { data } = await supabase
  .from('orders')
  .select('*')
  .order('date_order', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

---

## 💾 Backup y Recovery

### Backups Automáticos

```
Supabase realiza:
✅ Snapshots diarios
✅ Point-in-time recovery (últimos 7 días)
✅ Georeplicação (multiple regions)
```

### Manual Backup (SQL Query)

```bash
# Desde Supabase Dashboard → SQL Editor
-- Exportar tabla users
COPY users TO '/tmp/users_backup.csv' CSV;

-- Exportar tabla orders con fecha específica
COPY orders TO '/tmp/orders_2026_03.csv' CSV 
WHERE DATE(date_order) >= '2026-03-01' 
  AND DATE(date_order) < '2026-04-01';
```

### Recovery

```sql
-- Si algo se borra accidentalmente:
-- 1. Ir a Supabase Dashboard
-- 2. Backups → Point-in-time recovery
-- 3. Restaurar a fecha específica

-- O desde SQL:
SELECT * FROM orders
WHERE deleted_at IS NOT NULL
  AND DATE(deleted_at) = TODAY();
```

---

## 🔒 Seguridad de Datos

### RLS (Row Level Security) - TODO

```sql
-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo ven sus propias órdenes creadas
CREATE POLICY "Users see own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE user_name = orders.user_submit
    )
  );

-- Policy: Admins ven todas
ALTER POLICY "Users see own orders" ON public.orders 
  USING (
    (auth.uid() IN (SELECT id FROM public.users WHERE rol_name = 'ADMIN'))
    OR
    (auth.uid() IN (
      SELECT id FROM public.users WHERE user_name = orders.user_submit
    ))
  );
```

### Encryption at Rest

```
Supabase automaticamente encripta:
✅ Datos en reposo (AES-256)
✅ Backups (mismo nivel)
✅ Comunicaciones (TLS 1.3)
```

---

## 📊 Consultas Útiles

### Estadísticas Generales

```sql
-- Total de órdenes por estado
SELECT status, COUNT(*) as total
FROM orders
GROUP BY status;

-- Promedio de duración
SELECT AVG(duration) as avg_minutes
FROM orders
WHERE duration IS NOT NULL;

-- Órdenes hoy
SELECT COUNT(*) as today_total
FROM orders
WHERE DATE(date_order) = CURRENT_DATE;

-- Por área
SELECT area, COUNT(*) as total
FROM orders
GROUP BY area
ORDER BY total DESC;
```

### Mantenimiento

```sql
-- Ver tamaño de tabla
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver conexiones activas
SELECT pid, usename, application_name, state
FROM pg_stat_activity
WHERE state != 'idle';

-- Ver últimas queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 📚 Referencias

- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Query Performance](https://use-the-index-luke.com/)

---

**Siguiente:** [06-APIs.md](06-APIs.md) para entender los endpoints
