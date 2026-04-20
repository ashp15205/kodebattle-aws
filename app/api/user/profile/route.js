/**
 * GET  /api/user/profile → get own profile
 * PUT  /api/user/profile → update own profile
 */
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await db.findUserById(me.id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const allowed = ['username', 'avatar_url'];
  const updates = {};
  for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
  const user = await db.updateUser(me.id, updates);
  return NextResponse.json({ user });
}
