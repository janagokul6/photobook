'use client';

import { useState, useMemo } from 'react';
import PhotoGallery from '@/components/visitor/PhotoGallery';
import SelectionPanel from '@/components/visitor/SelectionPanel';

export default function FilestackGalleryPage() {
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
    const [allPhotoIds, setAllPhotoIds] = useState<string[]>([]);
    const [selectAllTrigger, setSelectAllTrigger] = useState(0);

    const handleToggleSelection = (photoId: string) => {
        setSelectedPhotoIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(photoId)) {
                newSet.delete(photoId);
            } else {
                newSet.add(photoId);
            }
            return newSet;
        });
    };

    const handlePhotosLoaded = (photoIds: string[]) => {
        setAllPhotoIds((prev) => {
            const combined = [...prev, ...photoIds];
            return Array.from(new Set(combined));
        });
    };

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

    return (
        <div className="min-h-screen pb-32">
            <header className="bg-[#FF6B35] text-white border-b border-orange-600 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Filestack Gallery</h1>
                    <p className="text-sm text-orange-100 mt-1">Select photos from your Filestack library</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <PhotoGallery
                    selectedPhotoIds={selectedPhotoIds}
                    onToggleSelection={handleToggleSelection}
                    onPhotosLoaded={handlePhotosLoaded}
                    selectAllTrigger={selectAllTrigger}
                    apiEndpoint="/api/filestack/photos"
                />
            </main>

            <SelectionPanel
                selectedCount={selectedPhotoIds.size}
                totalPhotos={allPhotoIds.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                selectedPhotoIds={selectedPhotoIdsArray}
            />
        </div>
    );
}

