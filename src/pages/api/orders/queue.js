/**
 * Public Orders Queue Endpoint
 * 
 * Purpose: Return active orders to build the queue display in Request.js
 * Uses Supabase service role when available, with anon-key fallback for local dev
 * 
 * This is necessary because:
 * - RLS restricts LINEA role to see only own orders
 * - But UI needs to show queue position (requires seeing all orders)
 * - Solution: Server endpoint centralizes the queue query
 */

import { createClient } from '@supabase/supabase-js';

const getQueueClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

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
     * Uses service role when configured; otherwise relies on current SELECT RLS.
     * Only returns non-delivered/non-cancelled orders
     */
    const supabase = getQueueClient();

    const { data, error } = await supabase
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
