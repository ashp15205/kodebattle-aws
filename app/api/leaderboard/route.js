/**
 * GET  /api/leaderboard → top 50 users by points (RDS query)
 * Assignment 3: RDS – Leaderboard query
 */
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.getLeaderboard(50);
  return NextResponse.json({ leaderboard: users });
}
