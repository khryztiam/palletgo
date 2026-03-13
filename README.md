# 📦 PalletGo - Sistema de Gestión Logística

[![Estado](https://img.shields.io/badge/Estado-Producción-green.svg)](#)
[![Versión](https://img.shields.io/badge/Versión-0.2.0-blue.svg)](#)
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
- **4 APIs** REST CRUD

---

## 🏗️ Estructura del Proyecto

```
palletgo/
├── doc/                    ← 📚 DOCUMENTACIÓN PROFESIONAL
│   └── 00-INDICE.md        (12 documentos completos)
├── src/
│   ├── pages/              ← Rutas principales
│   ├── components/         ← Componentes React
│   ├── context/            ← AuthContext global
│   ├── lib/                ← Clientes Supabase
│   └── styles/             ← CSS Modules
└── package.json            ← Dependencias NPM
```

---

## 🔐 Seguridad

✅ Autenticación JWT  
✅ Control de acceso por rol  
✅ Sesión persistente  
✅ HTTPS en producción

⚠️ **A mejorar:** Ver [doc/11-CALIDAD.md](./doc/11-CALIDAD.md)

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

- ✅ Documentación profesional ← YA HECHO
- ⏳ Implementar RLS en Supabase
- ⏳ Validación de sesión en APIs
- ⏳ Tests unitarios

Ver [Roadmap Completo](./doc/11-CALIDAD.md#-roadmap-recomendado)

---

## 📞 Contacto

- **Soporte:** soporte@yazaki.com
- **Issues:** GitHub Issues
- **Documentación:** Ver carpeta `/doc`

---

> 💡 **¿Perdido?** Abre [Documentación](./doc/00-INDICE.md) o pregunta a tu supervisor.
