'use client'

import { useState, useEffect } from 'react';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApprovalStatusBadge } from '@/components/approval-status-badge';
import { MinusCircle, Calendar, Search, Loader2 } from 'lucide-react';
import { Feature } from '@/types/models';
import { Input } from '@/components/ui/input';
import { AddFeatureToRoadmap } from './add-feature-to-roadmap';

// Define column interface for flexible table configuration
interface TableColumn {
  id: string;
  title: string;
  render: (feature: any) => React.ReactNode;
}

interface RoadmapFeaturesTableProps {
  roadmapId: string;
}

export function RoadmapFeaturesTable({ roadmapId }: RoadmapFeaturesTableProps) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    getRoadmapFeaturesQuery,
    removeFeatureFromRoadmap,
    isRemoving
  } = useRoadmapsQuery();

  // Get roadmap features using React Query hook
  const featuresQuery = getRoadmapFeaturesQuery(
    roadmapId,
    statusFilter !== 'All' ? statusFilter : undefined
  );

  // Group raw features by feature id, handling the one-to-many relationship with releases
  const isLoadingFeatures = featuresQuery.isLoading;
  const error = featuresQuery.error;

  // Type guard to safely check if data is a Feature array
  const isFeatureArray = (value: unknown): value is Feature[] =>
    Array.isArray(value) && (value.length === 0 || (typeof value[0] === 'object' && value[0] !== null && 'id' in value[0]));

  // Apply type guard to ensure we have a proper array
  const rawFeatures = isFeatureArray(featuresQuery.data) ? featuresQuery.data : [];

  // Group features that have the same ID to handle multiple releases per feature
  const featureMap = new Map();

  rawFeatures.forEach(feature => {
    if (!featureMap.has(feature.id)) {
      // Create a new feature entry
      const baseFeature = {...feature};

      // Add our custom releases property for UI purposes only (separate from the Feature type)
      // Note: releaseDate doesn't exist on Feature type, so we'll use undefined
      (baseFeature as any).releasesData = feature.releaseId ? [{
        id: feature.releaseId,
        name: feature.releaseName,
        date: undefined // Feature doesn't have releaseDate property
      }] : [];

      // Keep the original releases property as string[] to match the Feature type
      baseFeature.releases = feature.releaseId ? [feature.releaseId] : [];

      featureMap.set(feature.id, baseFeature);
    } else {
      // Add to existing feature's releases if this release isn't already included
      const existingFeature = featureMap.get(feature.id);

      if (feature.releaseId) {
        // Add to releasesData for UI purposes
        if (!existingFeature.releasesData.some((r: any) => r.id === feature.releaseId)) {
          existingFeature.releasesData.push({
            id: feature.releaseId,
            name: feature.releaseName,
            date: undefined // Feature doesn't have releaseDate property
          });
        }

        // Add to original releases array if not already included
        if (!existingFeature.releases.includes(feature.releaseId)) {
          existingFeature.releases.push(feature.releaseId);
        }
      }
    }
  });

  // Convert map back to array
  const features = Array.from(featureMap.values());

  // Status change effect - refetch when status changes
  useEffect(() => {
    if (featuresQuery.isError) {
      console.error('Error in features query:', featuresQuery.error);
    }
    featuresQuery.refetch().catch(err => {
      console.error('Error refetching data:', err);
    });
  }, [statusFilter, featuresQuery]);
  
  // Filter features based on search query
  const filteredFeatures = !searchQuery.trim() 
    ? features 
    : features.filter(feature => 
        feature.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle feature removal from roadmap
  const handleRemoveFeature = async (featureId: string) => {
    try {
      await removeFeatureFromRoadmap(featureId);
      // Feature will be removed from the list automatically via React Query
    } catch (error) {
      console.error('Error removing feature from roadmap:', error);
    }
  };

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-red-900/20 text-red-400 rounded-md">
        <p>Error loading roadmap features: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => featuresQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Render loading state
  if (isLoadingFeatures) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Loading roadmap features...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Tabs defaultValue={statusFilter} value={statusFilter} onValueChange={handleStatusChange} className="w-auto">
          <TabsList className="bg-muted">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Backlog">Backlog</TabsTrigger>
            <TabsTrigger value="Not Started">Not Started</TabsTrigger>
            <TabsTrigger value="In Progress">In Progress</TabsTrigger>
            <TabsTrigger value="Launched">Launched</TabsTrigger>
            <TabsTrigger value="Blocked">Blocked</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search features..."
              className="pl-8 h-9 bg-transparent border-[#2a2a2c] rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <AddFeatureToRoadmap
            roadmapId={roadmapId}
            onAddFeature={() => {
              // After adding features, refetch the query
              featuresQuery.refetch();
            }}
          />
        </div>
      </div>

      <div className="rounded-md border border-[#2a2a2c] bg-[#1e1e20] w-full">
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-[#1e1e20]">
              <TableRow className="border-b border-[#2a2a2c]">
                <TableHead className="text-[#a0a0a0] p-2">Feature</TableHead>
                <TableHead className="text-[#a0a0a0] p-2">Feature Status</TableHead>
                <TableHead className="text-[#a0a0a0] p-2">Release</TableHead>
                <TableHead className="text-[#a0a0a0] p-2 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.length > 0 ? (
                filteredFeatures.map((feature, index) => (
                  <TableRow
                    key={feature.id}
                    className={`
                      transition-colors duration-150
                      border-b border-[#2a2a2c]
                      ${index % 2 === 0 ? 'bg-[#1e1e20]' : 'bg-[#232326]'}
                      hover:bg-[#232326]
                    `}
                  >
                    <TableCell className="p-2 font-medium">{feature.name}</TableCell>
                    <TableCell className="p-2">
                      <ApprovalStatusBadge status={feature.workflowStatus || 'Not Started'} />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex flex-col gap-1">
                        {(feature as any).releasesData && (feature as any).releasesData.length > 0 ? (
                          (feature as any).releasesData.map((release: any) => (
                            <div key={release.id} className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{release.name}</span>
                              {/* Date display removed since releaseDate doesn't exist on Feature */}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No releases</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFeature(feature.id)}
                        disabled={isRemoving}
                      >
                        <MinusCircle className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-[#a0a0a0]">
                    {searchQuery 
                      ? 'No features match your search criteria.' 
                      : 'No features found in this roadmap.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}