'use client';

import { useState } from 'react';
import { extractFolderIdFromUrl, isValidFolderId, generateFolderLink } from '@/lib/google-drive-utils';

interface FolderInfo {
  folderId: string;
  folderName: string;
  link: string;
}

export default function FolderManager() {
  const [driveUrl, setDriveUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [folderInfo, setFolderInfo] = useState<FolderInfo | null>(null);

  const handleExtractFolderId = async () => {
    if (!driveUrl.trim()) {
      setError('Please enter a Google Drive URL or folder ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setFolderInfo(null);

    try {
      // Extract folder ID from URL
      const folderId = extractFolderIdFromUrl(driveUrl.trim());

      if (!folderId || !isValidFolderId(folderId)) {
        setError('Invalid Google Drive URL or folder ID. Please check and try again.');
        setLoading(false);
        return;
      }

      // Fetch folder name from API
      const response = await fetch(`/api/google-drive/folder-info?folderId=${encodeURIComponent(folderId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch folder information');
      }

      const data = await response.json();
      const folderName = data.folderName || 'Unknown Folder';
      const link = `/google-drive/${folderId}`;

      setFolderInfo({
        folderId,
        folderName,
        link,
      });

      setSuccess(`Folder ID extracted successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract folder ID');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (folderInfo) {
      const fullUrl = `${window.location.origin}${folderInfo.link}`;
      navigator.clipboard.writeText(fullUrl);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl font-semibold mb-4">Google Drive Folder Management</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter a Google Drive folder URL to generate a unique link for that folder. Visitors can use this link to view and select photos from that specific folder.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Drive Folder URL or Folder ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/FOLDER_ID or just FOLDER_ID"
              className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleExtractFolderId();
                }
              }}
            />
            <button
              onClick={handleExtractFolderId}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Extract & Generate Link'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && !folderInfo && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {folderInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Generated Link</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Folder Name</label>
                <p className="text-blue-900">{folderInfo.folderName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Folder ID</label>
                <p className="text-blue-900 font-mono text-sm">{folderInfo.folderId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Shareable Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}${folderInfo.link}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 text-black rounded text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href={folderInfo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Open Gallery →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
