"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createHybridStorage } from '@/utils/hybrid-storage'

// Define Feature model
export type Feature = {
  id: string
  name: string
  priority: 'High' | 'Med' | 'Low'
  description: string
  interfaceId: string
  content?: string
  releases?: string[]
  artifacts?: string[]
}

type FeaturesStore = {
  features: Feature[]
  // Actions
  addFeature: (feature: Omit<Feature, 'id'>) => Feature
  getFeatures: () => Feature[]
  getFeaturesByInterfaceId: (interfaceId: string) => Feature[]
  getFeatureById: (featureId: string) => Feature | undefined
  updateFeatureWithRelease: (featureId: string, releaseId: string) => void
  saveFeatureContent: (featureId: string, content: string) => void
  updateFeatureName: (featureId: string, name: string) => void
  updateFeatureDescription: (featureId: string, description: string) => void
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
        return newFeature
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
      },
      saveFeatureContent: (featureId, content) => {
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { ...feature, content } 
              : feature
          )
        }))
      },
      updateFeatureName: (featureId, name) => {
        // Don't update if name is empty
        if (!name.trim()) return;
        
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { ...feature, name: name.trim() } 
              : feature
          )
        }))
      },
      updateFeatureDescription: (featureId, description) => {
        // Don't update if description is empty
        if (!description.trim()) return;
        
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { ...feature, description: description.trim() } 
              : feature
          )
        }))
      }
    }),
    {
      name: 'features-storage',
      storage: createHybridStorage('features')
    }
  )
) 