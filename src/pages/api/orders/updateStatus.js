import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * PATCH /api/orders/updateStatus
 * Body: { id_order, updates: { status, user_deliver, date_delivery? } }
 * Usa service role para bypassear RLS — acceso restringido a EMBARQUE y ADMIN.
 */
export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar autenticación
  const bearerToken = req.headers.authorization;
  if (!bearerToken?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const token = bearerToken.slice(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const email = payload.email;

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('rol_name')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!['ADMIN', 'EMBARQUE'].includes(userData.rol_name)) {
      return res.status(403).json({ error: 'Sin permisos para actualizar órdenes' });
    }
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { id_order, updates } = req.body;

  if (!id_order || !updates) {
    return res.status(400).json({ error: 'Faltan campos requeridos: id_order, updates' });
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updates)
    .eq('id_order', id_order);

  if (error) {
    console.error('[API/orders/updateStatus] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
