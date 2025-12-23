'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PhotoCard from './PhotoCard';
import { MediaItem, PhotosResponse } from '@/types';

interface PhotoGalleryProps {
  selectedPhotoIds: Set<string>;
  onToggleSelection: (photoId: string) => void;
  onPhotosLoaded?: (photoIds: string[]) => void;
  selectAllTrigger?: number;
  apiEndpoint?: string;
  folderId?: string;
}

export default function PhotoGallery({
  selectedPhotoIds,
  onToggleSelection,
  onPhotosLoaded,
  selectAllTrigger,
  apiEndpoint = '/api/photos',
  folderId
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const hasInitialFetch = useRef(false);
  const onPhotosLoadedRef = useRef(onPhotosLoaded);
  const prevSelectAllTriggerRef = useRef<number | undefined>(undefined);

  // Keep ref updated with latest callback
  useEffect(() => {
    onPhotosLoadedRef.current = onPhotosLoaded;
  }, [onPhotosLoaded]);

  const fetchPhotos = useCallback(async (pageToken?: string) => {
    // Prevent duplicate initial fetches
    if (!pageToken && hasInitialFetch.current) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (pageToken) {
        params.set('pageToken', pageToken);
      }
      params.set('pageSize', '50');
      if (folderId) {
        params.set('folderId', folderId);
      }

      const response = await fetch(`${apiEndpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data: PhotosResponse = await response.json();

      if (pageToken) {
        // Append to existing photos
        setPhotos((prev) => {
          const updated = [...prev, ...data.mediaItems];
          if (onPhotosLoadedRef.current) {
            onPhotosLoadedRef.current(updated.map(p => p.id));
          }
          return updated;
        });
      } else {
        // Initial load
        setPhotos(data.mediaItems);
        if (onPhotosLoadedRef.current) {
          onPhotosLoadedRef.current(data.mediaItems.map(p => p.id));
        }
        hasInitialFetch.current = true;
      }

      setNextPageToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, folderId]);

  useEffect(() => {
    // Reset and fetch when apiEndpoint or folderId changes
    hasInitialFetch.current = false;
    setPhotos([]);
    setNextPageToken(undefined);
    setHasMore(true);
    fetchPhotos();
  }, [apiEndpoint, folderId, fetchPhotos]);

  // Handle select all trigger - only run when selectAllTrigger actually changes
  useEffect(() => {
    // Only run if selectAllTrigger has changed (not just if it's defined)
    if (selectAllTrigger !== undefined && selectAllTrigger !== prevSelectAllTriggerRef.current && photos.length > 0) {
      photos.forEach(photo => {
        if (!selectedPhotoIds.has(photo.id)) {
          onToggleSelection(photo.id);
        }
      });
      prevSelectAllTriggerRef.current = selectAllTrigger;
    }
  }, [selectAllTrigger, photos, onToggleSelection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPhotos(nextPageToken);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, nextPageToken, fetchPhotos]);

  if (error && photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPhotos()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {photos.map((photo, index) => {
          // Use thumbnailUrl if available (e.g., from Google Drive), otherwise transform baseUrl
          const photoWithThumb = photo as MediaItem & { thumbnailUrl?: string; originalThumbnailUrl?: string };
          const thumbnailUrl = photoWithThumb.thumbnailUrl || photo.baseUrl.replace('=d', '=w400-h400');

          return (
            <PhotoCard
              key={photo.id}
              photo={{
                id: photo.id,
                thumbnailUrl,
                filename: photo.filename,
                originalThumbnailUrl: photoWithThumb.originalThumbnailUrl,
              }}
              isSelected={selectedPhotoIds.has(photo.id)}
              onToggle={onToggleSelection}
              priority={index === 0}
            />
          );
        })}
      </div>

      {/* Loading indicator / Observer target */}
      <div ref={observerTarget} className="h-20 flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading more photos...</span>
          </div>
        )}
        {!hasMore && photos.length > 0 && (
          <p className="text-gray-500 text-sm">All photos loaded</p>
        )}
      </div>

      {error && photos.length > 0 && (
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => fetchPhotos(nextPageToken)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

