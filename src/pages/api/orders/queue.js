/**
 * Public Orders Queue Endpoint
 * 
 * Purpose: Return active orders to build the queue display in Request.js
 * Uses Supabase service role (server-side) to bypass RLS
 * 
 * This is necessary because:
 * - RLS restricts LINEA role to see only own orders
 * - But UI needs to show queue position (requires seeing all orders)
 * - Solution: Server endpoint with service role access
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  // Only GET requests allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Calculate start of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      .toISOString();

    /**
     * Query: Get all active orders from today
     * Uses service role admin client - bypasses RLS
     * Only returns non-delivered/non-cancelled orders
     */
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .not('status', 'in', '("ENTREGADO","CANCELADO")')
      .gte('date_order', startOfDay)
      .order('date_order', { ascending: true });

    if (error) {
      console.error('Error fetching queue orders:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch orders queue',
        details: error.message 
      });
    }

    // Return orders
    return res.status(200).json({
      success: true,
      data: data || [],
      count: (data || []).length,
    });

  } catch (err) {
    console.error('Queue endpoint error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
}
