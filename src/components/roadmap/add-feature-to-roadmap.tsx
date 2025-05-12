'use client'

import { useState, useEffect } from 'react';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { Feature } from '@/types/models';
import { Checkbox } from '@/components/ui/checkbox';
import { ApprovalStatusBadge } from '@/components/approval-status-badge';
import { cn } from '@/lib/utils';

interface AddFeatureToRoadmapProps {
  roadmapId: string;
  onAddFeature: () => void;
}

export function AddFeatureToRoadmap({ roadmapId, onAddFeature }: AddFeatureToRoadmapProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { addFeatureToRoadmap, isAdding } = useRoadmapsQuery();

  // Load available features (not on this roadmap)
  const loadAvailableFeatures = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/features-db');
      if (!response.ok) {
        throw new Error('Failed to fetch features');
      }
      
      const data = await response.json();
      
      // Filter out features that are already on this roadmap
      const notOnRoadmap = data.filter((feature: Feature) => 
        feature.roadmapId !== roadmapId
      );
      
      setAvailableFeatures(notOnRoadmap);
      setFilteredFeatures(notOnRoadmap);
    } catch (error) {
      console.error('Error loading available features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load features when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableFeatures();
      setSearchQuery('');
      setSelectedFeatures([]);
    }
  }, [open]);

  // Handle search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFeatures(availableFeatures);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = availableFeatures.filter(feature => 
      feature.name.toLowerCase().includes(lowerQuery) || 
      (feature.description && feature.description.toLowerCase().includes(lowerQuery))
    );
    
    setFilteredFeatures(filtered);
  }, [searchQuery, availableFeatures]);

  // Handle feature selection
  const toggleFeatureSelection = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // Handle adding features to roadmap
  const handleAddToRoadmap = async () => {
    try {
      // Add selected features to roadmap
      for (const featureId of selectedFeatures) {
        await addFeatureToRoadmap(featureId, roadmapId);
      }
      
      onAddFeature();
      setOpen(false);
    } catch (error) {
      console.error('Error adding features to roadmap:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Features
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Features to Roadmap</DialogTitle>
          <DialogDescription>
            Select features to add to this roadmap
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                className="pl-8 h-9 bg-transparent border-[#2a2a2c] rounded-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md border-[#2a2a2c] h-[300px] overflow-y-auto bg-card">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Loading features...</span>
              </div>
            ) : filteredFeatures.length > 0 ? (
              <div className="divide-y divide-[#2a2a2c]">
                {filteredFeatures.map(feature => (
                  <div 
                    key={feature.id} 
                    className="p-3 flex items-start hover:bg-muted/50 feature-item-wrapper transition-colors"
                  >
                    <Checkbox 
                      id={`feature-${feature.id}`}
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeatureSelection(feature.id)}
                      className="mt-1 mr-3 feature-item-checkbox"
                    />
                    <div 
                      className="flex-1 feature-item-content"
                      onClick={() => toggleFeatureSelection(feature.id)}
                    >
                      <label 
                        htmlFor={`feature-${feature.id}`}
                        className="font-medium cursor-pointer block"
                      >
                        {feature.name}
                      </label>
                      {feature.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {feature.description}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {feature.releaseId && (
                          <div className="text-xs px-2 py-0.5 bg-blue-100/10 text-blue-500 rounded-full">
                            {feature.releaseName || 'Unknown Release'}
                          </div>
                        )}
                        {feature.workflowStatus && (
                          <ApprovalStatusBadge status={feature.workflowStatus} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {searchQuery 
                  ? 'No matching features found'
                  : 'No features available to add'}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFeatures.length} features
            </div>
            <Button 
              onClick={handleAddToRoadmap} 
              disabled={selectedFeatures.length === 0 || isAdding}
            >
              {isAdding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add to Roadmap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}