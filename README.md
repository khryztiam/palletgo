# 📦 PalletGo - Sistema de Gestión Logística

[![Estado](https://img.shields.io/badge/Estado-Producción-green.svg)](#)
[![Versión](https://img.shields.io/badge/Versión-0.3.0-blue.svg)](#)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-red.svg)](#)

> **PalletGo** es una solución web para gestión integral de solicitudes logísticas, despacho y embarques en tiempo real. Cuenta con notificaciones de voz, realtime updates y análisis de datos en vivo.

---

## 🚀 Inicio Rápido

### Para Usuarios
👉 Abre [Guía de Usuario](./doc/03-GUIA-USUARIO.md)

### Para Desarrolladores
```bash
# 1. Clonar
git clone https://github.com/tu-org/palletgo.git && cd palletgo

# 2. Instalar
npm install

# 3. Configurar (copiar credenciales en .env.local)
cp .env .env.local

# 4. Ejecutar
npm run dev
```

**Abre:** http://localhost:3000

---

## 📚 Documentación Profesional

Documentación completa y actualizada en carpeta **`/doc`**:

| Documento | Para Quién | Tiempo |
|-----------|-----------|--------|
| [📖 Índice General](./doc/00-INDICE.md) | Todos | 5 min |
| [🏗️ Arquitectura](./doc/01-ARQUITECTURA.md) | Tech Leads, Devs Senior | 15 min |
| [🚀 Setup](./doc/02-SETUP.md) | Devs, DevOps | 10 min |
| [👥 Guía Usuario](./doc/03-GUIA-USUARIO.md) | Operadores | 20 min |
| [🔐 Autenticación](./doc/04-AUTENTICACION.md) | Devs | 20 min |
| [🗄️ Base de Datos](./doc/05-BASE-DE-DATOS.md) | Devs, DBAs | 25 min |
| [📡 APIs REST](./doc/06-APIs.md) | Devs | 15 min |
| [🔄 Flujos](./doc/08-FLUJOS.md) | Devs | 25 min |
| [🌐 Despliegue](./doc/09-DESPLIEGUE.md) | DevOps | 30 min |
| [🔍 Calidad](./doc/11-CALIDAD.md) | Tech Leads | 20 min |

---

## 🎯 Características Principales

### ✅ Para LINEA (Crear Solicitudes)
- 📝 Formulario intuitivo para crear solicitudes
- 📊 Ver cola de espera en tiempo real
- 🔄 Realtime updates automáticos
- 📍 Stepper de progreso visual

### ✅ Para EMBARQUE (Despachar)
- 📦 Panel en vivo de órdenes activas
- 🔊 Notificaciones de voz automáticas
- ⏱️ Timer de duración de cada orden
- 📋 Cambio de estado intuitivo
- 👥 Gestión de entregadores

### ✅ Para SUPERVISOR (Monitoreo)
- 📊 Dashboard con gráficos estadísticos
- 📈 Análisis por área y estado
- 📥 Exportación a CSV
- 🔍 Filtros por fecha
- 📋 Tabla completa con filtros

### ✅ Para ADMIN (Control Total)
- 👤 Gestión de usuarios (crear/editar/eliminar)
- 📚 Acceso a todas las funcionalidades
- 🔑 Control de permisos
- 📊 Reportes avanzados

---

## 💻 Stack Tecnológico

```json
Frontend:
- Next.js 16 (Pages Router)
- React 19.2 con Hooks
- CSS Modules (scoped)
- Chart.js para gráficos

Backend:
- Supabase (PostgreSQL 15)
- Realtime WebSockets
- JWT Authentication
- Vercel Hosting
```

---

## 📊 Estadísticas

- **7 rutas** principales
- **20+ componentes** reutilizables
- **25,000+ órdenes** procesadas
- **27 usuarios** activos
- **6 APIs** REST
- **12 políticas RLS** activas

---

## 🏗️ Estructura del Proyecto

```
palletgo/
├── doc/                    ← 📚 DOCUMENTACIÓN PROFESIONAL
│   └── 00-INDICE.md        (documentos completos)
├── migrations/             ← Scripts SQL de base de datos
│   ├── 000_disable_rls_reset.sql
│   └── 001_enable_rls_adapted.sql
├── src/
│   ├── pages/              ← Rutas principales + API endpoints
│   │   └── api/
│   │       ├── admin/users/  ← CRUD usuarios (requiere ADMIN)
│   │       └── orders/       ← Cola y actualización de órdenes
│   ├── components/         ← Componentes React
│   ├── context/            ← AuthContext global
│   ├── lib/                ← Clientes Supabase (anon + service role)
│   └── styles/             ← CSS Modules
└── package.json            ← Dependencias NPM
```

---

## 🔐 Seguridad

✅ Autenticación JWT  
✅ Control de acceso por rol (RoleGate + AdminGate)  
✅ Row Level Security (RLS) en todas las tablas  
✅ Validación de sesión en todos los endpoints de API  
✅ Service role (server-only) para operaciones privilegiadas  
✅ Sesión persistente  
✅ HTTPS en producción

---

## 📖 Documentación

**¿Necesitas empezar rápido?**
- Usuarios → [Guía de Usuario](./doc/03-GUIA-USUARIO.md)
- Devs → [Setup](./doc/02-SETUP.md)
- Tech Leads → [Arquitectura](./doc/01-ARQUITECTURA.md)
- Calidad → [Roadmap de mejoras](./doc/11-CALIDAD.md)

**Documentación completa:** [Índice General](./doc/00-INDICE.md)

---

## 🚀 Próximos Pasos

- ✅ Documentación profesional
- ✅ RLS en Supabase (12 políticas activas)
- ✅ Validación de sesión en APIs backend
- ✅ Endpoints de servicio para operaciones privilegiadas
- ⏳ Tests unitarios
- ⏳ `.env.example` para onboarding de devs

Ver [Roadmap Completo](./doc/11-CALIDAD.md#-roadmap-recomendado)

---

## 📞 Contacto

- **Soporte:** soporte@yazaki.com
- **Issues:** GitHub Issues
- **Documentación:** Ver carpeta `/doc`

---

> 💡 **¿Perdido?** Abre [Documentación](./doc/00-INDICE.md) o pregunta a tu supervisor.
