"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import { AttachmentButtonProps } from "@/types/models";

/**
 * Button component for showing and managing attachments
 * Displays a badge with the count of attachments
 */
export function AttachmentButton({
  count,
  onClick,
  variant = "outline",
  size = "sm"
}: AttachmentButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className="relative"
    >
      <Paperclip className="h-4 w-4 mr-2" />
      {count === 1 ? "Attachment" : "Attachments"}
      {count > 0 && (
        <Badge
          variant="secondary"
          className="ml-2"
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}