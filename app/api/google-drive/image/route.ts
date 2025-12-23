import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveAccessToken } from '@/lib/google-drive';

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Proxy route to fetch Google Drive images with proper authentication
 * This solves CORS issues when loading images directly from Google's CDN
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🖼️ [google-drive/image] Request received');
        const searchParams = request.nextUrl.searchParams;
        const fileId = searchParams.get('fileId');
        const thumbnailUrl = searchParams.get('thumbnailUrl');
        const size = searchParams.get('size') || '220';

        console.log('🖼️ [google-drive/image] Params:', { fileId, hasThumbnailUrl: !!thumbnailUrl, size });

        if (!fileId) {
            console.error('❌ [google-drive/image] File ID is required');
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        const accessToken = await getGoogleDriveAccessToken();

        let imageUrl: string;
        let isGoogleCDN = false;
        
        // If thumbnailUrl is provided, use it (it's already a valid Google URL)
        // Otherwise, try to get thumbnail from API
        if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
            imageUrl = thumbnailUrl;
            // Check if it's a Google CDN URL (these might be publicly accessible)
            isGoogleCDN = imageUrl.includes('lh3.googleusercontent.com') || 
                         imageUrl.includes('googleusercontent.com');
        } else {
            // Use Google Drive API thumbnail endpoint
            // Size can be a number (max dimension in pixels) or format like "w400-h400"
            imageUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/thumbnail?sz=${encodeURIComponent(size)}`;
        }

        // Try fetching the image with timeout
        let response: Response;
        try {
            // For Google CDN URLs, try without auth first (they might be public)
            if (isGoogleCDN) {
                try {
                    response = await fetchWithTimeout(imageUrl, {}, 8000);
                    if (!response.ok) {
                        // If failed, try with auth
                        response = await fetchWithTimeout(imageUrl, {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                            },
                        }, 8000);
                    }
                } catch (error) {
                    // If timeout or network error, try with auth as fallback
                    console.warn('⚠️ [google-drive/image] CDN fetch without auth failed, trying with auth');
                    response = await fetchWithTimeout(imageUrl, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }, 8000);
                }
            } else {
                // For API endpoints, always use auth
                response = await fetchWithTimeout(imageUrl, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }, 8000);
            }
        } catch (fetchError) {
            // If fetch fails (timeout or network error), try fallback
            console.warn('⚠️ [google-drive/image] Primary fetch failed, trying fallback:', fetchError);
            throw fetchError;
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('⚠️ [google-drive/image] Failed to fetch thumbnail:', response.status, response.statusText);
            
            // If thumbnail endpoint fails, try to get file metadata and use thumbnailLink
            try {
                const fileResponse = await fetchWithTimeout(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    },
                    5000
                );
                
                if (fileResponse.ok) {
                    const fileData = await fileResponse.json();
                    if (fileData.thumbnailLink) {
                        // Try fetching the thumbnail from the thumbnailLink (might be public CDN)
                        try {
                            let thumbResponse = await fetchWithTimeout(fileData.thumbnailLink, {}, 8000);
                            if (!thumbResponse.ok) {
                                // Try with auth
                                thumbResponse = await fetchWithTimeout(fileData.thumbnailLink, {
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                    },
                                }, 8000);
                            }
                            
                            if (thumbResponse.ok) {
                                const imageBuffer = await thumbResponse.arrayBuffer();
                                const contentType = thumbResponse.headers.get('content-type') || 'image/jpeg';
                                
                                return new NextResponse(imageBuffer, {
                                    headers: {
                                        'Content-Type': contentType,
                                        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                                        'Access-Control-Allow-Origin': '*',
                                    },
                                });
                            }
                        } catch (thumbError) {
                            console.warn('⚠️ [google-drive/image] ThumbnailLink fetch failed:', thumbError);
                        }
                    }
                }
            } catch (fallbackError) {
                console.warn('⚠️ [google-drive/image] Fallback thumbnail fetch failed:', fallbackError);
            }
            
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Return the image with proper headers including CORS
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('❌ [google-drive/image] Error proxying Google Drive image:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch image';
        // Return 500 but include a message that client can use original URL as fallback
        return NextResponse.json(
            { 
                error: errorMessage,
                // Include hint for client to use original thumbnail URL
                useOriginalUrl: true
            },
            { status: 500 }
        );
    }
}
