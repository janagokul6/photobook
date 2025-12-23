'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SubmissionDetailProps {
  submissionId: string;
}

interface SubmissionData {
  submissionId: string;
  selectedPhotoIds: string[];
  submittedAt: string;
  photoCount: number;
}

interface PhotoData {
  id: string;
  thumbnailUrl: string;
  filename: string;
}

export default function SubmissionDetail({ submissionId }: SubmissionDetailProps) {
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/submissions?submissionId=${submissionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }

      const data = await response.json();
      if (data.length === 0) {
        throw new Error('Submission not found');
      }

      const submissionData = data[0];
      setSubmission(submissionData);

      // Fetch photo details for thumbnails
      await fetchPhotoThumbnails(submissionData.selectedPhotoIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoThumbnails = async (photoIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/photos?photoIds=${photoIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photo thumbnails');
      }
      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      console.error('Error fetching photo thumbnails:', err);
      // Set placeholder data
      const photoData: PhotoData[] = photoIds.map((id) => ({
        id,
        thumbnailUrl: '',
        filename: `photo_${id}.jpg`,
      }));
      setPhotos(photoData);
    }
  };

  const handleDownloadIndividual = async (photoId: string) => {
    setDownloading(photoId);
    try {
      const response = await fetch(`/api/admin/download?photoIds=${photoId}`);
      if (!response.ok) {
        throw new Error('Failed to download photo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_${photoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download photo');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!submission) return;

    setDownloading('all');
    try {
      const response = await fetch(`/api/admin/download?submissionId=${submissionId}`);
      if (!response.ok) {
        throw new Error('Failed to download photos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission_${submissionId}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download photos');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading submission...</span>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Submission not found'}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
            <p className="text-sm text-gray-600 mt-1">
              ID: <span className="font-mono">{submission.submissionId}</span>
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Submitted At</p>
            <p className="text-base font-medium">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Photos</p>
            <p className="text-base font-medium">{submission.photoCount}</p>
          </div>
          <div>
            <button
              onClick={handleDownloadAll}
              disabled={downloading === 'all'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {downloading === 'all' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </span>
              ) : (
                'Download All as ZIP'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Selected Photos</h2>
        {photos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No photos to display</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {submission.selectedPhotoIds.map((photoId) => {
              const photo = photos.find((p) => p.id === photoId);
              return (
                <div key={photoId} className="relative group">
                  <div className="aspect-square relative bg-gray-200 rounded-lg overflow-hidden">
                    {photo && photo.thumbnailUrl ? (
                      <Image
                        src={photo.thumbnailUrl}
                        alt={photo.filename}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Loading...</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadIndividual(photoId)}
                    disabled={downloading === photoId}
                    className="mt-2 w-full px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {downloading === photoId ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

