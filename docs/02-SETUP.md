# 🚀 Guía de Setup e Instalación

> **Documentación de Configuración**
> 
> Audiencia: Desarrolladores (todos los niveles)
> Tiempo: 10-15 minutos
> Plataforma: Windows, macOS, Linux

---

## 📋 Prerrequisitos

Verifica que tengas instalados:

```powershell
# Windows PowerShell
node --version      # Debe ser v18+ (recomendado v20+)
npm --version       # Debe ser 10+
git --version       # Debe estar instalado
```

En macOS/Linux:
```bash
node --version      # v18+
npm --version       # 10+
git --version
```

---

## 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-org/palletgo.git
cd palletgo
```

---

## 2️⃣ Instalar Dependencias

```bash
npm install
```

Esto instalará:
- `next@16.0.10` - Framework React con SSR
- `react@19.2.3` - Librería UI
- `@supabase/supabase-js@2.49.4` - Cliente BD + Auth
- Y todas las demás en `package.json`

**Tiempo esperado**: 2-3 minutos (depende de conexión)

---

## 3️⃣ Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Windows (PowerShell)
New-Item -Path ".env.local" -Type File

# macOS/Linux
touch .env.local
```

Abre `.env.local` y usa este formato como ejemplo:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Opcional (para analytics, etc)
# NEXT_PUBLIC_ANALYTICS_ID=tu_id_aqui
```

### ⚠️ Importante
- **NUNCA** subas `.env.local` a git (ya está en `.gitignore`)
- `NEXT_PUBLIC_*` son públicas (visibles en el cliente)
- `SUPABASE_SERVICE_ROLE_KEY` es **SECRETO** (solo servidor)
- Solicita las claves reales por el canal interno definido para el proyecto

---

## 4️⃣ Verificar la Conexión a BD

Ejecuta el script de exploración:

```bash
node explore-db.js
```

**Salida esperada:**
```
🔗 Conectando a Supabase (Proyecto: <proyecto>)

📋 TABLAS ENCONTRADAS:

  ✅ users (27 registros)
  ✅ orders (25124 registros)
  ✅ deliveryPersons (0 registros)
  ✅ orderDetails (0 registros)

✅ ESTRUCTURA - USERS:
Columnas: user_name, id_rol, rol_name, email, id, created_at
```

Si ves un error, revisa:
- [ ] `.env.local` existe y está bien formado
- [ ] No hay espacios extras alrededor de `=`
- [ ] Las claves son correctas (cópialas sin modificar)

---

## 5️⃣ Iniciar Servidor de Desarrollo

```bash
npm run dev
```

**Salida esperada:**
```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

Abre tu navegador en `http://localhost:3000`

---

## 6️⃣ Credenciales de Prueba

Usa estas credenciales para testear:

| Email | Contraseña | Rol | Descripción |
|-------|-----------|-----|-------------|
| linea_els@yazaki.com | password123 | LINEA | Crear solicitudes |
| embarque_els@yazaki.com | password123 | EMBARQUE | Despachar órdenes |
| admin_els@yazaki.com | password123 | ADMIN | Acceso total |

**⚠️ Nota**: Si no funcionan, revisa en Supabase Dashboard → Authentication → Users

---

## 📁 Estructura de Carpetas Post-Setup

```
palletgo/
├── src/
│   ├── pages/           ← Rutas principales (7 rutas)
│   ├── components/      ← Componentes React (20+)
│   ├── context/         ← AuthContext global
│   ├── lib/             ← Clientes Supabase
│   └── styles/          ← CSS Modules
├── doc/                 ← Documentación (NUEVA)
├── .env.local           ← Variables (NO en git)
├── package.json         ← Dependencias
├── next.config.mjs      ← Config Next.js
└── README.md            ← Documentación principal
```

---

## 🧪 Verificación Completa de Setup

Ejecuta este checklist para asegurar que todo funciona:

```bash
# 1. Node.js instalado
node --version
# Resultado esperado: v18+ ✅

# 2. npm instalado
npm --version
# Resultado esperado: 10+ ✅

# 3. Dependencias instaladas
npm list next react @supabase/supabase-js
# Debe listar las 3 sin errores ✅

# 4. .env.local existe
cat .env.local
# Debe mostrar las 3 variables ✅

# 5. Conexión a BD funciona
node explore-db.js
# Debe listar tablas ✅

# 6. Servidor inicia
npm run dev
# Debe decir "Ready" ✅

# 7. Login funciona
# Abre http://localhost:3000 e intenta login ✅
```

