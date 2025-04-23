"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Define Feature model
export type Feature = {
  id: string
  name: string
  priority: 'High' | 'Med' | 'Low'
  description: string
  productName: string
  releaseId?: string
  artifacts?: string[]
}

type FeaturesStore = {
  features: Feature[]
  // Actions
  addFeature: (feature: Omit<Feature, 'id'>) => void
  getFeatures: () => Feature[]
}

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store
export const useFeaturesStore = create<FeaturesStore>()(
  persist(
    (set, get) => ({
      features: [],
      addFeature: (feature) => {
        const newFeature = {
          ...feature,
          id: generateId(),
        }
        set((state) => ({
          features: [...state.features, newFeature]
        }))
      },
      getFeatures: () => get().features
    }),
    {
      name: 'features-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
) 