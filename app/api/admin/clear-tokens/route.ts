import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Token from '@/lib/models/Token';
import connectDB from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated as admin
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login first' },
                { status: 401 }
            );
        }

        // Connect to database
        await connectDB();

        // Delete all tokens
        const result = await Token.deleteMany({});

        return NextResponse.json({
            success: true,
            message: 'All OAuth tokens cleared successfully',
            deletedCount: result.deletedCount,
            nextSteps: [
                'Logout from your current session',
                'Visit /admin/login',
                'Re-authenticate with your OAuth providers'
            ]
        });
    } catch (error) {
        console.error('Error clearing tokens:', error);
        return NextResponse.json(
            {
                error: 'Failed to clear tokens',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
