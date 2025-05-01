import React from 'react';
import { useState, useEffect } from 'react';

/**
 * Custom hook to handle React Quill loading state
 * This prevents SSR issues with React Quill
 */
export function useQuill() {
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);
  
  useEffect(() => {
    // Only set when running on client side
    if (typeof window !== 'undefined') {
      // Load Quill styles
      try {
        // @ts-ignore: Importing CSS file
        require('react-quill/dist/quill.snow.css');
      } catch (e) {
        console.warn('Could not load Quill styles:', e);
      }
      
      setIsQuillLoaded(true);
    }
  }, []);
  
  return { isQuillLoaded };
} 