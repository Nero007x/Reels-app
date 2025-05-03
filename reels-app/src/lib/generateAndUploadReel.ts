import { generateScriptWithDeepSeek } from './openaiScriptService';
import { synthesizeWithPolly } from './pollyTTSService';
import { downloadImages } from './bingImageService';
import { createVideo } from './runwayVideoService';
import { uploadToS3 } from './s3UploadService';

export async function generateAndUploadReel(celebrityName: string): Promise<void> {
  const script = await generateScriptWithDeepSeek(celebrityName);
  const audio = await synthesizeWithPolly(script);
  const images = await downloadImages(celebrityName);
  const videoPath = await createVideo(images, audio);
  await uploadToS3(videoPath);
} 