# Prompt para Generar Presentacion de PalletGo

## Uso recomendado

Este prompt esta pensado para pegarse en herramientas como Gamma, Canva, PowerPoint con Copilot o plataformas similares que generen presentaciones a partir de texto.

## Prompt

Crea una presentacion profesional y ejecutiva en espanol para solicitar la aprobacion de un prototipo llamado PalletGo. La presentacion debe tener un estilo corporativo moderno, limpio, tecnologico y sobrio. Debe transmitir que el prototipo ya existe, ya funciona y busca aprobacion para continuar su validacion, no para vender una migracion completa todavia.

Objetivo de la presentacion:
Presentar PalletGo como un prototipo web operativo que reemplaza un flujo anterior basado en AppSheet, mostrando su valor actual, el alcance funcional validado, la arquitectura tecnologica real y la necesidad de habilitacion de red para seguir evaluandolo en el entorno objetivo de produccion.

Audiencia:
Jefaturas, responsables de aprobacion, personal de infraestructura y tomadores de decision.

Tono:
Ejecutivo, claro, concreto, convincente, profesional. Evitar lenguaje demasiado tecnico salvo en la slide de stack y en la slide de conectividad de red. No exagerar ni prometer integraciones no confirmadas. No hablar de riesgos internos del prototipo. No mencionar deuda tecnica ni pendientes de desarrollo.

Instrucciones visuales:
Usar diseno corporativo limpio con estetica moderna.
Priorizar diagramas simples, iconografia tecnologica y layouts con poco texto por slide.
Usar colores sobrios tipo azul, gris, blanco y algun acento moderno.
Incluir elementos visuales que representen flujo operativo, arquitectura cloud, usuarios por rol, conectividad y validacion.
Si una slide incluye capturas de pantalla, tratarlas como evidencia visual del prototipo en operacion.
No usar estilos recargados ni plantillas genericas demasiado llamativas.

Estructura sugerida de la presentacion:

### Slide 1. Portada

Titulo: PalletGo v0.3.0: Solicitud de Aprobacion del Prototipo

Mensaje clave: Prototipo web ya operativo para reemplazar AppSheet con una sola plataforma, sin licencias adicionales y con mejor control para usuarios, embarque, supervision y administracion.

### Slide 2. Situacion del punto de partida

Explicar brevemente los problemas del modelo anterior:

- Interfaz limitada
- Tope de usuarios
- Mantenimiento duplicado

Cerrar la slide indicando que esto motivo la construccion de un prototipo web unificado y administrable.

### Slide 3. PalletGo hoy

Mostrar que el prototipo ya existe y funciona.

Incluir estos datos:

- Cobertura funcional: Request, Dispatch, Boarding, Dashboard, Control, Management y GlobalUsers
- Escala validada: 27 usuarios creados, 4 roles definidos y 25,124 ordenes registradas
- Valor del prototipo: una sola base de codigo, despliegue web centralizado y operacion en tiempo real

Cerrar indicando que ya corre en entorno real de oficina y permite evaluacion controlada antes de cualquier migracion organizacional.

### Slide 4. Evidencia visual de la solucion

Usar layout para capturas o mockups del sistema.

Titulo sugerido: Evidencia Visual de la Solucion

Texto breve de apoyo:
Capturas del prototipo en operacion: solicitudes, despacho en tiempo real, control administrativo y vistas de seguimiento.

### Slide 5. Cobertura por rol

Explicar el uso por rol en una sola interfaz:

- LINEA: crea solicitudes y visualiza su avance en cola
- EMBARQUE: despacha ordenes, cambia estados y registra entregas
- SUPERVISOR / ADMIN: supervisan indicadores, control diario y administracion de usuarios

Cerrar con una frase sobre reduccion de complejidad operativa mediante navegacion por rol.

### Slide 6. Administracion y control operativo

Mostrar que el prototipo no solo captura datos, sino que ya tiene control administrativo.

Contenido:

