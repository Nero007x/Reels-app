import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const polly = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function synthesizeWithPolly(script: string): Promise<Buffer> {
  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'mp3',
    Text: script,
    VoiceId: 'Joanna', // You can make this configurable
    Engine: 'neural',
    LanguageCode: 'en-US',
  });
  const response = await polly.send(command);
  if (!response.AudioStream) throw new Error('No audio stream from Polly');
  // Convert stream to Buffer
  const chunks: Buffer[] = [];
  for await (const chunk of response.AudioStream as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
} 