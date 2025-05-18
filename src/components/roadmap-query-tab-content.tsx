'use client'

import React from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Map } from 'lucide-react';

interface RoadmapTabContentProps {
  tabId: string;
}

export function RoadmapQueryTabContent({ tabId }: RoadmapTabContentProps) {
  const { openTab } = useTabsQuery();
  const { roadmaps, isLoading, error } = useRoadmapsQuery();

  // Handler for opening a specific roadmap
  const handleOpenRoadmap = (roadmapId: string, roadmapName: string) => {
    openTab({
      title: roadmapName,
      type: 'roadmap',
      itemId: roadmapId,
      hasChanges: false
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        <span className="text-[#a0a0a0]">Loading roadmaps...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center text-[#a0a0a0]">
          <h3 className="text-lg font-medium">Error loading roadmaps</h3>
          <p className="text-sm mt-2">{String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with New Roadmap button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-5 w-5" />
          Roadmaps
        </h2>

        <Button onClick={() => {
          // Create a temporary ID with timestamp
          const timestamp = Date.now();
          const temporaryItemId = `new-roadmap-${timestamp}`;

          // Open a new tab for roadmap creation
          openTab({
            title: 'New Roadmap',
            type: 'roadmap',
            itemId: temporaryItemId,
            hasChanges: false
          });
        }}>
          <PlusCircle className="h-4 w-4 mr-2" /> New Roadmap
        </Button>
      </div>

      {/* My Roadmaps section */}
      <div>
        <h3 className="text-lg font-medium mb-4">My Roadmaps</h3>
        
        {roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map(roadmap => (
              <Card 
                key={roadmap.id} 
                className="hover:bg-[#232326] cursor-pointer transition-colors"
                onClick={() => handleOpenRoadmap(roadmap.id, roadmap.name)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-blue-400" />
                    {roadmap.name}
                    {roadmap.is_default === 1 && (
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {roadmap.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <div className="text-xs text-[#a0a0a0]">
                    Created {new Date(roadmap.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-[#2a2a2c] rounded-lg">
            <Map className="h-12 w-12 mx-auto mb-3 text-[#a0a0a0]" />
            <h4 className="text-lg font-medium mb-2">You have no roadmaps</h4>
            <p className="text-[#a0a0a0] mb-4">Create your first roadmap to start organizing features.</p>
            <Button onClick={() => {
              // Create a temporary ID with timestamp
              const timestamp = Date.now();
              const temporaryItemId = `new-roadmap-${timestamp}`;

              // Open a new tab for roadmap creation
              openTab({
                title: 'New Roadmap',
                type: 'roadmap',
                itemId: temporaryItemId,
                hasChanges: false
              });
            }}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Roadmap
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}