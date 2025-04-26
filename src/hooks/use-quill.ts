import { useEffect, useState } from 'react';

/**
 * Custom hook to load React Quill styles safely on the client side
 */
export function useQuill() {
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);

  useEffect(() => {
    // Only import styles on the client side
    if (typeof window !== 'undefined') {
      // Use a more dynamic approach to avoid TypeScript issues
      const loadStyles = async () => {
        try {
          // Load React Quill styles
          await import('react-quill-new/dist/quill.snow.css' as any);
          
          // No need to import custom CSS here as we'll include it in globals.css
          
          setIsQuillLoaded(true);
        } catch (error) {
          console.error('Failed to load Quill styles:', error);
        }
      };
      
      loadStyles();
    }
  }, []);

  return { isQuillLoaded };
} 