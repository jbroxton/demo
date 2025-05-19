'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Product } from '@/types/models'

// Query key for products
const PRODUCTS_QUERY_KEY = 'products'

// Type for creating a new product - excludes id and interfaces as they're added automatically
type CreateProductInput = Omit<Product, 'id' | 'interfaces'>

/**
 * Hook for working with products using React Query
 */
export function useProductsQuery() {
  const queryClient = useQueryClient()
  
  console.log('useProductsQuery hook called');
  console.log('queryClient exists:', !!queryClient);

  // Check initial cache state
  console.log('Initial cache state:', queryClient.getQueryData([PRODUCTS_QUERY_KEY]));
  
  // Get all products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: async () => {
      console.log('useQuery - Fetching products...');
      const response = await fetch('/api/products-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const result = await response.json();
      console.log('useQuery - Fetched products response:', result);
      console.log('useQuery - Extracted data:', result.data);
      // Extract the data array from the response
      const productsData = result.data || [];
      return productsData;
    }
  })
  
  console.log('Query hook state:', { products, isLoading, error });
  console.log('=== CREATING MUTATION ===');

  // Create product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: CreateProductInput): Promise<Product> => {
      console.log('=== MUTATION FUNCTION CALLED ===');
      console.log('Creating product:', product);
      const response = await fetch('/api/products-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json();
      console.log('Created product response:', result);
      // Extract the data from the response
      return result.data;
    },
    onSuccess: (newProduct) => {
      console.log('addProductMutation onSuccess:', newProduct);
      console.log('Current cache before update:', queryClient.getQueryData([PRODUCTS_QUERY_KEY]));
      
      // Update cache with the new product
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData = []) => {
        console.log('Old data in cache:', oldData);
        const updatedData = [...oldData, newProduct];
        console.log('New data to set in cache:', updatedData);
        return updatedData;
      });
      
      console.log('Current cache after update:', queryClient.getQueryData([PRODUCTS_QUERY_KEY]));
    },
  })

  console.log('=== MUTATION CREATED ===', {
    mutationExists: !!addProductMutation,
    mutateAsyncExists: !!addProductMutation.mutateAsync,
    mutationKeys: Object.keys(addProductMutation),
  });

  // Update product name mutation
  const updateProductNameMutation = useMutation({
    mutationFn: async ({ productId, name }: { productId: string, name: string }) => {
      if (!name.trim()) return null
      
      const response = await fetch('/api/products-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, name }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { productId, name }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated product name
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData || [];
        }
        return oldData.map(product => 
          product.id === data.productId 
            ? { ...product, name: data.name } 
            : product
        )
      })
    },
  })

  // Update product description mutation
  const updateProductDescriptionMutation = useMutation({
    mutationFn: async ({ productId, description }: { productId: string, description: string }) => {
      if (!description.trim()) return null
      
      const response = await fetch('/api/products-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, description }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return { productId, description }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the updated product description
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData || [];
        }
        return oldData.map(product => 
          product.id === data.productId 
            ? { ...product, description: data.description } 
            : product
        )
      })
    },
  })

  // Mark product as saved mutation
  const markProductAsSavedMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch('/api/products-db', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, markAsSaved: true }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return { productId, savedAt: result.savedAt }
    },
    onSuccess: (data) => {
      if (!data) return

      // Update cache with the saved status
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData || [];
        }
        return oldData.map(product => 
          product.id === data.productId 
            ? { ...product, isSaved: true, savedAt: data.savedAt } 
            : product
        )
      })
    },
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products-db?id=${productId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      return productId
    },
    onSuccess: (productId) => {
      // Remove the deleted product from cache
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) {
          return oldData || [];
        }
        return oldData.filter(product => product.id !== productId)
      })
    },
  })

  // Compatibility methods that match the Zustand API
  const getProducts = (): Product[] => products
  
  const getProductById = (productId: string): Product | undefined => {
    console.log('getProductById called with:', productId);
    console.log('Current products state:', products);
    console.log('Is Loading?', isLoading);
    if (!products || !Array.isArray(products)) {
      console.log('Products not loaded or not an array, returning undefined');
      return undefined
    }
    console.log('Looking for product with id:', productId);
    console.log('Products in store:', products.map(p => ({ id: p.id, name: p.name, isSaved: p.isSaved })));
    const found = products.find(product => product.id === productId);
    console.log('Found product:', found);
    return found;
  }
  
  const addProduct = async (product: CreateProductInput) => {
    console.log('addProduct called with:', product);
    console.log('addProduct - product type:', typeof product);
    console.log('addProduct - product keys:', Object.keys(product));
    console.log('addProduct - mutation state:', {
      isPending: addProductMutation.isPending,
      isError: addProductMutation.isError,
      error: addProductMutation.error,
    });
    
    try {
      const result = await addProductMutation.mutateAsync(product);
      console.log('addProduct result:', result);
      return result;
    } catch (error) {
      console.error('addProduct mutation error:', error);
      throw error;
    }
  }
  
  const updateProductName = async (productId: string, name: string) => {
    if (!name.trim()) return
    return updateProductNameMutation.mutateAsync({ productId, name })
  }
  
  const updateProductDescription = async (productId: string, description: string) => {
    if (!description.trim()) return
    return updateProductDescriptionMutation.mutateAsync({ productId, description })
  }
  
  const deleteProduct = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId)
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      return false
    }
  }
  
  const markProductAsSaved = async (productId: string) => {
    console.log('markProductAsSaved called with:', productId)
    try {
      await markProductAsSavedMutation.mutateAsync(productId)
      return true
    } catch (error) {
      console.error('Error marking product as saved:', error)
      return false
    }
  }
  
  // Temporary placeholder for interface updates, to be implemented later
  const updateProductWithInterface = (productId: string, interfaceId: string) => {
    // This will be implemented properly when we refactor interfaces
    console.log('updateProductWithInterface called:', productId, interfaceId)
  }

  return {
    // State
    products: products as Product[],
    isLoading,
    error,
    queryClient, // Expose query client for external invalidation
    
    // Mutations
    addProductMutation,
    updateProductNameMutation,
    updateProductDescriptionMutation,
    deleteProductMutation,
    markProductAsSavedMutation,
    
    // Zustand-compatible methods
    getProducts,
    getProductById,
    addProduct,
    updateProductName,
    updateProductDescription,
    updateProductWithInterface,
    markProductAsSaved,
    deleteProduct,
    
    // Refetch helper
    refetch: async () => {
      console.log('Refetching products query...');
      const result = await queryClient.refetchQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      console.log('Refetch complete', result);
      return result;
    },
    
    // Invalidate queries helper
    invalidateQueries: async () => {
      console.log('Invalidating products query...');
      await queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      console.log('Products query invalidated');
    }
  }
}