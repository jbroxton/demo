import React from 'react';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuill } from '@/hooks/use-quill';

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
  const { isQuillLoaded } = useQuill();
  
  // Import Quill styles on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import the Quill styles
      try {
        // @ts-ignore: Importing CSS file
        require('react-quill/dist/quill.snow.css');
      } catch (e) {
        console.warn('Could not load Quill styles:', e);
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
  
  return (
    <div className="min-h-[150px]">
      {typeof window !== 'undefined' && isQuillLoaded ? (
        <ReactQuill
          theme="snow"
          value={initialContent}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          readOnly={readOnly}
          className="h-full text-white quill-editor"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-[#a0a0a0]">Loading editor...</div>
        </div>
      )}
    </div>
  );
} 