# 👥 Autenticación y Control de Acceso

> **Documentación de Seguridad**
> 
> Audiencia: Desarrolladores, Tech Leads
> Tiempo de lectura: 20 minutos

---

## 📋 Tabla de Contenidos

1. [Sistema de Autenticación](#sistema-de-autenticación)
2. [Flujo de Login](#flujo-de-login)
3. [Roles y Permisos](#roles-y-permisos)
4. [AuthContext](#authcontext)
5. [Seguridad](#seguridad)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Sistema de Autenticación

PalletGo usa **Supabase Auth** basado en **JWT** y **session-based authentication**.

### Componentes Involucrados

```
┌─────────────────────────────────────────┐
│ Navegador del Usuario                   │
│                                         │
│ ┌──────────────────────────────┐       │
│ │ AuthContext (Global State)   │       │
│ │  - user (id, email)          │       │
│ │  - role (ADMIN, LINEA, etc)  │       │
│ │  - loading (boolean)         │       │
│ └──────────────────────────────┘       │
│           ↓                             │
│ ┌──────────────────────────────┐       │
│ │ Supabase JS Client           │       │
│ │  .auth.signInWithPassword()  │       │
│ │  .auth.signOut()             │       │
│ │  .auth.getSession()          │       │
│ └──────────────────────────────┘       │
│           ↓ HTTPS                      │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Supabase Auth Service                   │
│  (JWT management)                       │
│  (Session refresh)                      │
│  (Password bcrypt)                      │
└─────────────────────────────────────────┘
      ↓
┌──────────────────────────┐
│ PostgreSQL Databases     │
│                          │
│ - auth.users (Supabase)  │
│ - public.users (App)     │
└──────────────────────────┘
```

---

## 🚀 Flujo de Login

### Paso a Paso

```json
// 1. Usuario ingresa credenciales
{
  "email": "embarque_els@yazaki.com",
  "password": "password123"
}

↓ Click en "Ingresar"

// 2. AuthContext.login() llamado
supabase.auth.signInWithPassword(email, password)

↓ HTTP POST a auth service

// 3. Supabase valida
if (email en auth.users) {
  if (bcrypt.verify(password, password_hash)) {
    ✅ Crea session + JWT token
  } else {
    ❌ "Contraseña incorrecta"
  }
} else {
  ❌ "Usuario no encontrado"
}

↓ WebSocket notifica

// 4. App recibe session
onAuthStateChange(async (event, session) => {
  if (session) {
    // 4a. Obtener rol de tabla users
    const user = await supabase
      .from('users')
      .select('role, user_name')
      .eq('id', session.user.id)
      .single();
    
    // 4b. Guardar en AuthContext
    setUser({
      id: session.user.id,
      email: session.user.email,
      role: user.data.rol_name,
      userName: user.data.user_name
    });
    
    // 4c. localStorage guarda session automáticamente
    // (Supabase maneja esto)
  }
})

↓

// 5. AdminGate redirige
if (ROLE_ROUTES[role].includes(currentPath)) {
  ✅ Permite acceso
} else {
  ❌ Redirige a ruta permitida (primera del rol)
}

↓

// 6. App lista para usar
User puede acceder a funcionalidades según rol
```

### Diagrama Temporal

```
Usuario              App                 Supabase
   │                 │                      │
   ├─ Abre login ───>│                      │
   │                 │                      │
   ├─ Email + pwd ──>│                      │
   │                 │                      │
   │                 ├─ signInWithPassword >│
   │                 │                      │
   │                 │<─ Valida auth ──────│
   │                 │                      │
   │                 │<─ JWT token ────────│
   │                 │                      │
   │                 ├─ fetch users (rol)──>│
   │                 │                      │
   │                 │<─ rol_name ─────────│
   │                 │                      │
   │                 ├─ setAuthContext ─┐  │
   │                 │                  │  │
   │                 │<─ navigate() ─────┘  │
   │                 │                      │
   │<─ Redirige a │   │                      │
   │  dashboard ├────>│                      │
   │                 │                      │
   │                 │ (App lista)          │
   │                 │                      │
```

---

## 👤 Roles y Permisos

### Matriz de Acceso

| Rol | Request | Dispatch | Boarding | Dashboard | Control | Management |
|-----|---------|----------|----------|-----------|---------|------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LINEA | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EMBARQUE | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| SUPERVISOR | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### Definición Técnica (AdminGate.js)

```javascript
const ROLE_ROUTES = {
  ADMIN: [
    '/admin/Dashboard',
    '/admin/Control',
    '/admin/Management',
    '/Request',
    '/Dispatch',
    '/Boarding'
  ],
  LINEA: ['/Request'],
  EMBARQUE: ['/Dispatch', '/Boarding'],
  SUPERVISOR: ['/admin/Dashboard', '/admin/Control']
};
```

### Permisos a Nivel de Datos

```
ORDERS table:
  - LINEA: Puede INSERT propias órdenes (user_submit = id)
  - EMBARQUE: Puede UPDATE status (asignarse órdenes)
  - SUPERVISOR: Puede SELECT + UPDATE todas
  - ADMIN: Acceso total
  
USERS table (Management):
  - ADMIN: Acceso total (INSERT, UPDATE, DELETE)
  - Otros: READ-ONLY (sin permisos)
```

---

## 🧠 AuthContext - Implementación

### Ubicación
```
src/context/AuthContext.js
```

### Hook useAuth()

```javascript
const { user, role, userName, loading, login, logout } = useAuth();

// Propiedades:
user.id        // UUID: "12eddbb1-cd64-4e15-9926-ee8439ac33cc"
user.email     // string: "embarque_els@yazaki.com"
role           // string: "EMBARQUE" | "ADMIN" | "LINEA" | "SUPERVISOR"
userName       // string: "Embarque"
loading        // boolean: true si está autenticando
login(email, pwd) // async fn - throws error si falla
logout()       // async fn - limpia sesión
```

### Ejemplo de Uso

```javascript
// En un componente
function MyComponent() {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <p>Bienvenido {user.email}</p>
      <p>Tu rol: {role}</p>
      
      {role === 'ADMIN' && <ManagementPanel />}
      {role === 'EMBARQUE' && <DispatchPanel />}
    </div>
  );
}
```

### Ciclo de Vida

```javascript
// App.js o _app.js
useEffect(() => {
  // 1. Setup listener de auth
  const listener = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session) {
        // 2. Usuario logueado - obtener rol
        const user = await supabase
          .from('users')
          .select('rol_name, user_name')
          .eq('id', session.user.id)
          .single();
        
        // 3. Guardar en state
        setUser({...});
        setRole(user.data.rol_name);
      } else {
        // 4. Usuario deslogueado - limpiar
        setUser(null);
        setRole(null);
      }
    }
  );
  
  // 5. Cleanup en unmount
  return () => listener.subscription?.unsubscribe();
}, []);
```

---

## 🛡️ Seguridad

### ✅ Lo que ya está seguro

```
✅ Passwords: Hash bcrypt (Supabase administra)
✅ Tokens: JWT con expiración (15-30 min)
✅ HTTPS: Comunicación cifrada
✅ Session: localStorage solo en cliente
✅ AuthContext: Valida rol en cada navegación
✅ AdminGate: Protege rutas conocidas
✅ RLS habilitado en public.users, orders, list_users
✅ APIs validadas con JWT en backend (Bearer token)
✅ Endpoints usan supabaseAdmin (service role) — nunca anon key en servidor
```

### ⚠️ Pendientes Menores

```
⚠️ Sin CSRF tokens en formularios
   → Mitigado parcialmente por SameSite cookies de Supabase
   → Baja prioridad dado el entorno de red interna

⚠️ Service role key en .env.local
   → NUNCA commitear .env.local
   → En producción, usar variables de entorno de Vercel
```

### 🔑 Nota importante: IDs de usuarios

`auth.users.id` y `public.users.id` **pueden no coincidir** en usuarios creados
manualmente antes de sincronizar las tablas. Por ello, todos los endpoints de
backend usan `payload.email` (del JWT) como campo de lookup en `public.users`:

```javascript
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
const email = payload.email;

const { data: userData } = await supabaseAdmin
  .from('users')
  .select('rol_name')
  .eq('email', email)   // ← email, NO id
  .single();
```

---

## 🔓 Logout y Sesión

### Logout
```javascript
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // AuthContext listener se dispara con session = null
    // localStorage se limpia automáticamente
    // Redirige a login
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

### Session Persistence

```javascript
// Supabase automáticamente:
// 1. Guarda JWT en localStorage
// 2. Restaura sesión al recargar página
// 3. Refresca token antes de expirar

// Ya configurado en src/lib/supabase.js
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,    // ✅ Auto-refresh
    persistSession: true,       // ✅ localStorage
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    }
  }
});
```

---

## 🐛 Troubleshooting

### ❌ "Login fallido aunque credenciales son correctas"

**Causas posibles:**
1. Usuario no existe en auth.users
2. Contraseña incorrecta (case-sensitive)
3. Supabase service caído

**Solución:**
```bash
# 1. Verificar en Supabase Dashboard
# Authentication → Users
# Ver si email existe

# 2. Si no existe, crear usuario desde Management
# (O desde SQL direktamente:)
# SELECT * FROM auth.users WHERE email = 'test@yazaki.com';

# 3. Resetear contraseña:
# Supabase Dashboard → Users → Reset Password (send link)
```

### ❌ "No se guarda sesión tras reload"

**Causa:** localStorage deshabilitado o en incógnito

**Solución:**
```javascript
// En supabase.js mejorar storage fallback
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return sessionStorage.getItem(key); // fallback
    }
  },
  // ... etc
};
```

### ❌ "Usuario ve menú de otro rol"

**Causa:** AuthContext no actualizó role

**Solución:**
```javascript
// Força refresh de AuthContext
const { mutate } = useAuth();
useEffect(() => {
  mutate(); // valida rol nuevamente
}, []);

