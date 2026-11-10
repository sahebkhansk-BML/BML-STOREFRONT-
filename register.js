import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sql } from '../lib/db.js';
import { createToken } from '../lib/auth.js';
import { methodNotAllowed, requireSameOrigin, safeError, setAuthCookie } from '../lib/http.js';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(10).max(72)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireSameOrigin(req, res)) return;
  try {
    const input = schema.parse(req.body);
    const hash = await bcrypt.hash(input.password, 12);
    const rows = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${input.name}, ${input.email}, ${hash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role
    `;
    if (!rows.length) return res.status(409).json({ error: 'An account with this email already exists' });
    const user = rows[0];
    setAuthCookie(res, await createToken(user));
    return res.status(201).json({ user });
  } catch (error) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'Please check the name, email and password. Password must be at least 10 characters.' });
    return safeError(res, error);
  }
}
