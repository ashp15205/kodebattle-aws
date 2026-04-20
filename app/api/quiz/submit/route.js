/**
 * POST /api/quiz/submit
 * Validate answers server-side, update RDS scores
 * Assignment 3: RDS CRUD – update user stats
 */
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

function calcRank(points) {
  if (points >= 2000) return 'Legend';
  if (points >= 1000) return 'Master';
  if (points >= 500)  return 'Diamond';
  if (points >= 250)  return 'Gold';
  if (points >= 100)  return 'Silver';
  return 'Bronze';
}

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questionIds, answers, mode } = await req.json();
  const allQ = await db.getQuestions('Random', 100);
  
  let score = 0;
  const results = questionIds.map((qid, idx) => {
    const q = allQ.find(q => q.id === qid);
    if (!q) return { id: qid, correct: false, correctAnswer: -1 };
    const correct = q.answer === answers[idx];
    if (correct) score++;
    return { id: q.id, correct, correctAnswer: q.answer };
  });

  // In battle mode (mode='test'), finishMatch handles the ranked points.
  // Practice tests do not give competitive points.
  return NextResponse.json({ score, total: questionIds.length, results, pointsEarned: 0 });
}
