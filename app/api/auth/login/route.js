/**
 * POST /api/auth/login
 * Assignment 3: RDS – Validate user credentials
 */
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await db.findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const { password: _, ...safeUser } = user;
    const token = signToken({ id: safeUser.id, username: safeUser.username, email: safeUser.email });
    return NextResponse.json({ user: safeUser, token });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