- Gestion Administrativa: Management permite crear usuarios, definir roles y mantener permisos desde una sola vista
- Control Operativo: Control y Dashboard concentran revision diaria, filtros, exportacion y seguimiento de ordenes
- GlobalUsers complementa esta capa con una vista global de usuarios y resumen por rol

Usar una composicion visual de panel administrativo y tableros.

### Slide 7. Stack actual y rol de cada componente

Explicar el stack real sin duplicar demasiado lo anterior.

Contenido:

- Next.js + React: construyen la interfaz, rutas, formularios, vistas por rol y experiencia de uso
- Supabase: aporta autenticacion, base de datos PostgreSQL, politicas de acceso y tiempo real por WebSockets
- Vercel: publica la aplicacion web, facilita despliegue y centraliza el acceso al prototipo

Usar iconos y diagrama simple de arquitectura.

### Slide 8. Arquitectura actual del prototipo

Crear un diagrama visual simple de 3 capas:

- Frontend Web
- Servicios Cloud
- Despliegue y Acceso

Texto base:

- Next.js + React entregan formularios, dashboards, paneles por rol y navegacion unificada
- Supabase resuelve login, datos, politicas de acceso y eventos en tiempo real
- Vercel expone la aplicacion web y sirve de punto central para la evaluacion del prototipo

Cerrar con un texto breve:
La arquitectura actual conecta interfaz web, servicios cloud y operacion diaria sobre una base simple, mantenible y ya validada en uso interno.

### Slide 9. Validacion de red en equipos objetivo de produccion

Esta slide debe orientarse a infraestructura.

Titulo:
Validacion de Red en Equipos Objetivo de Produccion

Contenido:

- Las pruebas en equipos con IGEL muestran bloqueo de navegacion e interaccion con la app y sus servicios asociados
- VLANs validadas con bloqueo: 172.22.218.X, 174.X, 175.X y 219.X
- Actualmente el prototipo si opera en equipos ProdMon, ubicados en la red de oficinas sin ese bloqueo

Configuraciones requeridas:

- Habilitar trafico HTTPS/443, WebSockets y salida por firewall/proxy hacia la app y sus servicios

Dominios requeridos:

- palletgo.vercel.app
- *.vercel.app
- rhkhpigphjlccbscijms.supabase.co
- *.supabase.co

Resultado esperado:

- Acceso funcional desde los equipos objetivo de produccion
- Pruebas reales en el entorno donde hoy existe la restriccion tecnica
- Extender la validacion mas alla de ProdMon hacia el contexto operativo objetivo

### Slide 10. Solicitud de aprobacion en esta etapa

Esta debe ser una slide de cierre ejecutivo.

Titulo:
Solicitud de Aprobacion en Esta Etapa

Mensaje principal:
La propuesta busca aprobar la continuidad del prototipo y su validacion tecnica en el entorno objetivo, sin comprometer aun una migracion organizacional completa.

Incluir 3 bloques visuales:

- Continuidad del prototipo
  Mantener PalletGo como base funcional para evaluacion y mejora controlada
- Validacion en red objetivo
  Autorizar la habilitacion de acceso desde equipos IGEL y red de produccion
- Evaluacion con usuarios objetivo
  Ampliar la revision del prototipo donde hoy existe el bloqueo tecnico

Cierre:
Resultado esperado: un prototipo aprobado para continuar su validacion, con soporte de infraestructura donde hoy existe restriccion de red.

## Restricciones importantes

- No inventar integraciones con Azure, Active Directory o SharePoint.
- No presentar la solucion como sistema productivo corporativo definitivo.
- No incluir deuda tecnica, fallas internas ni roadmap de desarrollo.
- No agregar demasiado texto por slide.
- No repetir exactamente los mismos mensajes en varias slides.
- Generar una presentacion lista para ser afinada visualmente, con foco en aprobacion del prototipo.

## Instruccion extra de estilo

Quiero una presentacion con aspecto corporativo moderno, con diagramas claros, iconografia tecnologica, titulos potentes, poco texto por slide y buena jerarquia visual. Prioriza claridad para aprobacion ejecutiva e infraestructura.