// O simplemente reload:
location.reload();
```

### ❌ "Token expirado, pero sigue logueado"

**Causa:** autoRefreshToken = false

**Solución:**
```javascript
// Verificar en src/lib/supabase.js
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true, // DEBE SER TRUE
    persistSession: true
  }
});
```

---

## 🔄 Casos de Uso Comunes

### Caso 1: Crear nuevo usuario desde Management
```javascript
// POST /api/admin/users
const body = {
  email: "nuevo@yazaki.com",
  password: "min6chars",
  userName: "Nuevo",
  rolName: "LINEA"
};

// Backend:
// 1. supabaseAdmin.auth.admin.createUser()
// 2. INSERT INTO users (id, email, rol_name, user_name)
// 3. Si uno falla, rollback del otro
```

### Caso 2: Cambiar rol de usuario
```javascript
// PUT /api/admin/users/[id]
const body = { rolName: "SUPERVISOR" };

// Backend:
// UPDATE users SET rol_name = ? WHERE id = ?
// Usuario verá cambio en próxima interacción
// (o si se logout/login)
```

### Caso 3: Proteger componente por rol
```javascript
function ProtectedComponent() {
  const { role } = useAuth();
  
  if (role !== 'ADMIN') {
    return <div>No tienes permisos</div>;
  }
  
  return <ManagementPanel />;
}

// Mejor: Usar RoleGate
<RoleGate role="ADMIN">
  <ManagementPanel />
</RoleGate>
```

---

## 📚 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [JWT Tokens](https://jwt.io/)
- [OWASP Auth Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Siguiente:** [05-BASE-DE-DATOS.md](05-BASE-DE-DATOS.md) para entender el esquema
