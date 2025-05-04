import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { uploadImageToS3 } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';

const polly = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function synthesizeWithPolly(script: string): Promise<string> {
  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'mp3',
    Text: script,
    VoiceId: 'Joanna', 
    Engine: 'neural',
    LanguageCode: 'en-US',
  });
  const response = await polly.send(command);
  if (!response.AudioStream) throw new Error('No audio stream from Polly');
  // Convert stream to Buffer
  const chunks: Buffer[] = [];
  for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  const audioBuffer = Buffer.concat(chunks);
  const bucketName = process.env.AWS_S3_BUCKET || '';
  if (!bucketName) throw new Error('AWS_S3_BUCKET env var is required');
  const key = `audio/${uuidv4()}.mp3`;
  await uploadImageToS3(bucketName, key, audioBuffer, 'audio/mpeg');
  return key;
} 