---

## 🔧 Problemas Comunes y Soluciones

### ❌ Error: "Cannot find module '@supabase/supabase-js'"
```bash
# Solución:
npm install
npm install @supabase/supabase-js
```

### ❌ Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"
```bash
# Solución:
# 1. Verifica .env.local existe en raíz
# 2. Reinicia el servidor: Ctrl+C y npm run dev
# 3. Verifica que .env.local tenga las 3 líneas correctas
```

### ❌ Error: "You do not have permission to perform this action"
```bash
# Solución:
# Esto es normal si usas las claves en el navegador
# Las claves anon solo permiten ciertas operaciones
# Usa supabaseAdmin.js en servidor
```

### ❌ Port 3000 already in use
```bash
# Solución:
# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>

# O simplemente usa otro puerto:
npm run dev -- -p 3001
```

### ❌ "git command not found"
```bash
# Solución: Instala Git desde https://git-scm.com
```

---

## 📦 Scripts Disponibles en package.json

```json
{
  "dev": "next dev",           // Inicia servidor desarrollo
  "build": "next build",       // Build de producción
  "start": "next start",       // Inicia servidor producción
  "lint": "next lint"          // Corre linter
}
```

### Uso:
```bash
npm run dev      # Desarrollo (con hot reload)
npm run build    # Compilar para producción
npm run start    # Servir producción
npm run lint     # Revisar código
```

---

## 🌐 Acceso a Supabase Dashboard

Para ver datos en tiempo real, accede a:

**URL**: https://supabase.com/dashboard

**Login**:
1. Abre el enlace
2. Login con tu cuenta personal
3. Proyecto: `<proyecto>`
4. Ir a: `SQL Editor` para ejecutar queries crudas

### Consultas Útiles
```sql
-- Ver todos los usuarios
SELECT id, user_name, rol_name, email, created_at FROM users;

-- Ver órdenes del día
SELECT * FROM orders WHERE DATE(date_order) = TODAY();

-- Ver solo órdenes del estado SOLICITADO
SELECT * FROM orders WHERE status = 'SOLICITADO' ORDER BY date_order DESC;

-- Contar órdenes por área
SELECT area, COUNT(*) as total FROM orders GROUP BY area;
```

---

## 🚀 Próximos Pasos

Después del setup:

1. **Lee la documentación**
   - [01-ARQUITECTURA.md](01-ARQUITECTURA.md) - Visión general
   - [03-GUIA-USUARIO.md](03-GUIA-USUARIO.md) - Funcionalidades

2. **Explora el código**
   ```bash
   code src/pages/Request.js      # Miira una página
   code src/components/Layout.jsx # Mira un componente
   code src/context/AuthContext.js # Entiende autenticación
   ```

3. **Intenta modificar algo**
   - En `src/styles/global.css` cambia un color
   - Guarda y verifica el hot reload
   - Revert el cambio

4. **Crea una rama**
   ```bash
   git checkout -b feature/tu-nombre
   ```

---

## 📚 Referencias Útiles

| Tema | Link |
|------|------|
| Next.js Docs | https://nextjs.org/docs |
| React Hooks | https://react.dev/reference/react/hooks |
| Supabase Guide | https://supabase.com/docs/guides/getting-started |
| CSS Modules | https://nextjs.org/docs/basic-features/module-css |
| Chart.js | https://www.chartjs.org/docs/latest/ |

---

## ✅ Checklist Final

- [ ] Node.js v18+ instalado
- [ ] npm 10+ instalado
- [ ] Repositorio clonado
- [ ] `npm install` completado
- [ ] `.env.local` creado con 3 variables
- [ ] `node explore-db.js` funciona
- [ ] `npm run dev` inicia sin errores
- [ ] Puedes login en http://localhost:3000
- [ ] ¡Ready para desarrollar! 🎉

---

**¿Problemas?** → Contacta al Tech Lead o revisa [10-TROUBLESHOOTING.md](10-TROUBLESHOOTING.md)

**Siguiente:** [03-GUIA-USUARIO.md](03-GUIA-USUARIO.md) para entender cómo usar la app
