/**
 * CLOUDINARY INTEGRATION - COMMENTED OUT
 * 
 * This file contains modular Cloudinary integration code organized into separate concerns:
 * - Configuration module (Cloudinary SDK setup)
 * - Image listing module (listCloudinaryImages)
 * 
 * To re-enable Cloudinary:
 * 1. Uncomment all code below
 * 2. Uncomment Cloudinary page in app/(visitor)/cloudinary/page.tsx
 * 3. Uncomment Cloudinary API route in app/api/cloudinary/photos/route.ts
 * 4. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in .env.local
 */

// import { v2 as cloudinary } from 'cloudinary';

// ============================================================================
// CONFIGURATION MODULE
// ============================================================================
// const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
// const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
// const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
//     console.warn('Cloudinary credentials are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local');
// }

// cloudinary.config({
//     cloud_name: CLOUDINARY_CLOUD_NAME,
//     api_key: CLOUDINARY_API_KEY,
//     api_secret: CLOUDINARY_API_SECRET,
//     secure: true,
// });

// ============================================================================
// IMAGE LISTING MODULE
// ============================================================================

// /**
//  * List images from Cloudinary
//  * 
//  * @param nextCursor - Optional cursor for pagination (Cloudinary uses 'next_cursor')
//  * @returns Object containing images array and nextCursor for pagination
//  */
// export async function listCloudinaryImages(nextCursor?: string) {
//     try {
//         // Fetch images from the root folder (or you can specify a prefix/folder)
//         const result = await cloudinary.api.resources({
//             type: 'upload',
//             resource_type: 'image',
//             max_results: 50,
//             next_cursor: nextCursor,
//             direction: 'desc', // Newest first
//         });

//         const images = result.resources.map((resource: any) => ({
//             id: resource.public_id,
//             name: resource.filename,
//             link: resource.secure_url,
//             thumbnailUrl: resource.secure_url.replace('/upload/', '/upload/c_fill,w_400,h_400/'), // Cloudinary transformation for thumbnail
//             width: resource.width,
//             height: resource.height,
//             format: resource.format,
//             createdAt: resource.created_at,
//         }));

//         return {
//             images,
//             nextCursor: result.next_cursor,
//         };
//     } catch (error) {
//         console.error('❌ [listCloudinaryImages] Error:', error);
//         throw error;
//     }
// }
