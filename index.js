import { z } from 'zod';
import { sql } from '../lib/db.js';
import { requireUser } from '../lib/auth.js';
import { methodNotAllowed, requireSameOrigin, safeError } from '../lib/http.js';

const schema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20)
  })).min(1).max(30)
});

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const orders = await sql`
        SELECT o.id, o.total_paise, o.status, o.created_at,
          COALESCE(json_agg(json_build_object(
            'product_id', oi.product_id, 'product_name', oi.product_name,
            'quantity', oi.quantity, 'unit_price_paise', oi.unit_price_paise
          )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ${user.id}
        GROUP BY o.id ORDER BY o.created_at DESC LIMIT 50
      `;
      return res.status(200).json({ orders });
    } catch (error) { return safeError(res, error); }
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!requireSameOrigin(req, res)) return;
  try {
    const input = schema.parse(req.body);
    const ids = input.items.map(x => x.product_id);
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Do not repeat a product in the cart' });

    // One SQL statement creates the order, snapshots item prices, and reduces stock atomically.
    const rows = await sql`
      WITH requested AS (
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(input.items)}::jsonb)
        AS x(product_id uuid, quantity integer)
      ),
      selected AS (
        SELECT p.id, p.name, p.price_paise, r.quantity
        FROM products p JOIN requested r ON r.product_id = p.id
        WHERE p.is_active = TRUE AND p.stock >= r.quantity
      ),
      new_order AS (
        INSERT INTO orders (user_id, total_paise, status)
        SELECT ${user.id},
          COALESCE(SUM(s.price_paise * s.quantity), 0),
          'pending'
        FROM selected s
        HAVING COUNT(*) = (SELECT COUNT(*) FROM requested)
        RETURNING id
      ),
      new_items AS (
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_paise)
        SELECT no.id, s.id, s.name, s.quantity, s.price_paise
        FROM new_order no CROSS JOIN selected s
        RETURNING id
      ),
      stock_update AS (
        UPDATE products p SET stock = p.stock - r.quantity
        FROM requested r, new_order no
        WHERE p.id = r.product_id
        RETURNING p.id
      )
      SELECT no.id AS order_id FROM new_order no
    `;
    if (!rows.length) return res.status(409).json({ error: 'One or more products are unavailable or out of stock' });
    return res.status(201).json({ order_id: rows[0].order_id, status: 'pending' });
  } catch (error) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'Invalid cart items' });
    return safeError(res, error);
  }
}
