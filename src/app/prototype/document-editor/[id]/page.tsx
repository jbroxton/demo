"use client";

import React from 'react';
import { DocumentEditorTabContent } from '@/components/document-editor-tab-content';

export default function DocumentEditorWithIdPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen bg-[#1e1e20]">
      <DocumentEditorTabContent 
        documentId={params.id} 
        tabId={`document-${params.id}`}
        isNew={false}
      />
    </div>
  );
}