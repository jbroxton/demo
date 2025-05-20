/**
 * API Client Utility
 * 
 * Provides a centralized fetch wrapper that automatically handles:
 * - Authentication headers
 * - Error responses
 * - JSON parsing
 * - Credentials
 * 
 * This ensures consistent API calls throughout the application.
 */

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

/**
 * Custom fetch wrapper for API calls
 * Automatically includes credentials and handles common patterns
 */
export async function apiClient(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters if provided
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    // Make sure we're only adding params with valid values (not null or undefined)
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }
  
  // Default options
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  };
  
  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...fetchOptions,
    headers: {
      ...defaultOptions.headers,
      ...fetchOptions.headers,
    },
  };
  
  try {
    const response = await fetch(url, finalOptions);
    
    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }
    
    // Parse JSON response
    try {
      return await response.json();
    } catch {
      // Return null for empty responses
      return null;
    }
  } catch (error) {
    console.error('API request failed:', error);
    
    // Create a more useful error message
    if (error instanceof Error) {
      // Re-throw with the original message
      throw error;
    } else if (typeof error === 'object' && error !== null) {
      try {
        // Try to convert object errors to a well-formatted string
        const errorString = JSON.stringify(error, null, 2);
        throw new Error(errorString);
      } catch (jsonError) {
        // If JSON.stringify fails, fall back to a simple string conversion
        throw new Error(`API Error: ${Object.prototype.toString.call(error)}`);
      }
    } else {
      // Handle any other type of error
      throw new Error(String(error));
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, params?: Record<string, string>) =>
    apiClient(endpoint, { method: 'GET', params }),
    
  post: (endpoint: string, data?: any) =>
    apiClient(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  patch: (endpoint: string, data?: any) =>
    apiClient(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, params?: Record<string, string>) =>
    apiClient(endpoint, { method: 'DELETE', params }),
};