# Documentacion PalletGo - Indice general

> Ultima actualizacion: 2 de mayo de 2026
> Version documentada: 2.6.0

Este indice concentra la documentacion vigente del proyecto. El README queda como presentacion corta; los detalles tecnicos, estructura, estadisticas y flujos completos viven aqui.

## Lectura recomendada

| Necesidad | Documento |
|-----------|-----------|
| Entender que hace el sistema | [README](../README.md) |
| Revisar arquitectura y rutas | [01-ARQUITECTURA.md](01-ARQUITECTURA.md) |
| Instalar o levantar local | [02-SETUP.md](02-SETUP.md) |
| Capacitar usuarios | [03-GUIA-USUARIO.md](03-GUIA-USUARIO.md) |
| Revisar roles y sesion | [04-AUTENTICACION.md](04-AUTENTICACION.md) |
| Revisar tablas, RLS y migraciones | [05-BASE-DE-DATOS.md](05-BASE-DE-DATOS.md) |
| Revisar endpoints | [06-APIs.md](06-APIs.md) |
| Entender el flujo operativo por rol | [09-FLUJOS-POR-ROL.md](09-FLUJOS-POR-ROL.md) |
| Handover a otro desarrollador | [10-HANDOVER.md](10-HANDOVER.md) |
| Revisar deuda tecnica y calidad | [11-CALIDAD.md](11-CALIDAD.md) |

## Flujo principal del negocio

```text
1. LINEA crea una solicitud desde Request.
2. Supabase Realtime actualiza la cola operativa.
3. EMBARQUE recibe aviso visual/voz en Dispatch.
4. EMBARQUE toma la solicitud, controla el tiempo y actualiza estado.
5. Boarding registra/controla embarques cuando aplica.
6. SUPERVISOR y ADMIN revisan indicadores, filtros, detalle y exportacion.
```

## Estructura vigente del proyecto

```text
palletgo/
├── docs/                  Documentacion tecnica
├── migrations/            Scripts SQL y ajustes RLS
├── public/                Recursos estaticos
├── src/
│   ├── pages/             Rutas Pages Router
│   │   ├── index.js       Login
│   │   ├── Request.js     Solicitudes LINEA
│   │   ├── Dispatch.js    Despacho EMBARQUE
│   │   ├── Boarding.js    Embarques EMBARQUE
│   │   ├── admin/         Summary, Dashboard, Control, Management, GlobalUsers
│   │   └── api/           Endpoints backend
│   ├── components/        Componentes reutilizables
│   ├── context/           AuthContext
│   ├── lib/               Clientes Supabase
│   └── styles/            CSS Modules y estilos globales
├── eslint.config.mjs      Configuracion ESLint
├── package.json
└── README.md
```

## Estadisticas actuales

| Metrica | Estado |
|---------|--------|
| Rutas Pages Router | 15 archivos en `src/pages`, incluyendo APIs |
| Endpoints API | 4 archivos API activos |
| Componentes | 17 componentes principales |
| CSS Modules / estilos | 16 archivos de estilo |
| Migraciones SQL | 7 archivos |
| Tests automatizados | No identificados en el repo |
| Version actual | 2.6.0 |

## Roles operativos

| Rol | Alcance |
|-----|---------|
| LINEA | Solicita y consulta estado de ordenes. |
| EMBARQUE | Atiende, despacha, actualiza estados y gestiona entregadores. |
| SUPERVISOR | Monitorea indicadores, control diario, filtros y exportaciones. |
| ADMIN | Administra usuarios, permisos y vistas globales. |

## Historial documental y changelog

El historial reconstruido por commits esta en [CAMBIOS-DOCUMENTACION.md](CAMBIOS-DOCUMENTACION.md). La serie documentada inicia en `1.0.0`, reconoce el salto tecnico mayor en `2.0.0` y deja el relanzamiento UI/UX del 4 de marzo de 2026 como `2.1.0`.
