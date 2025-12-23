import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveFolderName } from '@/lib/google-drive';
import { extractFolderIdFromUrl, isValidFolderId } from '@/lib/google-drive-utils';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const folderIdParam = searchParams.get('folderId');

        if (!folderIdParam) {
            return NextResponse.json(
                { error: 'Folder ID is required' },
                { status: 400 }
            );
        }

        // Extract folder ID in case a full URL was provided
        const folderId = extractFolderIdFromUrl(folderIdParam);

        if (!folderId || !isValidFolderId(folderId)) {
            return NextResponse.json(
                { error: 'Invalid folder ID' },
                { status: 400 }
            );
        }

        // Fetch folder name from Google Drive
        const folderName = await getGoogleDriveFolderName(folderId);

        return NextResponse.json({
            folderId,
            folderName,
        });
    } catch (error) {
        console.error('Error fetching folder info:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch folder information';
        
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            return NextResponse.json(
                { error: 'Folder not found. Please check the folder ID and ensure it is accessible.' },
                { status: 404 }
            );
        } else if (errorMessage.includes('Permission denied') || errorMessage.includes('403')) {
            return NextResponse.json(
                { error: 'Permission denied. Please ensure the Google account has access to this folder.' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
