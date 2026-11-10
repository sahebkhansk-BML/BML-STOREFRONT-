import { clearAuthCookie, methodNotAllowed, requireSameOrigin } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!requireSameOrigin(req, res)) return;
  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
}
