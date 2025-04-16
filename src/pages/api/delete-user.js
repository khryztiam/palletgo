// pages/api/delete-user.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // esta debe estar en Vercel
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el ID del usuario' });
  }

  try {
    // Eliminar en la tabla `users`
    const { error: errorDeleteUsers } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (errorDeleteUsers) throw errorDeleteUsers;

    // Eliminar del sistema de autenticación
    const { error: errorAuth } = await supabase.auth.admin.deleteUser(userId);

    if (errorAuth) throw errorAuth;

    return res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('[ERROR] Delete User:', err.message);
    return res.status(500).json({ message: 'Error al eliminar el usuario', error: err.message });
  }
}
