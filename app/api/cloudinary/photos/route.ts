// CLOUDINARY CODE COMMENTED OUT
// import { NextRequest, NextResponse } from 'next/server';
// import { listCloudinaryImages } from '@/lib/cloudinary';

// export async function GET(request: NextRequest) {
//     try {
//         const searchParams = request.nextUrl.searchParams;
//         const pageToken = searchParams.get('pageToken') || undefined;

//         // Cloudinary uses 'next_cursor' for pagination
//         const result = await listCloudinaryImages(pageToken);

//         // Map Cloudinary images to the expected format
//         const mediaItems = result.images.map((item) => ({
//             id: item.id,
//             baseUrl: item.link,
//             mimeType: `image/${item.format}`,
//             filename: item.name,
//             thumbnailUrl: item.thumbnailUrl,
//         }));

//         return NextResponse.json({
//             mediaItems: mediaItems,
//             nextPageToken: result.nextCursor,
//         });
//     } catch (error) {
//         console.error('Error fetching Cloudinary photos:', error);
//         return NextResponse.json(
//             { error: 'Failed to fetch photos' },
//             { status: 500 }
//         );
//     }
// }

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json(
        { error: 'Cloudinary functionality is currently disabled' },
        { status: 503 }
    );
}
