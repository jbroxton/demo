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

/**
 * AI Agent Types
 * 
 * Type definitions for AI agent functionality including function calling,
 * confirmations, and action metadata.
 */



/**
 * Chat mode - determines behavior of AI system
 */
export type ChatMode = 'ask' | 'agent';

/**
 * Parameters for creating a product via agent
 */
export interface CreateProductParams {
  /** Product name */
  name: string;
  /** Product description */
  description: string;
  /** Associated interface IDs */
  interfaces?: string[];
}

/**
 * Parameters for updating a product via agent
 */
export interface UpdateProductParams {
  /** Product ID to update */
  id: string;
  /** New name (optional) */
  name?: string;
  /** New description (optional) */
  description?: string;
  /** New interface associations (optional) */
  interfaces?: string[];
}

/**
 * Parameters for creating a feature via agent
 */
export interface CreateFeatureParams {
  /** Feature name */
  name: string;
  /** Feature priority */
  priority: 'High' | 'Med' | 'Low';
  /** Feature description */
  description: string;
  /** Associated interface ID */
  interfaceId: string;
  /** Associated roadmap ID (optional) */
  roadmapId?: string;
  /** Associated OKR (optional) */
  okr?: string;
}

/**
 * Parameters for updating a feature via agent
 */
export interface UpdateFeatureParams {
  /** Feature ID to update */
  id: string;
  /** New name (optional) */
  name?: string;
  /** New priority (optional) */
  priority?: 'High' | 'Med' | 'Low';
  /** New description (optional) */
  description?: string;
  /** New roadmap association (optional) */
  roadmapId?: string;
  /** New OKR (optional) */
  okr?: string;
}

/**
 * Parameters for creating a requirement via agent
 */
export interface CreateRequirementParams {
  /** Requirement name */
  name: string;
  /** Requirement priority */
  priority: 'High' | 'Med' | 'Low';
  /** Requirement description */
  description: string;
  /** Requirement owner */
  owner?: string;
  /** Associated feature ID */
  featureId: string;
}

/**
 * Parameters for updating a requirement via agent
 */
export interface UpdateRequirementParams {
  /** Requirement ID to update */
  id: string;
  /** New name (optional) */
  name?: string;
  /** New priority (optional) */
  priority?: 'High' | 'Med' | 'Low';
  /** New description (optional) */
  description?: string;
  /** New owner (optional) */
  owner?: string;
}

/**
 * Parameters for creating a release via agent
 */
export interface CreateReleaseParams {
  /** Release name */
  name: string;
  /** Release description */
  description: string;
  /** Release date */
  releaseDate: string;
  /** Release priority */
  priority: 'High' | 'Med' | 'Low';
  /** Associated feature ID */
  featureId?: string;
}

/**
 * Parameters for updating a release via agent
 */
export interface UpdateReleaseParams {
  /** Release ID to update */
  id: string;
  /** New name (optional) */
  name?: string;
  /** New description (optional) */
  description?: string;
  /** New release date (optional) */
  releaseDate?: string;
  /** New priority (optional) */
  priority?: 'High' | 'Med' | 'Low';
}

/**
 * Parameters for creating a roadmap via agent
 */
export interface CreateRoadmapParams {
  /** Roadmap name */
  name: string;
  /** Roadmap description */
  description: string;
  /** Roadmap priority */
  priority: 'High' | 'Med' | 'Low';
}

/**
 * Parameters for updating a roadmap via agent
 */
export interface UpdateRoadmapParams {
  /** Roadmap ID to update */
  id: string;
  /** New name (optional) */
  name?: string;
  /** New description (optional) */
  description?: string;
  /** New priority (optional) */
  priority?: 'High' | 'Med' | 'Low';
}

/**
 * Parameters for deleting any entity via agent
 */
export interface DeleteEntityParams {
  /** Entity ID to delete */
  id: string;
  /** Entity type */
  entityType: AgentEntityType;
}

/**
 * Union type for all agent operation parameters
 */
