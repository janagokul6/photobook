import { NextRequest, NextResponse } from 'next/server';

/**
 * Generic photos endpoint - currently returns empty results
 * This endpoint is kept for compatibility but should be replaced with specific endpoints
 * (e.g., /api/google-drive/photos, /api/cloudinary/photos)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    mediaItems: [],
    nextPageToken: undefined,
  });
}

