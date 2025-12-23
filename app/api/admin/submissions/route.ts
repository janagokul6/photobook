import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const submissionId = searchParams.get('submissionId');
    const folderId = searchParams.get('folderId');

    // Build query
    const query: any = {};

    if (submissionId) {
      query.submissionId = submissionId;
    }

    if (folderId) {
      query.folderId = folderId;
    }

    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) {
        query.submittedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.submittedAt.$lte = new Date(dateTo);
      }
    }

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(100)
      .lean();

    const result = submissions.map((sub: any) => ({
      submissionId: sub.submissionId,
      selectedPhotoIds: sub.selectedPhotoIds,
      submittedAt: sub.submittedAt.toISOString(),
      photoCount: sub.selectedPhotoIds.length,
      folderId: sub.folderId || undefined,
      folderName: sub.folderName || undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

