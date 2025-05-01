// Archivo: /pages/api/admin/users/index.js
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, user_name, id_rol, rol_name } = req.body;

    // Validación de campos
    if (!email || !password || !user_name || !id_rol || !rol_name) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
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
          return res.status(409).json({ error: 'El correo ya está registrado.' });
        }
        return res.status(400).json({ error: authError.message });
      }

      const userId = authUser.user.id;

      // Insertar en public.users
      const { error: appUserError } = await supabase
        .from('users')
        .insert([{ id: userId, email, user_name, id_rol, rol_name }]);

      if (appUserError) {
        // Rollback: eliminar usuario creado en Auth
        await supabase.auth.admin.deleteUser(userId);
        throw appUserError;
      }

      return res.status(201).json({
        id: userId,
        email,
        user_name,
        id_rol,
        rol_name
      });

    } catch (err) {
      console.error('Error al crear usuario en Auth o insertar en public.users:', err);
      return res.status(500).json({ error: 'Error interno al registrar el usuario.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, user_name, id_rol, rol_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
  }

  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
