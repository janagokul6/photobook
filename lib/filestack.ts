/**
 * Filestack Integration
 * 
 * API documentation: https://www.filestack.com/docs/
 * Note: Actual API endpoints and response formats may vary. Adjust based on official documentation.
 */

const FILESTACK_API_KEY = process.env.FILESTACK_API_KEY;
const FILESTACK_BASE_URL = process.env.FILESTACK_BASE_URL || 'https://www.filestackapi.com/api';

if (!FILESTACK_API_KEY) {
    console.warn('Filestack API key is missing. Please set FILESTACK_API_KEY in .env.local');
}

/**
 * Get Filestack API key from environment
 */
export function getFilestackApiKey(): string {
    if (!FILESTACK_API_KEY) {
        throw new Error('Filestack API key is not configured. Please set FILESTACK_API_KEY in .env.local');
    }
    return FILESTACK_API_KEY;
}

export interface FilestackImage {
    id: string;
    name: string;
    thumbnailUrl: string;
    downloadUrl: string;
    mimeType: string;
}

export interface FilestackImagesResult {
    images: FilestackImage[];
    nextPageToken?: string;
}

/**
 * List images from Filestack store/library or folder
 * 
 * @param folderId - Optional folder/path to filter by. If not provided, lists all images from store
 * @param pageToken - Optional pagination token
 * @param pageSize - Number of images per page (default: 50)
 */
export async function listFilestackImages(
    folderId?: string,
    pageToken?: string,
    pageSize: number = 50
): Promise<FilestackImagesResult> {
    console.log('📸 [listFilestackImages] Starting to fetch images...');
    console.log('📊 [listFilestackImages] Parameters:', { folderId, pageToken, pageSize });

    const apiKey = getFilestackApiKey();

    try {
        // Build API endpoint - Filestack typically uses /store/list or /files endpoint
        // Adjust based on actual Filestack API documentation
        let url = new URL(`${FILESTACK_BASE_URL}/store/list`);
        
        // Add API key as query parameter or header (check actual API docs)
        url.searchParams.append('key', apiKey);
        
        // Add query parameters
        url.searchParams.append('limit', pageSize.toString());
        
        if (folderId) {
            // Filter by folder/path - adjust parameter name based on actual API
            url.searchParams.append('path', folderId);
        }
        
        if (pageToken) {
            // Pagination - may be 'cursor', 'token', 'offset', etc.
            url.searchParams.append('cursor', pageToken);
        }

        // Filter for images only
        url.searchParams.append('mimetype', 'image/*');

        console.log('🌐 [listFilestackImages] Request URL:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Some Filestack APIs may require API key in header instead
                // 'Authorization': `Bearer ${apiKey}`,
            },
        });

        console.log('📥 [listFilestackImages] Response received');
        console.log('📊 [listFilestackImages] Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [listFilestackImages] Filestack API error!');
            console.error('❌ [listFilestackImages] Status:', response.status, response.statusText);
            console.error('❌ [listFilestackImages] Error response body:', errorText);

            if (response.status === 404) {
                throw new Error('Folder or store not found. Please check the folder ID.');
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication failed. Please check your Filestack API key.');
            }

            throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ [listFilestackImages] Successfully received response from Filestack API');

        // Map response data - adjust based on actual API response structure
        // Common patterns:
        // - data.files or data.items or data.results
        // - data.next_cursor or data.pagination.next
        const files = data.files || data.items || data.results || [];
        
        const images: FilestackImage[] = files
            .filter((file: any) => {
                // Filter for images only - may already be filtered by mimetype param
                const mimeType = file.mimetype || file.mime_type || file.type || '';
                return mimeType.startsWith('image/');
            })
            .map((file: any) => {
                // Map file to our format
                // Adjust field names based on actual API response
                const fileId = file.handle || file.url || file.id || file._id;
                const fileName = file.filename || file.name || file.title || `image-${fileId}`;
                
                // Filestack provides URLs via handle - construct full URL
                // Format: https://cdn.filestackcontent.com/{handle} or use file.url if provided
                let fileUrl = file.url || file.source_url || '';
                if (!fileUrl && file.handle) {
                    fileUrl = `https://cdn.filestackcontent.com/${file.handle}`;
                }
                
                // Generate thumbnail URL using Filestack transformation API
                // Format: https://cdn.filestackcontent.com/{transformations}/{handle}
                let thumbnailUrl = file.thumbnail_url || file.thumbnail || '';
                if (!thumbnailUrl && fileUrl) {
                    if (file.handle) {
                        // Use Filestack transformation API
                        thumbnailUrl = `https://cdn.filestackcontent.com/resize=width:400,height:400,fit:clip/${file.handle}`;
                    } else {
                        thumbnailUrl = fileUrl;
                    }
                }

                return {
                    id: fileId,
                    name: fileName,
                    thumbnailUrl: thumbnailUrl || fileUrl,
                    downloadUrl: fileUrl,
                    mimeType: file.mimetype || file.mime_type || file.type || 'image/jpeg',
                };
            });

        // Extract next page token - adjust based on actual API response
        const nextPageToken = data.next_cursor || data.cursor || data.pagination?.next || data.next_page_token || undefined;

        console.log('✅ [listFilestackImages] Successfully processed', images.length, 'images');
        console.log('📊 [listFilestackImages] Has next page:', !!nextPageToken);

        return {
            images,
            nextPageToken,
        };
    } catch (error) {
        console.error('❌ [listFilestackImages] Error listing images:', error);
        if (error instanceof Error) {
            console.error('❌ [listFilestackImages] Error message:', error.message);
            console.error('❌ [listFilestackImages] Error stack:', error.stack);
        }
        throw error;
    }
}

