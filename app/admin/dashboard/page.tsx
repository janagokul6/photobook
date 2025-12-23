import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubmissionList from '@/components/admin/SubmissionList';
import LogoutButton from '@/components/admin/LogoutButton';
import FolderManager from '@/components/admin/FolderManager';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';

async function getSubmissions() {
  await connectDB();
  const submissions = await Submission.find()
    .sort({ submittedAt: -1 })
    .limit(100)
    .lean();

  return submissions.map((sub: any) => ({
    submissionId: sub.submissionId,
    selectedPhotoIds: sub.selectedPhotoIds,
    submittedAt: sub.submittedAt.toISOString(),
    photoCount: sub.selectedPhotoIds.length,
    folderId: sub.folderId || undefined,
    folderName: sub.folderName || undefined,
  }));
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  const initialSubmissions = await getSubmissions();

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">View and manage photo submissions</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{session.user?.name || session.user?.email}</span>
              </span>
              <LogoutButton clearTokens={true} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <FolderManager />
        <SubmissionList initialSubmissions={initialSubmissions} />
      </main>
    </div>
  );
}

