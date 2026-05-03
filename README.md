# PalletGo - Sistema de gestion logistica

[![Estado](https://img.shields.io/badge/Estado-Produccion-green.svg)](#)
[![Version](https://img.shields.io/badge/Version-2.6.0-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](#)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-red.svg)](#)

PalletGo es una aplicacion web interna para coordinar solicitudes logisticas entre linea de produccion y el area de embarque. Centraliza la creacion de solicitudes, despacho, seguimiento en tiempo real, indicadores operativos y gestion de usuarios.

## Presentacion breve

El flujo principal inicia cuando LINEA crea una solicitud de material o pallet. EMBARQUE recibe la orden en vivo, la toma, actualiza el estado operativo y registra la entrega. SUPERVISOR y ADMIN monitorean tiempos, volumen, estados y usuarios desde paneles de control.

La solucion esta orientada a operacion diaria: menos comunicacion manual, mas trazabilidad, alertas en tiempo real y control por rol.

## Funciones principales

| Rol | Funciones |
|-----|-----------|
| LINEA | Crear solicitudes, ver cola en tiempo real y seguir el estado de cada orden. |
| EMBARQUE | Atender solicitudes, usar notificaciones de voz, cambiar estados, controlar tiempos y gestionar entregadores. |
| SUPERVISOR | Revisar dashboard, KPIs, graficas, filtros por fecha, control diario y exportacion CSV. |
| ADMIN | Gestionar usuarios, roles, permisos, vista global de usuarios y funciones de supervision. |

## Flujo operativo

```text
LINEA crea solicitud
  -> Supabase Realtime notifica a EMBARQUE
  -> EMBARQUE toma y procesa la orden
  -> La orden cambia de estado hasta entregada
  -> SUPERVISOR/ADMIN revisan indicadores y trazabilidad
```

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | Next.js 16 con Pages Router + React 19 |
| Estilos | CSS Modules |
| Backend / datos | Supabase, PostgreSQL y Realtime |
| Autenticacion | Supabase Auth + control por roles |
| Graficas | Chart.js + React-ChartJS-2 |
| Iconos | React-icons / Lucide-react segun componente |
| Deploy | Vercel |

## Documentacion

La documentacion tecnica esta en [`docs/`](./docs/00-INDICE.md).

| Documento | Uso |
|-----------|-----|
| [Indice](./docs/00-INDICE.md) | Mapa general, estructura, estadisticas y lectura recomendada. |
| [Arquitectura](./docs/01-ARQUITECTURA.md) | Componentes, rutas, decisiones tecnicas y dependencias. |
| [Setup](./docs/02-SETUP.md) | Instalacion y variables locales. |
| [Guia de usuario](./docs/03-GUIA-USUARIO.md) | Uso por rol operativo. |
| [Autenticacion](./docs/04-AUTENTICACION.md) | Sesion, roles y permisos. |
| [Base de datos](./docs/05-BASE-DE-DATOS.md) | Tablas, RLS y migraciones. |
| [APIs](./docs/06-APIs.md) | Endpoints y contratos. |
| [Flujos por rol](./docs/09-FLUJOS-POR-ROL.md) | Flujo detallado entre solicitante, entregador y supervision. |

## Version actual

**Version:** `2.6.0`
**Fecha:** 2 de mayo de 2026
**Base del cambio:** actualizacion de UI, configuracion del proyecto, ESLint, ajustes en Summary, Card, Layout y API de cola.

## Historial resumido

| Version | Fecha | Cambios clave |
|---------|-------|---------------|
| `2.6.0` | 2026-05-02 | Update de UI y configuracion: ESLint, scripts lint, ajustes visuales en Card/Layout/Summary y mejora en API de cola. |
| `2.5.1` | 2026-04-24 | Fix RLS para `list_users`, permisos de EMBARQUE sobre entregadores y saneamiento de credenciales en documentacion. |
| `2.5.0` | 2026-04-11 | Summary ejecutivo, Boarding mejorado, Top5Turno, KPIs de dashboard y documentacion de presentacion. |
| `2.4.0` | 2026-04-10 | GlobalUsers, Timeline refactor, seguridad API reforzada y ajustes de Dashboard/Management. |
| `2.3.0` | 2026-03-15 | RLS, auth en APIs, endpoints de ordenes y correcciones en Dispatch/Request. |
| `2.1.1` | 2026-03-04 | Correccion de duplicidad de solicitudes por doble clic. |
| `2.1.0` | 2026-03-04 | Relanzamiento UI/UX: Layout, Sidebar, CSS Modules, responsive y reorganizacion visual de pantallas principales. |
| `2.0.0` | 2025-12-13 | Actualizacion tecnica mayor a Next.js 16 y React 19.2, con ajustes globales y recursos de temporada. |
| `1.5.0` | 2025-10-18 | Dashboard revisado, exportacion CSV y mejoras de control operativo. |
| `1.4.0` | 2025-08-14 | Mejoras en Request, registro administrativo, filtros, tablas y alertas para Dispatch. |
| `1.3.0` | 2025-06-28 | Evolucion de roles, visualizacion, Login y AdminGate. |
| `1.2.0` | 2025-04-30 | APIs, modales de Control, Management y ajustes de estilos. |
| `1.1.0` | 2025-04-15 | Interacciones backend/frontend, roles, filtros por area y exportacion inicial. |
| `1.0.0` | 2025-04-11 | Base funcional en Next.js: login, solicitudes, despacho, dashboard y gestion administrativa inicial. |

Nota historica: la version `2.0.0` se toma desde el salto tecnico a Next.js 16 + React 19.2, y `2.1.0` desde el relanzamiento UI/UX del 4 de marzo de 2026.

## Validacion rapida

```bash
npm install
npm run lint
npm run dev
```

Abrir `http://localhost:3000` y validar el flujo LINEA -> EMBARQUE -> SUPERVISOR/ADMIN.

---

Proyecto privado - Computer Doctor SVSA. Todos los derechos reservados.
