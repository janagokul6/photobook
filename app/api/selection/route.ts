import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import { getGoogleDriveFolderName } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoIds, folderId, folderName } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: photoIds array is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get client IP and user agent for metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // If folderId is provided but folderName is not, fetch it from Google Drive
    let finalFolderName = folderName;
    if (folderId && !folderName) {
      try {
        finalFolderName = await getGoogleDriveFolderName(folderId);
      } catch (error) {
        console.error('Failed to fetch folder name:', error);
        // Continue without folder name if fetch fails
      }
    }

    const submission = await Submission.create({
      selectedPhotoIds: photoIds,
      folderId: folderId || undefined,
      folderName: finalFolderName || undefined,
      metadata: {
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      submissionId: submission.submissionId,
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

