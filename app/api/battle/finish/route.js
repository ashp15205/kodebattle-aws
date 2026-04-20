/**
 * POST /api/battle/finish
 * Finish a match, award winner points (RDS update)
 * Assignment 3: RDS CRUD
 */
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

function calcRank(pts) {
  if (pts >= 2000) return 'Legend';
  if (pts >= 1000) return 'Master';
  if (pts >= 500)  return 'Diamond';
  if (pts >= 250)  return 'Gold';
  if (pts >= 100)  return 'Silver';
  return 'Bronze';
}

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId, myScore, opponentScore, winnerId } = await req.json();
  const match = await db.getMatch(matchId);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.status === 'finished') return NextResponse.json({ match });

  const isP1 = match.player1_id === me.id;
  const p1Score = isP1 ? myScore : opponentScore;
  const p2Score = isP1 ? opponentScore : myScore;

  let actualWinnerId = winnerId;
  if (!actualWinnerId) {
    if (p1Score > p2Score) actualWinnerId = match.player1_id;
    else if (p2Score > p1Score) actualWinnerId = match.player2_id;
  }

  const finishedMatch = await db.finishMatch(matchId, actualWinnerId, p1Score, p2Score);
  
  // If finishedMatch is null, another request already finished it! 
  // We can just exit cleanly without giving double points.
  if (!finishedMatch) return NextResponse.json({ success: true, winnerId: actualWinnerId });

  // Award +1 point per correct answer. If won, extra +10 points.
  if (actualWinnerId) {
    const winner = await db.findUserById(actualWinnerId);
    if (winner) {
      const winnerScore = actualWinnerId === match.player1_id ? p1Score : p2Score;
      const pointsToAward = winnerScore + 10; // 1 per correct answer + 10 for winning
      await db.updateUser(actualWinnerId, {
        points: (winner.points || 0) + pointsToAward,
        wins: (winner.wins || 0) + 1,
        matches: (winner.matches || 0) + 1,
        rank: calcRank((winner.points || 0) + pointsToAward),
      });
    }
    
    // Update loser stats
    const loserId = actualWinnerId === match.player1_id ? match.player2_id : match.player1_id;
    if (loserId) {
      const loser = await db.findUserById(loserId);
      if (loser) {
        const loserScore = loserId === match.player1_id ? p1Score : p2Score;
        const loserPoints = loserScore; // 1 per correct answer, 0 for loss
        await db.updateUser(loserId, {
          points: (loser.points || 0) + loserPoints,
          losses: (loser.losses || 0) + 1,
          matches: (loser.matches || 0) + 1,
          rank: calcRank((loser.points || 0) + loserPoints),
        });
      }
    }
  }

  return NextResponse.json({ success: true, winnerId: actualWinnerId });
}
