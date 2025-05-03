import RunwayML from '@runwayml/sdk';
import { generateAndUploadReel } from '@/service/generateAndUploadReel';

const client = new RunwayML();

export async function createVideo(
  images: string[],
  promptText: string = 'A cinematic video'
): Promise<string> {
  // Use the first image as the prompt image
  const promptImage = images[0];

  // Create the image-to-video task
  const imageToVideo = await client.imageToVideo.create({
    model: 'gen4_turbo',
    promptImage,
    promptText,
    ratio: '720:1280',
  });

  const taskId = imageToVideo.id;

  // Poll until the task is complete
  let task: Awaited<ReturnType<typeof client.tasks.retrieve>>;
  do {
    await new Promise(resolve => setTimeout(resolve, 10000));
    task = await client.tasks.retrieve(taskId);
  } while (!['SUCCEEDED', 'FAILED'].includes(task.status));

  if (task.status === 'SUCCEEDED' && task.output && Array.isArray(task.output) && task.output.length > 0) {
    // Return the first video URL
    return task.output[0];
  } else {
    throw new Error('RunwayML video generation failed');
  }
}
