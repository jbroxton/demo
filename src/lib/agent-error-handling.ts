import { z } from 'zod';
import type { 
  AgentOperationResult
} from '@/types/models/ai-chat';

// Extract the error type from AgentOperationResult
type AgentOperationError = NonNullable<AgentOperationResult<any>['error']>;

/**
 * Agent error types for classification and handling
 */
export enum AgentErrorType {
  VALIDATION = 'validation',
  PERMISSION = 'permission', 
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * Agent error severity levels
 */
export enum AgentErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Creates a standardized agent operation error
 */
export function createAgentError(
  type: AgentErrorType,
  message: string,
  details?: Record<string, any>,
  severity: AgentErrorSeverity = AgentErrorSeverity.MEDIUM
): AgentOperationError {
  return {
    type,
    message,
    details,
    severity,
    timestamp: new Date().toISOString(),
    retryable: isRetryableError(type),
    userMessage: getUserFriendlyMessage(type, message)
  };
}

/**
 * Validates agent operation parameters using Zod schema
 */
export function validateAgentParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown
): AgentOperationResult<T> {
  try {
    const validatedParams = schema.parse(params);
    return {
      success: true,
      data: validatedParams
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError: AgentOperationError = {
        type: AgentErrorType.VALIDATION,
        message: 'Parameter validation failed',
        details: {
          zodError: error.errors,
          receivedParams: params
        },
        severity: AgentErrorSeverity.HIGH,
        timestamp: new Date().toISOString(),
        retryable: false,
        userMessage: 'Please check your input and try again',
        fieldErrors: formatFieldErrors(error)
      };
      
      return {
        success: false,
        error: validationError
      };
    }
    
    return {
      success: false,
      error: createAgentError(
        AgentErrorType.SYSTEM,
        'Unexpected validation error',
        { originalError: error },
        AgentErrorSeverity.HIGH
      )
    };
  }
}

/**
 * Validates user permissions for agent operations
 */
export function validateAgentPermissions(
  operation: string,
  entityType: string,
  tenantId: string,
  userId: string
): AgentOperationResult<boolean> {
  try {
    // Basic permission validation logic
    if (!tenantId || !userId) {
      const permissionError: AgentOperationError = {
        type: AgentErrorType.PERMISSION,
        message: 'Authentication required',
        details: { operation, entityType, tenantId: !!tenantId, userId: !!userId },
        severity: AgentErrorSeverity.HIGH,
        timestamp: new Date().toISOString(),
        retryable: false,
        userMessage: 'Please sign in to perform this action',
        requiredPermission: `${operation}:${entityType}`,
        currentUser: userId
      };
      
      return {
        success: false,
        error: permissionError
      };
    }
    
    // Additional permission checks would be implemented here
    // For now, return success if basic auth is present
    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      error: createAgentError(
        AgentErrorType.SYSTEM,
        'Permission validation failed',
        { originalError: error },
        AgentErrorSeverity.CRITICAL
      )
    };
  }
}

/**
 * Handles network errors from API calls
 */
