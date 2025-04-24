"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Define Interface model
export type Interface = {
  id: string
  name: string
  description: string
  productId: string
  features?: string[]
}

type InterfacesStore = {
  interfaces: Interface[]
  // Actions
  addInterface: (interface_: Omit<Interface, 'id'>) => void
  getInterfaces: () => Interface[]
  getInterfacesByProductId: (productId: string) => Interface[]
  updateInterfaceWithFeature: (interfaceId: string, featureId: string) => void
}

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store
export const useInterfacesStore = create<InterfacesStore>()(
  persist(
    (set, get) => ({
      interfaces: [],
      addInterface: (interface_) => {
        const newInterface = {
          ...interface_,
          id: generateId(),
          features: []
        }
        set((state) => ({
          interfaces: [...state.interfaces, newInterface]
        }))
      },
      getInterfaces: () => get().interfaces,
      getInterfacesByProductId: (productId) => {
        return get().interfaces.filter(interface_ => interface_.productId === productId)
      },
      updateInterfaceWithFeature: (interfaceId, featureId) => {
        set((state) => ({
          interfaces: state.interfaces.map(interface_ => 
            interface_.id === interfaceId 
              ? { 
                  ...interface_, 
                  features: [...(interface_.features || []), featureId] 
                } 
              : interface_
          )
        }))
      }
    }),
    {
      name: 'interfaces-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
) 