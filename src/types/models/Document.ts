export interface Document {
  id: string;
  title: string;
  content: any; // JSON content from Tiptap
  featureId?: string;
  releaseId?: string;
  requirementId?: string; // Added for requirement documents
  createdAt: string;
  updatedAt: string;
  // tenantId field is omitted as it's managed by auth context
}

// Document with content typed as JSON object (optional but more specific)
export interface DocumentWithContent extends Omit<Document, 'content'> {
  content: {
    type: string;
    content: any[];
  };
}