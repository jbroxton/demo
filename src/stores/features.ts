"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Define Feature model
export type Feature = {
  id: string
  name: string
  priority: 'High' | 'Med' | 'Low'
  description: string
  interfaceId: string
  releases?: string[]
  artifacts?: string[]
}

type FeaturesStore = {
  features: Feature[]
  // Actions
  addFeature: (feature: Omit<Feature, 'id'>) => void
  getFeatures: () => Feature[]
  getFeaturesByInterfaceId: (interfaceId: string) => Feature[]
  getFeatureById: (featureId: string) => Feature | undefined
  updateFeatureWithRelease: (featureId: string, releaseId: string) => void
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
          releases: []
        }
        set((state) => ({
          features: [...state.features, newFeature]
        }))
      },
      getFeatures: () => get().features,
      getFeaturesByInterfaceId: (interfaceId) => {
        return get().features.filter(feature => feature.interfaceId === interfaceId)
      },
      getFeatureById: (featureId) => {
        return get().features.find(feature => feature.id === featureId)
      },
      updateFeatureWithRelease: (featureId, releaseId) => {
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { 
                  ...feature, 
                  releases: [...(feature.releases || []), releaseId] 
                } 
              : feature
          )
        }))
      }
    }),
    {
      name: 'features-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
) 