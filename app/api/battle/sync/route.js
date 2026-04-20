import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId, myScore, isForfeit } = await req.json();
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

  const match = await db.getMatch(matchId);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  // Handle Forfeit instantly
  if (isForfeit && match.status !== 'finished') {
    const winnerId = match.player1_id === me.id ? match.player2_id : match.player1_id;
    await db.finishMatch(matchId, winnerId, match.p1_score, match.p2_score);
    return NextResponse.json({ success: true, forfeit: true, winnerId });
  }

  // Update Score
  const isP1 = match.player1_id === me.id;
  
  if (myScore !== undefined) {
    await db.updateMatchScore(matchId, isP1, myScore);
    if (isP1) match.p1_score = myScore; // local update for response
    else match.p2_score = myScore;
  }

  // Fetch full opponent profile to show in versus & battle screen
  const opponentId = isP1 ? match.player2_id : match.player1_id;
  let opponent = null;
  if (opponentId) {
    opponent = await db.findUserById(opponentId);
  }

  return NextResponse.json({
    match,
    opponentInfo: opponent ? { username: opponent.username, rank: opponent.rank, avatar_url: opponent.avatar_url } : null,
  });
}
