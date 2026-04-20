import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId, myScore } = await req.json();
  const match = await db.getMatch(matchId);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const isP1 = match.player1_id === me.id;
  
  // Ensure score is updated
  await db.updateMatchScore(matchId, isP1, myScore);

  const myDoneFlag = isP1 ? 'p1_done' : 'p2_done';
  const opDoneFlag = isP1 ? 'p2_done' : 'p1_done';

  let newStatusMarker = myDoneFlag;

  // If opponent already done, mark both as done
  if (match.winner_id === opDoneFlag || match.winner_id === 'both_done') {
      newStatusMarker = 'both_done';
  }

  // We are hacking the winner_id string column to signal readiness while maintaining status=active.
  // When Finish API is finally called, it will override winner_id with the actual real UUID of winner.
  if (process.env.DEMO_MODE !== 'false') {
     // For demo mode (memory)
     const storeMatch = require('@/lib/db').db.getMatch;
     const m = await storeMatch(matchId);
     if (m) m.winner_id = newStatusMarker;
  } else {
     // SQL mode
     const pool = await require('mysql2/promise').createPool({
         host: process.env.DB_HOST,
         port: parseInt(process.env.DB_PORT || '3306'),
         user: process.env.DB_USER,
         password: process.env.DB_PASS,
         database: process.env.DB_NAME,
     });
     await pool.execute('UPDATE matches SET winner_id=? WHERE id=?', [newStatusMarker, matchId]);
  }

  return NextResponse.json({ success: true, marker: newStatusMarker });
}
