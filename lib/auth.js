/**
 * lib/auth.js
 * JWT-based auth helpers for API routes (Assignment 3 – RDS Users)
 */

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'kodebattle_secret';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

export function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
