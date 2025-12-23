import connectDB from './db';
import Token from './models/Token';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google credentials are missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
}

/**
 * Get a valid Google access token, refreshing if necessary
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
    console.log('🔍 [getGoogleDriveAccessToken] Starting token retrieval...');
    await connectDB();

    const tokenDoc = await Token.getToken('googledrive');

    if (!tokenDoc) {
        console.error('❌ [getGoogleDriveAccessToken] No Google Drive token found in database');
        throw new Error('No Google Drive token found. Please sign in with Google Drive via admin panel first.');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiresAt = new Date(tokenDoc.expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now.getTime() >= expiresAt.getTime() - bufferTime) {
        console.log('🔄 [getGoogleDriveAccessToken] Token expired, refreshing...');
        await refreshGoogleDriveAccessToken(tokenDoc.refreshToken);
        const updatedToken = await Token.getToken('googledrive');
        if (!updatedToken) return '';
        return updatedToken.accessToken;
    }

    return tokenDoc.accessToken;
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleDriveAccessToken(refreshToken: string): Promise<void> {
    console.log('🔄 [refreshGoogleDriveAccessToken] Refreshing token...');

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [refreshGoogleDriveAccessToken] Error response:', errorText);
            throw new Error(`Failed to refresh token: ${response.statusText}`);
        }

        const data = await response.json();

        const expiresIn = data.expires_in || 3600;

        await Token.updateToken(
            'googledrive',
            data.refresh_token || refreshToken, // Google may or may not return a new refresh token
            data.access_token,
            expiresIn
        );

        console.log('✅ [refreshGoogleDriveAccessToken] Token refreshed');
    } catch (error) {
        console.error('❌ [refreshGoogleDriveAccessToken] Error:', error);
        throw error;
    }
}

export interface GoogleDriveImage {
    id: string;
    name: string;
    thumbnailUrl: string;
    downloadUrl: string;
    mimeType: string;
}

export interface GoogleDriveImagesResult {
    images: GoogleDriveImage[];
    nextPageToken?: string;
}

/**
 * List images from a Google Drive folder
 */
export async function listGoogleDriveImages(
    folderId: string,
    pageToken?: string,
    pageSize: number = 50
): Promise<GoogleDriveImagesResult> {
    console.log('📸 [listGoogleDriveImages] Starting to fetch images from folder...');
    console.log('📊 [listGoogleDriveImages] Parameters:', { folderId, pageToken, pageSize });

    if (!folderId) {
        throw new Error('Folder ID is required');
    }

    const accessToken = await getGoogleDriveAccessToken();
    console.log('🔑 [listGoogleDriveImages] Access token retrieved');

    try {
        // Build query to filter for images in the specified folder
        // Query: files in folder with image MIME types
        const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
        
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.append('q', query);
        url.searchParams.append('pageSize', pageSize.toString());
        url.searchParams.append('fields', 'nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink)');
        if (pageToken) {
            url.searchParams.append('pageToken', pageToken);
        }

        console.log('🌐 [listGoogleDriveImages] Request URL:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📥 [listGoogleDriveImages] Response received');
        console.log('📊 [listGoogleDriveImages] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [listGoogleDriveImages] Google Drive API error!');
            console.error('❌ [listGoogleDriveImages] Status:', response.status, response.statusText);
            console.error('❌ [listGoogleDriveImages] Error response body:', errorText);

            if (response.status === 404) {
                throw new Error('Folder not found. Please check the folder ID.');
            } else if (response.status === 403) {
                throw new Error('Permission denied. Please ensure the Google account has access to this folder.');
            }

            throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ [listGoogleDriveImages] Successfully received response from Google Drive API');
        console.log('📊 [listGoogleDriveImages] Response data:', {
            filesCount: data.files?.length || 0,
            hasNextPageToken: !!data.nextPageToken,
        });

        const files = data.files || [];

        // Map files to our format
        const images: GoogleDriveImage[] = files.map((file: any) => {
            // Use thumbnailLink if available, otherwise use webViewLink with thumbnail parameter
            let thumbnailUrl = file.thumbnailLink;
            if (!thumbnailUrl && file.id) {
                // Generate thumbnail URL: https://drive.google.com/thumbnail?id={fileId}&sz=w400-h400
                thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400-h400`;
            }

            // Use webContentLink for download, fallback to webViewLink
            const downloadUrl = file.webContentLink || file.webViewLink || '';

            return {
                id: file.id,
                name: file.name,
                thumbnailUrl: thumbnailUrl || downloadUrl,
                downloadUrl: downloadUrl,
                mimeType: file.mimeType || 'image/jpeg',
            };
        });

        console.log('✅ [listGoogleDriveImages] Successfully processed', images.length, 'images');

        return {
            images,
            nextPageToken: data.nextPageToken || undefined,
        };
    } catch (error) {
        console.error('❌ [listGoogleDriveImages] Error listing images:', error);
        if (error instanceof Error) {
            console.error('❌ [listGoogleDriveImages] Error message:', error.message);
            console.error('❌ [listGoogleDriveImages] Error stack:', error.stack);
        }
        throw error;
    }
}

/**
 * Get folder name from Google Drive folder ID
 */
export async function getGoogleDriveFolderName(folderId: string): Promise<string> {
    console.log('📁 [getGoogleDriveFolderName] Fetching folder name for:', folderId);

    if (!folderId) {
        throw new Error('Folder ID is required');
    }

    const accessToken = await getGoogleDriveAccessToken();

    try {
        const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [getGoogleDriveFolderName] Error:', errorText);
            throw new Error(`Failed to fetch folder name: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ [getGoogleDriveFolderName] Folder name:', data.name);
        return data.name || 'Unknown Folder';
    } catch (error) {
        console.error('❌ [getGoogleDriveFolderName] Error:', error);
        throw error;
    }
}

/**
 * Get Google Drive file metadata by file ID
 */
export async function getGoogleDriveFile(fileId: string): Promise<GoogleDriveImage> {
    console.log('📄 [getGoogleDriveFile] Fetching file metadata for:', fileId);

    if (!fileId) {
        throw new Error('File ID is required');
    }

    const accessToken = await getGoogleDriveAccessToken();

    try {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [getGoogleDriveFile] Error:', errorText);
            if (response.status === 404) {
                throw new Error(`File not found: ${fileId}`);
            }
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const file = await response.json();

        // Use thumbnailLink if available, otherwise generate thumbnail URL
        let thumbnailUrl = file.thumbnailLink;
        if (!thumbnailUrl && file.id) {
            thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400-h400`;
        }

        // Use webContentLink for download, fallback to webViewLink
        const downloadUrl = file.webContentLink || file.webViewLink || '';

        const result: GoogleDriveImage = {
            id: file.id,
            name: file.name,
            thumbnailUrl: thumbnailUrl || downloadUrl,
            downloadUrl: downloadUrl,
            mimeType: file.mimeType || 'image/jpeg',
        };

        console.log('✅ [getGoogleDriveFile] Successfully fetched file:', file.name);
        return result;
    } catch (error) {
        console.error('❌ [getGoogleDriveFile] Error:', error);
        throw error;
    }
}
