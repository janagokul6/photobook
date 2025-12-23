import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGoogleDriveFile } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const photoIdsParam = searchParams.get('photoIds');

    if (!photoIdsParam) {
      return NextResponse.json(
        { error: 'photoIds parameter is required' },
        { status: 400 }
      );
    }

    // Parse comma-separated photo IDs
    const photoIds = photoIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);

    if (photoIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo ID is required' },
        { status: 400 }
      );
    }

    // Fetch file metadata for each photo ID
    const photos = await Promise.all(
      photoIds.map(async (photoId) => {
        try {
          const file = await getGoogleDriveFile(photoId);
          
          // Use proxy URL for thumbnails to avoid CORS issues
          const originalThumbnailUrl = file.thumbnailUrl || '';
          const proxyUrl = `/api/google-drive/image?fileId=${encodeURIComponent(file.id)}&thumbnailUrl=${encodeURIComponent(originalThumbnailUrl)}&size=220`;
          
          return {
            id: file.id,
            thumbnailUrl: proxyUrl,
            filename: file.name,
          };
        } catch (error) {
          console.error(`Error fetching photo ${photoId}:`, error);
          // Return placeholder data for failed fetches
          return {
            id: photoId,
            thumbnailUrl: '',
            filename: `photo_${photoId}.jpg`,
          };
        }
      })
    );

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

