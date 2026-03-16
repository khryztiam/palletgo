# 📋 Instrucciones de Trabajo - Línea y Embarque

**Aplicación**: PalletGo | **Versión**: 1.0 | **Fecha**: Marzo 2026

---

## 👥 Roles y Permisos

### 🔴 LINEA
- **Acceso**: Vista `/Request` únicamente
- **Responsabilidades**: Crear y consultar órdenes de solicitud
- **Permisos**: 
  - ✅ Crear nuevas solicitudes
  - ✅ Ver estado de sus órdenes
  - ✅ Ver cola de espera
  - ❌ No puede acceder a Dispatch o Boarding

### 🔵 EMBARQUE
- **Acceso**: Vistas `/Dispatch` y `/Boarding`
- **Responsabilidades**: Despachar órdenes y registrar embarques
- **Permisos**:
  - ✅ Ver órdenes activas en tiempo real
  - ✅ Cambiar estados de órdenes
  - ✅ Registrar entregadores
  - ✅ Gestionar embarques
  - ✅ Recibir notificaciones de voz

---

## 🔄 Flujo General del Sistema

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   LINEA     │────▶│  EMBARQUE    │────▶│ BOARDING   │
│  (Request)  │     │  (Dispatch)  │     │            │
└─────────────┘     └──────────────┘     └────────────┘
      1                    2                    3
```

### Estados de la Orden
1. **SOLICITADO** ⏳ - Orden creada, en cola de espera
2. **EN PROGRESO** 🚛 - Orden siendo procesada
3. **ENTREGADO** ✅ - Orden completada

---

## 📝 VISTA 1: REQUEST (Para LINEA)

### 🎯 Objetivo
Crear nuevas solicitudes de retiro de contenedores o tarimas y consultar el estado de órdenes anteriores.

### 📍 Ubicación
- **URL**: `http://localhost:3000/Request`
- **Rol requerido**: LINEA

### 🛠️ Formulario de Solicitud

#### Campos obligatorios:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| **Área** | Texto | Nombre del área solicitante | LINEA 1, LINEA 2 |
| **Solicitante** | Texto | Nombre de quien solicita | Juan Pérez |
| **Tipo de Retiro** | Dropdown | Tipo de solicitud | • RETIRO DE CONTENEDOR<br/>• RETIRO DE TARIMA |
| **Destino** | Dropdown | Dónde va la orden | • EMBARQUE<br/>• EPC |
| **Observaciones** | Textarea | Notas adicionales | Urgente, contenedor dañado |
| **Etiqueta** | Checkbox | Si requiere etiqueta de impresión | ☑ Sí / ☐ No |

### 📊 Stepper Visual de Progreso

OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOo

```
① Solicitado ──── ② En Progreso ──── ③ Entregado
   (Actual)
```

**Mensajes contextuales:**
- **Si hay cola**: "Hay **X órdenes** antes que la tuya"
- **Si eres el próximo**: "🎉 ¡Eres el siguiente en la cola!"
- **Cuando avanza**: "🚛 Tu orden está siendo atendida ahora"

### 📋 Mi Orden Actual

Muestra la orden más reciente con:
- 🆔 **ID de Orden**
- 📅 **Fecha y hora de creación**
- 📍 **Estado actual** (con código de color)
- 🎯 **Posición en cola**
- ⏱️ **Tiempo esperado**

### 🔍 Historial de Órdenes Anteriores

Tabla con últimas solicitudes:
- Orden ID
- Área
- Tipo de retiro
- Destino
- Fecha
- Estado actual

### ✅ Proceso Paso a Paso

1. **Verificar cola actual**
   - Observa el stepper de tu orden actual
   - Anota cuántas órdenes hay antes de la tuya

2. **Completar formulario**
   ```
   Área: LINEA 1
   Solicitante: Carlos López
   Tipo: RETIRO DE CONTENEDOR
   Destino: EMBARQUE
   Notas: Contenedor con pallets de acero
   Etiqueta: ☑
   ```

3. **Enviar solicitud**
   - Click en botón "SOLICITAR"
   - Se mostrará el ID de orden (guardar para referencia)

