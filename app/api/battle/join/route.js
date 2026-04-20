/**
 * POST /api/battle/join  – join matchmaking queue (RDS)
 * GET  /api/battle/join  – check match status
 * Assignment 3: RDS – match CRUD
 */
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { topic } = await req.json();
  const t = topic || 'Random';

  // Check for waiting match to join
  const waiting = await db.findWaitingMatch(t);
  if (waiting && waiting.player1_id !== me.id) {
    const match = await db.joinMatch(waiting.id, me.id);
    const questions = await db.getQuestions(t, 10);
    return NextResponse.json({ match, role: 'player2', questions: questions.map(({ answer: _, ...q }) => q) });
  }

  // Create a new waiting match
  const match = await db.createMatch({ player1_id: me.id, topic: t });
  const questions = await db.getQuestions(t, 10);
  return NextResponse.json({ match, role: 'player1', questions: questions.map(({ answer: _, ...q }) => q) });
}

export async function GET(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });
  const match = await db.getMatch(matchId);
  return NextResponse.json({ match });
}
