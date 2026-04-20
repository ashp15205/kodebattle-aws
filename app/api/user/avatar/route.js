/**
 * POST /api/user/avatar
 * Assignment 2: S3 – Upload profile image to S3
 */
import { s3 } from '@/lib/s3';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('avatar');
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const key = `avatars/${me.id}-${uuidv4()}.${ext}`;

  const url = await s3.uploadFile(key, buffer, file.type);
  await db.updateUser(me.id, { avatar_url: url });

  return NextResponse.json({ url, key, bucket: process.env.S3_BUCKET_NAME, operation: 'PUT' });
}

export async function DELETE(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { key } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });
  await s3.deleteFile(key);
  await db.updateUser(me.id, { avatar_url: null });
  return NextResponse.json({ success: true, operation: 'DELETE', key });
}