4. **Monitorear progreso**
   - El stepper se actualiza automáticamente
   - Revisadas cada 30 segundos aprox.

5. **Cuando esté en ENTREGADO**
   - La orden desaparece de "Mi Orden Actual"
   - Se mueve al historial
   - Ya puede crear nueva solicitud

---

## 🚚 VISTA 2: DISPATCH (Para EMBARQUE)

### 🎯 Objetivo
Ver y gestionar todas las órdenes activas en tiempo real, con notificaciones automáticas y timer de espera.

### 📍 Ubicación
- **URL**: `http://localhost:3000/Dispatch`
- **Rol requerido**: EMBARQUE, SUPERVISOR, ADMIN

### 🔴 Características Principales

#### 1️⃣ **Órdenes Activas en Tiempo Real**
- Se actualiza automáticamente cuando:
  - ✨ Nueva orden ingresa al sistema
  - 🔄 Cambio de estado de orden existente
- Muestra últimas **25 órdenes** (FIFO)

#### 2️⃣ **Tarjeta de Orden**
```
┌─────────────────────────────────────┐
│ ORDEN #12345                        │
├─────────────────────────────────────┤
│ Área: LINEA 1                       │
│ Solicitante: Juan Pérez             │
│ Tipo: RETIRO DE CONTENEDOR          │
│ Destino: EMBARQUE                   │
│ Status: EN PROGRESO                 │
│                                     │
│ ⏱ Tiempo transcurrido: 05:32        │
│                                     │
│ [CAMBIAR ESTADO]                    │
└─────────────────────────────────────┘
```

#### 3️⃣ **Timer Automático**
- ⏰ Contador en segundos (se actualiza cada segundo)
- Trackeador de eficiencia
- Útil para medir tiempo de respuesta

#### 4️⃣ **Notificaciones de Voz** 🔊
**Activación**: Se requiere interacción del usuario
- Primer click/touch en la página activa audio
- Se reproduce automáticamente en español (Voz: Microsoft Dalia)
- Mensaje: *"Nueva orden de [ÁREA] solicitada por [USUARIO]"*
- **Configuración**: rate 0.9, pitch 1.1, volumen 0.8

### 🎮 Cómo Cambiar Estado de Orden

1. Click en la orden deseada
2. Se abre modal con opciones:
   ```
   ┌────────────────────────┐
   │ Cambiar Estado Orden   │
   ├────────────────────────┤
   │ Estado Actual:         │
   │ [SOLICITADO]           │
   │                        │
   │ Nuevo estado:          │
   │ [▼ EN PROGRESO]        │
   │ [  ENTREGADO]          │
   │ [  CANCELADO]          │
   │                        │
   │ [Actualizar] [X]       │
   └────────────────────────┘
   ```

3. Seleccionar nuevo estado
4. Confirmar cambio

### ✅ Workflow en Dispatch

**⏳ SOLICITADO → 🚛 EN PROGRESO:**
```
1. Orden aparece en la lista (llega notificación de voz)
2. Leer información del cliente y tipo de retiro
3. Iniciar procesamiento
4. Click en orden → Cambiar a "EN PROGRESO"
5. Timer comienza a contar
```

**🚛 EN PROGRESO → ✅ ENTREGADO:**
```
1. Completar todas las actividades
2. Entregar a cliente
3. Click en orden → Cambiar a "ENTREGADO"
4. Orden desaparece de vista (se va a Boarding)
5. Timer se detiene
```

### 🔊 Troubleshooting Audio

| Problema | Solución |
|----------|----------|
| No suena la voz | 1. Verificar volumen del navegador<br/>2. Hacer click en la página<br/>3. Permitir acceso a audio cuando el navegador pregunte |
| Voz muy rápida/lenta | Aceptada como es (configuración del idioma del SO) |
| Acento incorrecto | Se detecta automáticamente voz en español |

---

## 🚢 VISTA 3: BOARDING (Para EMBARQUE)

### 🎯 Objetivo
Registrar y gestionar entregadores, y controlar el seguimiento de embarques completados.

