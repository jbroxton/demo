"use client";

import React from 'react';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill with ssr disabled
const ReactQuill = dynamic(
  () => import('react-quill'),
  { ssr: false }
);

interface FeatureDescriptionEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function FeatureDescriptionEditor({
  initialContent,
  onChange,
  placeholder = 'Enter feature description...',
  readOnly = false
}: FeatureDescriptionEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);
  const [content, setContent] = useState(initialContent);
  const initialContentRef = useRef(initialContent);
  
  // Handle content updates only when initialContent changes and is different from our tracked value
  useEffect(() => {
    if (initialContent !== initialContentRef.current) {
      setContent(initialContent);
      initialContentRef.current = initialContent;
    }
  }, [initialContent]);
  
  // Handle content changes
  const handleChange = (value: string) => {
    setContent(value);
    // Only call onChange if the value actually changed
    if (value !== initialContentRef.current) {
      onChange(value);
    }
  };
  
  // Import Quill styles on the client side and initialize
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      // Import the Quill styles
      try {
        // @ts-ignore - Dynamically import CSS
        require('react-quill/dist/quill.snow.css');
        console.log('ReactQuill styles loaded in editor');
        
        // Add a slight delay to ensure CSS is applied
        setTimeout(() => {
          setIsQuillLoaded(true);
        }, 100);
      } catch (e) {
        console.error('Failed to load Quill styles:', e);
      }
    }
  }, []);
  
  // Quill modules configuration - minimal toolbar
  const modules = {
    toolbar: readOnly ? false : [
      ['bold', 'italic', 'underline'],
      ['clean'] // Remove formatting button
    ]
  };
  
  if (!isClient) {
    return (
      <div className="min-h-[150px] border rounded-md bg-[#232326] p-4">
        <div className="text-[#a0a0a0]">Loading editor...</div>
      </div>
    );
  }
  
  // Render the editor in read-only mode if we're not editing,
  // or if the Quill hasn't loaded yet but we have content to show
  if (readOnly || (!isQuillLoaded && initialContent)) {
    return (
      <div 
        className="quill-editor-display min-h-[150px]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  // Otherwise render the editable Quill editor
  return (
    <div className="min-h-[150px]">
      {isQuillLoaded ? (
        <div className="quill-wrapper relative">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleChange}
            modules={modules}
            placeholder={placeholder}
            readOnly={readOnly}
            className="h-full text-white quill-editor"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full border rounded-md bg-[#232326] p-4">
          <div className="text-[#a0a0a0]">Loading editor...</div>
        </div>
      )}
    </div>
  );
} 