"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createHybridStorage } from '@/utils/hybrid-storage'

// Define Requirement model
export type Requirement = {
  id: string
  name: string
  owner?: string
  description?: string
  priority?: 'High' | 'Med' | 'Low'
  releaseId?: string
  cuj?: string
  acceptanceCriteria?: string
}

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
  requirements?: Requirement[] // Add requirements array
  showRequirements?: boolean // Track if requirements section should be shown
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
  toggleRequirementsVisibility: (featureId: string, show?: boolean) => void // Toggle requirements visibility
  addRequirement: (featureId: string, requirement: Omit<Requirement, 'id'>) => void // Add requirement
  updateRequirement: (featureId: string, requirementId: string, updates: Partial<Requirement>) => void // Update requirement
  deleteRequirement: (featureId: string, requirementId: string) => void // Delete requirement
  deleteFeature: (featureId: string) => boolean // Delete a feature
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
          releases: [],
          requirements: [],
          showRequirements: false
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
      },
      // Toggle requirements visibility
      toggleRequirementsVisibility: (featureId, show) => {
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { 
                  ...feature, 
                  showRequirements: show !== undefined ? show : !feature.showRequirements 
                } 
              : feature
          )
        }))
      },
      // Add a new requirement to a feature
      addRequirement: (featureId, requirement) => {
        const newRequirement = {
          ...requirement,
          id: generateId()
        }
        
        set((state) => ({
          features: state.features.map(feature => 
            feature.id === featureId 
              ? { 
                  ...feature, 
                  requirements: [...(feature.requirements || []), newRequirement],
                  showRequirements: true
                } 
              : feature
          )
        }))
      },
      // Update an existing requirement
      updateRequirement: (featureId, requirementId, updates) => {
        set((state) => ({
          features: state.features.map(feature => {
            if (feature.id !== featureId) return feature;
            
            return {
              ...feature,
              requirements: (feature.requirements || []).map(req => 
                req.id === requirementId 
                  ? { ...req, ...updates } 
                  : req
              )
            }
          })
        }))
      },
      // Delete a requirement
      deleteRequirement: (featureId, requirementId) => {
        set((state) => ({
          features: state.features.map(feature => {
            if (feature.id !== featureId) return feature;
            
            return {
              ...feature,
              requirements: (feature.requirements || []).filter(req => req.id !== requirementId)
            }
          })
        }))
      },
      // Delete a feature
      deleteFeature: (featureId) => {
        // Find the feature to check if it exists
        const featureExists = get().features.some(feature => feature.id === featureId);
        
        if (!featureExists) {
          return false;
        }
        
        // Remove the feature from the store
        set((state) => ({
          features: state.features.filter(feature => feature.id !== featureId)
        }));
        
        return true;
      }
    }),
    {
      name: 'features-storage',
      storage: createHybridStorage('features')
    }
  )
) 