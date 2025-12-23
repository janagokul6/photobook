/**
 * Gumlet Integration
 * 
 * API documentation: https://docs.gumlet.com/
 * Note: Actual API endpoints and response formats may vary. Adjust based on official documentation.
 */

const GUMLET_API_KEY = process.env.GUMLET_API_KEY;
const GUMLET_BASE_URL = process.env.GUMLET_BASE_URL || 'https://api.gumlet.com';

if (!GUMLET_API_KEY) {
    console.warn('Gumlet API key is missing. Please set GUMLET_API_KEY in .env.local');
}

/**
 * Get Gumlet API key from environment
 */
export function getGumletApiKey(): string {
    if (!GUMLET_API_KEY) {
        throw new Error('Gumlet API key is not configured. Please set GUMLET_API_KEY in .env.local');
    }
    return GUMLET_API_KEY;
}

export interface GumletImage {
    id: string;
    name: string;
    thumbnailUrl: string;
    downloadUrl: string;
    mimeType: string;
}

export interface GumletImagesResult {
    images: GumletImage[];
    nextPageToken?: string;
}

/**
 * List images from Gumlet library or folder
 * 
 * @param folderId - Optional folder ID to filter by. If not provided, lists all images from library
 * @param pageToken - Optional pagination token
 * @param pageSize - Number of images per page (default: 50)
 */
