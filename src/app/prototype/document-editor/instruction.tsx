"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface InstructionPageProps {
  onStartEditor?: () => void;
}

export default function DocumentEditorInstructionPage({ onStartEditor }: InstructionPageProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleStartEditor = () => {
    if (onStartEditor) {
      onStartEditor();
    }
  };

  const handleSignIn = () => {
    router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
  };

  return (
    <div className="min-h-screen bg-[#1e1e20] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Document Editor Prototype</h1>
        <p className="mb-6 text-[#a0a0a0]">
          This prototype implements a Notion-like document editing experience with embedded tables 
          for requirements management. You can create rich documents, insert tables, and format text.
        </p>
        
        <div className="bg-[#232326] border border-[#2a2a2c] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Getting Started</h2>
          <p className="mb-4 text-[#a0a0a0]">
            Click the button below to start testing the document editor. You can create a new document,
            add tables, format text, and save changes.
          </p>
          
          <div className="mt-6">
            {/* Authentication notice */}
            <div className="mb-4 rounded-md bg-amber-500/15 border border-amber-500/30 p-3 text-amber-200">
              <p className="text-sm">
                <strong>Note:</strong> The document editor requires authentication. You will be prompted to sign in after clicking the button below.
              </p>
            </div>

            <div className="flex space-x-4">
              {/* Main action button */}
              {onStartEditor ? (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleStartEditor}
                >
                  Create New Document
                </Button>
              ) : (
                <Link href="/prototype/document-editor">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create New Document
                  </Button>
                </Link>
              )}

              {/* Sign in button if not authenticated */}
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c]"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-[#232326] border border-[#2a2a2c] rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2 text-[#a0a0a0]">
            <li>Full rich-text editing with seamless inline formatting</li>
            <li>Insert and edit tables for requirements</li>
            <li>Support for headings, lists, and other formatting options</li>
            <li>Automatic saving as you type</li>
            <li>Keyboard navigation in tables (tab, arrow keys)</li>
            <li>Persistent storage through SQLite database</li>
            <li>Secure access with authentication</li>
          </ul>

          {/* Demo user info for testing */}
          <div className="mt-6 rounded-md bg-[#28282c] p-3 text-xs">
            <p className="font-medium text-white">Demo Users:</p>
            <p className="mt-1 text-[#a0a0a0]">Email: pm1@demo.com | Password: password</p>
            <p className="text-[#a0a0a0]">Email: admin@example.com | Password: password</p>
          </div>
        </div>
      </div>
    </div>
  );
}