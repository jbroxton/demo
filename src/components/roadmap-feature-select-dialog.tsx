'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Feature } from '@/types/models'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query'
import { useFeaturesQuery } from '@/hooks/use-features-query'

interface RoadmapFeatureSelectDialogProps {
  roadmapId: string
  onFeaturesAdded?: () => void
}

export function RoadmapFeatureSelectDialog({
  roadmapId,
  onFeaturesAdded
}: RoadmapFeatureSelectDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  
  // Get features not in the roadmap
  const { features: allFeatures = [], isLoading: isFeaturesLoading } = useFeaturesQuery()
  const { isAdding, addFeatureToRoadmap } = useRoadmapsQuery()
  
  // Filter features not already in the roadmap
  const availableFeatures = allFeatures.filter(feature => !feature.roadmapId)
  
  // Filter features based on search query
  const filteredFeatures = availableFeatures.filter(feature => 
    feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFeatureSelection = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleAddFeatures = async () => {
    try {
      // Add all selected features to the roadmap
      await Promise.all(
        selectedFeatures.map(featureId => 
          addFeatureToRoadmap(featureId, roadmapId)
        )
      )
      
      // Reset selection and close dialog
      setSelectedFeatures([])
      setOpen(false)
      
      // Notify parent component
      if (onFeaturesAdded) {
        onFeaturesAdded()
      }
    } catch (error) {
      console.error('Error adding features to roadmap:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Features
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Features to Roadmap</DialogTitle>
          <DialogDescription>
            Select features to add to your roadmap. These features will appear in the roadmap view.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            {isFeaturesLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading features...</div>
            ) : filteredFeatures.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No matching features found' : 'No available features to add'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredFeatures.map(feature => (
                  <div key={feature.id} className="p-3 flex items-start space-x-3 hover:bg-muted/50">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeatureSelection(feature.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`feature-${feature.id}`}
                        className="font-medium text-sm cursor-pointer"
                      >
                        {feature.name}
                      </label>
                      {feature.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {feature.description.length > 100
                            ? `${feature.description.substring(0, 100)}...`
                            : feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setSelectedFeatures([])
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddFeatures}
            disabled={selectedFeatures.length === 0 || isAdding}
          >
            {isAdding ? 'Adding...' : `Add ${selectedFeatures.length} Feature${selectedFeatures.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}