export type AgentOperationParams = 
  | CreateProductParams
  | UpdateProductParams
  | CreateFeatureParams
  | UpdateFeatureParams
  | CreateRequirementParams
  | UpdateRequirementParams
  | CreateReleaseParams
  | UpdateReleaseParams
  | CreateRoadmapParams
  | UpdateRoadmapParams
  | DeleteEntityParams;

/**
 * OpenAI function tool definition structure
 */
export interface OpenAIFunctionTool {
  /** Function type - always "function" for OpenAI */
  type: 'function';
  /** Function definition */
  function: {
    /** Function name */
    name: string;
    /** Function description */
    description: string;
    /** Function parameters schema */
    parameters: {
      /** Schema type */
      type: 'object';
      /** Parameter properties */
      properties: Record<string, any>;
      /** Required parameters */
      required: string[];
    };
  };
}

/**
 * Data structure for confirmation dialog
 */
export interface AgentConfirmationData {
  /** Unique ID for this confirmation request */
  id: string;
  /** Type of operation */
  operationType: AgentOperationType;
  /** Entity type being operated on */
  entityType: AgentEntityType;
  /** Function name being called */
  functionName: string;
  /** Parameters for the operation */
  parameters: AgentOperationParams;
  /** Human-readable description of the change */
  description: string;
  /** Preview of what will change */
  preview: {
    /** Current state (for updates/deletes) */
    before?: Record<string, any>;
    /** New state (for creates/updates) */
    after: Record<string, any>;
  };
  /** Timestamp when confirmation was requested */
  requestedAt: string;
}

/**
 * User response to confirmation dialog
 */
export interface AgentConfirmationResponse {
  /** ID of the confirmation request */
  confirmationId: string;
  /** User's decision */
  approved: boolean;
  /** Optional user comment */
  comment?: string;
  /** Timestamp of response */
  respondedAt: string;
}

/**
 * Metadata for agent actions stored in chat messages
 */
export interface AgentActionMetadata {
  /** Type of operation performed */
  operationType: AgentOperationType;
  /** Entity type operated on */
  entityType: AgentEntityType;
  /** Function name that was called */
  functionName: string;
  /** Parameters used for the operation */
  parameters: AgentOperationParams;
  /** Result of the operation */
  result: {
    /** Whether operation succeeded */
    success: boolean;
    /** Created/updated entity ID */
    entityId?: string;
    /** Error message if failed */
    error?: string;
  };
  /** Confirmation ID that approved this action */
  confirmationId: string;
  /** Timestamp when action was executed */
  executedAt: string;
}

/**
 * Enhanced chat message that includes agent action metadata
 */
export interface AgentChatMessage extends ChatMessage {
  /** Agent-specific metadata (only present for agent messages) */
  agentMetadata?: AgentActionMetadata;
}

/**
 * Status of an agent operation
 */
export type AgentOperationStatus = 'pending' | 'confirmed' | 'executing' | 'completed' | 'failed' | 'cancelled';

/**
 * State tracking for agent operations
 */
export interface AgentOperationState {
  /** Current operation status */
  status: AgentOperationStatus;
  /** Confirmation data (if pending confirmation) */
  confirmationData?: AgentConfirmationData;
  /** Error information (if failed) */
  error?: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Whether operation can be retried */
    retryable: boolean;
  };
  /** Progress information (if executing) */
  progress?: {
    /** Current step */
    step: string;
    /** Percentage complete (0-100) */
    percentage: number;
  };
}

/**
 * Agent mode type
 */
export type AgentMode = 'agent' | 'ask';

/**
 * Agent operation types
 */
export type AgentOperationType = 'create' | 'update' | 'delete' | 'read';

/**
 * Agent entity types
 */
export type AgentEntityType = 'product' | 'feature' | 'requirement' | 'release' | 'roadmap';

/**
 * Agent action status
 */
export type AgentActionStatus = 'pending' | 'confirmed' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rejected';

/**
 * Complete agent action record
 */
