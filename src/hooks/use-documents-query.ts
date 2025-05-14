import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document } from '@/types/models';

// Fetch functions to call the API
async function fetchDocuments(featureId?: string, releaseId?: string) {
  let url = '/api/documents-db';
  const params = new URLSearchParams();

  if (featureId) params.append('featureId', featureId);
  if (releaseId) params.append('releaseId', releaseId);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

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
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

      console.log(`Fetched ${Array.isArray(data) ? data.length : 0} documents`);

      // Validate response
      if (!Array.isArray(data)) {
        console.warn('Documents response is not an array, using empty array instead');
        return [];
      }

      return data;
    } catch (fetchError) {
      // Handle AbortController timeout
      if (fetchError.name === 'AbortError') {
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

    const data = await response.json();
    console.log(`Successfully fetched document ${id}`);
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

async function createDocument(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>) {
  try {
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

    const data = await response.json();
    console.log('Document created successfully:', data?.id);
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

async function updateDocument(id: string, updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>) {
  try {
    const response = await fetch(`/api/documents-db?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Error updating document ${id}:`, errorData);
      throw new Error(errorData.error || `Failed to update document with ID: ${id}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error in updateDocument (${id}):`, error);
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

  // Main query to fetch documents
  const documentsQuery = useQuery({
    queryKey: documentsKey,
    queryFn: () => fetchDocuments(featureId, releaseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000), // Exponential backoff
    onError: (error) => {
      console.error('React Query error in useDocumentsQuery:', error);
    }
  });
  
  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
  
  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>> }) => 
      updateDocument(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate both the document list and the specific document
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
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
    updateDocument: (id: string, updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>) => 
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
    mutationFn: (content: any) => updateDocument(documentId as string, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKey });
    }
  });
  
  // Update document title mutation (specialized for document renaming)
  const updateDocumentTitleMutation = useMutation({
    mutationFn: (title: string) => updateDocument(documentId as string, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKey });
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