export function handleNetworkError(
  error: unknown,
  operation: string,
  retryCount: number = 0
): AgentOperationError {
  const isTimeoutError = error instanceof Error && 
    (error.message.includes('timeout') || error.message.includes('ECONNRESET'));
  
  const isConnectionError = error instanceof Error &&
    (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'));
  
  let severity = AgentErrorSeverity.MEDIUM;
  let retryable = true;
  
  if (retryCount >= 3) {
    severity = AgentErrorSeverity.HIGH;
    retryable = false;
  }
  
  if (isConnectionError) {
    severity = AgentErrorSeverity.CRITICAL;
  }
  
  const networkError: AgentOperationError = {
    type: AgentErrorType.NETWORK,
    message: `Network error during ${operation}`,
    details: {
      originalError: error,
      retryCount,
      isTimeoutError,
      isConnectionError
    },
    severity,
    timestamp: new Date().toISOString(),
    retryable,
    userMessage: getNetworkErrorMessage(isTimeoutError, isConnectionError, retryCount),
    statusCode: extractStatusCode(error),
    retryAfter: calculateRetryDelay(retryCount)
  };
  
  return networkError;
}

/**
 * Wraps async operations with error handling
 */
export async function safeAgentOperation<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    entityType?: string;
    retryCount?: number;
    maxRetries?: number;
  }
): Promise<AgentOperationResult<T>> {
  const { operationName, entityType = 'unknown', retryCount = 0, maxRetries = 3 } = context;
  
  try {
    const result = await operation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // Network/API errors
    if (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    )) {
      return {
        success: false,
        error: handleNetworkError(error, operationName, retryCount)
      };
    }
    
    // Business logic errors
    if (error instanceof Error && error.message.includes('not found')) {
      return {
        success: false,
        error: createAgentError(
          AgentErrorType.BUSINESS_LOGIC,
          `${entityType} not found`,
          { originalError: error },
          AgentErrorSeverity.MEDIUM
        )
      };
    }
    
    // Generic system error
    return {
      success: false,
      error: createAgentError(
        AgentErrorType.SYSTEM,
        `Unexpected error in ${operationName}`,
        { originalError: error, entityType },
        AgentErrorSeverity.HIGH
      )
    };
  }
}

/**
 * Retry logic for agent operations
 */
export async function retryAgentOperation<T>(
  operation: () => Promise<AgentOperationResult<T>>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<AgentOperationResult<T>> {
  let lastError: AgentOperationError | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await operation();
    
    if (result.success) {
      return result;
    }
    
    lastError = result.error;
    
    // Don't retry if error is not retryable
    if (!result.error?.retryable || attempt === maxRetries) {
      break;
    }
    
    // Calculate delay with exponential backoff
    const delay = baseDelay * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return {
    success: false,
    error: lastError || createAgentError(
      AgentErrorType.SYSTEM,
      'Max retry attempts exceeded',
      { maxRetries },
      AgentErrorSeverity.HIGH
    )
  };
}

/**
 * Helper functions
 */
function isRetryableError(type: AgentErrorType): boolean {
  return [
    AgentErrorType.NETWORK,
    AgentErrorType.SYSTEM
  ].includes(type);
}

function getUserFriendlyMessage(type: AgentErrorType, message: string): string {
  switch (type) {
    case AgentErrorType.VALIDATION:
      return 'Please check your input and try again';
    case AgentErrorType.PERMISSION:
      return 'You don\'t have permission to perform this action';
    case AgentErrorType.NETWORK:
      return 'Connection issue. Please try again';
    case AgentErrorType.BUSINESS_LOGIC:
      return message; // Business logic errors are usually user-friendly
    case AgentErrorType.SYSTEM:
      return 'Something went wrong. Please try again';
    default:
      return 'An unexpected error occurred';
  }
}

function formatValidationErrorMessage(error: z.ZodError): string {
  const firstError = error.errors[0];
  if (firstError) {
    return `${firstError.path.join('.')}: ${firstError.message}`;
  }
  return 'Invalid input provided';
}

function formatFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  error.errors.forEach(err => {
    const fieldPath = err.path.join('.');
    fieldErrors[fieldPath] = err.message;
  });
  
  return fieldErrors;
}

function getNetworkErrorMessage(
  isTimeout: boolean,
  isConnection: boolean,
  retryCount: number
): string {
  if (isConnection) {
    return 'Unable to connect to the server. Please check your internet connection';
  }
  
  if (isTimeout) {
    return 'Request timed out. Please try again';
  }
  
  if (retryCount >= 3) {
    return 'Multiple attempts failed. Please try again later';
  }
  
  return 'Network error occurred. Retrying...';
}

function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    return error.status as number;
  }
  return undefined;
}

function calculateRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
}