# 🔄 Flujos de Negocio por Rol

> **Documentación de Procesos de Negocio**
> 
> Audiencia: Usuarios operacionales, Supervisores, Desarrolladores
> Tiempo de lectura: 20-30 minutos
> Actualización: Abril 2026 (v0.3.0)

---

## 📋 Tabla de Contenidos

1. [Flujo LINEA - Crear Solicitudes](#flujo-linea--crear-solicitudes)
2. [Flujo EMBARQUE - Despachar y Embarcar](#flujo-embarque--despachar-y-embarcar)
3. [Flujo SUPERVISOR - Supervisar y Reportar](#flujo-supervisor--supervisar-y-reportar)
4. [Flujo ADMIN - Gestión Completa](#flujo-admin--gestión-completa)
5. [Flujos Cruzados](#flujos-cruzados)

---

## 🟠 Flujo LINEA - Crear Solicitudes

**Rol:** LINEA  
**Objetivo:** Crear solicitudes de embarque/retiro de contenedor  
**Ubicación:** Menú → "Solicitudes" → `/Request`

### Paso a Paso

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUARIO ENTRA A LA APP                              │
│    - Login con email + contraseña                       │
│    - Llega a dashboard según rol (LINEA → Request.js)  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. VE LA COLA DE ESPERA EN TIEMPO REAL                 │
│    - Tabla de órdenes activas del DÍA                  │
│    - Cuenta atrás (timer mostrando tiempo en cola)    │
│    - Filtra por estado: SOLICITADO, EN PROGRESO, etc  │
│    - Se actualiza automáticamente cada 1-2 segundos   │
│      (Realtime: suscrito a cambios en tabla `orders`) │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CREA UNA NUEVA SOLICITUD                             │
│    - Click en: "Nueva Solicitud"                        │
│    - Se abre Modal con formulario                       │
│    - Campos a llenar:                                  │
│      * Área: (auto-completado con su usuario)          │
│      * Tipo de solicitud:                              │
│        - "RETIRO DE CONTENEDOR"                        │
│        - "RETIRO DE TARIMA"                            │
│      * Destino: "EMBARQUE" o "EPC"                     │
│      * Comentarios: (opcional)                         │
│      * Si selecciona "RETIRO DE CONTENEDOR":           │
│        - Aparece campo: "Etiqueta de impresión"        │
│      * Si selecciona "RETIRO DE TARIMA":               │
│        - Aparece campo: "Múltiples etiquetas"          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. VALIDA Y ENVÍA                                       │
│    - Sistema valida todos los campos                   │
│    - Click en: "Enviar Solicitud"                      │
│    - Envía: supabase.from('orders').insert({...})      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ORDEN CREADA EXITOSAMENTE                            │
│    - Toast: "✅ Solicitud creada exitosamente"         │
│    - Status: 'SOLICITADO'                              │
│    - Entra a la cola visible por EMBARQUE/SUPERVISOR  │
│    - **REALTIME EVENT:**                               │
│      - Dispatch.js recibe notificación de voz          │
│        "Nueva orden de Línea 29..."                    │
│      - Control.js actualiza tabla automáticamente      │
│      - Dashboard.js recalcula gráficos                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 6. USUARIO VE SU SOLICITUD EN COLA                      │
│    - Aparece en la tabla con posición: "#3 en cola"   │
│    - Timer muestra: tiempo transcurrido desde creación │
│    - Estado actual: SOLICITADO (En espera)             │
│    - Puede ver si pasó a EN PROGRESO (realtime)       │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario rellenan formulario en Request.js
  ↓
Click "Enviar Solicitud"
  ↓
INSERT en orders { 
  area: "Línea 29", 
  user_submit: "khris", 
  status: 'SOLICITADO',
  details: ['RETIRO DE CONTENEDOR'],
  destiny: 'EMBARQUE',
  date_order: NOW()
}
  ↓
PostgreSQL inserta + dispara trigger
  ↓
Supabase Realtime publica evento INSERT
  ↓
┌─────────────────────────────────────────┐
│ TODOS LOS CLIENTES CONECTADOS RECIBEN: │
├─────────────────────────────────────────┤
│ ✅ Dispatch.js (EMBARQUE)               │
│    → playVoiceNotification(...)         │
│    → addTimer()                         │
│    → flashCards()                       │
│                                         │
│ ✅ Control.js (SUPERVISOR/ADMIN)        │
│    → setOrders([...newOrder])           │
│    → tabla se re-renderiza              │
│                                         │
│ ✅ Dashboard.js (SUPERVISOR/ADMIN)      │
│    → recalc STATUS_MAP                  │
│    → gráficos se actualizan             │
│                                         │
│ ✅ Otros Request.js (LINEA)             │
│    → ven orden en cola compartida       │
└─────────────────────────────────────────┘
```

### Posibles Estados Posteriores

```
LINEA crea orden en: SOLICITADO
                ↓
EMBARQUE ve en palletgo/Dispatch.js → Cambia a: EN PROGRESO
                ↓
EMBARQUE completa → Cambia a: ENTREGADO

ó

EMBARQUE cancela → Cambia a: CANCELADO
```

### Validaciones Importantes

- ✅ Área: auto-rellenado (no editable)
- ✅ Tipo solicitud: requerido
- ✅ Destino: requerido (EMBARQUE o EPC)
- ✅ Sin duplicación: botón tipo "isSubmitting" previene doble clic
- ✅ Toast feedback: 4 segundos de confirmación

---

## 🔵 Flujo EMBARQUE - Despachar y Embarcar

**Rol:** EMBARQUE  
**Objetivos:**
1. Ver órdenes en tiempo real (Dispatch)
2. Cambiar estado (EN PROGRESO → ENTREGADO)
3. Registrar entregas (Boarding)

**Ubicación:**
- Menú → "Despacho" → `/Dispatch`
- Menú → "Embarques" → `/Boarding`

### 1️⃣ Despacho (Dispatch.js)

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUARIO ENTRA A DESPACHO                             │
│    - Página: /Dispatch                                  │
│    - Ve: Últimas 25 órdenes ACTIVAS                    │
│    - Cada orden en tarjeta (Card)                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. RECIBE NOTIFICACIONES EN TIEMPO REAL                 │
│    - Cada vez que LINEA crea orden:                     │
│      * Sonido: beep (si no está silenciado)             │
│      * Voz: "Nueva orden de Línea 29..."                │
│      * Flash: tarjeta pestañea en rojo                  │
│    - Requiremientos: Usuario debe interactuar (click)  │
│      primero para activar audio (política navegador)   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SELECCIONA ORDEN DE LA TARJETA                       │
│    - Click en Card de orden                            │
│    - Se abre Modal: "Cambiar Estado"                    │
│    - Muestra detalles actuales:                        │
│      * Área solicitante                                │
│      * Tipo (RETIRO CONTENEDOR / TARIMA)              │
│      * Destino (EMBARQUE / EPC)                        │
│      * Comentarios                                     │
│      * Status actual: SOLICITADO                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ACTUALIZA ESTADO                                     │
│    - Elige estado del dropdown:                        │
│      SOLICITADO → EN PROGRESO ✅ (usual)               │
│      SOLICITADO → CANCELADO   (si rechaza)             │
│    - (Después) EN PROGRESO → ENTREGADO ✅              │
│    - Agrega comentarios (opcional):                    │
│      "Contenedor cargado en montacargas"               │
│    - Click: "Guardar"                                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ORDEN ACTUALIZADA EN BD                              │
│    - UPDATE orders SET status = 'EN PROGRESO' ...      │
│    - date_pickup: (timestamp de ahora)                 │
│    - Realtime event publica UPDATE                     │
│    - Modal se cierra                                   │
│    - Toast: "✅ Estado actualizado"                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 6. OTROS USUARIOS VEN CAMBIO EN TIEMPO REAL             │
│    - Control.js (SUPERVISOR): tabla se actualiza      │
│    - Dashboard.js: gráfico SOLICITADO ↓, EN PROGRESO ↑ │
│    - EMBARQUE en Dispatch: tarjeta desaparece (o gris) │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ Embarques (Boarding.js)

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUARIO ENTRA A EMBARQUES                            │
│    - Página: /Boarding                                  │
│    - Ve: Órdenes con status 'EN PROGRESO' + 'ENTREGADO'│
│    - Panel para registrar entregas                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. BUSCA UNA ORDEN EN LA TABLA                          │
│    - Filtros:                                          │
│      * Por área                                        │
│      * Por rango de fecha                              │
│      * Por destino (EMBARQUE / EPC)                    │
│    - Tabla muestra: Área, Tipo, Destino, Estado       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SELECCIONA ORDEN                                     │
│    - Click en fila de tabla                            │
│    - Se abre detalles para confirmar entrega           │
│    - Muestra:                                          │
│      * Hora que fue creada                            │
│      * Hora que pasó a EN PROGRESO                    │
│      * Comentarios de EMBARQUE                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CONFIRMA ENTREGA                                     │
│    - Button: "Marcar como Entregado"                   │
│    - Sistema confirma cambio a: ENTREGADO              │
│    - date_delivery: NOW()                              │
│    - UPDATE en órdenes                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🟢 Flujo SUPERVISOR - Supervisar y Reportar

**Rol:** SUPERVISOR  
**Objetivos:**
1. Ver estadísticas del día
2. Controlar todas las órdenes
3. Exportar datos

**Ubicación:**
- Menú → "Dashboard" → `/admin/Dashboard`
- Menú → "Control" → `/admin/Control`

### 1️⃣ Dashboard (Dashboard.js)

```
┌─────────────────────────────────────────────────────────┐
│ 1. SUPERVISOR ENTRA AL DASHBOARD                        │
│    - Página: /admin/Dashboard                           │
│    - Ve: Resumen del DÍA completo                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SELECCIONA RANGO DE FECHA (Filtro)                   │
│    - Pick: Fecha inicio (hoy, ayer, rango custom)       │
│    - Pick: Fecha fin                                    │
│    - Sistema calcula START_ISO y END_ISO                │
│      con offset de zona horaria (SV: UTC-6)             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. VE VISUALIZACIONES AUTOMÁTICAS                        │
│    - Gráfico DONUT: Distribución de estados            │
│      * SOLICITADO: %                                    │
│      * EN PROGRESO: %                                   │
│      * ENTREGADO: % (más grande)                       │
│      * CANCELADO: %                                    │
│    - Gráfico BARRAS: Órdenes por área                  │
│      * Y-axis: Cantidad                                 │
│      * X-axis: Areas (Línea 29, ELS, IT, etc)         │
│    - TIMELINE: Últimas 10 órdenes entregadas          │
│      * Hora de entrega                                 │
│      * Área y destino                                  │
│    - Datos procesados FUERA del render                 │
│      (performance optimization)                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. EXPORTA DATOS A CSV                                  │
│    - Button: "Descargar CSV"                            │
│    - Genera archivo: palletgo_[fecha].csv               │
│    - Incluye: todas órdenes del rango                   │
│    - Campos: areea, estado, tiempo en cola, comentarios │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ Control (Control.js)

```
┌─────────────────────────────────────────────────────────┐
│ 1. SUPERVISOR ENTRA A CONTROL                           │
│    - Página: /admin/Control                             │
│    - Objetivo: Gestión diaria (HOY)                     │
│    - Filtro: Automático a HOY                           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. TABLA INTERACTIVA DE ÓRDENES                         │
│    - Muestra: Todas las órdenes de HOY                  │
│    - Columnas:                                          │
│      * Área / Usuario                                   │
│      * Tipo (RETIRO CONTENEDOR/TARIMA)                 │
│      * Destino (EMBARQUE/EPC)                          │
│      * Status (con color: amarillo/verde/gris)         │
│      * Tiempo en cola (timer en tiempo real)            │
│      * Acciones (Editar / Eliminar)                    │
│    - Realtime: Se actualiza automáticamente con cambios │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. TARJETAS DE RESUMEN (StatusCards)                    │
│    - Cards por estado:                                  │
│      * SOLICITADO: [3] órdenes                         │
│      * EN PROGRESO: [7] órdenes                        │
│      * ENTREGADO: [45] órdenes ✅                      │
│      * CANCELADO: [1] orden                            │
│    - Click en card: filtra tabla a ese estado          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. EDITA ORDEN (si es necesario)                        │
│    - Click en botón "Editar" en fila                    │
│    - Abre Modal para cambiar:                          │
│      * Status                                          │
│      * Comentarios                                      │
│      * Destino                                          │
│    - Cambios inmediatos se sincronizan realtime        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ELIMINA ORDEN (si es necesario - CUIDADO)            │
│    - Click en botón "Eliminar" (🗑️)                    │
│    - Confirm: "¿Estás seguro?"                          │
│    - DELETE order (soft delete si está implementado)   │
│    - ⚠️ NO se puede recuperar fácilmente                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 6. EXPORTA LISTADO                                      │
│    - Button: "Exportar CSV"                             │
│    - Descarga: órdenes del día en CSV                   │
│    - Para reportes / auditoría                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Flujo ADMIN - Gestión Completa

**Rol:** ADMIN  
**Objetivos:**
1. Hacer TODO lo que LINEA, EMBARQUE, SUPERVISOR hacen
2. Crear/editar/eliminar usuarios
3. Ver vista global de usuarios

**Ubicación:**
- Menú → "Gestion de Usuarios" → `/admin/Management`
- Menú → "Vista Global de Usuarios" → `/admin/GlobalUsers` (NUEVO v0.3.0)

### 1️⃣ Management (Management.js)

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN ENTRA A GESTIÓN DE USUARIOS                    │
│    - Página: /admin/Management                          │
│    - Ve: Tabla de usuarios + resumen por rol            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CREA USUARIO NUEVO                                   │
│    - Button: "+ Nuevo Usuario"                          │
│    - Abre Modal con formulario:                        │
│      * Email: (validar formato @yazaki.com)            │
│      * Contraseña: (min 6 caracteres)                   │
│      * Nombre: (display name)                           │
│      * Rol: Dropdown (ADMIN/LINEA/EMBARQUE/SUPERVISOR) │
│    - Click: "Crear"                                    │
│    - Sistema:                                           │
│      1. Crea en auth.users (supabaseAdmin.auth.*)      │
│      2. Crea en public.users (con rol)                 │
│      3. Si alguno falla → rollback automático           │
│      4. Toast: "✅ Usuario creado"                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EDITA USUARIO EXISTENTE                              │
│    - Click en botón "Editar" en fila                    │
│    - Modal pre-completado con datos:                   │
│      * Email: (no editable)                             │
│      * Nombre: (editable)                               │
│      * Rol: (editable dropdown)                         │
│    - Click: "Guardar"                                   │
│    - UPDATE en public.users                             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. TABLERO DE USUARIOS PENDIENTES (Resumen)             │
│    - Cards por rol:                                     │
│      * ADMIN: [1] usuario                              │
│      * LINEA: [5] usuarios                             │
│      * EMBARQUE: [3] usuarios                          │
│      * SUPERVISOR: [2] usuarios                        │
│    - Click en tarjeta: filtra tabla a ese rol          │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ GlobalUsers (GlobalUsers.js) - **NUEVO v0.3.0**

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN VE VISTA GLOBAL DE USUARIOS                    │
│    - Página: /admin/GlobalUsers                         │
│    - Objetivo: Panorama completo sin paginación         │
│    - Ve: TODOS los usuarios (sin límite)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. TABLA COMPLETA                                       │
│    - Columnas:                                          │
│      * Nombre                                            │
│      * Email                                             │
│      * Rol (badge con color)                           │
│      * Fecha de creación                                │
│      * Estado (Activo / Inactivo - si aplica)          │
│    - Sin paginación: muestra todos a la vez             │
│      (mejor performance que Management)                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. TARJETAS DE RESUMEN (StatusCards)                    │
│    - Card por rol:                                      │
│      * Total ADMIN: [1]                                 │
│      * Total LINEA: [5]                                 │
│      * Total EMBARQUE: [3]                              │
│      * Total SUPERVISOR: [2]                            │
│      * TOTAL USUARIOS: [11]                             │
│    - Actualiza en tiempo real si llegan usuarios nuevos  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. FILTROS                                              │
│    - Por rol (dropdown)                                 │
│    - Por estado (búsqueda by name)                      │
│    - Realtime: tabla se filtra instantáneamente         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. EXPORTA LISTA COMPLETA                               │
│    - Button: "Descargar CSV"                            │
│    - Archivo: usuarios_[fecha].csv                      │
│    - Campos: Nombre, Email, Rol, Fecha creación        │
│    - Para reportes / auditoría / listas de backup       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Flujos Cruzados

### Escenario: Una Orden Viaja de Principio a Fin

```
┌─────────────────────────────────┐
│ T0: LINEA CREA SOLICITUD        │
│ Estado: SOLICITADO              │
│ Rol: LINEA                      │
│ Resultado: Está en cola         │
└─────────────────────────────────┘
           ↓ (Supabase Realtime Event)
    ┌─────────────────────────┐
    │ Dispatch ve notificación │
    │ "Nueva orden Línea 29"   │
    │ Timer: 00:00:01          │
    └─────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ T1: EMBARQUE TOMA ORDEN                │
│ Estado: EN PROGRESO                    │
│ Acción: Clickea en Dispatch            │
│         Selecciona "EN PROGRESO"       │
│ Resultado: Orden pasa a EN PROGRESO    │
└────────────────────────────────────────┘
           ↓ (Supabase Realtime Event)
    ┌──────────────────────────────┐
    │ Dispatch: tarjeta se atenúa   │
    │ Control: row cambia a amarillo │
    │ Dashboard: gráfico se mueve   │
    └──────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ T2: EMBARQUE COMPLETA TAREA            │
│ Estado: ENTREGADO                      │
│ Acción: En Boarding, marca entregado   │
│ Resultado: time_delivery se registra   │
└────────────────────────────────────────┘
           ↓ (Supabase Realtime Event)
    ┌──────────────────────────────┐
    │ Control: row desaparece       │
    │ Dashboard: ENTREGADO ++       │
    │ Donut recalcula               │
    │ Tiempo total desde SOLICITADO │
    │ va a TIMELINE                 │
    └──────────────────────────────┘
           ↓
┌────────────────────────────────────────┐
│ FINAL: ORDEN COMPLETADA                │
│ Status: ENTREGADO                      │
│ Visible en: Control (histórico)        │
│            Dashboard (Timeline)        │
│            Reports (CSV export)        │
└────────────────────────────────────────┘
```

### Escenario: SUPERVISOR Audita el Trabajo

```
SUPERVISOR accede a /admin/Dashboard
  ↓
Selecciona rango de fecha (Ej: Últimos 7 días)
  ↓
Ve gráficos de desempeño:
  - Cuántas órdenes por área
  - Qué porcentaje se entregó
  - Tiempos promedio
  ↓
Encuentra una orden sospechosa
  ↓
Va a Control.js para editar
  ↓
Verifica comentarios y timestamps
  ↓
Actualiza estado si es necesario
  ↓
Exporta reporte CSV para archivo
```

---

## ⏰ Cronología de Estados (State Machine)

```
SOLICITADO (creado por LINEA)
    ├─→ EN PROGRESO (actualizado por EMBARQUE)
    │       ├─→ ENTREGADO (completado por EMBARQUE)
    │       └─→ CANCELADO (cancelado por EMBARQUE)
    └─→ CANCELADO (cancelado por SUPERVISOR/ADMIN)

Transiciones válidas:
  SOLICITADO → EN PROGRESO ✅
  SOLICITADO → CANCELADO ✅
  EN PROGRESO → ENTREGADO ✅
  EN PROGRESO → CANCELADO ✅
  
Transiciones INVÁLIDAS (prevenir):
  ENTREGADO → X ❌ (estado final)
  CANCELADO → X ❌ (estado final)
  EN PROGRESO → SOLICITADO ❌ (no retroceder)
```

---

## 📊 Matriz de Permisos por Rol

```
┌──────────────────┬────────┬──────────┬────────────┬───────┐
│ Acción           │ LINEA  │ EMBARQUE │ SUPERVISOR │ ADMIN │
├──────────────────┼────────┼──────────┼────────────┼───────┤
│ Ver Request      │   ✅   │    ❌    │     ❌     │  ✅   │
│ Crear orden      │   ✅   │    ❌    │     ❌     │  ✅   │
│ Ver Dispatch     │   ❌   │    ✅    │   ✅(RO)   │  ✅   │
│ Cambiar estado   │   ❌   │    ✅    │     ❌     │  ✅   │
│ Ver Dashboard    │   ❌   │    ❌    │     ✅     │  ✅   │
│ Ver Control      │   ❌   │    ❌    │     ✅     │  ✅   │
│ Editar orden     │   ❌   │    ❌    │     ✅     │  ✅   │
│ Eliminar orden   │   ❌   │    ❌    │     ❌     │  ✅   │
│ Crear usuario    │   ❌   │    ❌    │     ❌     │  ✅   │
│ Editar usuario   │   ❌   │    ❌    │     ❌     │  ✅   │
│ Eliminar usuario │   ❌   │    ❌    │     ❌     │  ✅   │
│ Ver GlobalUsers  │   ❌   │    ❌    │     ❌     │  ✅   │
└──────────────────┴────────┴──────────┴────────────┴───────┘

Legend: ✅ = Acceso total, RO = solo lectura, ❌ = sin acceso
```

---

## 🔔 Notificaciones por Evento

```
LINEA crea orden
  └─→ EMBARQUE: Notificación de voz + beep + visual
  
Orden pasa a EN PROGRESO
  └─→ LINEA: (no notificada, pueden ver en tabla)
  
Orden se completa (ENTREGADO)
  └─→ Dashboard: Gráficos actualizan
  └─→ LINEA: (ve cambio en tabla realtime)
  
Usuario se crea
  └─→ GlobalUsers: Resumen actualiza
  
Usuario se elimina
  └─→ Management: Tabla actualiza
```

---

## 🚨 Errores Comunes y Cómo Evitarlos

| Error | Causa | Solución |
|-------|-------|----------|
| "Orden no aparece en Dispatch" | LINEA la creó pero EMBARQUE ni la ve | Revisar conexión realtime, refrescar página |
| "No puedo cambiar estado" | No eres EMBARQUE + ADMIN | Cambiar rol en Management |
| "Dashboard no actualiza" | Realtime desconectado | Revisar WebSocket en DevTools |
| "Usuario duplicado" | Mismo email en dos registros | Email es clave única, prevenir duplicación |
| "Voces no suenan en Dispatch" | Navegador silenciado o sin permiso | Hacer click en página, permitir audio |

---

**Última actualización:** Abril 2026 (v0.3.0)  
**Autor:** Khris + AI  
**Estado:** ✅ Completado y probado en producción
