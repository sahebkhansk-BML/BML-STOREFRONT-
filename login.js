import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sql } from '../lib/db.js';
import { createToken } from '../lib/auth.js';
import { methodNotAllowed, requireSameOrigin, safeError, setAuthCookie } from '../lib/http.js';

const schema = z.object({
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(1).max(72)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireSameOrigin(req, res)) return;
  try {
    const input = schema.parse(req.body);
    const rows = await sql`SELECT id, name, email, role, password_hash FROM users WHERE email = ${input.email} LIMIT 1`;
    const user = rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    setAuthCookie(res, await createToken(user));
    return res.status(200).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'Invalid email or password' });
    return safeError(res, error);
  }
}
