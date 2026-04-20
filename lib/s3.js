/**
 * lib/s3.js
 * Assignment 2: S3 Storage Operations
 *
 * Supports:
 *  - uploadFile(key, buffer, contentType) → URL
 *  - deleteFile(key)
 *  - getPresignedUrl(key) → signed URL for private objects
 *
 * In DEMO_MODE the S3 calls are simulated and return mock URLs.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const BUCKET = process.env.S3_BUCKET_NAME || 'kodebattle-assets';
const REGION = process.env.AWS_REGION || 'us-east-1';

let s3Client = null;

function getClient() {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  return s3Client;
}

function mockUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export const s3 = {
  /**
   * Upload a file to S3
   * @param {string} key  - S3 object key (e.g., "avatars/user-id.jpg")
   * @param {Buffer} buffer - file buffer
   * @param {string} contentType - MIME type
   * @returns {string} public URL
   */
  async uploadFile(key, buffer, contentType = 'image/jpeg') {
    if (DEMO_MODE) {
      console.log(`[S3 DEMO] PUT s3://${BUCKET}/${key} (${buffer.length} bytes)`);
      return mockUrl(key);
    }
    const client = getClient();
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  },

  /**
   * Delete a file from S3
   * @param {string} key - S3 object key
   */
  async deleteFile(key) {
    if (DEMO_MODE) {
      console.log(`[S3 DEMO] DELETE s3://${BUCKET}/${key}`);
      return { success: true };
    }
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { success: true };
  },

  /**
   * Generate a presigned GET URL for a private S3 object
   * @param {string} key - S3 object key
   * @param {number} expiresIn - seconds (default 3600)
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    if (DEMO_MODE) {
      console.log(`[S3 DEMO] PRESIGN s3://${BUCKET}/${key}`);
      return `${mockUrl(key)}?demo=true&expires=${Date.now() + expiresIn * 1000}`;
    }
    const client = getClient();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
  },

  /** List available quiz datasets stored in S3 (demo: returns static list) */
  async listDatasets() {
    if (DEMO_MODE) {
      return [
        { key: 'datasets/arrays.json', name: 'Arrays', size: '12 KB', lastModified: '2024-01-15' },
        { key: 'datasets/linkedlists.json', name: 'Linked Lists', size: '9 KB', lastModified: '2024-01-16' },
        { key: 'datasets/trees.json', name: 'Trees', size: '15 KB', lastModified: '2024-01-17' },
        { key: 'datasets/graphs.json', name: 'Graphs', size: '18 KB', lastModified: '2024-01-18' },
        { key: 'datasets/dp.json', name: 'Dynamic Programming', size: '22 KB', lastModified: '2024-01-19' },
      ];
    }
    // Real: list s3 objects in datasets/ prefix
    const client = getClient();
    try {
      const data = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'datasets/' }));
      return (data.Contents || [])
        .filter(obj => obj.Size > 0)
        .map(obj => ({
          key: obj.Key,
          name: obj.Key.split('/').pop().replace('.json', '').toUpperCase(),
          size: Math.round(obj.Size / 1024) + ' KB',
          lastModified: obj.LastModified.toISOString().split('T')[0]
        }));
    } catch {
      return [];
    }
  },
};

export default s3;
