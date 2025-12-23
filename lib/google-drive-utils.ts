/**
 * Extract folder ID from various Google Drive URL formats
 * Supports:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/1/folders/FOLDER_ID
 * - https://drive.google.com/open?id=FOLDER_ID
 * - Direct folder ID
 */
export function extractFolderIdFromUrl(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return null;
  }

  // If it's already just an ID (no slashes, no special chars except alphanumeric, dash, underscore)
  if (/^[a-zA-Z0-9_-]+$/.test(urlOrId.trim())) {
    return urlOrId.trim();
  }

  const trimmed = urlOrId.trim();

  // Pattern 1: /folders/FOLDER_ID
  const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch) {
    return foldersMatch[1];
  }

  // Pattern 2: ?id=FOLDER_ID or &id=FOLDER_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return idMatch[1];
  }

  return null;
}

/**
 * Validate if a string looks like a valid Google Drive folder ID
 */
export function isValidFolderId(folderId: string): boolean {
  if (!folderId || typeof folderId !== 'string') {
    return false;
  }
  // Google Drive IDs are typically 33 characters, alphanumeric with dashes/underscores
  return /^[a-zA-Z0-9_-]{20,}$/.test(folderId.trim());
}

/**
 * Generate a shareable link for a folder
 */
export function generateFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
