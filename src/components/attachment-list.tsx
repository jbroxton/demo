"use client";

import { AttachmentListProps, Attachment } from "@/types/models";
import { AttachmentCard } from "./attachment-card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AttachmentDialog } from "./attachment-dialog";
import { AttachmentPreview } from "./attachment-preview";

/**
 * Component for displaying a list of attachments with actions
 */
export function AttachmentList({
  attachments,
  onRemove,
  onAdd,
  isLoading = false,
  isAddingAttachment = false, // Separate loading state for adding attachments
  emptyState,
  showAddButton = true,
  inheritedFrom
}: AttachmentListProps & {
  onAdd?: (url: string, title?: string) => Promise<Attachment>;
  showAddButton?: boolean;
  inheritedFrom?: string;
  isAddingAttachment?: boolean; // New prop for add operation loading state
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  // Handle opening the preview for an attachment
  const handleViewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">
            Attachments
            {attachments.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({attachments.length})
              </span>
            )}
          </h3>
          {inheritedFrom && (
            <span className="text-sm text-muted-foreground">
              from {inheritedFrom}
            </span>
          )}
        </div>

        {showAddButton && onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Attachment
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-md bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div className="p-4 text-center border rounded-md">
          {emptyState || (
            <div className="text-muted-foreground">
              No attachments yet
              {showAddButton && onAdd && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Attachment
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onRemove={onRemove}
              onView={handleViewAttachment}
            />
          ))}
        </div>
      )}

      {/* Add Attachment Dialog */}
      {onAdd && (
        <AttachmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onAdd={onAdd}
          isLoading={isAddingAttachment} // Use the specific loading state for adding
        />
      )}

      {/* Attachment Preview */}
      {selectedAttachment && (
        <AttachmentPreview
          attachment={selectedAttachment}
          open={!!selectedAttachment}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedAttachment(null);
          }}
        />
      )}
    </div>
  );
}