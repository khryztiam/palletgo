# 📋 REFERENCIA RÁPIDA - Módulo Mantenimiento

## 🔐 Roles Creados

### TECNICO (rol_id: 5)
- **Acceso a**: Vista Monitor
- **Funcionalidad**: Ver solicitudes asignadas, ranking de técnicos, cola global
- **Ruta en Sidebar**: "Mi área" → "Solicitudes Mtto"

### ADMIN_TEC (rol_id: 6)
- **Acceso a**: Vista Monitor + Vista Admin Técnicos
- **Funcionalidad**: 
  - Monitor: ver todas las solicitudes y ranking
  - Admin: crear, editar, eliminar usuarios Técnico
- **Ruta en Sidebar**: 
  - "Administración" → "Gestión Técnicos"
  - "Monitoreo" → "Monitor Mtto"

---

## 🗺️ Navegación por Rol

### ADMIN
```
Sidebar "Administración":
  - Dashboard
  - Request Control
  - Usuarios (Management)
  - Admin Mantenimiento ← NUEVO

Sidebar "Operaciones":
  - Solicitudes (Request)
  - Despacho
  - Embarque

Sidebar "Mantenimiento": ← NUEVA SECCIÓN
  - Monitor Mtto
```

### LINEA
```
Sidebar "Mi área":
  - Solicitudes (Request)
  - Solicitud Mtto ← NUEVO (va a /maintenance/RequestMaintenance)
```

### TECNICO ← NUEVO ROL
```
Sidebar "Mi área":
  - Solicitudes Mtto (va a /maintenance/Monitor)
```

### ADMIN_TEC ← NUEVO ROL
```
Sidebar "Administración":
  - Gestión Técnicos (va a /admin/MaintenanceAdmin)

Sidebar "Monitoreo":
  - Monitor Mtto (va a /maintenance/Monitor)
```

---

## 🎯 Vistas Implementadas

### 1. `/maintenance/Monitor.js`
**Disponible para**: TECNICO, ADMIN_TEC, ADMIN
**Función**: Mostrar solicitudes de mtto y ranking de técnicos
**Componentes**: 
- Leaderboard de técnicos con conteos
- Cola de solicitudes con filtros
- Mi solicitud actual (si aplica)

**Routes**:
- `/maintenance/Monitor` ← URL principal

---

### 2. `/maintenance/RequestMaintenance.js`
**Disponible para**: LINEA, ADMIN
**Función**: Crear nuevas solicitudes de mantenimiento
**Funcionalidad**:
- Formulario con categorías dinámicas (Equipamiento, Preventivo, Seguridad, Mantenimiento)
- Subcategorías según categoría seleccionada
- Mostrar historial de solicitudes propias
- Filtros por estado

**Routes**:
- `/maintenance/RequestMaintenance` ← URL principal

**Categorías Disponibles**:
- **Equipamiento**: Conveyor, Sensor, Motor, Frenos, Cilindro, etc.
- **Preventivo**: Cambio aceite, filtros, lubricación, inspección, calibración
- **Seguridad**: Resguardo, señalización, emergencia, iluminación, piso
- **Mantenimiento**: Limpieza, soldadura, pintura, estructura, aislamiento

---

### 3. `/admin/MaintenanceAdmin.js`
**Disponible para**: ADMIN_TEC, ADMIN
**Función**: CRUD de usuarios Técnico
**Opciones**:
- ✅ Crear nuevo técnico
- ✏️ Editar nombre y datos
- 🗑️ Eliminar técnico
- 📊 Ver conteo de soportes realizados

**Routes**:
- `/admin/MaintenanceAdmin` ← URL principal

---

## 🧩 Componentes Creados

### MaintenanceCard.jsx
```javascript
import MaintenanceCard from '@/components/maintenance/MaintenanceCard';

<MaintenanceCard 
  maintenance={object} 
  position={number} 
  totalAhead={number}
/>
```
**Props**:
- `maintenance`: objeto con datos de solicitud
- `position`: posición en cola (opcional)
- `totalAhead`: cuántas hay antes (opcional)

