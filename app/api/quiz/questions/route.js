/**
 * GET  /api/quiz/questions?topic=Arrays&count=10
 * Assignment 2+3: S3 datasets / RDS questions
 */
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get('topic') || 'Random';
  const count = parseInt(searchParams.get('count') || '10');

  const questions = await db.getQuestions(topic, count);
  // Strip the answer field before sending to client
  const safe = questions.map(({ answer: _, ...q }) => q);
  return NextResponse.json({ questions: safe, topic, total: questions.length });
}
