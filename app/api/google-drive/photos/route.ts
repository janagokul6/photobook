import { NextRequest, NextResponse } from 'next/server';
import { listGoogleDriveImages } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pageToken = searchParams.get('pageToken') || undefined;
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

        // Get folder ID from query parameter or fallback to environment variable
        let folderId = searchParams.get('folderId') || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!folderId) {
            console.error('❌ [google-drive/photos] Folder ID not provided in query parameter or environment variables');
            return NextResponse.json(
                { error: 'Google Drive folder ID is required. Provide it as a query parameter: ?folderId=YOUR_FOLDER_ID' },
                { status: 400 }
            );
        }

        // Fetch images from Google Drive folder
        const result = await listGoogleDriveImages(folderId, pageToken, pageSize);

        // Map Google Drive images to the expected format
        // Use proxy URLs to avoid CORS issues with Google's CDN
        const mediaItems = result.images.map((item) => {
            // Store original thumbnail URL for fallback
            const originalThumbnailUrl = item.thumbnailUrl || '';
            
            // For Google CDN URLs, we can try using them directly (they might be public)
            // But we'll still provide the proxy as primary and original as fallback
            // The client will handle fallback if proxy fails
            const isGoogleCDN = originalThumbnailUrl.includes('lh3.googleusercontent.com') || 
                               originalThumbnailUrl.includes('googleusercontent.com');
            
            // Use proxy route to fetch images with proper authentication
            // The proxy will try without auth first for CDN URLs
            const proxyUrl = `/api/google-drive/image?fileId=${encodeURIComponent(item.id)}&thumbnailUrl=${encodeURIComponent(originalThumbnailUrl)}&size=220`;
            
            return {
                id: item.id,
                baseUrl: item.downloadUrl || originalThumbnailUrl, // Use download URL or thumbnail as fallback
                mimeType: item.mimeType,
                filename: item.name,
                thumbnailUrl: proxyUrl,
                // Store original for fallback in case proxy fails
                originalThumbnailUrl: originalThumbnailUrl,
            };
        });

        return NextResponse.json({
            mediaItems: mediaItems,
            nextPageToken: result.nextPageToken,
        });
    } catch (error) {
        console.error('Error fetching Google Drive photos:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photos';
        
        // Return appropriate status codes based on error type
        if (errorMessage.includes('not found')) {
            return NextResponse.json(
                { error: errorMessage },
                { status: 404 }
            );
        } else if (errorMessage.includes('Permission denied') || errorMessage.includes('token')) {
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
