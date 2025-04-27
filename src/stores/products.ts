"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createHybridStorage } from '@/utils/hybrid-storage'

// Define Product model
export type Product = {
  id: string
  name: string
  description: string
  interfaces?: string[]
}

type ProductsStore = {
  products: Product[]
  // Actions
  addProduct: (product: Omit<Product, 'id'>) => Product
  getProducts: () => Product[]
  getProductById: (productId: string) => Product | undefined
  updateProductWithInterface: (productId: string, interfaceId: string) => void
  updateProductName: (productId: string, name: string) => void
}

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store
export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const newProduct = {
          ...product,
          id: generateId(),
          interfaces: []
        }
        set((state) => ({
          products: [...state.products, newProduct]
        }))
        return newProduct
      },
      getProducts: () => get().products,
      getProductById: (productId) => {
        return get().products.find(product => product.id === productId)
      },
      updateProductWithInterface: (productId, interfaceId) => {
        set((state) => ({
          products: state.products.map(product => 
            product.id === productId 
              ? { 
                  ...product, 
                  interfaces: [...(product.interfaces || []), interfaceId] 
                } 
              : product
          )
        }))
      },
      updateProductName: (productId, name) => {
        // Don't update if name is empty
        if (!name.trim()) return;
        
        set((state) => ({
          products: state.products.map(product => 
            product.id === productId 
              ? { ...product, name } 
              : product
          )
        }))
      }
    }),
    {
      name: 'products-storage',
      storage: createHybridStorage('products')
    }
  )
) 