export interface AgentAction {
  /** Unique identifier */
  id: string;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  /** User who initiated the action */
  userId: string;
  /** Session this action belongs to */
  sessionId: string;
  /** Type of operation */
  operationType: AgentOperationType;
  /** Type of entity being operated on */
  entityType: AgentEntityType;
  /** ID of the entity (null for create operations) */
  entityId: string | null;
  /** OpenAI function name that was called */
  functionName: string;
  /** Parameters passed to the function */
  functionParameters: Record<string, any>;
  /** OpenAI function call ID for correlation */
  openAiFunctionCallId: string;
  /** Current status of the action */
  status: AgentActionStatus;
  /** Whether this action requires user confirmation */
  requiresConfirmation: boolean;
  /** When confirmation was requested */
  confirmationRequestedAt: string | null;
  /** When confirmation was received */
  confirmationReceivedAt: string | null;
  /** User who confirmed the action */
  confirmedByUserId: string | null;
  /** Result data from successful execution */
  resultData: Record<string, any> | null;
  /** Error data from failed execution */
  errorData: Record<string, any> | null;
  /** When the action was created */
  createdAt: string;
  /** When the action was last updated */
  updatedAt: string;
  /** When the action was completed (success or failure) */
  completedAt: string | null;
  /** IP address of the user */
  ipAddress: string | null;
  /** User agent string */
  userAgent: string | null;
}

/**
 * Agent session for tracking related actions
 */
export interface AgentSession {
  /** Unique identifier */
  id: string;
  /** Session ID */
  sessionId: string;
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  /** User who owns this session */
  userId: string;
  /** Session mode */
  mode: AgentMode;
  /** When session started */
  startedAt: string;
  /** Last activity timestamp */
  lastActivityAt: string;
  /** When session ended */
  endedAt: string | null;
  /** Total number of actions in session */
  totalActions: number;
  /** Number of successful actions */
  successfulActions: number;
  /** Number of failed actions */
  failedActions: number;
  /** Number of pending actions */
  pendingActions: number;
}

/**
 * Agent confirmation record
 */
export interface AgentConfirmation {
  /** Unique identifier */
  id: string;
  /** Related action ID */
  agentActionId: string;
  /** Dialog type */
  dialogType: string;
  /** Confirmation title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Additional details */
  details?: any;
  /** User response to confirmation */
  userResponse?: 'confirmed' | 'rejected' | 'cancelled';
  /** Response timestamp */
  responseTimestamp?: string;
  /** Response details */
  responseDetails?: any;
  /** When the confirmation was created */
  createdAt: string;
  /** When the confirmation expires */
  expiresAt?: string;
}

/**
 * Generic operation result type
 */
export interface AgentOperationResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: {
    /** Error type for classification */
    type: string;
    /** Human-readable error message */
    message: string;
    /** Technical error details */
    details?: Record<string, any>;
    /** Error severity level */
    severity: string;
    /** Timestamp when error occurred */
    timestamp: string;
    /** Whether the operation can be retried */
    retryable: boolean;
    /** User-friendly error message */
    userMessage?: string;
    /** HTTP status code (if applicable) */
    statusCode?: number;
    /** Suggested retry delay in milliseconds */
    retryAfter?: number;
    /** Required permission (for permission errors) */
    requiredPermission?: string;
    /** Current user context (for permission errors) */
    currentUser?: string;
    /** Field-specific validation errors */
    fieldErrors?: Record<string, string>;
  };
}

/**
 * Parameters for creating agent actions
 */
export interface CreateAgentActionParams {
  tenantId: string;
  userId: string;
  sessionId: string;
  operationType: AgentOperationType;
  entityType: AgentEntityType;
  entityId?: string | null;
  functionName: string;
  functionParameters: Record<string, any>;
  openAiFunctionCallId?: string;
  status?: AgentActionStatus;
  requiresConfirmation?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for updating agent actions
 */
export interface UpdateAgentActionParams {
  status?: AgentActionStatus;
  entityId?: string;
  confirmationRequestedAt?: string;
  confirmationReceivedAt?: string;
  confirmedByUserId?: string;
  resultData?: Record<string, any>;
  errorData?: Record<string, any>;
  completedAt?: string;
}