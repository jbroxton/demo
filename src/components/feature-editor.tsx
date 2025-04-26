import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useFeaturesStore } from '@/stores/features';
import { useQuill } from '@/hooks/use-quill';

// Dynamically import ReactQuill with ssr disabled
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { ssr: false }
);

interface FeatureEditorProps {
  featureId: string;
  initialContent?: string;
}

export function FeatureEditor({ featureId, initialContent = '' }: FeatureEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaved, setIsSaved] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { isQuillLoaded } = useQuill();
  
  // Get the saveFeatureContent function from the features store
  const { saveFeatureContent } = useFeaturesStore();
  
  // Quill modules configuration - minimal toolbar
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['clean'] // Remove formatting button
    ]
  };
  
  // Handle save action
  const handleSave = () => {
    try {
      setSaveStatus('saving');
      
      // Save the content using the store function
      saveFeatureContent(featureId, content);
      
      // Set saved status with a small delay to show feedback
      setTimeout(() => {
        setIsSaved(true);
        setSaveStatus('saved');
        
        // Clear the saved status after a delay
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 500);
    } catch (error) {
      console.error('Error saving feature content:', error);
      setSaveStatus('error');
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20] overflow-hidden">
      <div className="flex-1 min-h-[300px]">
        {/* Only render ReactQuill when it's fully loaded on the client side */}
        {typeof window !== 'undefined' && isQuillLoaded ? (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={(value) => {
              setContent(value);
              setIsSaved(false);
              setSaveStatus('idle');
            }}
            modules={modules}
            placeholder="Enter feature content here..."
            className="h-full text-white" // Match dark theme text color
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-[#a0a0a0]">Loading editor...</div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-4 px-4 py-2 bg-[#161618] border-t border-[#232326]">
        <div className="text-sm text-[#a0a0a0]">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Changes saved'}
          {saveStatus === 'error' && 'Error saving changes'}
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaved || saveStatus === 'saving'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 