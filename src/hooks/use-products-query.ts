'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Product } from '@/types/models'

// Query key for products
const PRODUCTS_QUERY_KEY = 'products'

/**
 * Hook for working with products using React Query
 */
export function useProductsQuery() {
  const queryClient = useQueryClient()

  // Get all products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/products-db')
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      return response.json()
    },
  })

  // Create product mutation
  const addProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id'>): Promise<Product> => {
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
      
      return response.json()
    },
    onSuccess: (newProduct) => {
      // Update cache with the new product
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData = []) => {
        return [...oldData, newProduct]
      })
    },
  })

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
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData = []) => {
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
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData = []) => {
        return oldData.map(product => 
          product.id === data.productId 
            ? { ...product, description: data.description } 
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
      queryClient.setQueryData<Product[]>([PRODUCTS_QUERY_KEY], (oldData = []) => {
        return oldData.filter(product => product.id !== productId)
      })
    },
  })

  // Compatibility methods that match the Zustand API
  const getProducts = () => products
  
  const getProductById = (productId: string) => {
    return products.find(product => product.id === productId)
  }
  
  const addProduct = async (product: Omit<Product, 'id'>) => {
    return addProductMutation.mutateAsync(product)
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
  
  // Temporary placeholder for interface updates, to be implemented later
  const updateProductWithInterface = (productId: string, interfaceId: string) => {
    // This will be implemented properly when we refactor interfaces
    console.log('updateProductWithInterface called:', productId, interfaceId)
  }

  return {
    // State
    products,
    isLoading,
    error,
    
    // Mutations
    addProductMutation,
    updateProductNameMutation,
    updateProductDescriptionMutation,
    deleteProductMutation,
    
    // Zustand-compatible methods
    getProducts,
    getProductById,
    addProduct,
    updateProductName,
    updateProductDescription,
    updateProductWithInterface,
    deleteProduct,
    
    // Refetch helper
    refetch: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] })
  }
}