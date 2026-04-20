/**
 * GET /api/s3/datasets  – list quiz dataset files in S3
 * Assignment 2: S3 retrieval operation
 */
import { s3 } from '@/lib/s3';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const me = getUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const datasets = await s3.listDatasets();
  return NextResponse.json({ datasets, bucket: process.env.S3_BUCKET_NAME || 'kodebattle-assets' });
}
