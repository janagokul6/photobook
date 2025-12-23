/**
 * Google Photos Picker API wrapper
 * 
 * The Photos Picker API is a client-side JavaScript API that allows users
 * to select photos from their Google Photos library through an interactive dialog.
 * 
 * Documentation: https://developers.google.com/photos/picker
 */


export interface PhotosPickerConfig {
  accessToken: string;
  developerKey: string;
  oAuthToken?: string;
  locale?: string;
  maxPhotos?: number;
  showAlbums?: boolean;
}

export interface PickerPhoto {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  thumbnailUrl?: string;
}

/**
 * Wait for the Photos Picker API script to load
 */
export function waitForPickerAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Picker API can only be used in browser environment'));
      return;
    }

    // Check if already loaded - Google Picker API is on google.picker
    if (window.google?.picker) {
      resolve();
      return;
    }

    // If gapi is available but picker isn't loaded yet, load it
    if (window.gapi && !window.google?.picker) {
      window.gapi.load('picker', {
        callback: () => {
          if (window.google?.picker) {
            resolve();
          } else {
            reject(new Error('Picker API failed to initialize'));
          }
        }
      });
      return;
    }

    // Wait for script to load (check every 100ms, timeout after 15 seconds)
    let attempts = 0;
    const maxAttempts = 150;

    const checkInterval = setInterval(() => {
      attempts++;

      // Try to load picker if gapi is available
      if (window.gapi && !window.google?.picker) {
        clearInterval(checkInterval);
        window.gapi.load('picker', {
          callback: () => {
            if (window.google?.picker) {
              resolve();
            } else {
              reject(new Error('Picker API failed to initialize'));
            }
          }
        });
        return;
      }

      if (window.google?.picker) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('Photos Picker API script failed to load. Make sure the Google API script is included in the page.'));
      }
    }, 100);
  });
}

/**
 * Open Google Photos Picker dialog
 * 
 * @param config Configuration object
 * @returns Promise that resolves with selected photos
 */
export async function openPhotosPicker(
  config: PhotosPickerConfig
): Promise<PickerPhoto[]> {
  if (typeof window === 'undefined') {
    throw new Error('Photos Picker can only be used in browser environment');
  }

  // Wait for API to be available
  await waitForPickerAPI();

  return new Promise((resolve, reject) => {
    try {
      // Google Picker API is on google.picker
      if (!window.google?.picker) {
        reject(new Error('Photos Picker API is not available'));
        return;
      }

      const pickerAPI = window.google.picker;
      const { ViewId, PickerBuilder, Action } = pickerAPI;

      // Create picker builder
      const pickerBuilder = new PickerBuilder();

      // Add photos view - Google Picker API uses ViewId.PHOTOS
      if (ViewId && ViewId.PHOTOS) {
        pickerBuilder.addView(ViewId.PHOTOS);
      } else {
        // Fallback: try PhotosView if available
        if (pickerAPI.PhotosView) {
          const photosView = new pickerAPI.PhotosView();
          if (photosView.setMimeTypes) {
            photosView.setMimeTypes('image/*');
          }
          pickerBuilder.addView(photosView);
        } else {
          reject(new Error('Photos view is not available in Picker API'));
          return;
        }
      }

      // Enable multiselect
      try {
        if (pickerBuilder.enableFeature) {
          pickerBuilder.enableFeature('MULTISELECT_ENABLED');
        }
      } catch (e) {
        console.warn('Multiselect feature may not be supported:', e);
      }
      pickerBuilder.setOAuthToken(config.accessToken);
      pickerBuilder.setDeveloperKey(config.developerKey);

      // Set callback for picker response
      pickerBuilder.setCallback((data: any) => {
        console.log('Picker callback data:', data);

        // Google Photos Picker returns data in this format:
        // { action: google.picker.Action.PICKED, docs: [...] } or { action: google.picker.Action.CANCEL }
        const pickedAction = Action?.PICKED || 'picked';
        const cancelAction = Action?.CANCEL || 'cancel';
        const action = data.action;

        if (action === pickedAction || (data.docs && data.docs.length > 0)) {
          const docs = data.docs || [];
          console.log('Photos picked:', docs.length, 'items');

          const photos: PickerPhoto[] = docs.map((doc: any, index: number) => {
            // Extract photo information from picker response
            const photoId = doc.id || doc.mediaItemId || `photo_${Date.now()}_${index}`;
            const baseUrl = doc.url || doc.thumbnailUrl || doc.thumbnailLink || '';
            const thumbnailUrl = doc.thumbnailUrl || doc.thumbnailLink || doc.url || '';
            const filename = doc.name || doc.title || doc.filename || `photo_${photoId}.jpg`;
            const mimeType = doc.mimeType || 'image/jpeg';

            console.log('Processing photo:', { photoId, filename, hasUrl: !!baseUrl });

            return {
              id: photoId,
              baseUrl: baseUrl,
              filename: filename,
              mimeType: mimeType,
              thumbnailUrl: thumbnailUrl || baseUrl,
            };
          });

          resolve(photos);
        } else if (action === Action?.CANCEL || action === 'cancel') {
          console.log('User cancelled photo picker');
          resolve([]); // User cancelled, return empty array
        } else if (action === cancelAction) {
          console.log('User cancelled photo picker');
          resolve([]);
        } else {
          console.warn('Unknown picker action or response:', action, data);
          // If we have docs even without clear action, treat as picked
          if (data.docs && data.docs.length > 0) {
            const docs = data.docs;
            const photos: PickerPhoto[] = docs.map((doc: any, index: number) => ({
              id: doc.id || doc.mediaItemId || `photo_${Date.now()}_${index}`,
              baseUrl: doc.url || doc.thumbnailUrl || doc.thumbnailLink || '',
              filename: doc.name || doc.title || doc.filename || `photo_${doc.id || index}.jpg`,
              mimeType: doc.mimeType || 'image/jpeg',
              thumbnailUrl: doc.thumbnailUrl || doc.thumbnailLink || doc.url || '',
            }));
            resolve(photos);
          } else {
            resolve([]);
          }
        }
      });

      if (config.locale) {
        pickerBuilder.setLocale(config.locale);
      }

      // Build and show the picker
      try {
        const picker = pickerBuilder.build();
        if (picker && typeof picker.setVisible === 'function') {
          picker.setVisible(true);
        } else {
          console.error('Picker build failed or setVisible not available:', picker);
          reject(new Error('Failed to create picker dialog'));
        }
      } catch (buildError) {
        console.error('Error building picker:', buildError);
        reject(buildError);
      }

    } catch (error) {
      console.error('Error creating picker:', error);
      reject(error);
    }
  });
}

/**
 * Check if Photos Picker API is available
 */
export function isPickerAPIAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!window.google?.picker;
}
