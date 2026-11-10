import { jwtVerify, SignJWT } from 'jose';
import { getCookie } from './http.js';

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return new TextEncoder().encode(value);
};

export async function createToken(user) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function currentUser(req) {
  const token = getCookie(req, 'bml_session');
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in first' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return user;
}
