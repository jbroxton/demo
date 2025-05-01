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
  featureId: string
  releaseId?: string
  cuj?: string
  acceptanceCriteria?: string
}

type RequirementsStore = {
  requirements: Requirement[]
  // Actions
  addRequirement: (requirement: Omit<Requirement, 'id'>) => Requirement
  getRequirements: () => Requirement[]
  getRequirementsByFeatureId: (featureId: string) => Requirement[]
  getRequirementsByReleaseId: (releaseId: string) => Requirement[]
  getRequirementById: (requirementId: string) => Requirement | undefined
  updateRequirement: (requirementId: string, updates: Partial<Requirement>) => void
  assignRequirementToRelease: (requirementId: string, releaseId: string) => void
  removeRequirementFromRelease: (requirementId: string) => void
  deleteRequirement: (requirementId: string) => boolean
}

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store
export const useRequirementsStore = create<RequirementsStore>()(
  persist(
    (set, get) => ({
      requirements: [],
      
      addRequirement: (requirement) => {
        const newRequirement = {
          ...requirement,
          id: generateId(),
        }
        set((state) => ({
          requirements: [...state.requirements, newRequirement]
        }))
        return newRequirement
      },
      
      getRequirements: () => get().requirements,
      
      getRequirementsByFeatureId: (featureId) => {
        return get().requirements.filter(requirement => requirement.featureId === featureId)
      },
      
      getRequirementsByReleaseId: (releaseId) => {
        return get().requirements.filter(requirement => requirement.releaseId === releaseId)
      },
      
      getRequirementById: (requirementId) => {
        return get().requirements.find(requirement => requirement.id === requirementId)
      },
      
      updateRequirement: (requirementId, updates) => {
        set((state) => ({
          requirements: state.requirements.map(requirement => 
            requirement.id === requirementId 
              ? { ...requirement, ...updates } 
              : requirement
          )
        }))
      },
      
      assignRequirementToRelease: (requirementId, releaseId) => {
        set((state) => ({
          requirements: state.requirements.map(requirement => 
            requirement.id === requirementId 
              ? { ...requirement, releaseId } 
              : requirement
          )
        }))
      },
      
      removeRequirementFromRelease: (requirementId) => {
        set((state) => ({
          requirements: state.requirements.map(requirement => 
            requirement.id === requirementId 
              ? { ...requirement, releaseId: undefined } 
              : requirement
          )
        }))
      },
      
      deleteRequirement: (requirementId) => {
        // Find the requirement to check if it exists
        const requirementExists = get().requirements.some(requirement => requirement.id === requirementId);
        
        if (!requirementExists) {
          return false;
        }
        
        // Remove the requirement from the store
        set((state) => ({
          requirements: state.requirements.filter(requirement => requirement.id !== requirementId)
        }));
        
        return true;
      }
    }),
    {
      name: 'requirements-storage',
      storage: createHybridStorage('requirements')
    }
  )
) 