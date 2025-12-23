/**
 * DROPBOX INTEGRATION - COMMENTED OUT
 * 
 * This file contains modular Dropbox integration code organized into separate concerns:
 * - Token management (getDropboxAccessToken, refreshDropboxAccessToken)
 * - Image listing (listDropboxImages)
 * 
 * To re-enable Dropbox:
 * 1. Uncomment all code below
 * 2. Uncomment DropboxProvider in lib/auth.ts
 * 3. Uncomment Dropbox login handler in app/admin/login/page.tsx
 * 4. Uncomment Dropbox usage in app/api/photos/route.ts
 * 5. Uncomment test endpoint in app/api/test-dropbox/route.ts
 */

// import { Dropbox } from 'dropbox';
// import connectDB from './db';
// import Token from './models/Token';

// ============================================================================
// CONFIGURATION MODULE
// ============================================================================
// const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
// const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

// if (!DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
//     console.warn('Dropbox credentials are missing. Please set DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET in .env.local');
// }

// ============================================================================
// TOKEN MANAGEMENT MODULE
// ============================================================================

// /**
//  * Get a valid Dropbox access token, refreshing if necessary
//  */
// export async function getDropboxAccessToken(): Promise<string> {
//     console.log('🔍 [getDropboxAccessToken] Starting token retrieval...');
//     await connectDB();

//     const tokenDoc = await Token.getToken('dropbox');

//     if (!tokenDoc) {
//         console.error('❌ [getDropboxAccessToken] No Dropbox token found in database');
//         throw new Error('No Dropbox token found. Please log in via admin panel first.');
//     }

//     // Check if token is expired (with 5 minute buffer)
//     const now = new Date();
//     const expiresAt = new Date(tokenDoc.expiresAt);
//     const bufferTime = 5 * 60 * 1000; // 5 minutes

//     if (now.getTime() >= expiresAt.getTime() - bufferTime) {
//         console.log('🔄 [getDropboxAccessToken] Token expired, refreshing...');
//         await refreshDropboxAccessToken(tokenDoc.refreshToken);
//         const updatedToken = await Token.getToken('dropbox');
//         if (!updatedToken) return '';
//         return updatedToken.accessToken;
//     }

//     return tokenDoc.accessToken;
// }

// /**
//  * Refresh Dropbox access token
//  */
// export async function refreshDropboxAccessToken(refreshToken: string): Promise<void> {
//     console.log('🔄 [refreshDropboxAccessToken] Refreshing token...');

//     try {
//         const response = await fetch('https://api.dropbox.com/oauth2/token', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: new URLSearchParams({
//                 grant_type: 'refresh_token',
//                 refresh_token: refreshToken,
//                 client_id: DROPBOX_CLIENT_ID!,
//                 client_secret: DROPBOX_CLIENT_SECRET!,
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`Failed to refresh token: ${response.statusText}`);
//         }

//         const data = await response.json();

//         // Dropbox tokens expire in 14400 seconds (4 hours) usually
//         const expiresIn = data.expires_in;

//         await Token.updateToken(
//             'dropbox',
//             refreshToken, // Dropbox usually doesn't rotate refresh tokens, but if they do, it would be in data.refresh_token
//             data.access_token,
//             expiresIn
//         );

//         console.log('✅ [refreshDropboxAccessToken] Token refreshed');
//     } catch (error) {
//         console.error('❌ [refreshDropboxAccessToken] Error:', error);
//         throw error;
//     }
// }

// ============================================================================
// IMAGE LISTING MODULE
// ============================================================================

// /**
//  * List images from Dropbox
//  */
// export async function listDropboxImages(path: string = '') {
//     const accessToken = await getDropboxAccessToken();
//     const dbx = new Dropbox({ accessToken });

//     try {
//         const response = await dbx.filesListFolder({
//             path: path,
//             recursive: true,
//             include_media_info: true,
//         });

//         // Filter for images
//         const images = response.result.entries.filter(entry => {
//             return entry['.tag'] === 'file' &&
//                 (entry.name.toLowerCase().endsWith('.jpg') ||
//                     entry.name.toLowerCase().endsWith('.jpeg') ||
//                     entry.name.toLowerCase().endsWith('.png') ||
//                     entry.name.toLowerCase().endsWith('.webp'));
//         });

//         // Get temporary links for images (since we can't display them directly from path)
//         // Note: This is slow for many images. In production, you'd want to cache these or use thumbnails.
//         const imagesWithLinks = await Promise.all(images.map(async (image) => {
//             const linkResponse = await dbx.filesGetTemporaryLink({ path: image.path_lower! });
//             return {
//                 id: image.id,
//                 name: image.name,
//                 link: linkResponse.result.link,
//                 path: image.path_lower
//             };
//         }));

//         return imagesWithLinks;
//     } catch (error) {
//         console.error('❌ [listDropboxImages] Error:', error);
//         throw error;
//     }
// }
