"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createHybridStorage } from '@/utils/hybrid-storage'

// Define Release model
export type Release = {
  id: string
  name: string
  description: string
  releaseDate: string // ISO date string
  priority: 'High' | 'Med' | 'Low'
  featureId: string
}

type ReleasesStore = {
  releases: Release[]
  // Actions
  addRelease: (release: Omit<Release, 'id'>) => void
  getReleases: () => Release[]
  getReleasesByFeatureId: (featureId: string) => Release[]
}

// Generate a simple ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store
export const useReleasesStore = create<ReleasesStore>()(
  persist(
    (set, get) => ({
      releases: [],
      addRelease: (release) => {
        const newRelease = {
          ...release,
          id: generateId(),
        }
        set((state) => ({
          releases: [...state.releases, newRelease]
        }))
      },
      getReleases: () => get().releases,
      getReleasesByFeatureId: (featureId) => {
        return get().releases.filter(release => release.featureId === featureId)
          .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
      }
    }),
    {
      name: 'releases-storage',
      storage: createHybridStorage('releases')
    }
  )
) 