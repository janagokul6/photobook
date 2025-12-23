'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PhotoGallery from '@/components/visitor/PhotoGallery';
import SelectionPanel from '@/components/visitor/SelectionPanel';

export default function GoogleDriveFolderGalleryPage() {
    const params = useParams();
    const folderId = params.folderId as string;
    
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
    const [allPhotoIds, setAllPhotoIds] = useState<string[]>([]);
    const [selectAllTrigger, setSelectAllTrigger] = useState(0);

    const handleToggleSelection = useCallback((photoId: string) => {
        setSelectedPhotoIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(photoId)) {
                newSet.delete(photoId);
            } else {
                newSet.add(photoId);
            }
            return newSet;
        });
    }, []);

    const handlePhotosLoaded = useCallback((photoIds: string[]) => {
        setAllPhotoIds((prev) => {
            const combined = [...prev, ...photoIds];
            return Array.from(new Set(combined));
        });
    }, []);

    const handleSelectAll = () => {
        // Select all currently loaded photos
        setSelectedPhotoIds(new Set(allPhotoIds));
        setSelectAllTrigger((prev) => prev + 1);
    };

    const handleDeselectAll = () => {
        setSelectedPhotoIds(new Set());
    };

    // Convert Set to Array for SelectionPanel
    const selectedPhotoIdsArray = useMemo(() => Array.from(selectedPhotoIds), [selectedPhotoIds]);

    if (!folderId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg">Invalid folder ID</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            <header className="bg-[#4285F4] text-white border-b border-blue-600 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Google Drive Gallery</h1>
                    <p className="text-sm text-blue-100 mt-1">Select photos from your Google Drive folder</p>
                    <p className="text-xs text-blue-200 mt-1 font-mono">Folder ID: {folderId}</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <PhotoGallery
                    selectedPhotoIds={selectedPhotoIds}
                    onToggleSelection={handleToggleSelection}
                    onPhotosLoaded={handlePhotosLoaded}
                    selectAllTrigger={selectAllTrigger}
                    apiEndpoint="/api/google-drive/photos"
                    folderId={folderId}
                />
            </main>

            <SelectionPanel
                selectedCount={selectedPhotoIds.size}
                totalPhotos={allPhotoIds.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                selectedPhotoIds={selectedPhotoIdsArray}
                folderId={folderId}
            />
        </div>
    );
}
