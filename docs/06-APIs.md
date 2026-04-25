# 📡 APIs REST - Endpoints Documentados

> **Documentación de API**
> 
> Audiencia: Desarrolladores Frontend/Backend
> Tiempo: 15 minutos

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints CRUD](#endpoints-crud)
4. [Ejemplos](#ejemplos)
5. [Errores](#errores-comunes)

---

## 🌐 Overview

```
Base URL:        http://localhost:3000 (dev)
                 https://palletgo.vercel.app (prod)

Tipo:            REST API
Autenticación:   JWT Bearer Token
Content-Type:    application/json
```

### Endpoints

```
# Administración de usuarios (requiere rol ADMIN)
GET    /api/admin/users        - Listar usuarios
POST   /api/admin/users        - Crear usuario
PUT    /api/admin/users/[id]   - Editar usuario
DELETE /api/admin/users/[id]   - Eliminar usuario

# Órdenes (servicio interno)
GET    /api/orders/queue       - Cola activa del día (rol LINEA, service role)
PATCH  /api/orders/updateStatus - Actualizar estado de orden (rol EMBARQUE/ADMIN)
```

---

## 🔐 Authentication

### Bearer Token

Incluye en headers:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

El token se obtiene automáticamente del supabase.auth.getSession()

### Validación de Rol en Backend

Todos los endpoints protegidos decodifican el JWT manualmente y verifican
el rol en `public.users` usando el service role (bypasea RLS):

```javascript
// Patrón usado en todos los endpoints protegidos:
const token = bearerToken.slice(7);
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
const email = payload.email; // email es el campo de lookup en public.users

const { data: userData } = await supabaseAdmin
  .from('users')
  .select('rol_name')
  .eq('email', email)
  .single();

// NOTA: public.users.id !== auth.users.id en algunos usuarios.
// Se usa email como campo de lookup para garantizar compatibilidad.

if (!session) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## 📝 Endpoints CRUD

### 1. GET /api/admin/users - Listar Usuarios

**Request**
```http
GET /api/admin/users HTTP/1.1
host: localhost:3000
authorization: Bearer <token>
```

**Response (200 OK)**
```json
[
  {
    "id": "12eddbb1-cd64-4e15-9926-ee8439ac33cc",
    "user_name": "Embarque",
    "email": "embarque_els@yazaki.com",
    "rol_name": "EMBARQUE",
    "created_at": "2025-04-08T01:31:20.052376+00:00"
  },
  {
    "id": "abc123...",
    "user_name": "Linea",
    "email": "linea@yazaki.com",
    "rol_name": "LINEA",
    "created_at": "2025-04-08T01:31:20+00:00"
  }
]
```

**Errores**
```json
// 401 - No autorizado
{ "error": "Unauthorized" }

// 500 - Error servidor
{ "error": "Failed to fetch users" }
```

---

### 2. POST /api/admin/users - Crear Usuario

**Request**
```http
POST /api/admin/users HTTP/1.1
host: localhost:3000
content-type: application/json
authorization: Bearer <token>

{
  "email": "nuevo@yazaki.com",
  "password": "minimo6caracteres",
  "userName": "Nuevo User",
  "rolName": "LINEA"
}
```

**Request Body Validations**
```
- email: formato email válido + dominio @yazaki.com
- password: mínimo 6 caracteres
- userName: string no vacío
- rolName: uno de [ADMIN, LINEA, EMBARQUE, SUPERVISOR]
```

**Response (201 Created)**
```json
{
  "message": "User created successfully",
  "userId": "abc123..."
}
```

**Errores**
```json
// 400 - Email ya existe
{ "error": "Email already exists" }

// 400 - Email no es @yazaki.com
{ "error": "Email must be from @yazaki.com domain" }

// 400 - Password muy corta
{ "error": "Password must be at least 6 characters" }

// 500 - Error en auth.users OR public.users
{ "error": "User creation failed: [details]" }
```

**Implementación (Backend)**
```javascript
// pages/api/admin/users/index.js - POST
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, password, userName, rolName } = req.body;
  
  // 1. Validations
  if (!email.endsWith('@yazaki.com')) {
    return res.status(400).json({ error: 'Email must be @yazaki.com' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short' });
  }
  
  // 2. Insert in auth.users
  const authUser = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authUser.error) {
    return res.status(400).json({ error: authUser.error.message });
  }
  
  // 3. Insert in public.users
  const appUser = await supabaseAdmin
    .from('users')
    .insert([{
      id: authUser.data.user.id,
      email,
      user_name: userName,
      rol_name: rolName
    }]);
  
  if (appUser.error) {
    // Rollback: DELETE from auth.users
    await supabaseAdmin.auth.admin.deleteUser(authUser.data.user.id);
    return res.status(500).json({ error: 'Insert failed, rolled back' });
  }
  
  return res.status(201).json({ 
    message: 'User created successfully',
    userId: authUser.data.user.id 
  });
}
```

---

### 3. PUT /api/admin/users/[id] - Editar Usuario

**Request**
```http
PUT /api/admin/users/12eddbb1-cd64-4e15-9926-ee8439ac33cc HTTP/1.1
host: localhost:3000
content-type: application/json
authorization: Bearer <token>

{
  "userName": "Nuevo Nombre",
  "rolName": "SUPERVISOR"
}
```

**Response (200 OK)**
```json
{
  "message": "User updated successfully"
}
```

**Errores**
```json
// 404 - Usuario no existe
{ "error": "User not found" }

// 500 - Error al actualizar
{ "error": "Update failed" }
```

---

### 4. DELETE /api/admin/users/[id] - Eliminar Usuario

**Request**
```http
DELETE /api/admin/users/12eddbb1-cd64-4e15-9926-ee8439ac33cc HTTP/1.1
host: localhost:3000
authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "message": "User deleted successfully"
}
```

**Errores**
```json
// 404 - Usuario no existe
{ "error": "User not found" }

// 500 - Error compl...
{ "error": "Delete failed" }
```

**⚠️ Implementación incompleta:**
```javascript
// ACTUAL (incompleto):
await supabaseAdmin
  .from('users')
  .delete()
  .eq('id', userId);

// DEBERÍA SER:
// 1. DELETE from public.users
// 2. DELETE from auth.users (importante!)
const authDelete = await supabaseAdmin
  .auth.admin.deleteUser(userId);

if (authDelete.error) {
  return res.status(500).json({ error: authDelete.error.message });
}
```

---

## 🔨 Ejemplos de Uso

### Desde Frontend (React)

```javascript
// GET - Listar usuarios
async function fetchUsers() {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  const users = await response.json();
  return users;
}

// POST - Crear usuario
async function createUser(userData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error);
  }
  return result;
}

