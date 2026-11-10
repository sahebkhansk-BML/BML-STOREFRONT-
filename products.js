import { sql } from './lib/db.js';
import { methodNotAllowed, safeError } from './lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const products = await sql`
      SELECT id, name, description, price_paise, image_url, category, stock
      FROM products WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 100
    `;
    return res.status(200).json({ products });
  } catch (error) {
    return safeError(res, error);
  }
}