export async function listGumletImages(
    folderId?: string,
    pageToken?: string,
    pageSize: number = 50
): Promise<GumletImagesResult> {
    console.log('📸 [listGumletImages] Starting to fetch images...');
    console.log('📊 [listGumletImages] Parameters:', { folderId, pageToken, pageSize });

    const apiKey = getGumletApiKey();

    try {
        // Build API endpoint - adjust based on actual Gumlet API documentation
        // Common pattern: /v1/assets or /v1/library/assets or similar
        let url = new URL(`${GUMLET_BASE_URL}/v1/assets`);
        
        // Add query parameters
        // Note: Actual parameter names may differ (e.g., 'limit', 'offset', 'cursor', 'page')
        url.searchParams.append('limit', pageSize.toString());
        
        if (folderId) {
            // Filter by folder - adjust parameter name based on actual API
            url.searchParams.append('folder_id', folderId);
        }
        
        if (pageToken) {
            // Pagination - may be 'cursor', 'page_token', 'offset', etc.
            url.searchParams.append('cursor', pageToken);
        }

        console.log('🌐 [listGumletImages] Request URL:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📥 [listGumletImages] Response received');
        console.log('📊 [listGumletImages] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [listGumletImages] Gumlet API error!');
            console.error('❌ [listGumletImages] Status:', response.status, response.statusText);
            console.error('❌ [listGumletImages] Error response body:', errorText);

            if (response.status === 404) {
                throw new Error('Folder or library not found. Please check the folder ID.');
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication failed. Please check your Gumlet API key.');
            }

            throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ [listGumletImages] Successfully received response from Gumlet API');

        // Map response data - adjust based on actual API response structure
        // Common patterns:
        // - data.assets or data.items or data.results
        // - data.next_cursor or data.next_page_token or data.pagination.next
        const assets = data.assets || data.items || data.results || [];
        
        const images: GumletImage[] = assets
            .filter((asset: any) => {
                // Filter for images only - adjust mime type check based on actual API
                const mimeType = asset.mime_type || asset.mimeType || asset.content_type || '';
                return mimeType.startsWith('image/');
            })
            .map((asset: any) => {
                // Map asset to our format
                // Adjust field names based on actual API response
                const assetId = asset.id || asset.asset_id || asset._id;
                const assetName = asset.name || asset.filename || asset.title || `image-${assetId}`;
                const assetUrl = asset.url || asset.source_url || asset.original_url || '';
                
                // Generate thumbnail URL - Gumlet typically supports URL transformations
                // Common pattern: append transformation parameters or use thumbnail field
                let thumbnailUrl = asset.thumbnail_url || asset.thumbnail || '';
                if (!thumbnailUrl && assetUrl) {
                    // Generate thumbnail using Gumlet transformation API
                    // Adjust transformation syntax based on actual API
                    thumbnailUrl = assetUrl.replace(/\/upload\//, '/upload/w_400,h_400,c_fill/') || assetUrl;
                }

                return {
                    id: assetId,
                    name: assetName,
                    thumbnailUrl: thumbnailUrl || assetUrl,
                    downloadUrl: assetUrl,
                    mimeType: asset.mime_type || asset.mimeType || asset.content_type || 'image/jpeg',
                };
            });

        // Extract next page token - adjust based on actual API response
        const nextPageToken = data.next_cursor || data.next_page_token || data.pagination?.next || data.next_cursor_token || undefined;

        console.log('✅ [listGumletImages] Successfully processed', images.length, 'images');
        console.log('📊 [listGumletImages] Has next page:', !!nextPageToken);

        return {
            images,
            nextPageToken,
        };
    } catch (error) {
        console.error('❌ [listGumletImages] Error listing images:', error);
        if (error instanceof Error) {
            console.error('❌ [listGumletImages] Error message:', error.message);
            console.error('❌ [listGumletImages] Error stack:', error.stack);
        }
        throw error;
    }
}

/**
 * Get Gumlet folder name by folder ID
 * 
 * @param folderId - Folder ID
 */
export async function getGumletFolderName(folderId: string): Promise<string> {
    console.log('📁 [getGumletFolderName] Fetching folder name for:', folderId);

    if (!folderId) {
        throw new Error('Folder ID is required');
    }

    const apiKey = getGumletApiKey();

    try {
        // Adjust endpoint based on actual Gumlet API documentation
        const url = `${GUMLET_BASE_URL}/v1/folders/${folderId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [getGumletFolderName] Error:', errorText);
            throw new Error(`Failed to fetch folder name: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Adjust field name based on actual API response
        const folderName = data.name || data.folder_name || data.title || 'Unknown Folder';
        console.log('✅ [getGumletFolderName] Folder name:', folderName);
        return folderName;
    } catch (error) {
        console.error('❌ [getGumletFolderName] Error:', error);
        throw error;
    }
}

/**
 * Get Gumlet file metadata by file ID
 * 
 * @param fileId - File/Asset ID
 */
export async function getGumletFile(fileId: string): Promise<GumletImage> {
    console.log('📄 [getGumletFile] Fetching file metadata for:', fileId);

    if (!fileId) {
        throw new Error('File ID is required');
    }

    const apiKey = getGumletApiKey();

    try {
        // Adjust endpoint based on actual Gumlet API documentation
        const url = `${GUMLET_BASE_URL}/v1/assets/${fileId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [getGumletFile] Error:', errorText);
            if (response.status === 404) {
                throw new Error(`File not found: ${fileId}`);
            }
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const asset = await response.json();

        // Map to our format - adjust field names based on actual API response
        const assetUrl = asset.url || asset.source_url || asset.original_url || '';
        let thumbnailUrl = asset.thumbnail_url || asset.thumbnail || '';
        if (!thumbnailUrl && assetUrl) {
            thumbnailUrl = assetUrl.replace(/\/upload\//, '/upload/w_400,h_400,c_fill/') || assetUrl;
        }

        const result: GumletImage = {
            id: asset.id || asset.asset_id || asset._id,
            name: asset.name || asset.filename || asset.title || `image-${fileId}`,
            thumbnailUrl: thumbnailUrl || assetUrl,
            downloadUrl: assetUrl,
            mimeType: asset.mime_type || asset.mimeType || asset.content_type || 'image/jpeg',
        };

        console.log('✅ [getGumletFile] Successfully fetched file:', result.name);
        return result;
    } catch (error) {
        console.error('❌ [getGumletFile] Error:', error);
        throw error;
    }
}

