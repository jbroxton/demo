'use client'

import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Map } from 'lucide-react';
import { EntityCreator } from '@/components/entity-creator';

interface RoadmapTabContentProps {
  tabId: string;
}

export function RoadmapQueryTabContent({ tabId }: RoadmapTabContentProps) {
  const { openTab } = useTabsQuery();
  const { roadmaps, isLoading, error } = useRoadmapsQuery();
  const { currentTenant } = useAuth();

  // Handler for opening a specific roadmap
  const handleOpenRoadmap = (roadmapId: string, roadmapName: string) => {
    console.log('[RoadmapQueryTabContent] Opening roadmap:', { roadmapId, roadmapName });
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
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-white"></div>
        <span className="text-base font-medium text-white/70">Loading roadmaps...</span>
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6 text-blue-500" />
          Roadmaps
        </h2>

        <EntityCreator
          entityType="roadmap"
          buttonLabel="New Roadmap"
          buttonVariant="default"
          buttonSize="default"
          buttonClassName="bg-blue-600 hover:bg-blue-700 text-white px-4"
          iconOnly={false}
        />
      </div>

      {/* My Roadmaps section */}
      <div>
        <h3 className="text-lg font-medium mb-4">My Roadmaps</h3>
        
        {roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map(roadmap => (
              <Card 
                key={roadmap.id} 
                className="hover:bg-[#232326] cursor-pointer transition-colors border-[#1a1a1c]"
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
                    {roadmap.description && roadmap.description.startsWith('{') 
                      ? (
                        <div className="flex items-center gap-1 text-[#a0a0a0]">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="10 17 15 12 10 7"/>
                          </svg>
                          Notion-style document with tables and structured content
                        </div>
                      ) 
                      : roadmap.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-[#a0a0a0]">
                      Created {new Date(roadmap.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs bg-[#1a1a1c] text-[#a0a0a0] px-2 py-0.5 rounded">
                      Open document →
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 border border-dashed border-[#2a2a2c] rounded-lg bg-[#0A0A0A]/50">
            <Map className="h-16 w-16 mx-auto mb-4 text-[#232326]" />
            <h4 className="text-xl font-medium mb-3">You have no roadmaps yet</h4>
            <p className="text-[#a0a0a0] mb-6 max-w-md mx-auto">Create your first roadmap to document your product vision and organize features in a structured document.</p>
            <EntityCreator
              entityType="roadmap"
              buttonLabel="Create Roadmap"
              buttonVariant="default"
              buttonSize="default" 
              buttonClassName="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              iconOnly={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}