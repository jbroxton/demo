import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document } from '@/types/models';

// Fetch functions to call the API
async function fetchDocuments(featureId?: string, releaseId?: string) {
  // Ensure we have at least one ID
  if (!featureId && !releaseId) {
    console.error('fetchDocuments: Either featureId or releaseId is required');
    throw new Error('Either featureId or releaseId is required');
  }

  let url = '/api/documents-db';
  const params = new URLSearchParams();

  if (featureId) params.append('featureId', featureId);
  if (releaseId) params.append('releaseId', releaseId);

  // Add params to URL
  url += `?${params.toString()}`;

  try {
    console.log(`Fetching documents from: ${url}`);

    // Add a timeout to the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        },
        // Do not follow redirects - this helps identify auth redirects
        redirect: 'manual'
      });
      clearTimeout(timeoutId);

      console.log(`Response status: ${response.status}`);

      // Detect authentication redirects specifically (sign-in redirects usually use 302 or 307)
      if (response.status === 302 || response.status === 307) {
        const redirectLocation = response.headers.get('Location');
        if (redirectLocation && redirectLocation.includes('/signin')) {
          console.error('Authentication redirect detected:', redirectLocation);
          throw new Error('Authentication required. Please sign in to access documents.');
        }
      }

      // Special handling for non-OK responses
      if (!response.ok) {
        let errorData;
        let errorText = '';

        try {
          // Try to get text first in case JSON parsing fails
          errorText = await response.text();

          try {
            // Then try to parse as JSON if possible
            errorData = JSON.parse(errorText);
          } catch (jsonError) {
            // Not JSON, use text as is
            errorData = { error: errorText || 'Unknown error' };
          }
        } catch (textError) {
          console.error('Failed to get error response text:', textError);
          errorData = { error: `HTTP ${response.status} ${response.statusText}` };
        }

        console.error('Error fetching documents:', errorData);
        throw new Error(errorData.error || `Failed to fetch documents: ${response.status} ${response.statusText}`);
      }

      // Handle successful response
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

      // The API wraps data in a { data: [] } structure,
      // so we need to extract the actual data array
      const data = responseData.data || [];
      
      console.log(`API Response structure:`, {
        hasDataProperty: 'data' in responseData,
        responseType: typeof responseData,
        dataType: typeof data,
        isArray: Array.isArray(data)
      });
      
      console.log(`Fetched ${Array.isArray(data) ? data.length : 0} documents`);

      // Validate response
      if (!Array.isArray(data)) {
        console.warn('Documents response is not an array, using empty array instead');
        return [];
      }

      return data;
    } catch (fetchError) {
      // Handle AbortController timeout
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.error('Fetch operation timed out after 15 seconds');
        throw new Error('Request timed out. The server took too long to respond.');
      }

      // Rethrow other fetch errors
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in fetchDocuments:', error);

    // For React Query to properly handle error states, we should throw
    // But first, create a more detailed error message for debugging
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred while fetching documents';

    console.error(`Documents fetch failed: ${errorMessage}`);

    // Check for authentication errors specifically
    const errorStr = String(error);
    if (
      errorStr.includes('Authentication') ||
      errorStr.includes('signin') ||
      errorStr.includes('login') ||
      errorStr.includes('307') ||
      errorStr.includes('redirect')
    ) {
      // Create a special authentication error to help UI display appropriate message
      throw new Error('Authentication required. Please sign in to access documents.');
    }

    // For other errors, throw the error for React Query to handle
    throw error;
  }
}

