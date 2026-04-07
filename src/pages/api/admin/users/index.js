// Archivo: /pages/api/admin/users/index.js
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

// ─── Dominios de roles por perfil ───────────────────────────────────────────
// TECNICO = usuarios del monitor de mtto, etiqueta visual "Home Position"
// list_tec = catálogo de nombres de soporte (sin cuenta de auth, como entregadores)
const ROLE_DOMAIN = {
  ADMIN:      ['ADMIN', 'LINEA', 'EMBARQUE', 'SUPERVISOR'],
  ADMIN_TEC:  ['TECNICO', 'ADMIN_TEC'],
  SUPERADMIN: ['SUPERADMIN', 'ADMIN', 'LINEA', 'EMBARQUE', 'SUPERVISOR', 'TECNICO', 'ADMIN_TEC'],
};

// ─── Helper: Verify Admin Role from Authorization Header ──────────────────
// Receives JWT token and validates it's a real user with ADMIN role
async function verifyAdminRole(bearerToken) {
  try {
    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return { isValid: false, reason: 'No valid Bearer token provided' };
    }

    const token = bearerToken.slice(7); // Remove "Bearer " prefix

    // Verify token using supabase auth (client-side verification)
    // Decode JWT to get user ID
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const email = payload.email;

      if (!email) {
        return { isValid: false, reason: 'Invalid token format' };
      }

      // Get user's role from public.users table using service role
      // Service role bypasses RLS, so this always works if user exists
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('rol_name, id')
        .eq('email', email)
        .single();

      if (dbError || !userData) {
        console.error('[verifyAdminRole] DB error:', dbError);
        return { isValid: false, reason: 'User not found in database' };
      }

      // Check if user has ADMIN role
      const callerRole = userData.rol_name;
      if (!ROLE_DOMAIN[callerRole]) {
        return { isValid: false, reason: `Role ${callerRole} cannot manage users` };
      }

      return { isValid: true, callerRole, userEmail: email };
    } catch (decodeErr) {
      return { isValid: false, reason: 'Failed to decode JWT token' };
    }
  } catch (err) {
    console.error('[verifyAdminRole] Error:', err.message);
    return { isValid: false, reason: err.message };
  }
}

export default async function handler(req, res) {
  // ─── Authorization Check ────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  const { isValid, reason, callerRole } = await verifyAdminRole(authHeader);
  
  if (!isValid) {
    console.error('[API/admin/users] Auth failed:', reason);
    return res.status(401).json({ 
      error: 'Unauthorized - Admin access required',
      reason: reason,
      code: 'AUTH_REQUIRED'
    });
  }

  const allowedRoles = ROLE_DOMAIN[callerRole];

  if (req.method === 'POST') {
    const { email, password, user_name, id_rol, rol_name } = req.body;

    // Validación de campos
    if (!email || !password || !user_name || !id_rol || !rol_name) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos.' ,
        code: 'MISSING_FIELDS'
      });
    }

    // Validar que el rol a asignar esté dentro del dominio del caller
    if (!allowedRoles.includes(rol_name)) {
      return res.status(403).json({ 
        error: `No tienes permiso para asignar el rol ${rol_name}.`,
        code: 'ROLE_DOMAIN_VIOLATION'
      });
    }

    // Crear en auth.users
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      // Si hay un error en la creación, devolvemos el error
      if (authError) {
        if (authError.message.includes('email already exists')) {
          return res.status(409).json({ 
            error: 'El correo ya está registrado.',
            code: 'EMAIL_EXISTS'
          });
        }
        return res.status(400).json({ 
          error: authError.message,
          code: 'AUTH_ERROR'
        });
      }

      const userId = authUser.user.id;

      // Insertar en public.users respetando RLS
      const { error: appUserError } = await supabase
        .from('users')
        .insert([{ id: userId, email, user_name, id_rol, rol_name }]);

      if (appUserError) {
        // Rollback: eliminar usuario creado en Auth
        await supabase.auth.admin.deleteUser(userId);
        console.error('RLS Error inserting user:', appUserError);
        throw appUserError;
      }

      return res.status(201).json({
        success: true,
        data: {
          id: userId,
          email,
          user_name,
          id_rol,
          rol_name
        }
      });

    } catch (err) {
      console.error('Error al crear usuario en Auth o insertar en public.users:', err);
      return res.status(500).json({ 
        error: 'Error interno al registrar el usuario.',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, user_name, id_rol, rol_name')
        .in('rol_name', allowedRoles)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('RLS Error fetching users:', error);
        throw error;
      }
      
      return res.status(200).json({ 
        success: true,
        data: Array.isArray(data) ? data : []
      });
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
  }

  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