// PUT - Editar usuario
async function updateUser(userId, updates) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
}

// DELETE - Eliminar usuario
async function deleteUser(userId) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  return await response.json();
}
```

### Desde Command Line

```bash
# GET
curl -H "Authorization: Bearer TOKEN" \\
  http://localhost:3000/api/admin/users

# POST
curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{\"email\":\"nuevo@yazaki.com\",\"password\":\"pwd\",\"userName\":\"Test\",\"rolName\":\"LINEA\"}' \\
  http://localhost:3000/api/admin/users

# PUT
curl -X PUT \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{\"rolName\":\"SUPERVISOR\"}' \\
  http://localhost:3000/api/admin/users/abc123

# DELETE
curl -X DELETE \\
  -H "Authorization: Bearer TOKEN" \\
  http://localhost:3000/api/admin/users/abc123
```

---

## ⚠️ Errores Comunes

### 401 Unauthorized
```
Causa: Token faltante o inválido
Solución: Verificar Authorization header con token válido
```

### 400 Bad Request
```
Causa: Datos inválidos en request body
Solución: Revisar validaciones del endpoint
```

### 405 Method Not Allowed
```
Causa: Usando HTTP method incorrecto (ej: GET en POST endpoint)
Solución: Usar método correcto según documentación
```

### 500 Internal Server Error
```
Causa: Error en servidor
Solución: Revisar logs de Supabase + error.log en servidor
```

---

## 🔮 Endpoints Futuros (Pendientes)

```
GET    /api/orders                  - Listar órdenes
POST   /api/orders                  - Crear orden
PUT    /api/orders/[id]             - Actualizar orden
DELETE /api/orders/[id]             - Eliminar orden

GET    /api/orders/[id]/stats       - Estadísticas por orden
GET    /api/reports/daily           - Reporte diario
GET    /api/reports/export          - Exportar CSV
```

---

## 📚 Referencia Rápida

| Método | Endpoint | Auth | Body | Uso |
|--------|----------|------|------|-----|
| GET | /api/admin/users | ✅ | - | Listar |
| POST | /api/admin/users | ✅ | user data | Crear |
| PUT | /api/admin/users/[id] | ✅ | updates | Editar |
| DELETE | /api/admin/users/[id] | ✅ | - | Eliminar |

---

**Siguiente:** [07-COMPONENTES.md](07-COMPONENTES.md) para arquitectura frontend
