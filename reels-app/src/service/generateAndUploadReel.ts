import { generateScriptWithDeepSeek } from '../service/openaiScriptService';
import { synthesizeWithPolly } from '../service/pollyTTSService';
import { downloadImages } from '../service/openaiImageService';
import { createVideo } from '../service/runwayVideoService';
import { uploadToS3 } from '../service/s3UploadService';
import { addAudioToVideo, AudioProcessingError } from '../service/addAudioToVideoService';

export async function generateAndUploadReel(celebrityName: string): Promise<void> {
  const script = await generateScriptWithDeepSeek(celebrityName);
  const audio = await synthesizeWithPolly(script);
  const images = await downloadImages(celebrityName);
  const videoPath = await createVideo(images);
  
  // Try to add audio to video, but continue with original video if it fails
  let finalVideoPath = videoPath;
  try {
    finalVideoPath = await addAudioToVideo(videoPath, audio);
    console.log('Successfully added audio to video');
  } catch (error) {
    if (error instanceof AudioProcessingError) {
      console.error('Failed to add audio to video, continuing with silent video:', error.message);
      // Continue with original video
    } else {
      // For unexpected errors, rethrow
      throw error;
    }
  }
  
  // Upload the final video (either with audio or the original)
  await uploadToS3(finalVideoPath);
} 