async function fetchDocument(id: string) {
  try {
    console.log(`Fetching document with ID: ${id}`);
    const response = await fetch(`/api/documents-db?id=${id}`, {
      headers: {
        'Cache-Control': 'no-cache'
      },
      // Do not follow redirects - this helps identify auth redirects
      redirect: 'manual'
    });
    console.log(`Response status for document ${id}: ${response.status}`);

    // Detect authentication redirects
    if (response.status === 302 || response.status === 307) {
      const redirectLocation = response.headers.get('Location');
      if (redirectLocation && redirectLocation.includes('/signin')) {
        console.error('Authentication redirect detected:', redirectLocation);
        throw new Error('Authentication required. Please sign in to access documents.');
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        // Return null for 404 - not found is a valid state
        console.log(`Document not found: ${id}`);
        return null;
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = { error: 'Unknown error' };
      }

      console.error(`Error fetching document ${id}:`, errorData);
      throw new Error(errorData.error || `Failed to fetch document with ID: ${id}`);
    }

    const responseData = await response.json();
    console.log(`Successfully fetched document ${id}`);
    
    // The API wraps document in { data: {...} }
    const data = responseData.data;
    
    if (!data) {
      console.warn(`Document response for ${id} is missing data property:`, responseData);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in fetchDocument (${id}):`, error);
    // Check for authentication errors
    const errorStr = String(error);
    if (
      errorStr.includes('Authentication') ||
      errorStr.includes('signin') ||
      errorStr.includes('login') ||
      errorStr.includes('307') ||
      errorStr.includes('redirect')
    ) {
      // Create a special authentication error to help UI display appropriate message
      throw new Error('Authentication required. Please sign in to access documents.');
    }

    // For other errors, throw for better error handling
    throw error;
  }
}

async function createDocument(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Validate that at least one ID field is provided
    if (!documentData.featureId && !documentData.releaseId && !documentData.requirementId) {
      throw new Error('At least one of featureId, releaseId, or requirementId is required');
    }

    console.log('Creating document with data:', JSON.stringify(documentData, null, 2));

    const response = await fetch('/api/documents-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(documentData),
      redirect: 'manual'
    });

    // Detect authentication redirects
    if (response.status === 302 || response.status === 307) {
      const redirectLocation = response.headers.get('Location');
      if (redirectLocation && redirectLocation.includes('/signin')) {
        console.error('Authentication redirect detected:', redirectLocation);
        throw new Error('Authentication required. Please sign in to create documents.');
      }
    }

    console.log(`Document creation response status: ${response.status}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('Error response from server:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = { error: 'Unknown error' };
      }

      console.error(`Failed to create document: ${response.status} ${response.statusText}`);
      throw new Error(errorData.error || `Failed to create document: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Document creation response:', responseData);
    
    // The API returns { data: {...} }
    const data = responseData.data;
    
    if (!data) {
      console.warn('Document creation response is missing data property:', responseData);
      throw new Error('Invalid response from server: missing document data');
    }
    
    console.log('Document created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error in createDocument:', error);

    // Check for authentication errors
    const errorStr = String(error);
    if (
      errorStr.includes('Authentication') ||
      errorStr.includes('signin') ||
      errorStr.includes('login') ||
      errorStr.includes('307') ||
      errorStr.includes('redirect')
    ) {
      // Create a special authentication error to help UI display appropriate message
      throw new Error('Authentication required. Please sign in to create documents.');
    }

    throw error; // Rethrow for mutation error handling
  }
}

async function updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    // Enhanced logging for debugging
    console.log(`Updating document ${id} with:`, JSON.stringify(updates, null, 2));
    
    // Safety check: If there's nothing to update, return early with a success response
    if (!updates || Object.keys(updates).length === 0) {
      console.warn(`Update called for document ${id} but no update fields provided`);
      return { id, ...updates };
    }
    
    // Ensure the ID is a string to prevent type issues
    const documentId = String(id);
    
    // Create a clean updates object with only defined fields, avoiding null values
    const cleanUpdates = Object.entries(updates)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((obj, [key, value]) => {
        // Special handling for content - ensure it's properly formatted
        if (key === 'content' && value) {
          try {
            // If it's already a string, ensure it's valid JSON if possible
            if (typeof value === 'string') {
              try {
                // Try parsing it - if it works, it's valid JSON
                const parsed = JSON.parse(value);
                return { ...obj, [key]: value };
              } catch (err) {
                // Not valid JSON, make it an empty document structure instead
                console.warn('Content not valid JSON, using default structure');
                return { ...obj, [key]: JSON.stringify({
                  type: 'doc',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }]
                })};
              }
            } else {
              // Object content, stringify it
              return { ...obj, [key]: JSON.stringify(value) };
            }
          } catch (e) {
            console.error('Error processing content:', e);
            // Default fallback
            return { ...obj, [key]: '{"type":"doc","content":[]}' };
          }
        }
        
        // Special handling for title
        if (key === 'title' && value !== undefined) {
          // Make sure title is never empty
          if (!value || value.trim() === '') {
            return { ...obj, [key]: 'Untitled' };
          }
          return { ...obj, [key]: String(value).trim() };
        }
        
        // Regular field
        return { ...obj, [key]: value };
      }, {});
      
    console.log(`Cleaned updates for document ${documentId}:`, cleanUpdates);
    
    // Create a payload object with the document ID explicitly included
    const payload = {
      id: documentId, // Required by API
      ...cleanUpdates
    };
    
    console.log(`Sending PATCH request to /api/documents-db with payload:`, payload);
    
    const response = await fetch(`/api/documents-db`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload),
      redirect: 'manual'
    });

    // Log the full response for debugging
    console.log(`Response status for document update ${documentId}:`, response.status);
    console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
    
    // Detect authentication redirects
    if (response.status === 302 || response.status === 307) {
      const redirectLocation = response.headers.get('Location');
      if (redirectLocation && redirectLocation.includes('/signin')) {
        console.error('Authentication redirect detected:', redirectLocation);
        throw new Error('Authentication required. Please sign in to update documents.');
      }
    }

    // Handle non-ok responses with detailed diagnostics
    if (!response.ok) {
      // Full logging for all response details
      console.error(`Error response status: ${response.status} ${response.statusText}`);
      console.error('Error updating document with payload:', payload);
      
      // Get more detailed error information
      let errorText = '';
      let errorData = { error: `HTTP Error: ${response.status} ${response.statusText}` };
      
      try {
        errorText = await response.text();
        console.error('Raw error response text:', errorText);
        
        try {
          if (errorText && errorText.trim()) {
            errorData = JSON.parse(errorText);
            console.error('Parsed error data:', errorData);
          }
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          errorData = { 
            error: errorText || `HTTP ${response.status} ${response.statusText}`,
            parseError: String(parseError) 
          };
        }
      } catch (textError) {
        console.error('Failed to read error response text:', textError);
        errorData.readError = String(textError);
      }
      
      console.error(`Error updating document ${id}:`, errorData);
      
      const errorMessage = 
        (errorData && typeof errorData.error === 'string') ? errorData.error : 
        `Failed to update document with ID: ${id} (Status: ${response.status})`;
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log(`Document ${id} update response:`, responseData);
    
    // The API returns { success: true, data: {...} }
    const data = responseData.data;
    
    if (!data) {
      console.warn(`Document update response for ${id} is missing data property:`, responseData);
      // Return something basic so UI doesn't crash
      return { id: documentId, ...cleanUpdates };
    }
    
    console.log(`Document ${id} updated successfully, returned data:`, data);
    return data;
  } catch (error) {
    console.error(`Error in updateDocument (${id}):`, error);
    
    // Check for authentication errors
    const errorStr = String(error);
    if (
      errorStr.includes('Authentication') ||
      errorStr.includes('signin') ||
      errorStr.includes('login') ||
      errorStr.includes('307') ||
      errorStr.includes('redirect')
    ) {
      throw new Error('Authentication required. Please sign in to update documents.');
    }
    
    throw error; // Rethrow for mutation error handling
  }
}

async function deleteDocument(id: string) {
  try {
    const response = await fetch(`/api/documents-db?id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Error deleting document ${id}:`, errorData);
      throw new Error(errorData.error || `Failed to delete document with ID: ${id}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error in deleteDocument (${id}):`, error);
    throw error; // Rethrow for mutation error handling
  }
}

export function useDocumentsQuery(featureId?: string, releaseId?: string) {
  const queryClient = useQueryClient();
  const documentsKey = ['documents', { featureId, releaseId }];

  // The query is created with these parameters (removed log for clarity)

  // Main query to fetch documents
  const documentsQuery = useQuery({
    queryKey: documentsKey,
    queryFn: () => {
      return fetchDocuments(featureId, releaseId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000), // Exponential backoff
    // Only run query if we have at least one of the required IDs
    enabled: !!(featureId || releaseId),
  });
  
  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
  
  // Update document mutation - always use optimistic updates to prevent UI refreshes
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, updates }: { 
      id: string, 
      updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>
    }) => updateDocument(id, updates),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      await queryClient.cancelQueries({ queryKey: ['document', variables.id] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['documents', { featureId, releaseId }]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['documents', { featureId, releaseId }], (oldData: Document[] | undefined) => {
        if (!oldData) return [];
        
        // Update document in cache
        return oldData.map(doc => 
          doc.id === variables.id ? { ...doc, ...variables.updates } : doc
        );
      });
      
      // Return a context object with the previous data
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['documents', { featureId, releaseId }], context.previousData);
      }
      console.error('Error updating document:', err);
    },
    onSettled: () => {
      // No query invalidation - we already updated the cache optimistically
      // This prevents unnecessary refreshes while still keeping data in sync
    }
  });
  
  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
  
  // Return the combined result
  return {
    // Data and loading states
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    
    // CRUD operations
    createDocument: createDocumentMutation.mutateAsync,
    updateDocument: (id: string, updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>) => 
      updateDocumentMutation.mutateAsync({ id, updates }),
    deleteDocument: deleteDocumentMutation.mutateAsync,
    
    // Loading states for mutations
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    
    // Refetch function
    refetch: documentsQuery.refetch,
    
    // Helper to get document by ID (for use in components)
    getDocumentById: (id: string) => {
      const documents = documentsQuery.data || [];
      return documents.find((doc: Document) => doc.id === id) || null;
    }
  };
}

// Hook for fetching a single document by ID
export function useDocumentQuery(documentId?: string) {
  const queryClient = useQueryClient();
  const documentKey = documentId ? ['document', documentId] : ['document'];

  // Query for single document
  const documentQuery = useQuery({
    queryKey: documentKey,
    queryFn: () => fetchDocument(documentId as string),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update document content mutation (specialized for document editing)
  const updateDocumentContentMutation = useMutation({
    mutationFn: (content: any) => {
      if (!documentId) {
        console.error('Cannot update document content: No document ID provided');
        throw new Error('Document ID is required to update content');
      }
      return updateDocument(documentId, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKey });
    },
    onError: (error) => {
      console.error('Document content update failed:', error);
      // Let the component handle the error display
    }
  });
  
  // Update document title mutation (specialized for document renaming)
  const updateDocumentTitleMutation = useMutation({
    mutationFn: (title: string) => {
      if (!documentId) {
        console.error('Cannot update document title: No document ID provided');
        throw new Error('Document ID is required to update title');
      }
      return updateDocument(documentId, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKey });
    },
    onError: (error) => {
      console.error('Document title update failed:', error);
      // Let the component handle the error display
    }
  });
  
  // Return the combined result
  return {
    // Data and loading states
    document: documentQuery.data,
    isLoading: documentQuery.isLoading,
    error: documentQuery.error,
    
    // Specialized mutations for document editing
    updateContent: updateDocumentContentMutation.mutateAsync,
    updateTitle: updateDocumentTitleMutation.mutateAsync,
    
    // Loading states for mutations
    isSavingContent: updateDocumentContentMutation.isPending,
    isSavingTitle: updateDocumentTitleMutation.isPending,
    
    // Refetch function
    refetch: documentQuery.refetch
  };
}