import { generateScriptWithDeepSeek } from '../service/openaiScriptService';
import { synthesizeWithPolly } from '../service/pollyTTSService';
import { downloadImages } from '../service/openaiImageService';
import { createVideo } from '../service/runwayVideoService';
import { uploadToS3 } from '../service/s3UploadService';

export async function generateAndUploadReel(celebrityName: string): Promise<void> {
  const script = await generateScriptWithDeepSeek(celebrityName);
  const audio = await synthesizeWithPolly(script);
  const images = await downloadImages(celebrityName);
  const videoPath = await createVideo(images);
  const addAudio = await addAudioToVideo(videoPath, audio);
  await uploadToS3(videoPath);
} 