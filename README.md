# 📦 PalletGo — Sistema de Gestión Logística

[![Estado](https://img.shields.io/badge/Estado-Producción-green.svg)](#)
[![Versión](https://img.shields.io/badge/Versión-0.3.0-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](#)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-red.svg)](#)

> **PalletGo** es una solución web interna para la gestión integral de solicitudes logísticas, despacho y embarques en tiempo real, desarrollada para la planta de producción Yazaki. Incluye notificaciones de voz, actualizaciones en tiempo real vía Supabase Realtime, análisis de datos y control de acceso basado en roles.

---

## 🚀 Inicio Rápido

### Para Usuarios
👉 Abre [Guía de Usuario](./doc/03-GUIA-USUARIO.md)

### Para Desarrolladores
```bash
# 1. Clonar
git clone https://github.com/khryztiam/palletgo.git && cd palletgo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear .env.local con las credenciales de Supabase (ver sección Variables de Entorno)

# 4. Ejecutar en modo desarrollo
npm run dev
```

**Abre:** http://localhost:3000

---

## 📚 Documentación

Documentación técnica completa en la carpeta **`/doc`**:

| Documento | Descripción |
|-----------|-------------|
| [📖 Índice General](./doc/00-INDICE.md) | Punto de entrada a toda la documentación |
| [🏗️ Arquitectura](./doc/01-ARQUITECTURA.md) | Decisiones técnicas y estructura del sistema |
| [🚀 Setup](./doc/02-SETUP.md) | Instalación y configuración del entorno |
| [👥 Guía Usuario](./doc/03-GUIA-USUARIO.md) | Manual de uso para operadores |
| [🔐 Autenticación](./doc/04-AUTENTICACION.md) | Flujo de auth, roles y permisos |
| [🗄️ Base de Datos](./doc/05-BASE-DE-DATOS.md) | Esquema, relaciones y políticas RLS |
| [📡 APIs REST](./doc/06-APIs.md) | Endpoints, contratos y ejemplos |
| [🔍 Calidad](./doc/11-CALIDAD.md) | Criterios de calidad y roadmap |

---

## 🎯 Características Principales

## 🎯 Funcionalidades por Rol

### 🔴 LINEA — Crear Solicitudes
- Formulario intuitivo para nuevas solicitudes
- Cola de espera en tiempo real
- Stepper visual de progreso (Solicitado → En Progreso → Entregado)
- Actualización automática sin recargar

### 🔵 EMBARQUE — Despacho y Boarding
- Panel en vivo de órdenes activas
- Notificaciones de voz automáticas (Speech Synthesis API)
- Timer de duración por orden
- Cambio de estado con un clic
- Gestión de entregadores (lista CRUD)
- Registro y control de embarques

### 🟡 SUPERVISOR — Monitoreo
- Dashboard con gráficos estadísticos (donut + barras)
- Análisis de órdenes por área y estado
- Exportación a CSV
- Filtros por rango de fechas
- Tabla con filtros reactivos

### ⚫ ADMIN — Control Total
- Todo lo anterior, más:
- Gestión completa de usuarios (crear/editar/eliminar)
- Vista global de usuarios con resumen por rol
- Control de permisos y accesos

---

## 💻 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (Pages Router) + React 19 |
| Estilos | CSS Modules (scoped, sin Tailwind) |
| Gráficos | Chart.js 4 + React-ChartJS-2 |
| Base de datos | Supabase (PostgreSQL 15) |
| Tiempo real | Supabase Realtime WebSockets |
| Autenticación | Supabase Auth (JWT) |
| Deploy | Vercel |

---

## 📊 Estadísticas del Sistema

- **8 rutas** principales
- **20+ componentes** reutilizables
- **6 endpoints** API REST
- **12+ políticas RLS** activas

---

## 🏗️ Estructura del Proyecto

```
palletgo/
├── doc/                    ← Documentación técnica completa
├── migrations/             ← Scripts SQL de base de datos
│   ├── 000_disable_rls_reset.sql
│   └── 001_enable_rls_adapted.sql
├── src/
│   ├── pages/              ← Rutas (Pages Router)
│   │   ├── index.js        ← Login
│   │   ├── Request.js      ← Solicitudes (LINEA)
│   │   ├── Dispatch.js     ← Despacho (EMBARQUE)
│   │   ├── Boarding.js     ← Embarques (EMBARQUE)
│   │   └── admin/
│   │       ├── Dashboard.js     ← Estadísticas (SUPERVISOR+)
│   │       ├── Control.js       ← Control diario (SUPERVISOR+)
│   │       ├── Management.js    ← Gestión usuarios (ADMIN)
│   │       └── GlobalUsers.js   ← Vista global usuarios (ADMIN)
│   ├── components/         ← Componentes reutilizables
│   ├── context/            ← AuthContext global
│   ├── lib/                ← Clientes Supabase (anon + service role)
│   └── styles/             ← CSS Modules por componente
└── package.json
```

---

## 🔐 Seguridad

- Autenticación JWT via Supabase Auth
- Control de acceso por rol (`AdminGate` + `RoleGate`)
- Row Level Security (RLS) en todas las tablas de Supabase
- Validación de sesión en cada endpoint de API
- Service role solo en servidor (nunca expuesto al cliente)
- HTTPS en producción

---

## ⚙️ Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> **Nota**: Nunca subir `.env.local` al repositorio.

---

## 🗓️ Historial de Versiones

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| `0.3.0` | Abril 2026 | GlobalUsers, Timeline mejorado, seguridad API reforzada, CSS dashboard |
| `0.2.0` | Dic 2025 | Mobile responsive completo, RLS implementado, docs profesional |
| `0.1.0` | Sep 2025 | MVP — Request, Dispatch, Boarding, Dashboard |

---

## 🚀 Roadmap

- ✅ RLS en Supabase (12+ políticas activas)
- ✅ Validación de sesión en APIs backend
- ✅ Vista global de usuarios (GlobalUsers)
- ✅ Mobile responsive completo
- ⏳ Tests unitarios (Vitest)
- ⏳ `.env.example` para onboarding de devs
- ⏳ Rate limiting en endpoints API

---

*Proyecto Publico — Computer Doctor SVSA. Todos los derechos reservados.*
