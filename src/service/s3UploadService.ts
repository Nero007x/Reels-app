import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // No longer needed
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import fetch from 'node-fetch';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToS3(videoPath: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET || '';
  if (!bucketName) throw new Error('AWS_S3_BUCKET env var is required');
  const key = `reels/${uuidv4()}.mp4`;

  let videoBuffer: Buffer;
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    const res = await fetch(videoPath);
    if (!res.ok) throw new Error('Failed to fetch video from URL');
    videoBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    // Read video from local file system
    videoBuffer = fs.readFileSync(videoPath);
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: videoBuffer,
    ContentType: 'video/mp4',
  });
  await s3Client.send(command);

  // Return the S3 key
  return key;
} 