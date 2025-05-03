import OpenAI from 'openai';
import { uploadImageToS3, getPresignedUrl } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function downloadImages(celebrityName: string): Promise<string[]> {
  const bucketName = process.env.AWS_S3_BUCKET || '';
  if (!bucketName) throw new Error('AWS_S3_BUCKET env var is required');

  const response = await openai.images.generate({
    prompt: `${celebrityName}`,
    n: 4,
    size: 'auto', // 9:16 aspect ratio supported by DALL·E 3
    model: 'gpt-image-1',
  });

  if (!response.data) throw new Error('No image data returned from OpenAI');

  // Only use images with defined b64_json
  const images = response.data
    .filter((img: { b64_json?: string }) => typeof img.b64_json === 'string')
    .map((img: { b64_json?: string }) => img.b64_json as string);

  // Upload each image to S3 and get a presigned URL
  const urls: string[] = [];
  for (const base64Image of images) {
    const buffer = Buffer.from(base64Image, 'base64');
    const key = `image/${uuidv4()}.png`;
    await uploadImageToS3(bucketName, key, buffer, 'image/png');
    const url = await getPresignedUrl(bucketName, key, 3600 * 24); // 24h expiry
    urls.push(url);
  }
  return urls;
} 