/**
 * Get Filestack folder/path name
 * 
 * Note: Filestack may not have explicit folder objects. This may return the path string.
 * 
 * @param folderId - Folder/path identifier
 */
export async function getFilestackFolderName(folderId: string): Promise<string> {
    console.log('📁 [getFilestackFolderName] Fetching folder name for:', folderId);

    if (!folderId) {
        throw new Error('Folder ID is required');
    }

    // If Filestack uses path-based folders, the folderId might be the path itself
    // Extract folder name from path (last segment)
    if (folderId.includes('/')) {
        const parts = folderId.split('/').filter(Boolean);
        return parts[parts.length - 1] || folderId;
    }

    // If Filestack has explicit folder objects, fetch metadata
    const apiKey = getFilestackApiKey();

    try {
        // Adjust endpoint based on actual Filestack API documentation
        // This is a placeholder - Filestack may not have explicit folder metadata endpoints
        const url = `${FILESTACK_BASE_URL}/store/metadata?key=${apiKey}&path=${encodeURIComponent(folderId)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // If folder metadata endpoint doesn't exist, return folderId as name
            console.log('📁 [getFilestackFolderName] Using folderId as name (metadata endpoint may not exist)');
            return folderId;
        }

        const data = await response.json();
        // Adjust field name based on actual API response
        const folderName = data.name || data.folder_name || data.title || folderId;
        console.log('✅ [getFilestackFolderName] Folder name:', folderName);
        return folderName;
    } catch (error) {
        console.error('❌ [getFilestackFolderName] Error:', error);
        // Return folderId as fallback
        return folderId;
    }
}

/**
 * Get Filestack file metadata by file handle/ID
 * 
 * @param fileId - File handle or ID
 */
export async function getFilestackFile(fileId: string): Promise<FilestackImage> {
    console.log('📄 [getFilestackFile] Fetching file metadata for:', fileId);

    if (!fileId) {
        throw new Error('File ID is required');
    }

    const apiKey = getFilestackApiKey();

    try {
        // Filestack metadata endpoint
        // Format: /store/metadata?handle={handle} or /files/{id}
        const url = `${FILESTACK_BASE_URL}/store/metadata?key=${apiKey}&handle=${encodeURIComponent(fileId)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [getFilestackFile] Error:', errorText);
            if (response.status === 404) {
                throw new Error(`File not found: ${fileId}`);
            }
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const file = await response.json();

        // Map to our format - adjust field names based on actual API response
        const handle = file.handle || fileId;
        const fileUrl = file.url || `https://cdn.filestackcontent.com/${handle}`;
        
        // Generate thumbnail using Filestack transformation
        let thumbnailUrl = file.thumbnail_url || file.thumbnail || '';
        if (!thumbnailUrl && handle) {
            thumbnailUrl = `https://cdn.filestackcontent.com/resize=width:400,height:400,fit:clip/${handle}`;
        }

        const result: FilestackImage = {
            id: handle,
            name: file.filename || file.name || file.title || `image-${handle}`,
            thumbnailUrl: thumbnailUrl || fileUrl,
            downloadUrl: fileUrl,
            mimeType: file.mimetype || file.mime_type || file.type || 'image/jpeg',
        };

        console.log('✅ [getFilestackFile] Successfully fetched file:', result.name);
        return result;
    } catch (error) {
        console.error('❌ [getFilestackFile] Error:', error);
        throw error;
    }
}