### 📍 Ubicación
- **URL**: `http://localhost:3000/Boarding`
- **Rol requerido**: EMBARQUE, SUPERVISOR, ADMIN

### 📋 Secciones

#### 1️⃣ **Gestión de Entregadores**

**Panel de Lista de Entregadores:**
```
┌──────────────────────────────────┐
│ ENTREGADORES REGISTRADOS         │
├──────────────────────────────────┤
│ □ Juan Pérez       [Editar] [❌] │
│ □ Carlos López     [Editar] [❌] │
│ □ María García     [Editar] [❌] │
│ □ David Sánchez    [Editar] [❌] │
│                                  │
│ [+ NUEVO ENTREGADOR]             │
└──────────────────────────────────┘
```

**Crear Nuevo Entregador:**
```
┌──────────────────────────────┐
│ Nuevo Entregador             │
├──────────────────────────────┤
│ Nombre:                      │
│ [_________________]          │
│                              │
│ [Guardar] [Cancelar]         │
└──────────────────────────────┘
```

**Editar Entregador:**
```
┌──────────────────────────────┐
│ Editar Entregador            │
├──────────────────────────────┤
│ Nombre: Juan Pérez           │
│ [Juan Pérez (Editando)]      │
│                              │
│ [Guardar] [Cancelar]         │
└──────────────────────────────┘
```

**Eliminar Entregador:**
```
┌──────────────────────────────┐
│ ⚠️ ¿Eliminar entregador?     │
├──────────────────────────────┤
│ Esta acción eliminará a      │
│ "Juan Pérez" permanentemente │
│ y no se puede deshacer.      │
│                              │
│ [Cancelar] [Sí, eliminar]    │
└──────────────────────────────┘
```

#### 2️⃣ **Órdenes Entregadas**

**Tabla de Órdenes Completadas:**
```
┌──────────────────────────────────────────────────────┐
│ ÓRDENES ENTREGADAS (Últimas 25)                      │
├──────────────────────────────────────────────────────┤
│ ID    │ Área     │ Tipo           │ Destino   │ Fecha │
├──────────────────────────────────────────────────────┤
│ 12345 │ LINEA 1  │ RETIRO CONTENE │ EMBARQUE  │ 14:32 │
│ 12346 │ LINEA 2  │ RETIRO TARIMA  │ EPC       │ 15:01 │
│ 12347 │ LINEA 1  │ RETIRO CONTENE │ EMBARQUE  │ 15:45 │
│ ...   │ ...      │ ...            │ ...       │ ...   │
└──────────────────────────────────────────────────────┘
```

**Información al hacer click en orden:**
```
┌──────────────────────────────────┐
│ Detalles Orden #12345            │
├──────────────────────────────────┤
│ Área: LINEA 1                    │
│ Solicitante: Juan Pérez          │
│ Tipo: RETIRO DE CONTENEDOR       │
│ Destino: EMBARQUE                │
│ Estado: ENTREGADO                │
│ Fecha Solicitud: 14:15           │
│ Fecha Entrega: 14:32             │
│ Tiempo Total: 17 min             │
│                                  │
│ [Cerrar]                         │
└──────────────────────────────────┘
```

### ✅ Workflow en Boarding

#### 📍 **Registrar Nuevo Entregador:**
```
1. Click "[+ NUEVO ENTREGADOR]"
2. Ingreso nombre del entregador
   Ej: "José María Rodríguez"
3. Click "Guardar"
4. Aparece en la lista inmediatamente
```

#### 📍 **Actualizar Datos de Entregador:**
```
1. Localizar entregador en lista
2. Click "[Editar]"
3. Modificar nombre
   Ej: De "José María" a "José María Rodríguez García"
4. Click "Guardar"
5. Cambio se refleja en la lista
```

#### 📍 **Eliminar Entregador:**
```
1. Localizar entregador en lista
2. Click "[❌]"
3. Confirmar en modal de eliminación
   ⚠️ "¿Eliminar a Juan Pérez?"
4. Click "Sí, eliminar"
5. Entregador se quita de la lista
```