---

### TechnicianLeaderboard.jsx
```javascript
import TechnicianLeaderboard from '@/components/maintenance/TechnicianLeaderboard';

<TechnicianLeaderboard technicians={array} />
```
**Props**:
- `technicians`: array de técnicos [{id, name, support_count, is_active}]

---

### MaintenanceQueue.jsx
```javascript
import MaintenanceQueue from '@/components/maintenance/MaintenanceQueue';

<MaintenanceQueue queue={array} filter={string} />
```
**Props**:
- `queue`: array de solicitudes
- `filter`: 'TODOS', 'PENDIENTE', 'EN PROGRESO', 'COMPLETADO'

---

## 🎨 Colores por Rol

| Rol | Color Hex | Uso |
|-----|-----------|-----|
| TECNICO | #ec4899 | Pink/Magenta |
| ADMIN_TEC | #d946ef | Purple |

Estos colores se aplican en:
- Sidebar (color de ícono activo)
- Summary en Management.js
- Filas de tabla en Management.js

---

## 📊 Estructura de Datos Mockup

### Solicitud de Mantenimiento
```javascript
{
  id_maintenance: number,
  title: string,
  description: string,
  category: 'Equipamiento' | 'Preventivo' | 'Seguridad' | 'Mantenimiento',
  created_by: string,
  assigned_to: string | null,
  status: 'PENDIENTE' | 'EN PROGRESO' | 'COMPLETADO' | 'RECHAZADO',
  priority: 'Baja' | 'Media' | 'Alta',
  date_created: ISO6391string,
  date_updated: ISO8601string | null,
  location?: string
}
```

### Técnico
```javascript
{
  id: number,
  email: string,
  user_name: string,
  rol_name: 'TECNICO',
  created_at: ISO8601string,
  support_count: number
}
```

---

## 🧪 Testing Recomendado

1. **Login como LINEA**
   - ✅ Ir a Sidebar → "Mi área" → "Solicitud Mtto"
   - ✅ Crear nueva solicitud
   - ✅ Ver historial de solicitudes

2. **Login como TECNICO**
   - ✅ Ir a Sidebar → "Mi área" → "Solicitudes Mtto"
   - ✅ Ver Monitor.js
   - ✅ Ver leaderboard
   - ✅ Filtrar por estado

3. **Login como ADMIN_TEC**
   - ✅ Ir a Sidebar → "Administración" → "Gestión Técnicos"
   - ✅ Crear técnico
   - ✅ Editar técnico
   - ✅ Eliminar técnico
   - ✅ Ir a Monitor (Sidebar → "Monitoreo")

4. **Login como ADMIN**
   - ✅ Acceso completo a todo
   - ✅ Ver Admin Management (Management.js)
   - ✅ Ver Admin Técnicos (MaintenanceAdmin.js)

---

## 🔄 Integración con BD (próximos pasos)

Para conectar con Supabase:

1. **Crear tablas**:
   - `maintenance_requests` (solicitudes)
   - `technicians` (si es separada de users)

2. **Reemplazar mockData** en:
   - `/maintenance/Monitor.js`
   - `/maintenance/RequestMaintenance.js`
   - `/admin/MaintenanceAdmin.js`

3. **Crear API endpoints** (/api/maintenance/*):
   - GET /api/maintenance/requests
   - POST /api/maintenance/requests
   - PUT /api/maintenance/requests/:id
   - DELETE /api/maintenance/requests/:id

4. **Implementar Realtime** (Supabase):
   - Escuchar cambios en solicitudes
   - Actualizar leaderboard en tiempo real

---

## 📝 Notas

- ✅ Todos los componentes usan CSS Modules
- ✅ Responsive design incluido (mobile-friendly)
- ✅ RoleGate implementado en todas las vistas
- ✅ Datos mockup sin conexión a BD (YA ESTÁ LISTO PARA PROBAR)
- ⚠️ Sin commit como solicitado
