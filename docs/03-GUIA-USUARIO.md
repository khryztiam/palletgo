# 👥 Guía de Usuario - PalletGo

> **Manual para Usuarios Estándar**
> 
> Audiencia: Operadores, Despachadores, Supervisores
> Tiempo de lectura: 20 minutos

---

## 📋 Índice Rápido

- [Roles y Acceso](#roles-y-acceso)
- [Cómo Usar la App](#cómo-usar-la-app)
- [Solución de Problemas](#solución-de-problemas)
- [Contacto](#contacto)

---

## 👤 Roles y Acceso

Según tu rol, tienes acceso a diferentes áreas:

### 🔴 LINEA - Crear Solicitudes
**Acceso:** Solo puedes crear solicitudes de embarque

**Qué puedes hacer:**
- ✅ Crear nuevas solicitudes
- ✅ Ver estado de tus solicitudes
- ✅ Ver posición en la cola de espera
- ❌ No puedes despachar ni embarcar

**Dónde:** Menú → "Solicitudes"

---

### 🔵 EMBARQUE - Despachar Órdenes
**Acceso:** Despachas órdenes y registras embarques

**Funciones principales:**
1. **Despacho** - Ver órdenes activas en tiempo real
   - ✅ Recibir notificaciones de voz
   - ✅ Cambiar estado (EN PROGRESO → ENTREGADO)
   - ✅ Asignar entregador
   - ✅ Registrar comentarios

2. **Embarques** - Registrar entregas
   - ✅ Crear lista de entregadores
   - ✅ Ver órdenes pendientes
   - ✅ Marcar como entregado

**Dónde:** Menú → "Despacho" y "Embarques"

---

### 🟢 SUPERVISOR - Ver Estadísticas
**Acceso:** Supervisa el día de trabajo (casi lo mismo que ADMIN, pero SIN crear/editar/eliminar usuarios)

**Qué ves:**
- ✅ Dashboard con gráficos (donut de estados, barras por área)
- ✅ Tabla de todas las órdenes del día (Control)
- ✅ Filtros por estado
- ✅ Exportar datos a Excel
- ✅ Editar órdenes si es necesario (cambiar estado, comentarios)
- ❌ NO puedes crear/editar/eliminar usuarios

**Dónde:** Menú → "Dashboard" y "Control"

**Permiso especial:** Si necesitas promover a alguien a SUPERVISOR, contacta a ADMIN

**Diferencia clave ADMIN vs SUPERVISOR:**
| Función | ADMIN | SUPERVISOR |
|---------|-------|------------|
| Ver Dashboard | ✅ | ✅ |
| Ver Control | ✅ | ✅ |
| Editar órdenes | ✅ | ✅ |
| Crear usuarios | ✅ | ❌ |
| Editar usuarios | ✅ | ❌ |
| Eliminar usuarios | ✅ | ❌ |
| Ver lista de usuarios | ✅ | ❌ |

---

### 🔑 ADMIN - Acceso Total
**Acceso:** Control completo del sistema

**Todas las funciones de LINEA + EMBARQUE + SUPERVISOR +**
- ✅ Crear/editar/eliminar usuarios
- ✅ Ver lista global de usuarios (GlobalUsers - NUEVO)
- ✅ Reportes avanzados
- ✅ Gestionar permisos y roles

**Dónde:** Menú → "Gestión de Usuarios" + "Vista Global de Usuarios" (además del resto)

---

## 📊 Tabla de Acceso Rápida

| Función | LINEA | EMBARQUE | SUPERVISOR | ADMIN |
|---------|-------|----------|------------|-------|
| **Crear solicitud** | ✅ | ❌ | ❌ | ✅ |
| **Ver solicitudes** | ✅ (solo mis) | ✅ (todas) | ✅ (todas) | ✅ (todas) |
| **Despacho** | ❌ | ✅ | ✅ (read-only) | ✅ |
| **Embarques** | ❌ | ✅ | ✅ (read-only) | ✅ |
| **Dashboard** | ❌ | ❌ | ✅ | ✅ |
| **Summary Ejecutivo** | ❌ | ❌ | ✅ | ✅ |
| **Control (Tabla)** | ❌ | ❌ | ✅ | ✅ |
| **Gestión usuarios** | ❌ | ❌ | ❌ | ✅ |
| **Vista global usuarios** | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 Cómo Usar la App

### 1. Entrar a la App

**Paso 1:** Abre tu navegador en:
```
http://localhost:3000
(o la URL que te proporcionó tu administrador)
```

**Paso 2:** Ingresa tus credenciales:
```
Email:     embarque_els@yazaki.com (ej)
Contraseña: ••••••
```

**Paso 3:** Click en "Ingresar"

Si no tienes credenciales, contacta a tu administrador.

---

### 2. LINEA: Crear una Solicitud

**Ubicación:** Menú → "Solicitudes"

**Paso a paso:**

1. Click en botón "Nueva Solicitud"
2. Rellena el formulario:
   - **Área:** Selecciona tu línea (Linea 29, Linea 15, etc)
   - **Detalles:** Selecciona qué necesitas
     * CAJA GRANDE P/AEREO
     * RETIRO DE CONTENEDOR
     * DEVOLUCION DE CONTENEDOR
     * Etc.
   - **Destino:** EMBARQUE o EPC
   - **Comentarios:** (Opcional) Notas adicionales

3. Click en "Crear Solicitud"

**Qué pasa después:**
- ✅ Tu solicitud entra en cola
- ✅ Aparecerá en el panel de Embarque
- ✅ Recibirán notificación de voz
- ✅ Puedes ver tu posición en la cola

**Ver mis solicitudes:**
- La cola se actualiza en tiempo real (no necesitas refresh)
- Verde = Solicitud creada
- Azul = En progreso
- Gris = Entregada

---

### 3. EMBARQUE: Despachar Órdenes

**Ubicación:** Menú → "Despacho"

**Qué ves:**
- Tabla con todas las órdenes activas
- Negrita = Nueva orden (hace poco)
- Timer = Cuánto lleva en proceso
- Notificación de voz automática cuando llega una nueva

**Acciones:**

**A. Cambiar estado de orden**
1. Ve la orden en la tabla
2. Click en botón "Cambiar Estado"
3. Selecciona: EN PROGRESO → ENTREGADO
4. Ingresa entregador: Nombre de quien entrega
5. Click "Guardar"

**B. Oír nuevamente la notificación**
- Si no escuchaste, click en el ícono de volumen

**C. Filtrar órdenes**
- Por estado: SOLICITADO, EN PROGRESO, ENTREGADO
- Por área: Linea 29, Linea 15, etc.

---

### 4. EMBARQUE: Registrar Entregadores

**Ubicación:** Menú → "Embarques"

**Agregar entregador nuevo:**
1. Click en "+ Nuevo Entregador"
2. Ingresa:
   - **Nombre:** Del entregador
   - **Placa:** Vehículo (opcional)
   - **Teléfono:** Contacto (opcional)
3. Click "Guardar"

**Ver órdenes a entregar:**
- Lista abajo mostrará las últimas órdenes del turno activo
- **Filtro de turno:** AUTO (detecta el turno actual) o manual (Turno 1 / Turno 2)
- Paginación: 50 órdenes por página
- **Top 3 entregadores del turno:** aparece al costado con conteo de entregas
- Al hacer click en una orden se abre el detalle completo

---

### 5. SUPERVISOR: Dashboard

**Ubicación:** Menú → "Dashboard"

**Qué ves:**
- **Filtro de fechas:** Cambia el rango (Hoy / 7 días / 30 días o personalizado)
- **KPI SLA promedio:** Meta 20 min — verde = cumpliendo, amarillo = en riesgo, rojo = fuera de SLA
- **KPI Total órdenes** y **órdenes activas** del periodo seleccionado
- **Gráfico Dona:** Resumen de estados (Solicitado, En Progreso, Entregado, Cancelado)
- **Gráfico Barras:** Órdenes por área
- **Top 5 áreas por turno:** Cuáles zonas generan más solicitudes en Turno 1 y Turno 2
- **Timeline:** Últimas 10 órdenes (historial)
- **Exportar CSV:** Descargar datos a Excel

**Usar filtro:**
1. Click en las fechas o usar atajos rápidos (Hoy / 7D / 30D)
2. Los gráficos se actualizan automáticamente

---

### 6. SUPERVISOR: Summary Ejecutivo (**NUEVO**)

**Ubicación:** Menú → "Summary"

**Para qué sirve:** Vista analítica consolidada para revisar el desempeño por turno en un rango de fechas.

**Qué ves:**
- **KPIs en la parte superior:**
  - Total de órdenes del periodo
  - Tiempo promedio de entrega (minutos)
  - Total Turno 1 / Total Turno 2
  - Cumplimiento SLA (órdenes entregadas en ≤20 min)
- **Gráfico de barras apiladas:** Órdenes por área separadas por turno
- **Gráfico de línea:** Tendencia diaria de órdenes por turno
- **Dona:** Distribución Turno 1 vs Turno 2
- **Rangos de duración:** Cuántas órdenes tardaron 0-10 / 11-20 / 21-30 / >30 min
- **Tabla detallada:** Hora, solicitante, detalles, duración, entregador

**Comportamiento de la tabla según el rango:**
| Rango seleccionado | Comportamiento de la tabla |
|-------------------|---------------------------|
| 1 día (Hoy) | Muestra todas las filas sin paginar |
| 2–29 días | Paginada (30 filas por página) |
| 30+ días | Tabla bloqueada — ir a Dashboard para exportar |

**Nota:** Solo se incluyen órdenes con todos los campos completos (fecha, área, duración, entregador, detalles).

**Default:** Últimos 7 días al abrir la vista.

---

### 7. SUPERVISOR: Control del Día

**Ubicación:** Menú → "Control"

**Qué ves:**
- **Tarjetas de resumen:** Total de cada estado
- **Tabla filtrable:** Todas las órdenes de hoy
- **Filtros:** Por estado (por si necesitas solo las "EN PROGRESO")

**Editar una orden:**
1. Click en el ícono de lápiz (✏️) en la orden
2. Cambia lo que necesites
3. Click "Guardar"

**Eliminar una orden:**
1. Click en el ícono de basura (🗑️)
2. Confirma la eliminación
3. Se elimina de la base de datos

---

### 8. ADMIN: Gestión de Usuarios

**Ubicación:** Menú → "Gestión de Usuarios"

**Ver usuarios:**
- Tabla con todos los usuarios del sistema
- Resumen por rol

**Crear nuevo usuario:**
1. Click "+ Nuevo Usuario"
2. Ingresa:
   - **Email:** usuario@yazaki.com (DEBE ser @yazaki.com)
   - **Contraseña:** Mínimo 6 caracteres
   - **Nombre:** Del usuario
   - **Rol:** ADMIN, LINEA, EMBARQUE, SUPERVISOR
3. Click "Crear"

**Editar usuario:**
1. Click en ícono ✏️
2. Cambia nombre o rol
3. Click "Guardar"

**Eliminar usuario:**
1. Click en ícono 🗑️
2. Confirma
3. Usuario eliminado del sistema

---

## ⚠️ Solución de Problemas

### ❌ "No puedo entrar a la app"

**Problema:** Email y contraseña correctos pero no puedo login

**Soluciones:**
1. Verifica que escribas el email correcto (mayúsculas importan)
2. Verifica que sea del dominio @yazaki.com
3. Borra caché del navegador (Ctrl+Shift+Delete) e intenta de nuevo
4. Intenta en otro navegador
5. Contacta a tu administrador

---

### ❌ "No veo mi solicitud en Despacho"

**Solución:**
- La app se actualiza en tiempo real automáticamente
- Si aún no la ves, toma máximo 5 segundos
- Si pasan 10 segundos, recarga la página (F5)

---

### ❌ "No escucho la notificación de voz"

**Soluciones:**
1. Verifica volumen del PC (abajo a la derecha)
2. Verifica que el navegador no esté silenciado
3. Intenta hacer click en el ícono de volumen para reproducir manualmente
4. Revisa en Configuración del navegador que permita audio

---

### ❌ "Se me cerró la sesión"

**Causas:**
- Lleva inactivo más de 1 hora
- Alguien cerró sesión en otra pestaña
- Cookies se borraron

**Solución:**
- Login nuevamente
- No cierres el navegador entre órdenes

---

### ❌ "Veo error rojo en la pantalla"

**Acciones:**
1. Recarga la página (F5)
2. Si persiste, contacta a soporte inmediatamente
3. Devuelve la URL que estabas usando y el error exacto

---

## 💡 Tips y Trucos

### Atajos rápidos:
- **F5** → Recarga la página (si algo falla)
- **Ctrl+Shift+Delete** → Borrar caché (si hay problemas de display)
- **Ctrl+C** → Al seleccionar área, copia para siguiente orden

### Mejores prácticas:
- ✅ Revisa la cola regularmente (cada 5 minutos)
- ✅ Actualiza estado apenas entregues (para BD está correcta)
- ✅ Anota comentarios si hay problemas
- ✅ Exporta reportes al final del día

### Optimizar tiempo:
- Usa los filtros para ver solo lo que necesitas
- Cambia estado en lote si hay muchas pendientes
- Anota los entregadores antes de empezar turno

---

## 📞 Contacto y Soporte

**¿Problemas técnicos?**
- 📧 Email: soporte@yazaki.com
- 📞 Tel: 555-1234

**¿Dudas sobre procesos?**
- 👨‍💼 Contacta a tu supervisor

**¿Crear nuevo usuario?**
- 🔑 Solo Admin puede en "Gestión de Usuarios"

---

## 📱 Disponibilidad

**Plataformas soportadas:**
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ⚠️ Mobile (funciona pero es mejor en tablet, botones son pequeños)

**Horarios:**
- Disponible 24/7
- Backups se hacen de noche automáticamente

---

## ✅ Checklist Antes de Empezar

- [ ] Tienes credenciales de login
- [ ] Sabes cuál es tu rol
- [ ] Acceso a Internet estable
- [ ] Navegador actualizado
- [ ] Volumen activado (si necesitas notificaciones)

---

¿Necesitas más ayuda? Contacta a tu supervisor o administrador.

**Buena suerte con PalletGo!** 🚀