#### 📍 **Consultar Órdenes Entregadas:**
```
1. Scrollear a sección "Órdenes Entregadas"
2. Tabla muestra últimas 25 entregas
3. Para más detalle: click en fila
4. Se abre modal con informacióncompleta
5. Revisar tiempos de processing
```

---

## 🔐 Matriz de Acceso

| Vista | LINEA | EMBARQUE | SUPERVISOR | ADMIN |
|-------|:-----:|:--------:|:----------:|:-----:|
| Request | ✅ | ❌ | ❌ | ✅ |
| Dispatch | ❌ | ✅ | ✅ | ✅ |
| Boarding | ❌ | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ❌ | ✅ | ✅ |
| Control | ❌ | ❌ | ✅ | ✅ |
| Management | ❌ | ❌ | ❌ | ✅ |

---

## ⚡ Funcionalidades Especiales

### 🔄 Actualización en Tiempo Real
- **Dispatch**: Se actualiza automáticamente cuando:
  - Nuevo orden ingresa al sistema
  - Otro usuario cambia estado
  - No necesita F5 o refresco manual

- **Boarding**: 
  - Órdenes se actualizan al cambiar de estado en Dispatch
  - Entregadores se sincronizar entre usuarios

### 🔊 Notificaciones de Voz (Dispatch)
- **Primer click activa**: Se reproducirá automáticamente para nuevas órdenes
- **Idioma**: Español (México)
- **Mensaje**: Área solicitante + nombre del usuario
- **Cuándo suena**: Al insertar nueva orden en la tabla

### ⏱️ Timer Inteligente
- Activo en Dispatch
- Cuenta segundos desde creación de orden
- Útil para:
  - Medir eficiencia
  - Identificar órdenes "lentas"
  - Planificación de recursos

---

## 🚨 Alertas y Validaciones

| Acción | Validación | Mensaje |
|--------|-----------|---------|
| Crear orden sin área | Area es obligatoria | "Por favor completa todos los campos" |
| Enviar sin destino | Destino es obligatorio | "Por favor completa todos los campos" |
| Cambiar estado | Control en Dispatch | Debe seleccionar nuevo estado válido |
| Eliminar entregador | Confirmación modal | Pregunta "¿Estás seguro?" |

---

## 📞 Soporte Rápido

### Problemas Comunes

**P: No veo mis órdenes en Dispatch**
A: 
1. Verificar rol de usuario (debe ser EMBARQUE)
2. Hacer F5 para refrescar
3. Verificar que órdenes estén en estado "SOLICITADO" o "EN PROGRESO"
4. Si sigue sin funcionar, contactar al Administrador

**P: ¿Por qué no suena la notificación de voz?**
A:
1. Hacer click en la página para activar audio
2. Verificar volumen del navegador
3. Permitir acceso a audio si el navegador lo pide
4. Probar en Chrome o Edge (mejor soporte)

**P: ¿Cuántas órdenes guarda Boarding?**
A: Últimas 25 entregas. Para historial completo, usar /admin/Dashboard

**P: ¿Puedo editar orden desde Boarding?**
A: No. Solo puedes consultar. Para cambiar estado, usa Dispatch.

**P: ¿Se pierde la orden al cambiar estado a ENTREGADO?**
A: No. Se mueve a Boarding (Órdenes Entregadas) con toda la información intacta.

---

## 📚 Referencia Rápida

### Keypaths
- 🏠 Home: `/`
- 📝 Solicitar: `/Request`
- 🚚 Despachar: `/Dispatch`
- 🚢 Embarcar: `/Boarding`

### Estados
- ⏳ `SOLICITADO` - En cola
- 🚛 `EN PROGRESO` - Siendo procesada
- ✅ `ENTREGADO` - Completada
- ❌ `CANCELADO` - Anulada

### Colores de Estado
- 🟧 Solicitado: Ámbar
- 🟦 En Progreso: Azul
- 🟩 Entregado: Verde (En Boarding)
- ⬜ Cancelado: Gris

---

**Documento versión 1.0 | Actualizado: Marzo 2026**
**Contacto: Equipo de Desarrollo | Email: soporte@palletgo.local**
