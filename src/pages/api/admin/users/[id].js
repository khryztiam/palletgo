// Archivo: /pages/api/admin/users/[id].js
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

// ─── Helper: Verify Admin Role from Authorization Header ──────────────────────
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
      if (userData.rol_name !== 'ADMIN') {
        return { isValid: false, reason: `User role is ${userData.rol_name}, not ADMIN` };
      }

      return { isValid: true, reason: 'Admin verified', userEmail: email };
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
  const { isValid, reason } = await verifyAdminRole(authHeader);
  
  if (!isValid) {
    console.error('[API/admin/users/:id] Auth failed:', reason);
    return res.status(401).json({ 
      error: 'Unauthorized - Admin access required',
      reason: reason,
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.method === 'PUT') {
    const { user_name, id_rol, rol_name } = req.body;
    if (!user_name || !id_rol || !rol_name) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos.',
        code: 'MISSING_FIELDS'
      });
    }

    // Validar que el rol sea permitido
    const validRoles = ['ADMIN', 'LINEA', 'EMBARQUE', 'SUPERVISOR'];
    if (!validRoles.includes(rol_name)) {
      return res.status(400).json({ 
        error: `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE'
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
