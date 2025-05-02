import { NextRequest, NextResponse } from 'next/server';
import { fetchVideosFromS3, getPresignedUrl, type S3VideoObject } from '../../../utils/s3';

export async function GET(request: NextRequest) {
  // Get pagination parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const continuationToken = searchParams.get('token') || undefined;
  
  // Log environment variables (make sure not to log actual secrets in production)
  console.log('AWS_REGION:', process.env.AWS_REGION);
  console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
  console.log('Has AWS_ACCESS_KEY_ID:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('Has AWS_SECRET_ACCESS_KEY:', !!process.env.AWS_SECRET_ACCESS_KEY);
  
  try {
    // Get bucket name from environment variable
    const bucketName = process.env.AWS_S3_BUCKET;
    
    if (!bucketName) {
      console.error('S3 bucket name is not configured');
      throw new Error('S3 bucket name is not configured');
    }
    
    console.log('Fetching videos from bucket:', bucketName);
    
    // Fetch videos from S3
    const { videos, nextToken } = await fetchVideosFromS3(bucketName, limit, continuationToken);
    
    console.log('Videos fetched:', videos.length);
    
    if (videos.length > 0) {
      // Log a sample of the first video
      console.log('Sample video keys:', videos.slice(0, 2).map(v => v.key));
    }
    
    // If no videos found in S3, return empty array
    if (videos.length === 0) {
      console.log('No videos found in S3');
      
      return NextResponse.json({
        reels: [],
        pagination: {
          page,
          limit,
          hasMore: false
        }
      });
    }
    
    // Transform S3 video data to reel format
    // Use Promise.all to handle the async presigned URL generation
    const reelsPromises = videos.map(async (video: S3VideoObject) => {
      // Generate presigned URL for secure access
      try {
        const presignedUrl = await getPresignedUrl(bucketName, video.key);
        
        return {
          id: video.id,
          videoUrl: presignedUrl,
          caption: `Reel #${video.id}`,
          likes: Math.floor(Math.random() * 10000), // Placeholder
          comments: Math.floor(Math.random() * 1000), // Placeholder
          createdAt: video.lastModified?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error generating presigned URL for ${video.key}:`, error);
        return null;
      }
    });
    
    // Filter out any null values (failed URLs)
    const reelsWithUrls = await Promise.all(reelsPromises);
    const reels = reelsWithUrls.filter(r => r !== null);
    
    console.log('Final reels count:', reels.length);
    
    // Return response with pagination token for next page
    return NextResponse.json({
      reels,
      pagination: {
        page,
        limit,
        hasMore: !!nextToken,
        nextToken: nextToken
      }
    });
  } catch (error) {
    // Log detailed error
    console.error('Error fetching reels from S3:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to fetch videos from S3',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 