# 📖 Guía de Handover para Nuevos Desarrolladores

> **Introducción Rápida a PalletGo**
> 
> Audiencia: Nuevos desarrolladores que mantendrán el proyecto
> Tiempo de lectura: 30-45 minutos
> Fecha: Abril 2026 (v0.3.0)

---

## 🎯 Objetivo de este Documento

Si estás leyendo esto, probablemente:
- Heredaste el proyecto de Khris
- Necesitas hacer cambios/mejoras/mantenimiento
- NO conoces el código en detalle

**Este documento te prepara en 30 minutos para trabajar con confianza.**

---

## ⚡ En 2 Minutos: ¿Qué es PalletGo?

```
PalletGo = Sistema web para gestionar solicitudes de embarque/retiro
           en tiempo real en una empresa logística.

Usuarios crean solicitudes → Otros las procesan → Se ven cambios INMEDIATOS
(Realtime con WebSockets)

Tech: Next.js + React + Supabase + PostgreSQL
Hosting: Vercel (frontend) + Supabase (backend)
Users: ~11 personas, 4 roles distintos
```

---

## 🗂️ Estructura del Proyecto (Lo importante)

```
palletgo/
├── doc/                      ← Tú estás aquí
│   ├── 00-INDICE.md          ← Mapa de toda la doc
│   ├── 01-ARQUITECTURA.md    ← Tech high-level
│   ├── 03-GUIA-USUARIO.md    ← Qué hace cada rol
│   ├── 04-AUTENTICACION.md   ← Cómo login funciona
│   ├── 05-BASE-DE-DATOS.md   ← Schema de BD
│   ├── 06-APIs.md            ← Endpoints disponibles
│   ├── 09-FLUJOS-POR-ROL.md  ← User journeys completos
│   └── 11-CALIDAD.md         ← Problemas conocidos + fixes
│
├── migrations/               ← Scripts SQL (aplica una vez)
│   └── 001_enable_rls_adapted.sql ← ⚠️ CRÍTICO
│
├── src/
│   ├── pages/                ← Rutas (lo que ves en navegador)
│   │   ├── index.js          ← Login page
│   │   ├── Request.js        ← Crear solicitudes
│   │   ├── Dispatch.js       ← Ver órdenes en tiempo real
│   │   ├── Boarding.js       ← Registrar entregas
│   │   └── admin/
│   │       ├── Dashboard.js  ← Gráficos + estadísticas
│   │       ├── Control.js    ← Tabla de órdenes del día
│   │       ├── Management.js ← Gestión de usuarios
│   │       └── GlobalUsers.js ← Vista global (NUEVO v0.3)
│   │
│   ├── components/           ← Componentes reutilizables
│   │   ├── Layout.jsx        ← Menú lateral + header
│   │   ├── AdminGate.js      ← Proteger rutas por rol
│   │   ├── RoleGate.js       ← Mostrar/ocultar secciones
│   │   ├── StatusModal.js    ← Modal para cambiar estado
│   │   ├── Card.jsx          ← Tarjeta de orden
│   │   ├── Sidebar.jsx       ← Menú lateral
│   │   ├── countdown.js      ← Timer (tiempo en cola)
│   │   ├── admin/
│   │   │   ├── BarChart.js   ← Gráfico barras (Chart.js)
│   │   │   ├── DonutChart.js ← Gráfico donut (Chart.js)
│   │   │   ├── Timeline.js   ← Timeline de últimas órdenes
│   │   │   ├── DashboardHeader.js
│   │   │   ├── ExportData.js ← Exportar a CSV (PapaParse)
│   │   │   └── control/
│   │   │       ├── OrdersTable.js
│   │   │       ├── OrderModal.js
│   │   │       ├── StatusCards.js
│   │   │       └── DetailOptionsPanel.js
│   │   └── ...
│   │
│   ├── context/
│   │   └── AuthContext.js    ← Estado global (user, role, login)
│   │
│   ├── lib/
│   │   ├── supabase.js       ← Cliente Supabase (público)
│   │   └── supabaseAdmin.js  ← Cliente Supabase (servidor)
│   │
│   └── styles/
│       └── *.module.css      ← Estilos (CSS Modules)
│
└── package.json
```

---

## 🔐 Autenticación: ¿Quién puede hacer qué?

```
4 ROLES EN EL SISTEMA:

1. LINEA (Operador de línea)
   - Crea solicitudes de embarque
   - Ve su cola de solicitudes
   - No puede cambiar estado

2. EMBARQUE (Despachador)
   - Ve órdenes en tiempo real (Dispatch)
   - Cambia estado (SOLICITADO → EN PROGRESO → ENTREGADO)
   - Registra entregas (Boarding)
   - NO puede crear usuarios

3. SUPERVISOR (Supervisor)
   - Ve estadísticas (Dashboard)
   - Ve tabla de todas las órdenes (Control)
   - Edita órdenes si es necesario
   - NO puede crear/eliminar usuarios

4. ADMIN (Administrador)
   - TODO. Acceso completo.
   - Crea/edita/elimina usuarios
   - Ve lista global de usuarios (GlobalUsers)
   - Soluciona problemas
```

