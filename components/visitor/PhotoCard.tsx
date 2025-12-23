'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PhotoCardProps {
  photo: {
    id: string;
    thumbnailUrl: string;
    filename: string;
    originalThumbnailUrl?: string;
  };
  isSelected: boolean;
  onToggle: (photoId: string) => void;
  priority?: boolean;
}

export default function PhotoCard({ photo, isSelected, onToggle, priority = false }: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(photo.thumbnailUrl);

  const handleClick = () => {
    onToggle(photo.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div
      className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      {!imageError ? (
        <Image
          src={currentSrc}
          alt={photo.filename}
          fill
          className="object-cover select-none"
          draggable={false}
          unoptimized
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          onError={() => {
            // If proxy fails and we have original URL, try that as fallback
            if (currentSrc.startsWith('/api/google-drive/image') && photo.originalThumbnailUrl) {
              setCurrentSrc(photo.originalThumbnailUrl);
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      )}
      
      {/* Checkbox overlay */}
      <div
        className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white/80 border-white'
        }`}
      >
        {isSelected && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      {/* Overlay on hover */}
      <div
        className={`absolute inset-0 transition-opacity ${
          isSelected ? 'bg-blue-600/20' : 'bg-black/0 group-hover:bg-black/10'
        }`}
      />
    </div>
  );
}

