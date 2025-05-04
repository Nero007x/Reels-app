import { exec } from 'child_process';
import { promisify } from 'util';
import { getPresignedUrl } from '../utils/s3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';

const execAsync = promisify(exec);

// Log FFmpeg path for debugging
console.log('FFmpeg path:', ffmpegPath);

export class AudioProcessingError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

/**
 * Adds audio to a video using native FFmpeg
 * @param videoPath The video URL or local path
 * @param audioS3Key The S3 key for the audio file
 * @returns The path to the combined video file
 * @throws {AudioProcessingError} When audio processing fails
 */
export async function addAudioToVideo(videoPath: string, audioS3Key: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET || '';
  if (!bucketName) throw new AudioProcessingError('AWS_S3_BUCKET env var is required');
  
  try {
    // Get the audio file from S3
    const audioUrl = await getPresignedUrl(bucketName, audioS3Key);
    
    // Create temporary file paths
    const tmpDir = os.tmpdir();
    const videoFileName = path.join(tmpDir, `input-${uuidv4()}.mp4`);
    const audioFileName = path.join(tmpDir, `audio-${uuidv4()}.mp3`);
    const outputFileName = path.join(tmpDir, `output-${uuidv4()}.mp4`);
    
    // Fetch and save the video file
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
      const videoResponse = await fetch(videoPath);
      if (!videoResponse.ok) throw new AudioProcessingError('Failed to fetch video from URL');
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      fs.writeFileSync(videoFileName, videoBuffer);
    } else {
      // If video is a local path, copy it to temp dir
      fs.copyFileSync(videoPath, videoFileName);
    }
    
    // Fetch and save the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new AudioProcessingError('Failed to fetch audio from S3');
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    fs.writeFileSync(audioFileName, audioBuffer);
    
    // Run FFmpeg command to combine audio and video
    // Use the ffmpeg-static path instead of relying on system ffmpeg
    const ffmpegCmd = `"${ffmpegPath}" -i "${videoFileName}" -i "${audioFileName}" -c:v copy -c:a aac -map 0:v -map 1:a -shortest "${outputFileName}"`;
    
    console.log(`Running FFmpeg command: ${ffmpegCmd}`);
    
    await execAsync(ffmpegCmd);
    
    // Verify the output file exists and has content
    if (!fs.existsSync(outputFileName) || fs.statSync(outputFileName).size === 0) {
      throw new AudioProcessingError('FFmpeg processed without error but output file is missing or empty');
    }
    
    return outputFileName;
  } catch (error) {
    // Convert all errors to AudioProcessingError for consistent handling
    if (error instanceof AudioProcessingError) {
      throw error;
    } else {
      console.error('Error adding audio to video:', error);
      throw new AudioProcessingError('Failed to add audio to video', error);
    }
  }
}
