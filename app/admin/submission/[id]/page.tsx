import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubmissionDetail from '@/components/admin/SubmissionDetail';

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  const { id } = await params;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SubmissionDetail submissionId={id} />
      </main>
    </div>
  );
}

