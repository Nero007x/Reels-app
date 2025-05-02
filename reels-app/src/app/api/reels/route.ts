import { NextRequest, NextResponse } from 'next/server';

// Public domain videos that should work better
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

// Mock data generation
const generateMockReels = (page: number, limit: number) => {
  const startIndex = (page - 1) * limit;
  
  return Array.from({ length: limit }, (_, i) => {
    const id = startIndex + i;
    return {
      id: `reel-${id}`,
      videoUrl: SAMPLE_VIDEOS[id % SAMPLE_VIDEOS.length],
      caption: `This is a sample reel caption for reel ${id}. #reels #sample #nextjs`,
      likes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 1000),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
};

export async function GET(request: NextRequest) {
  // Get pagination parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock data
  const reels = generateMockReels(page, limit);
  
  // Return response
  return NextResponse.json({
    reels,
    pagination: {
      page,
      limit,
      totalPages: 10, // Mock value
      hasMore: page < 10, // Mock value
    }
  });
} 