import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export interface S3VideoObject {
  id: string;
  key: string;
  lastModified?: Date;
  size?: number;
}

/**
 * Fetch videos from S3 bucket
 * @param bucketName The S3 bucket name
 * @param limit Maximum number of videos to fetch
 * @param continuationToken Token for pagination
 */
export async function fetchVideosFromS3(
  bucketName: string,
  limit: number = 10,
  continuationToken?: string
): Promise<{ videos: S3VideoObject[], nextToken?: string }> {
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: limit,
      ContinuationToken: continuationToken,
      // No prefix filter - search in the root of the bucket
    });

    const response = await s3Client.send(command);
    
    console.log('S3 response contents:', response.Contents?.length);
    
    // Transform S3 objects to our internal format
    const videos = (response.Contents || [])
      .filter(item => {
        // Only include video files
        const key = item.Key || '';
        return key.match(/\.(mp4|mov|avi|webm)$/i);
      })
      .map(item => ({
        id: uuidv4(), // Generate a unique ID
        key: item.Key || '',
        lastModified: item.LastModified,
        size: item.Size
      }));
      
    console.log('Filtered video files:', videos.length);

    return {
      videos,
      nextToken: response.NextContinuationToken
    };
  } catch (error) {
    console.error('Error fetching videos from S3:', error);
    throw error;
  }
}

/**
 * Generate a presigned URL for securely accessing an S3 object
 * @param bucketName The S3 bucket name
 * @param key The object key in the bucket
 * @param expiresIn Expiration time in seconds
 */
export async function getPresignedUrl(
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
} 