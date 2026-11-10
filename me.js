import { currentUser } from '../lib/auth.js';
import { methodNotAllowed } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const user = await currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  return res.status(200).json({ user });
}
