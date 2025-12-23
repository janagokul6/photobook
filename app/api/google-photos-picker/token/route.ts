import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGooglePhotosAccessToken } from '@/lib/google-photos-token';

/**
 * Get access token for Photos Picker API
 * This endpoint provides the OAuth token needed to initialize the Photos Picker
 */
export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login first' },
                { status: 401 }
            );
        }

        // Get access token (this will refresh if needed)
        // Using Google Photos access token function with 'googlephotos' provider
        const accessToken = await getGooglePhotosAccessToken();

        return NextResponse.json({
            accessToken,
            developerKey: process.env.GOOGLE_CLIENT_ID, // Photos Picker uses client ID as developer key
        });
    } catch (error) {
        console.error('Error getting Photos Picker token:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get access token';
        
        // Provide more specific error messages
        let status = 500;
        if (errorMessage.includes('No Google Photos token found')) {
            status = 401;
        }
        
        return NextResponse.json(
            { 
                error: errorMessage,
                needsAuth: errorMessage.includes('No Google Photos token found'),
            },
            { status }
        );
    }
}
