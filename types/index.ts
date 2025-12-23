export interface MediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata?: {
    creationTime?: string;
    width?: string;
    height?: string;
  };
}

export interface PhotosResponse {
  mediaItems: MediaItem[];
  nextPageToken?: string;
}

export interface SubmissionRequest {
  photoIds: string[];
}

export interface SubmissionResponse {
  submissionId: string;
}

export interface AdminSubmission {
  submissionId: string;
  selectedPhotoIds: string[];
  submittedAt: string;
  photoCount: number;
  folderId?: string;
  folderName?: string;
}

