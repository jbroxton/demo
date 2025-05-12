/**
 * Types of entities that can have attachments
 */
export type EntityType = 'feature' | 'requirement' | 'release';

/**
 * Supported attachment types with specific handling
 */
export type AttachmentType =
  'figma' | 'googleDoc' | 'image' | 'pdf' | 'miro' | 'generic' | 'other';

/**
 * Core Attachment Entity
 */
export interface Attachment {
  id: string;                  // Unique identifier
  title: string;               // User-provided or auto-extracted title
  url: string;                 // Link to external resource
  type: AttachmentType;        // File type or service (Figma, Google Docs, etc.)
  thumbnailUrl?: string;       // Optional thumbnail image URL
  createdAt: string;           // Creation timestamp
  updatedAt: string;           // Last update timestamp
  entityId: string;            // ID of the parent entity (feature, requirement, etc.)
  entityType: EntityType;      // Type of the parent entity
  metadata?: Record<string, any>; // Additional service-specific metadata
}

/**
 * Request shape for creating a new attachment
 */
export interface CreateAttachmentRequest {
  url: string;
  title?: string;
  entityId: string;
  entityType: EntityType;
  thumbnailUrl?: string;
}

/**
 * Response shape for attachment operations
 */
export interface AttachmentResponse {
  success: boolean;
  data?: Attachment | Attachment[];
  error?: string;
}

/**
 * Props for attachment component interfaces
 */
export interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  inheritedFrom?: string;
}

export interface AttachmentCardProps {
  attachment: Attachment;
  onRemove: (id: string) => Promise<void> | void;
  onView?: (attachment: Attachment) => void;
}

export interface AttachmentButtonProps {
  count: number;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export interface AttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string, title?: string) => Promise<Attachment>;
  isLoading?: boolean;
}

export interface AttachmentPreviewProps {
  attachment: Attachment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Type for extracted URL metadata
 */
export interface UrlMetadata {
  title?: string;
  type: AttachmentType;
  thumbnailUrl?: string;
  favicon?: string;
  description?: string;
  serviceSpecific?: Record<string, any>;
}