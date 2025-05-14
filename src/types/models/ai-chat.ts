/**
 * AI Chat Types
 * 
 * Type definitions for the AI chat feature including embeddings,
 * chat messages, and search functionality.
 */

/**
 * Represents stored embedding record in the database
 */
export interface EmbeddingRecord {
  /** Unique identifier of the embedding */
  id: string;
  /** ID of the entity this embedding represents */
  entityId: string;
  /** Type of entity (product, feature, etc.) */
  entityType: 'product' | 'feature' | 'requirement' | 'document';
  /** Hash of the content for change detection */
  contentHash: string;
  /** Vector representation of the content */
  embedding: number[];
  /** Number of dimensions in the embedding vector */
  embeddingDim: number;
  /** Additional metadata for filtering */
  metadata?: Record<string, any>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
}

/**
 * Result from a similarity search operation
 */
export interface SimilarityResult {
  /** ID of the matching entity */
  entityId: string;
  /** Type of the matching entity */
  entityType: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** Associated metadata */
  metadata?: Record<string, any>;
}

/**
 * Parameters for context search
 */
export interface SearchParams {
  /** The search query text */
  query: string;
  /** Entity types to include in search */
  entityTypes?: string[];
  /** Maximum number of results */
  limit?: number;
  /** Minimum similarity threshold */
  threshold?: number;
}

/**
 * Represents a chat message in the system
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** The message content */
  content: string;
  /** Who sent the message - user or AI assistant */
  role: 'user' | 'assistant';
  /** When the message was sent (ISO date string) */
  timestamp: string;
  /** Optional conversation ID this message belongs to */
  conversationId?: string;
}

/**
 * Represents a conversation thread
 */
export interface ChatConversation {
  /** Unique identifier for the conversation */
  id: string;
  /** User who owns this conversation */
  userId: string;
  /** Optional title for the conversation */
  title?: string;
  /** When the conversation was created */
  createdAt: string;
  /** When the conversation was last updated */
  updatedAt: string;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
}