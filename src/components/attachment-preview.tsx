"use client";

import { AttachmentPreviewProps } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Figma,
  FileText,
  Globe,
  Image as ImageIcon,
  BarChart
} from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Component for previewing attachment content
 */
export function AttachmentPreview({
  attachment,
  open,
  onOpenChange
}: AttachmentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use effect to reset loading state when attachment changes
  // This fixes the infinite render loop by moving state updates out of the render phase
  useEffect(() => {
    if (attachment.type === 'image' || attachment.type === 'figma' ||
        attachment.type === 'googleDoc' || attachment.type === 'pdf') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
    setError(null);
  }, [attachment.type, attachment.url]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load preview");
  };

  // Get content based on attachment type
  const renderContent = () => {
    // We'll use useEffect for state updates instead of doing them during render

    switch (attachment.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center w-full max-h-[70vh] p-4">
            <img
              src={attachment.url}
              alt={attachment.title}
              className="max-w-full max-h-[65vh] object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load image");
              }}
            />
          </div>
        );
      
      case 'figma':
        return (
          <iframe
            src={`${attachment.url.replace('file/', 'embed/')}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-[70vh]"
            allow="fullscreen"
          />
        );
      
      case 'googleDoc':
        const googleViewerUrl = attachment.url.includes('docs.google.com') 
          ? `${attachment.url}&embedded=true`
          : `https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true`;
        
        return (
          <iframe
            src={googleViewerUrl}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-[70vh]"
            allow="fullscreen"
          />
        );
      
      case 'pdf':
        // For PDFs, try to use browser's built-in PDF viewer or Google Docs viewer as fallback
        const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true`;
        
        return (
          <iframe
            src={pdfViewerUrl}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="w-full h-[70vh]"
            allow="fullscreen"
          />
        );
      
      // For other types, show a simple info card
      default:
        // Don't update state during render
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {getTypeIcon()}
            <h3 className="text-xl font-medium mt-4">{attachment.title}</h3>
            <p className="text-muted-foreground mt-2 break-all">{attachment.url}</p>
            <Button 
              className="mt-6" 
              asChild
            >
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
          </div>
        );
    }
  };

  // Get the type icon based on attachment type
  const getTypeIcon = () => {
    switch (attachment.type) {
      case 'figma':
        return <Figma className="h-12 w-12 text-blue-500" />;
      case 'googleDoc':
        return <FileText className="h-12 w-12 text-red-500" />;
      case 'miro':
        return <BarChart className="h-12 w-12 text-yellow-500" />;
      case 'image':
        return <ImageIcon className="h-12 w-12 text-green-500" />;
      case 'pdf':
        return <FileText className="h-12 w-12 text-red-700" />;
      default:
        return <Globe className="h-12 w-12 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()} 
            <span>{attachment.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                asChild
              >
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button 
            asChild
          >
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}