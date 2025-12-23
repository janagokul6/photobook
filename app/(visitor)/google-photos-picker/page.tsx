'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PhotoCard from '@/components/visitor/PhotoCard';
import SelectionPanel from '@/components/visitor/SelectionPanel';
import { openPhotosPicker } from '@/lib/google-photos-picker';
import { MediaItem } from '@/types';

interface PickerPhoto {
    id: string;
    baseUrl: string;
    filename: string;
    mimeType: string;
    thumbnailUrl?: string;
}

export default function GooglePhotosPickerPage() {
    const { data: session, status } = useSession();
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
    const [pickedPhotos, setPickedPhotos] = useState<PickerPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pickerReady, setPickerReady] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [developerKey, setDeveloperKey] = useState<string | null>(null);

    // Check if picker API is available and get access token
    useEffect(() => {
        if (status !== 'authenticated') {
            return;
        }

        // Wait for Picker API script to load, then get token
        const initializePicker = async () => {
            try {
                // First, wait for the script to load
                const { waitForPickerAPI } = await import('@/lib/google-photos-picker');
                
                // Wait up to 10 seconds for the script to load
                await waitForPickerAPI();
                
                console.log('Photos Picker API loaded, fetching token...');
                
                // Fetch access token for picker
                const res = await fetch('/api/google-photos-picker/token');
                const data = await res.json();
                
                if (data.accessToken) {
                    setAccessToken(data.accessToken);
                    setDeveloperKey(data.developerKey);
                    setPickerReady(true);
                    console.log('Photos Picker ready!');
                } else {
                    const errorMsg = data.error || 'Failed to get access token';
                    if (data.needsAuth) {
                        setError('Please sign in with Google Photos via the admin panel first to authorize access.');
                    } else {
                        setError(errorMsg);
                    }
                    console.error('Token fetch error:', data);
                }
            } catch (err) {
                console.error('Failed to initialize Photos Picker:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize Photos Picker. Make sure the Picker API script is loaded.');
            }
        };

        initializePicker();
    }, [status]);

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

    const handlePickPhotos = async () => {
        if (!accessToken || !developerKey) {
            setError('Photos Picker not ready. Please wait...');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const photos = await openPhotosPicker({
                accessToken,
                developerKey,
                showAlbums: true,
                maxPhotos: 50,
            });

            if (photos.length > 0) {
                setPickedPhotos(prev => {
                    // Merge with existing photos, avoiding duplicates
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPhotos = photos.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPhotos];
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to open Photos Picker');
            console.error('Photos Picker error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        const allIds = pickedPhotos.map(p => p.id);
        setSelectedPhotoIds(new Set(allIds));
    };

    const handleDeselectAll = () => {
        setSelectedPhotoIds(new Set());
    };

    const handleClearPicked = () => {
        setPickedPhotos([]);
        setSelectedPhotoIds(new Set());
    };

    // Convert Set to Array for SelectionPanel
    const selectedPhotoIdsArray = useMemo(() => Array.from(selectedPhotoIds), [selectedPhotoIds]);

    // Convert PickerPhoto to MediaItem format for PhotoCard
    const photosForGallery: Array<MediaItem & { thumbnailUrl?: string }> = pickedPhotos.map(photo => ({
        id: photo.id,
        baseUrl: photo.baseUrl,
        mimeType: photo.mimeType,
        filename: photo.filename,
        thumbnailUrl: photo.thumbnailUrl || photo.baseUrl,
    }));

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Please sign in with Google Photos to use the Photos Picker</p>
                    <a
                        href="/admin/login"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            <header className="bg-[#4285F4] text-white border-b border-blue-600 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Google Photos Picker</h1>
                    <p className="text-sm text-blue-100 mt-1">Select photos from your Google Photos library</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <button
                        onClick={handlePickPhotos}
                        disabled={!pickerReady || loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Opening Picker...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Pick Photos from Google Photos
                            </>
                        )}
                    </button>

                    {pickedPhotos.length > 0 && (
                        <button
                            onClick={handleClearPicked}
                            className="ml-4 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear All
                        </button>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm font-medium mb-2">{error}</p>
                            {error.includes('log in') && (
                                <div className="mt-3">
                                    <a
                                        href="/admin/login"
                                        className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                    >
                                        Go to Admin Login
                                    </a>
                                    <p className="text-red-700 text-xs mt-2">
                                        After logging in with Google, return here to use the Photos Picker.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!pickerReady && !error && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm">Initializing Photos Picker...</p>
                        </div>
                    )}
                </div>

                {pickedPhotos.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg">No photos selected yet</p>
                        <p className="text-gray-400 text-sm mt-2">Click "Pick Photos from Google Photos" to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                        {photosForGallery.map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={{
                                    id: photo.id,
                                    thumbnailUrl: photo.thumbnailUrl || photo.baseUrl,
                                    filename: photo.filename,
                                }}
                                isSelected={selectedPhotoIds.has(photo.id)}
                                onToggle={handleToggleSelection}
                            />
                        ))}
                    </div>
                )}
            </main>

            {pickedPhotos.length > 0 && (
                <SelectionPanel
                    selectedCount={selectedPhotoIds.size}
                    totalPhotos={pickedPhotos.length}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    selectedPhotoIds={selectedPhotoIdsArray}
                />
            )}
        </div>
    );
}
