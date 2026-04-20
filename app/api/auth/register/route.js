/**
 * POST /api/auth/register
 * Assignment 3: RDS – Create user in DB
 */
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const user = await db.createUser({ username, email, password });
    const token = signToken({ id: user.id, username: user.username, email: user.email });
    return NextResponse.json({ user, token }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
