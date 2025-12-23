import { NextRequest, NextResponse } from 'next/server';
import { listGumletImages } from '@/lib/gumlet';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pageToken = searchParams.get('pageToken') || undefined;
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

        // Get folder ID from query parameter (optional - if not provided, lists all images)
        const folderId = searchParams.get('folderId') || undefined;

        // Fetch images from Gumlet (library or folder)
        const result = await listGumletImages(folderId, pageToken, pageSize);

        // Map Gumlet images to the expected format
        const mediaItems = result.images.map((item) => ({
            id: item.id,
            baseUrl: item.downloadUrl || item.thumbnailUrl,
            mimeType: item.mimeType,
            filename: item.name,
            thumbnailUrl: item.thumbnailUrl,
        }));

        return NextResponse.json({
            mediaItems: mediaItems,
            nextPageToken: result.nextPageToken,
        });
    } catch (error) {
        console.error('Error fetching Gumlet photos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photos';
        
        // Return appropriate status codes based on error type
        if (errorMessage.includes('not found')) {
            return NextResponse.json(
                { error: errorMessage },
                { status: 404 }
            );
        } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('API key')) {
            return NextResponse.json(
                { error: errorMessage },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

