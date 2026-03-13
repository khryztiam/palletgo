# 🏗️ Arquitectura de PalletGo

> **Documento Técnico de Arquitectura**
> 
> Audiencia: Tech Leads, Arquitectos, Devs Senior
> Tiempo de lectura: 15-20 minutos

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
4. [Componentes Principales](#componentes-principales)
5. [Flujo de Datos](#flujo-de-datos)
6. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)

---

## 🎯 Visión General

**PalletGo** es una solución web para gestión logística de solicitudes, despacho y embarques. Está diseñada como una aplicación **real-time** donde múltiples usuarios colaboran simultáneamente.

### Objetivos Principales
- ✅ Crear solicitudes de embarque desde múltiples áreas
- ✅ Despacharlas en tiempo real con notificaciones de voz
- ✅ Registrar entregas con control de calidad
- ✅ Recopilar estadísticas para análisis

### Principios de Diseño
- **Real-time First**: Las actualizaciones se sincronizan automáticamente
- **Role-Based Access**: Cada usuario ve solo lo que puede hacer
- **Mobile-Friendly**: Compatible con tablets en el piso
- **Offline-Ready**: Funciona sin conexión (pendiente)

---

## 💻 Stack Tecnológico

### Frontend
```json
{
  "framework": "Next.js 16 (Pages Router)",
  "ui_library": "React 19.2",
  "styling": "CSS Modules",
  "state_management": "React Context API",
  "charts": "Chart.js + react-chartjs-2",
  "modals": "react-modal",
  "select": "react-select",
  "parsing": "PapaParse (CSV)"
}
```

### Backend
```json
{
  "database": "Supabase (PostgreSQL 15)",
  "auth": "Supabase Auth (JWT)",
  "realtime": "Supabase Realtime WebSockets",
  "api_gateway": "Supabase PostgRest",
  "edge_functions": "JavaScript (Node.js)",
  "storage": "Supabase Storage (S3-compatible)"
}
```

### DevOps
```json
{
  "hosting": "Vercel (Next.js optimizado)",
  "version_control": "Git / GitHub",
  "monitoring": "Supabase Observability",
  "backup": "Supabase Automated Backups"
}
```

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DEL USUARIO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │           NEXT.JS FRONTEND (React 19)              │   │
│  │                                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │   │
│  │  │   Pages  │  │Components│  │ AuthContext  │    │   │
│  │  │          │  │          │  │ (Global)     │    │   │
│  │  │ Request  │  │StatusModal│  └──────────────┘    │   │
│  │  │Dispatch  │  │OrdersTable│                      │   │
│  │  │Boarding  │  │Timeline   │  ┌──────────────┐    │   │
│  │  │Dashboard │  │ExportData │  │ CSS Modules  │    │   │
│  │  │Control   │  └──────────┘  │ (Scoped)     │    │   │
│  │  └──────────┘                 └──────────────┘    │   │
│  │                                                    │   │
│  │  Supabase JS Client (supabase.js)                │   │
│  │  - .auth.signInWithPassword()                     │   │
│  │  - .from('orders').select() / .insert() / .update│   │
│  │  - .channel().on('postgres_changes')  ← REALTIME │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↓ HTTPS ↓                         │
├─────────────────────────────────────────────────────────────┤
│                  VERCEL (Next.js Hosting)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         /pages/api/admin/users/* (CRUD)             │  │
│  │         - POST   → Crear usuario                    │  │
│  │         - GET    → Listar usuarios                  │  │
│  │         - PUT    → Editar usuario                   │  │
│  │         - DELETE → Eliminar usuario (⚠️ Review)    │  │
│  │                                                     │  │
│  │         Supabase Admin Client (supabaseAdmin.js)   │  │
│  │         - auth.getSession() → Validar token       │  │
│  │         - .auth.admin.* → Operaciones admin        │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓ PostgreRest ↓                   │
├─────────────────────────────────────────────────────────────┤
│              SUPABASE (PostgreSQL + Auth + Realtime)        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              AUTENTICACIÓN (auth.users)              │ │
│  │  - email, password_hash, session, created_at        │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↓                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         PUBLIC SCHEMA (Datos de Negocio)            │ │
│  │                                                      │ │
│  │  users ────┐                                        │ │
│  │   - id_col │ └──→ orders (1:N)                      │ │
│  │   - rol    │      - id_order                        │ │
│  │   - name   │      - status (SOLICITADO/PROGRESO/...)│ │
│  │            │      - date_order, date_delivery       │ │
│  │            │      - area, destiny, details, ...    │ │
│  │            │                                        │ │
│  │  deliveryPersons (vacía)                           │ │
│  │  orderDetails (vacía)                              │ │
│  │                                                      │ │
│  │  🔄 REALTIME ENABLED en 'orders'                   │ │
│  │     - INSERT, UPDATE events enviados a clientes    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  BACKUPS: Automáticos diarios + Snapshots                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes Principales

### 1. **AuthContext** (Gestión de Sesión Global)
```
Responsabilidad: Autenticación centralizada
Ubicación: src/context/AuthContext.js
Métodos:
  - login(email, password) → crea sesión
  - logout() → destruye sesión
  - useAuth() → accede a user, role, loading
Almacenamiento: localStorage (cliente) + Supabase Sessions
```

### 2. **Supabase Client** (Comunicación con BD)
```
Responsabilidad: QueryBuilder + Realtime
Ubicación: src/lib/supabase.js (público)
          src/lib/supabaseAdmin.js (servidor)
Métodos comunes:
  .from('tabla').select() / .insert() / .update() / .delete()
  .channel('nombre').on('postgres_changes', ...).subscribe()
  .auth.getSession() / .signInWithPassword()
```

### 3. **AdminGate** (Control de Acceso)
```
Responsabilidad: Proteger rutas por rol
Ubicación: src/components/AdminGate.js
Roles soportados: ADMIN, LINEA, EMBARQUE, SUPERVISOR
Redirige a: /  si no tiene permiso
```

### 4. **Páginas de Negocio**

#### Request.js - Crear Solicitudes
```
Roles: LINEA, ADMIN
Funcionalidad:
  ✅ Formulario para crear solicitud
  ✅ Cola de espera en tiempo real
  ✅ Stepper de progreso
  ✅ Validación de campos
  ✅ Toast notifications
Realtime: Suscrito a events INSERT de orders
```

#### Dispatch.js - Despacho en Tiempo Real
```
Roles: EMBARQUE, SUPERVISOR, ADMIN
Funcionalidad:
  ✅ Ver órdenes activas (últimas 25)
  ✅ Timer automático de duración
  ✅ Notificaciones de voz (TTS)
  ✅ Modal para cambiar estado
  ✅ Audio feedback
Realtime: Suscrito a INSERT + UPDATE (continuo)
```

#### Control.js - Gestión Diaria
```
Roles: ADMIN, SUPERVISOR
Funcionalidad:
  ✅ Filtro por dia (HOY)
  ✅ Tabla de órdenes con filtros
  ✅ Resumen por estado (tarjetas)
  ✅ Editar/eliminar órdenes
  ✅ Exportar CSV
Realtime: Actualiza en vivo
```

#### Dashboard.js - Estadísticas
```
Roles: ADMIN, SUPERVISOR
Funcionalidad:
  ✅ Filtro por fecha (rango)
  ✅ Gráfico donut (estados)
  ✅ Gráfico barras (áreas)
  ✅ Timeline (últimas 10)
  ✅ CSV export
Rendering: Datos procesados fuera del render
```

#### Management.js - CRUD Usuarios
```
Roles: ADMIN
Funcionalidad:
  ✅ Crear usuario (email, password, rol)
  ✅ Editar usuario
  ✅ Eliminar usuario
  ✅ Listar con resumen por rol
  ✅ Validaciones
Seguridad: rollback automático si falla
```

---

## 🔄 Flujo de Datos (End-to-End)

### Escenario: Crear una solicitud

```
1. Usuario LINEA en Request.js
   └─ Rellena formulario: area, details, destiny
   
2. Click en "Crear Solicitud"
   └─ INSERT orders { area, user_submit, status: 'SOLICITADO', ... }
   
3. Supabase recibe y guarda en PostgreSQL
   └─ Trigger realtime se activa
   
4. WebSocket publica evento INSERT a todos conectados
   
5. Dispatch.js (activo) recibe evento
   └─ playVoiceNotification("Nueva orden de Línea 29...")
   └─ startTimer()
   └─ setOrders([...newOrder])
   └─ UI re-renderiza
   
6. Control.js (activo) también recibe
   └─ setOrders([...newOrder])
   └─ Tabla se actualiza automáticamente
   
7. Dashboard.js (activo) también recibe
   └─ Gráficos se recalculan
   └─ Timeline se actualiza
```

### Data Flow Diagram
```
┌─────────────┐
│ Formulario  │
│  (Request)  │
└──────┬──────┘
       │ form.submit()
       ↓
┌─────────────────────────────────┐
│ supabase.from('orders').insert() │
└──────┬──────────────────────────┘
       │ (HTTP POST /rest/v1/orders)
       ↓
┌──────────────────────────────────┐
│ PostgreSQL inserta en tabla      │
│ orders y dispara trigger         │
└──────┬───────────────────────────┘
       │ (realtime event)
       ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Realtime publica en WebSocket channel      │
│ evento: {type: 'INSERT', table: 'orders', ...}      │
└──────┬──────────────────────────────────────────────┘
       │
       ├─→ Dispatch.js (suscrito)  → playVoice + setOrders
       ├─→ Control.js (suscrito)   → setOrders
       ├─→ Boarding.js (suscrito)  → setOrders
       └─→ Dashboard.js (suscrito) → recalcData

       Todos los clientes se sincronizan AUTOMÁTICAMENTE
```

---

## 🎯 Decisiones Arquitectónicas

### 1️⃣ **Supabase sobre Firebase**
```
✅ PostgreSQL (soporte SQL nativo)
✅ Realtime con WebSockets (bajo latency)
✅ RLS (Row Level Security) granular
✅ Open source friendly
✅ Self-hosting posible

Alternativo considerado: Firebase
❌ Firestore (No-SQL, queries limitadas)
❌ Realtime DB deprecated
❌ RLS limitado
```

### 2️⃣ **Next.js Pages Router**
```
✅ API routes file-based
✅ SSR para SEO (si necesario)
✅ Incremental Static Regeneration
✅ Built-in middleware

Alternativo considerado: App Router (Next 13+)
⚠️ Más moderno pero menos maduro
⚠️ Requiere rewrite de código
⚠️ No necesario para esta aplicación
```

### 3️⃣ **CSS Modules (No Tailwind)**
```
✅ Scoped styles (sin conflictos globales)
✅ Tipado en IDEs
✅ Menor overhead de CSS
✅ Performance optimal

Alternativo considerado: Tailwind CSS
⚠️ Mayor tamaño inicial
⚠️ Más opíniconado
⚠️ Menos customizable para diseños complejos
```

### 4️⃣ **Realtime con Websockets**
```
✅ Latency bajo (~100ms)
✅ Escalable con Supabase
✅ Funciona con RLS
✅ Costo-eficiente

Alternativo considerado: Polling (cada 5sec)
❌ Mayor latency
❌ Mayor carga de servidor
❌ Actualización de UX lenta
```

---

## 🚀 Escalabilidad

### Horizontal (Más usuarios)
```
Current: 27 usuarios simultáneos ✅
Supabase free tier: Hasta 50K MAU → Upgrade a Pro
PostgreSQL: Soporta millones de conexiones
Realtime: 100K+ conexiones simultáneas
Vercel CDN: Automático con geografía distribuida
```

### Vertical (Más datos)
```
Current: 25K órdenes
PostgreSQL Scaling: Índices + Particionado
History: Archivar órdenes > 1 año
Backups: Supabase Point-in-time recovery
```

### Bottlenecks Potenciales
```
🚨 Realtime canales sin límite → Rate limit a 100 eventos/sec
🚨 CSV export sin paginación → Puede tardar con 100K+ registros
🚨 Browser memory si tabla > 50K filas → Implementar virtualization
```

---

## 🔐 Seguridad en Capas

```
Capa 1: HTTPS/TLS
└─ Todas las comunicaciones cifradas

Capa 2: Autenticación
└─ Supabase Auth (JWT, session-based)
└─ Token refresh automático

Capa 3: Autorización (RLS)
└─ PostgreSQL policies (pendiente implementar ⚠️)
└─ Validación en API routes

Capa 4: Validación de Entrada
└─ Frontend (React)
└─ Backend (API routes)
└─ Database (constraints)

Capa 5: Encriptación
└─ Passwords: bcrypt (Supabase)
└─ PII: Considerar encryption at rest
```

---

## 📈 Monitoreo y Observabilidad

```
Métricas disponibles en Supabase Dashboard:
✅ API usage (requests/sec)
✅ Database connections
✅ Realtime events
✅ Storage usage
✅ Auth logins

Implementar:
⚠️ Custom logging (Supabase Logs API)
⚠️ Error tracking (Sentry.io o similar)
⚠️ Performance monitoring (Lighthouse CI)
```

---

## 📚 Referencias

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Architecture](https://nextjs.org/docs/architecture)
- [React Context API](https://react.dev/reference/react/useContext)
- [PostgreSQL Realtime](https://supabase.com/docs/guides/realtime)

---

**Siguiente:** [02-SETUP.md](02-SETUP.md) para configurar el proyecto
