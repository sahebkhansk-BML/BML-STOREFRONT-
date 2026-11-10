export function methodNotAllowed(res, allowed = []) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'Method not allowed' });
}

export function requireSameOrigin(req, res) {
  const origin = req.headers.origin;
  const expected = process.env.APP_ORIGIN;
  if (!origin || !expected || origin !== expected) {
    res.status(403).json({ error: 'Request origin not allowed' });
    return false;
  }
  return true;
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie',
    `bml_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie',
    'bml_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
}

export function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function safeError(res, error) {
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
