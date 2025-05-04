import { NextRequest, NextResponse } from 'next/server';
import { fetchVideosFromS3, getPresignedUrl, type S3VideoObject } from '../../../utils/s3';

export async function GET(request: NextRequest) {
  // Get pagination parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  const continuationToken = searchParams.get('token') || undefined;
  const sessionId = searchParams.get('session') || undefined;
  
  console.log('API Request - page:', page, 'limit:', limit, 'token:', continuationToken, 'session:', sessionId);
  
  try {
    // Get bucket name from environment variable
    const bucketName = process.env.AWS_S3_BUCKET;
    
    if (!bucketName) {
      console.error('S3 bucket name is not configured');
      throw new Error('S3 bucket name is not configured');
    }
    
    console.log('Fetching videos from bucket:', bucketName, 'with token:', continuationToken);
    
    // Fetch videos from S3 using the continuation token for pagination
    const { videos, nextToken } = await fetchVideosFromS3(bucketName, limit, continuationToken);
    
    console.log('Videos fetched:', videos.length, 'Next token:', nextToken);
    
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
          hasMore: false,
          nextToken: undefined
        },
        message: 'No videos available at this time. Please try again later.'
      });
    }
    
    // Transform S3 video data to reel format
    // Use Promise.all to handle the async presigned URL generation
    const reelsPromises = videos.map(async (video: S3VideoObject) => {
      // Generate presigned URL for secure access
      try {
        // Try up to 3 times to get a presigned URL
        let presignedUrl = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!presignedUrl && attempts < maxAttempts) {
          try {
            attempts++;
            presignedUrl = await getPresignedUrl(bucketName, video.key);
          } catch (urlError) {
            console.error(`Error generating presigned URL for ${video.key} (attempt ${attempts}/${maxAttempts}):`, urlError);
            // Wait briefly before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!presignedUrl) {
          console.error(`Failed to generate presigned URL for ${video.key} after ${maxAttempts} attempts`);
          return null;
        }
        
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
    
    // Only randomize if we have a session ID (which changes on each page refresh)
    let finalReels = reels;
    if (sessionId) {
      // Randomize videos order before returning
      finalReels = [...reels].sort(() => Math.random() - 0.5);
      console.log('Videos randomized for session:', sessionId);
    }
    
    // Return response with pagination token for next page
    return NextResponse.json({
      reels: finalReels,
      pagination: {
        page,
        limit,
        hasMore: !!nextToken,
        nextToken: nextToken
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
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
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}