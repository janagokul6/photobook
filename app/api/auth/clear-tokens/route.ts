import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Token from '@/lib/models/Token';

/**
 * API endpoint to clear stored OAuth tokens from database
 * Only accessible to authenticated admin users
 */
export async function POST() {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Connect to database and clear tokens
        await connectDB();
        await Token.deleteMany({});

        console.log('✅ Successfully cleared all OAuth tokens from database');

        return NextResponse.json({
            success: true,
            message: 'OAuth tokens cleared successfully',
        });
    } catch (error) {
        console.error('❌ Error clearing tokens:', error);
        return NextResponse.json(
            { error: 'Failed to clear tokens' },
            { status: 500 }
        );
    }
}
