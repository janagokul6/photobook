'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SelectionPanelProps {
  selectedCount: number;
  totalPhotos: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  selectedPhotoIds: string[];
  folderId?: string;
}

export default function SelectionPanel({
  selectedCount,
  totalPhotos,
  onSelectAll,
  onDeselectAll,
  selectedPhotoIds,
  folderId,
}: SelectionPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (selectedPhotoIds.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: selectedPhotoIds,
          folderId: folderId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit selection');
      }

      const data = await response.json();
      router.push(`/thank-you?submissionId=${data.submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit selection');
      setIsSubmitting(false);
    }
  };

  const allSelected = selectedCount === totalPhotos && totalPhotos > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-blue-600">{selectedCount}</span>
              <span className="text-gray-600"> photo{selectedCount !== 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                disabled={totalPhotos === 0}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={selectedCount === 0 || isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                `Submit Selection${selectedCount > 0 ? ` (${selectedCount})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

