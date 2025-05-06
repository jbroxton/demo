"use client";

import { useEffect } from 'react';

/**
 * Component to load external styles on the client side
 * This helps prevent issues with CSS loading in Next.js
 */
export function StyleLoader() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Load Quill styles using a more compatible approach
      try {
        // @ts-ignore - Dynamically import CSS
        require('react-quill/dist/quill.snow.css');
        console.log('ReactQuill styles loaded');
        
        // Add Material UI styles
        // We're not actually loading styles here, but this triggers
        // proper initialization of MUI components
        import('@mui/material/styles')
          .then(() => console.log('Material UI styles initialized'))
          .catch(e => console.error('Failed to initialize Material UI:', e));
      } catch (e) {
        console.error('Failed to load styles:', e);
      }
      
      // Additional styles can be loaded here if needed
      
      // Add class to body to indicate styles are loaded
      document.body.classList.add('external-styles-loaded');
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 