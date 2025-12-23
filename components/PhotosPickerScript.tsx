'use client';

import { useEffect } from 'react';


export default function PhotosPickerScript() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    if (window.gapi) {
      loadPickerAPI();
      return;
    }

    // Define callback before loading script
    window.onApiLoad = () => {
      console.log('Google API client library loaded');
      loadPickerAPI();
    };

    // Load the Google API script dynamically
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google API script loaded');
      // The script should call window.onApiLoad, but call it manually as fallback
      setTimeout(() => {
        if (window.gapi && window.onApiLoad) {
          window.onApiLoad();
        } else if (window.gapi) {
          // If onApiLoad wasn't called, load picker directly
          loadPickerAPI();
        }
      }, 100);
    };
    script.onerror = (e) => {
      console.error('Failed to load Google API script:', e);
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    if (!existingScript) {
      document.head.appendChild(script);
    } else if (window.gapi) {
      loadPickerAPI();
    }

    function loadPickerAPI() {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => {
            console.log('Picker API loaded successfully');
            if (window.google?.picker) {
              console.log('google.picker is now available');
            }
          }
        });
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
}
