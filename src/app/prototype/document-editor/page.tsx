"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DocumentEditorTabContent } from '@/components/document-editor-tab-content';
import DocumentEditorInstructionPage from './instruction';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function DocumentEditorPrototypePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const skipIntro = searchParams.get('skip') === 'true';
  const [showEditor, setShowEditor] = useState(skipIntro);

  // Get auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Check URL parameters on mount
  useEffect(() => {
    if (skipIntro) {
      setShowEditor(true);
    }
  }, [skipIntro]);

  // Handle non-authenticated state for document editing
  // Only show authentication UI if not creating a new document and we're trying to show the editor
  if (!authLoading && !isAuthenticated && showEditor && !searchParams.get('id')) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e20] text-[#a0a0a0]">
        <div className="bg-[#232326] border border-[#2a2a2c] rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-medium mb-4 text-white">Authentication Required</h2>
          <p className="mb-6">
            You need to sign in to access the document editor. Documents API requires authentication.
          </p>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
              onClick={() => setShowEditor(false)}
            >
              Back to Instructions
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!showEditor) {
    return (
      <div className="h-screen bg-[#1e1e20] p-4 overflow-auto">
        <DocumentEditorInstructionPage onStartEditor={() => setShowEditor(true)} />
      </div>
    );
  }

  const documentId = searchParams.get('id');

  // If we have a document ID, load that document
  if (documentId) {
    return (
      <div className="h-screen bg-[#1e1e20]">
        <DocumentEditorTabContent
          documentId={documentId}
          tabId={`document-${documentId}`}
          isNew={false}
        />
      </div>
    );
  }

  // Otherwise, create a new document
  return (
    <div className="h-screen bg-[#1e1e20]">
      <DocumentEditorTabContent
        documentId="new-document"
        tabId="new-document-tab"
        isNew={true}
      />
    </div>
  );
}