**Cómo cambiar rol de usuario:**
1. Login como ADMIN
2. Ir a Menú → "Gestión de Usuarios"
3. Buscar usuario
4. Editar rol en dropdown
5. Guardar

---

## ⚙️ Setup Rápido (Primeras 10 mins)

### Requisitos
- Node.js 18+ (`node --version`)
- Git
- Credenciales de Supabase

### Pasos

```bash
# 1. Clonar repo
git clone https://github.com/khryztiam/palletgo.git
cd palletgo

# 2. Instalar dependencias
npm install

# 3. Crear .env.local
# Pedir a Khris o ver .env.example
# Necesitas: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_KEY
# (No están en git por seguridad)

# 4. Ejecutar
npm run dev

# 5. Abrir en navegador
# http://localhost:3000

# 6. TestLogin
# Usa credenciales que te proporcione Khris
```

### Verificar que todo funciona

```bash
# Build debería pasar sin errores
npm run build

# Debería compilar Next.js sin problemas
# Si hay errores: probablemente falta .env.local

# Linting (opcional)
npm run lint
```

---

## 🔄 Realtime: Las Órdenes se Actualizan SOLAS

**Punto crítico que diferencia PalletGo:**

```
LINEA crea orden en Request.js
  ↓
INSERT en tabla 'orders' en Supabase
  ↓
PostgreSQL dispara trigger (realtime enabled)
  ↓
Supabase Realtime publica evento por WebSocket
  ↓
TODOS LOS CLIENTES CONECTADOS RECIBEN:
  ├─ Dispatch.js: playVoice("Nueva orden...")
  ├─ Control.js: tabla actualiza sin F5
  ├─ Dashboard.js: gráficos recalculan
  └─ Request.js: otros LINEA ven en cola

TODO PASA EN <100ms
```

**Si algo no actualiza:**
1. Revisar DevTools → Network → WS (WebSocket)
   - Debería mostrar conexión a `wss://...`
2. Si no hay connection: supabase está down o mal configurado
3. Si connection existe pero no actualiza: revisar suscripción en código

---

## 🚨 Partes CRÍTICAS del Código

### 1. AuthContext.js - Control de acceso

```javascript
// Este archivo es EL CORAZÓN de seguridad
// Si se rompe, nadie puede hacer nada

export const useAuth = () => {
  // Devuelve: { user, role, loading, login, logout }
  // TODOS los componentes lo usan
  // Nunca hagas cambios aquí sin testear
};
```

**Peligros comunes:**
- Borrar `onAuthStateChange` → usuarios se quedan loggeados aunque cierren sesión
- Cambiar localStorage key → usuarios pierden sesión

### 2. RLS Policies en Supabase - Seguridad de datos

```sql
-- Archivo: migrations/001_enable_rls_adapted.sql
-- ESTO define quién puede ver/modificar cada tabla

-- Si algo se "desaparece" misteriosamente:
-- 1. Revisar RLS policies en Supabase console
-- 2. ¿Está el usuario en el rol correcto?
-- 3. ¿RLS está habilitado (enable_rls)?
```

**Red flag:** Si un usuario dice "no veo mis órdenes":
1. Revisar role en `public.users`
2. Revisar RLS policy en `orders`
3. Probablemente email != email_en_bd

### 3. Dispatch.js - Realtime + Voice (Complejo)

```javascript
// Aquí pasan cosas avanzadas:
// - Suscripción a Supabase Realtime
// - playVoiceNotification() (Text-to-Speech)
// - timers por orden
// - useRef para manejo de memoria

// Si se rompe:
// 1. ¿Navegador silenciado? Hacer click para activar audio
// 2. ¿Connection realtime? Ver DevTools
// 3. ¿Estado de órdenes? Revisar setOrders()
```

### 4. API Endpoints (/pages/api/*)

```javascript
// Validación de sesión EN TODOS:
// 1. Obtener token del header Authorization
// 2. Decodificar JWT (token.split('.')[1])
// 3. Extraer email del payload
// 4. Buscar usuario en public.users para verificar rol
// 5. Si rol != requerido: 403 Forbidden

// ⚠️ SI CAMBIAS ESTO, puedes exponer la BD
// Nunca remuevas validación
```

---

## 📝 Tareas Comunes

### Agregar un nuevo rol

```javascript
// 1. En Supabase: crear nuevo rol (ej: QUALITY)
// 2. En src/components/AdminGate.js:
//    - Agregar rol a requiredRoles array
// 3. En RLS policies:
//    - Agregar regla para el nuevo rol
// 4. En doc/09-FLUJOS-POR-ROL.md:
//    - Documenta flujo del nuevo rol
// 5. En doc/03-GUIA-USUARIO.md:
//    - Explica al usuario qué puede hacer
```

### Cambiar estado de orden

```javascript
// Los estados son (en src/pages/Request.js, Dispatch.js, etc):
const STATUS_CONFIG = {
  'SOLICITADO': { ... },
  'EN PROGRESO': { ... },
  'ENTREGADO': { ... },
  'CANCELADO': { ... }
};

// SI NECESITAS AGREGAR ESTADO:
// 1. Crear ENUM en migration SQL
// 2. Actualizar STATUS_CONFIG
// 3. Actualizar RLS policies
// 4. Actualizar validaciones en APIs
// 5. Testear en Dispatch (visual)
```

