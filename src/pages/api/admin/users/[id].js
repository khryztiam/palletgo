// Archivo: /pages/api/admin/users/[id].js
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'PUT') {
    const { user_name, id_rol, rol_name } = req.body;
    if (!user_name || !id_rol || !rol_name) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ user_name, id_rol, rol_name })
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Usuario actualizado correctamente.' });
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      return res.status(500).json({ error: 'Error al actualizar usuario.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Usuario eliminado correctamente.' });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ error: 'Error al eliminar usuario.' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
