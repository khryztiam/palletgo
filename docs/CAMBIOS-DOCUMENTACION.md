# Changelog y hallazgos documentales

> Reconstruido desde commits locales/remotos el 2 de mayo de 2026.
> La serie publica inicia en `1.x.x`; se evita documentar entregables como `0.x.x`.

## Hallazgos

- El README apuntaba a `./doc`, pero la carpeta vigente es `docs/`.
- `package.json` seguia en `0.4.0` aunque existen fixes posteriores del 24 de abril de 2026 y un update del 2 de mayo de 2026.
- La documentacion mezclaba estado `0.3.0`, roadmap desactualizado y estadisticas que encajan mejor en el indice tecnico.
- En la historia disponible no aparece Vite. El primer commit local/remoto es `c7a08e1` con Create Next App, Next 15.3.0 y React 19.0.0.
- El cambio grande verificable de stack ocurre el 13 de diciembre de 2025: Next.js pasa a `^16.0.10` y React/React DOM a `^19.2.3`. Se documenta como `2.0.0`.
- El cambio del 4 de marzo de 2026 se documenta como `2.1.0`: relanzamiento UI/UX sobre la nueva base tecnica, sin justificar una version `3.0.0`.
- Existe la rama `v2-maintenance` con un modulo grande de mantenimiento (`8ff9817`), pero no esta integrada en `main`; no debe describirse como parte de la version vigente.

## Version vigente

| Version | Fecha | Base | Resumen |
|---------|-------|------|---------|
| `2.6.0` | 2026-05-02 | `477c7ae` | Update de UI y configuracion: ESLint, scripts lint, Card/Layout/Summary y API de cola. |

## Historial reconstruido

| Version | Fecha | Commits base | Cambios principales |
|---------|-------|--------------|---------------------|
| `1.0.0` | 2025-04-11 | `c7a08e1`, `112f060` | Base en Next.js Pages Router: login, estructura inicial, Supabase, componentes base y primera gestion operativa. |
| `1.1.0` | 2025-04-15 | `b344431` - `dbb0437` | Management, mini backend, roles, filtros por area, mejoras CSS, dashboard y exportacion inicial. |
| `1.2.0` | 2025-04-30 | `75d2868`, `557d60b` | Implementacion de APIs, revision de modales de Control y ajustes de Management. |
| `1.3.0` | 2025-06-28 | `296f1b2` - `b31f6f8` | Login/AdminGate, evolucion de roles, visualizacion y nuevo rol con ajustes UX. |
| `1.4.0` | 2025-08-25 | `57794b5` - `aaee822` | Mejoras de formularios, registro admin, Request por usuario, tablas, alertas Dispatch, Control y Dashboard. |
| `1.5.0` | 2025-11-21 | `394984c` - `699e632` | Dashboard con export CSV, menu, comentarios, soporte HU scan y ajustes de Request. |
| `2.0.0` | 2025-12-13 | `eaa28ce` | Actualizacion tecnica mayor: Next.js 16, React 19.2, React DOM 19.2 y ajustes globales. |
| `2.1.0` | 2026-03-04 | `489c3a2` | Relanzamiento UI/UX: Layout, Sidebar, CSS Modules, responsive y reorganizacion visual de pantallas principales. |
| `2.1.1` | 2026-03-04 | `5a5ec75` | Fix de duplicidad de solicitudes por doble clic. |
| `2.2.0` | 2026-03-15 | `9691342` - `6d70642` | Documentacion profesional, responsive mobile, RLS, auth en APIs, endpoints de ordenes y fixes Dispatch/Request. |
| `2.3.0` | 2026-04-06 | `44b1f3e` | GlobalUsers inicial, permisos por rol, Sidebar/AdminGate y ajustes de Dashboard. |
| `2.4.0` | 2026-04-10 | `04e7cfb` | GlobalUsers consolidado, Timeline refactor, seguridad API y actualizacion documental. |
| `2.5.0` | 2026-04-11 | `623a0e6` - `5e586d2` | Flujos por rol, Handover, Summary ejecutivo, Boarding mejorado, Top5Turno y KPIs. |
| `2.5.1` | 2026-04-24 | `284b305` - `86aa3c9` | Fix RLS `list_users`, CRUD de entregadores para EMBARQUE, simplificacion de politicas y remocion de credenciales expuestas. |
| `2.6.0` | 2026-05-02 | `477c7ae` | UI/configuracion: ESLint, scripts lint, estilos Card/Layout/Summary y API de cola. |

## Rama no integrada

| Rama | Commit | Estado | Observacion |
|------|--------|--------|-------------|
| `v2-maintenance` | `8ff9817` | No integrada en `main` | Agrega modulo de mantenimiento, paginas `maintenance`, componentes y estilos propios. Documentar aparte si se retoma. |

## Criterio de versionado usado

- `1.x.x`: evolucion funcional inicial previa al salto tecnico mayor.
- `2.0.0`: cambio mayor de base tecnica.
- `2.1.0`: relanzamiento UI/UX sobre la base `2.0.0`.
- `2.x.0`: features o cambios de UI/configuracion con impacto visible.
- `2.x.1`: fixes puntuales de seguridad, RLS o documentacion sensible.