### Exportar datos a CSV

```javascript
// Ya existe: ExportData.js usa PapaParse
// Solo copia el patrón:
// 1. Formatear array de objetos
// 2. Usar Papa.unparse() para convertir a CSV
// 3. Trigger descarga con Blob + link

// Ej: ver Dashboard.js línea ~180
```

### Agregar columna a tabla orders

```
1. En Supabase SQL: ALTER TABLE orders ADD COLUMN new_field TYPE
2. En src/pages/api: actualizar INSERT/UPDATE queries
3. En componentes: agregar field a setFormData() inicial
4. En RLS: ¿Quién ve/edita esta columna?
5. Actualizar tipos si migras a TypeScript (futuro)
6. TEST: crear orden nueva, verificar campo aparece
```

---

## 🐛 Debugging: Checklist

```
❓ "Algo no funciona"
│
├─ ¿Qué ves en consola? (F12 → Console)
│  └─ Si hay error rojo → skill debugging aumenta 💯
│
├─ ¿Network? (F12 → Network)
│  └─ ¿POST /rest/v1/orders devuelve 200?
│  └─ ¿Hay WS a Realtime?
│
├─ ¿BD data?
│  └─ Abre Supabase console → inspecciona tabla
│  └─ ¿Ese usuario existe allí?
│  └─ ¿Rol está correcto?
│
├─ ¿Auth? (F12 → Aplicación → localStorage)
│  └─ ¿supabase.auth.* keys existen?
│  └─ ¿Token no expiró?
│  └─ Logout + login de nuevo
│
└─ ¿Última opción?
   └─ Refrescar página (F5)
   └─ Limpiar localStorage (Dev Tools → Storage → Clear All)
   └─ Reiniciar servidor Next.js (npm run dev)
```

---

## 📚 Documentos Importantes (en Orden)

1. **[01-ARQUITECTURA.md](01-ARQUITECTURA.md)** ← PRIMERO
   - Qué es el proyecto, componentes principales
   - 15 minutos

2. **[04-AUTENTICACION.md](04-AUTENTICACION.md)** ← SEGUNDO
   - Cómo funciona login y roles
   - 20 minutos

3. **[09-FLUJOS-POR-ROL.md](09-FLUJOS-POR-ROL.md)** ← TERCERO
   - Flujos reales de usuario (importante para entender lógica)
   - 20 minutos

4. **[05-BASE-DE-DATOS.md](05-BASE-DE-DATOS.md)** ← CUARTO
   - Esquema de BD (solo si necesitas hacer cambios)
   - 20 minutos

5. **[06-APIs.md](06-APIs.md)** ← QUINTO
   - Endpoints disponibles (si necesitas agregar/cambiar)
   - 15 minutos

6. **[11-CALIDAD.md](11-CALIDAD.md)** ← SIEMPRE
   - Problemas conocidos + fixes implementados
   - Consulta si encuentras raro

---

## 🆘 ¿Quién Preguntarle?

- **Khris** (Dev original)
  - Decisiones arquitectónicas
  - Lógica de negocio compleja
  - Problemas de producción

- **Documentación** (Este repo)
  - Cómo funciona algo
  - Flujos de usuario
  - Estructura del código

- **Supabase Docs**
  - Si es problema de BD/Auth
  - https://supabase.com/docs

---

## ✅ Checklist: Primer Día

- [ ] Cloné repo
- [ ] Instalé npm packages
- [ ] Creé .env.local (pedí credenciales)
- [ ] Ejecuté `npm run dev` exitosamente
- [ ] Logueé con usuario admin
- [ ] Navegué por las 4 páginas principales
- [ ] Leí 01-ARQUITECTURA.md
- [ ] Leí 04-AUTENTICACION.md
- [ ] Leí 09-FLUJOS-POR-ROL.md
- [ ] Encontré dónde está cada rol en el código
- [ ] Tengo contacto de Khris para preguntas

---

## 💡 Consejos Finales

1. **No toques RLS sin testing:** Puede bloquear a todos
2. **Commit frecuente:** Especialmente cuando cambias auth/datos
3. **Testea flujos reales:** No solo "compiló" — verifica que funciona
4. **Lee comentarios en código:** Khris dejó hints para futuros devs
5. **Actualiza docs si cambias algo:** Próximo dev te lo agradeceré
6. **Sé cuidadoso con DELETE:** Es difícil recuperar datos

---

## 📞 ¿Te falta algo?

Si después de leer esto:
- ❌ Algo no funciona
- ❌ No entiendes un concepto
- ❌ Necesitas cambiar datos críticos

**Antes de modificar:**
1. Abre [11-CALIDAD.md](11-CALIDAD.md)
2. Contacta a Khris
3. Revisa DevTools (F12)

**Bienvenido al proyecto! 🚀**

---

Última actualización: Abril 2026  
Versión: 0.3.0  
Mantenedor: Khris (contacto)
