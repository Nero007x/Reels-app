import { NextRequest, NextResponse } from 'next/server';
import { generateAndUploadReel } from '@/service/generateAndUploadReel';

export async function POST(req: NextRequest) {
  try {
    const { celebrityName } = await req.json();
    if (!celebrityName) {
      return NextResponse.json({ error: 'Missing celebrityName' }, { status: 400 });
    }
    await generateAndUploadReel(celebrityName);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate and upload reel' }, { status: 500 });
  }
} 