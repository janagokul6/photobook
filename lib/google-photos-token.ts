import connectDB from './db';
import Token from './models/Token';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google credentials are missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
}

/**
 * Get a valid Google Photos access token, refreshing if necessary
 */
export async function getGooglePhotosAccessToken(): Promise<string> {
    console.log('🔍 [getGooglePhotosAccessToken] Starting token retrieval...');
    await connectDB();

    const tokenDoc = await Token.getToken('googlephotos');

    if (!tokenDoc) {
        console.error('❌ [getGooglePhotosAccessToken] No Google Photos token found in database');
        throw new Error('No Google Photos token found. Please sign in with Google Photos via admin panel first.');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiresAt = new Date(tokenDoc.expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now.getTime() >= expiresAt.getTime() - bufferTime) {
        console.log('🔄 [getGooglePhotosAccessToken] Token expired, refreshing...');
        await refreshGooglePhotosAccessToken(tokenDoc.refreshToken);
        const updatedToken = await Token.getToken('googlephotos');
        if (!updatedToken) return '';
        return updatedToken.accessToken;
    }

    return tokenDoc.accessToken;
}

/**
 * Refresh Google Photos access token
 */
export async function refreshGooglePhotosAccessToken(refreshToken: string): Promise<void> {
    console.log('🔄 [refreshGooglePhotosAccessToken] Refreshing token...');

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
            console.error('❌ [refreshGooglePhotosAccessToken] Error response:', errorText);
            throw new Error(`Failed to refresh token: ${response.statusText}`);
        }

        const data = await response.json();

        const expiresIn = data.expires_in || 3600;

        await Token.updateToken(
            'googlephotos',
            data.refresh_token || refreshToken, // Google may or may not return a new refresh token
            data.access_token,
            expiresIn
        );

        console.log('✅ [refreshGooglePhotosAccessToken] Token refreshed');
    } catch (error) {
        console.error('❌ [refreshGooglePhotosAccessToken] Error:', error);
        throw error;
    }
}
