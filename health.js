import { sql } from './lib/db.js';
import { methodNotAllowed, safeError } from './lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const rows = await sql`SELECT NOW() AS database_time`;
    return res.status(200).json({ ok: true, service: 'BML API', database: 'connected', time: rows[0].database_time });
  } catch (error) {
    return safeError(res, error);
  }
}
