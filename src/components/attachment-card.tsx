"use client";

import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import {
  BarChart,
  ExternalLink,
  FileText,
  Figma,
  Globe,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { AttachmentCardProps } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  ConfirmationDialog
} from "@/components/confirmation-dialog"; 

/**
 * Card component for displaying an attachment
 */
export function AttachmentCard({ 
  attachment, 
  onRemove,
  onView 
}: AttachmentCardProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Handle attachment removal with confirmation
  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove(attachment.id);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error removing attachment:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Get the type icon based on attachment type
  const getTypeIcon = () => {
    switch (attachment.type) {
      case 'figma':
        return <Figma className="h-4 w-4 text-blue-500" />;
      case 'googleDoc':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'miro':
        return <BarChart className="h-4 w-4 text-yellow-500" />;
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-700" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format URL for display
  const formatUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname.slice(0, 20)}${parsed.pathname.length > 20 ? '...' : ''}`;
    } catch (e) {
      return url.slice(0, 30) + (url.length > 30 ? '...' : '');
    }
  };

  return (
    <>
      {/* Compact attachment card design */}
      <div
        className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/30 transition-colors cursor-pointer group"
        onClick={() => onView?.(attachment)}
      >
        {/* Type icon */}
        <div className="flex-shrink-0">
          {getTypeIcon()}
        </div>

        {/* Title and URL */}
        <div className="flex-grow min-w-0"> {/* min-width-0 enables truncation */}
          <h3 className="font-medium text-sm truncate">{attachment.title}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {formatUrl(attachment.url)}
          </p>
        </div>

        {/* Actions - visible on hover or always visible on mobile */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              window.open(attachment.url, '_blank', 'noopener,noreferrer');
            }}
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive/90"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmation(true);
            }}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Remove Attachment"
        description="Are you sure you want to remove this attachment? This action cannot be undone."
        onConfirm={handleRemove}
        isLoading={isRemoving}
      />
    </>
  );
}