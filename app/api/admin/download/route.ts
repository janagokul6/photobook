import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import { getGoogleDriveFile, getGoogleDriveAccessToken } from '@/lib/google-drive';
import JSZip from 'jszip';

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
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
 * Download a file from Google Drive using the download URL
 */
async function downloadGoogleDriveFile(fileId: string, downloadUrl: string): Promise<Buffer> {
    const accessToken = await getGoogleDriveAccessToken();
    
    // Use the download URL with authentication and timeout
    const response = await fetchWithTimeout(downloadUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    }, 30000); // 30 second timeout for file downloads

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const photoIdsParam = searchParams.get('photoIds');
        const submissionId = searchParams.get('submissionId');

        // Handle submission download (ZIP)
        if (submissionId) {
            console.log('📦 [admin/download] Downloading submission as ZIP:', submissionId);
            
            const submission = await Submission.findOne({ submissionId });
            if (!submission) {
                return NextResponse.json(
                    { error: 'Submission not found' },
                    { status: 404 }
                );
            }

            if (!submission.selectedPhotoIds || submission.selectedPhotoIds.length === 0) {
                return NextResponse.json(
                    { error: 'No photos in submission' },
                    { status: 400 }
                );
            }

            const zip = new JSZip();
            const photoIds = submission.selectedPhotoIds;

            // Download all photos and add to ZIP
            for (let i = 0; i < photoIds.length; i++) {
                const photoId = photoIds[i];
                try {
                    console.log(`📥 [admin/download] Downloading photo ${i + 1}/${photoIds.length}: ${photoId}`);
                    
                    const file = await getGoogleDriveFile(photoId);
                    if (!file.downloadUrl) {
                        console.warn(`⚠️ [admin/download] No download URL for photo ${photoId}, skipping`);
                        continue;
                    }

                    const fileBuffer = await downloadGoogleDriveFile(photoId, file.downloadUrl);
                    
                    // Get file extension from mimeType or filename
                    let extension = 'jpg';
                    if (file.mimeType) {
                        const mimeToExt: Record<string, string> = {
                            'image/jpeg': 'jpg',
                            'image/png': 'png',
                            'image/gif': 'gif',
                            'image/webp': 'webp',
                        };
                        extension = mimeToExt[file.mimeType] || 'jpg';
                    } else if (file.name) {
                        const match = file.name.match(/\.([^.]+)$/);
                        if (match) extension = match[1];
                    }

                    // Use filename if available, otherwise use photo ID
                    const filename = file.name || `photo_${photoId}.${extension}`;
                    
                    zip.file(filename, fileBuffer);
                } catch (error) {
                    console.error(`❌ [admin/download] Error downloading photo ${photoId}:`, error);
                    // Continue with other photos even if one fails
                }
            }

            // Generate ZIP buffer
            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

            return new NextResponse(zipBuffer as any, {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="submission_${submissionId}_photos.zip"`,
                },
            });
        }

        // Handle individual photo download
        if (photoIdsParam) {
            const photoIds = photoIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0);
            
            if (photoIds.length === 0) {
                return NextResponse.json(
                    { error: 'No photo IDs provided' },
                    { status: 400 }
                );
            }

            // For now, download the first photo (can be extended to handle multiple)
            const photoId = photoIds[0];
            console.log('📥 [admin/download] Downloading individual photo:', photoId);

            try {
                const file = await getGoogleDriveFile(photoId);
                if (!file.downloadUrl) {
                    return NextResponse.json(
                        { error: 'No download URL available for this photo' },
                        { status: 404 }
                    );
                }

                const fileBuffer = await downloadGoogleDriveFile(photoId, file.downloadUrl);
                
                // Determine content type
                const contentType = file.mimeType || 'image/jpeg';
                const filename = file.name || `photo_${photoId}.jpg`;

                return new NextResponse(fileBuffer as any, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `attachment; filename="${filename}"`,
                    },
                });
            } catch (error) {
                console.error('❌ [admin/download] Error downloading photo:', error);
                return NextResponse.json(
                    { error: 'Failed to download photo' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Either photoIds or submissionId parameter is required' },
            { status: 400 }
        );
    } catch (error) {
        console.error('❌ [admin/download] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to download';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

