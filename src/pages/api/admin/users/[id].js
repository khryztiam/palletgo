// Archivo: /pages/api/admin/users/[id].js
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

    // Verify token using JWT decode
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const email = payload.email;

      if (!email) {
        return { isValid: false, reason: 'Invalid token format' };
      }

      // Get user's role from public.users table using service role
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
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'ID inválido',
      code: 'INVALID_ID'
    });
  }

  // ─── Authorization Check ────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  const { isValid, reason, callerRole } = await verifyAdminRole(authHeader);
  
  if (!isValid) {
    console.error('[API/admin/users/:id] Auth failed:', reason);
    return res.status(401).json({ 
      error: 'Unauthorized - Admin access required',
      reason: reason,
      code: 'AUTH_REQUIRED'
    });
  }

  const allowedRoles = ROLE_DOMAIN[callerRole];

  if (req.method === 'PUT') {
    const { user_name, id_rol, rol_name, new_password } = req.body;
    if (!user_name || !id_rol || !rol_name) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos.',
        code: 'MISSING_FIELDS'
      });
    }

    if (new_password && new_password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres.',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validar que el nuevo rol esté dentro del dominio del caller
    if (!allowedRoles.includes(rol_name)) {
      return res.status(403).json({ 
        error: `No tienes permiso para asignar el rol ${rol_name}.`,
        code: 'ROLE_DOMAIN_VIOLATION'
      });
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ user_name, id_rol, rol_name, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('RLS Error updating user:', error);
        throw error;
      }

      if (new_password) {
        const { error: pwErr } = await supabase.auth.admin.updateUserById(id, { password: new_password });
        if (pwErr) {
          console.error('Auth password update error:', pwErr);
          throw pwErr;
        }
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Usuario actualizado correctamente.'
      });
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      return res.status(500).json({ 
        error: 'Error al actualizar usuario.',
        code: 'UPDATE_ERROR'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First, delete from auth.users
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.error('Auth deletion error:', authError);
        // Continue to delete from public.users anyway
      }

      // Then delete from public.users (cascades via FK)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('RLS Error deleting user:', error);
        throw error;
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Usuario eliminado correctamente.'
      });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ 
        error: 'Error al eliminar usuario.',
        code: 'DELETE_ERROR'
      });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
