"use client";

import React, { useMemo } from 'react';
import { PageMultiSelectProper as PageMultiSelect } from './page-multi-select-proper';
import { AssignmentBadges } from './assignment-badges';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import type { Page, PageType } from '@/types/models/Page';

interface AssignmentItem {
  id: string;
  title: string;
}

// This interface matches the actual database structure 
interface PageAssignments {
  roadmaps: AssignmentItem[];
  releases: AssignmentItem[];
}

// Type guard to ensure assignment data is valid
function isValidAssignment(assignment: any): assignment is PageAssignments {
  return assignment && 
         Array.isArray(assignment.roadmaps) && 
         Array.isArray(assignment.releases);
}

interface PageAssignmentsSectionProps {
  /** Current page ID */
  pageId: string;
  /** Current page data */
  pageData: Page;
}

export function PageAssignmentsSection({ 
  pageId, 
  pageData 
}: PageAssignmentsSectionProps) {
  const pagesState = useUnifiedPages();
  
  // Get all pages for assignment options
  const allPages = pagesState.getPages();
  
  // Get LIVE page data from React Query cache (not static prop)
  const livePage = pagesState.getPageById(pageId) || pageData;
  
  // Filter pages by type and exclude current page
  const roadmapOptions = useMemo(() => {
    return allPages.filter((page: Page) => 
      page.type === 'roadmap' && 
      page.id !== pageId
    );
  }, [allPages, pageId]);
  
  const releaseOptions = useMemo(() => {
    return allPages.filter((page: Page) => 
      page.type === 'release' && 
      page.id !== pageId
    );
  }, [allPages, pageId]);
  
  // Get current assignments from LIVE page properties (reactive to cache updates)
  const rawAssignments = livePage.properties?.assignedTo;
  const currentAssignments: PageAssignments = isValidAssignment(rawAssignments) 
    ? rawAssignments 
    : { roadmaps: [], releases: [] };
  
  const roadmapAssignments = currentAssignments.roadmaps;
  const releaseAssignments = currentAssignments.releases;
  
  console.log('🔍 Live assignments state:', { 
    pageId, 
    roadmapCount: roadmapAssignments.length, 
    releaseCount: releaseAssignments.length,
    roadmapAssignments, 
    releaseAssignments 
  });
  
  // Update assignments in page properties using existing updatePage method
  const updateAssignments = async (type: 'roadmaps' | 'releases', newItems: AssignmentItem[]) => {
    console.log(`updateAssignments called for ${type}:`, newItems);
    try {
      const updatedProperties = {
        ...livePage.properties,
        assignedTo: {
          ...currentAssignments,
          [type]: newItems
        }
      };
      
      console.log('Updated properties:', updatedProperties);
      
      // Use existing pagesState.updatePage - no separate auto-save needed
      await pagesState.updatePage(pageId, { 
        properties: updatedProperties 
      });
      
      console.log('Page update completed successfully');
    } catch (error) {
      console.error(`Failed to update ${type} assignments:`, error);
    }
  };
  
  // Handle roadmap assignment changes
  const handleRoadmapChange = (newRoadmaps: AssignmentItem[]) => {
    console.log('handleRoadmapChange called with:', newRoadmaps);
    updateAssignments('roadmaps', newRoadmaps);
  };
  
  // Handle release assignment changes
  const handleReleaseChange = (newReleases: AssignmentItem[]) => {
    updateAssignments('releases', newReleases);
  };
  
  // Handle removing individual assignments
  const handleRemoveRoadmap = (roadmapId: string) => {
    const newRoadmaps = roadmapAssignments.filter(item => item.id !== roadmapId);
    updateAssignments('roadmaps', newRoadmaps);
  };
  
  const handleRemoveRelease = (releaseId: string) => {
    const newReleases = releaseAssignments.filter(item => item.id !== releaseId);
    updateAssignments('releases', newReleases);
  };

  return (
    <section>
      <h3 className="text-sm font-medium text-white/90 mb-3">Assignments</h3>
      
      <div className="space-y-4">
        {/* Roadmap Assignments */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">Roadmaps</label>
          
          <PageMultiSelect
            options={roadmapOptions}
            selectedItems={roadmapAssignments}
            onSelectionChange={handleRoadmapChange}
            placeholder="Select roadmaps..."
            searchPlaceholder="Search roadmaps..."
            emptyMessage="No roadmaps found"
            className="mb-2"
          />
          
          <AssignmentBadges
            items={roadmapAssignments}
            onRemove={handleRemoveRoadmap}
            emptyText="No roadmap assignments"
          />
        </div>
        
        {/* Release Assignments */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">Releases</label>
          
          <PageMultiSelect
            options={releaseOptions}
            selectedItems={releaseAssignments}
            onSelectionChange={handleReleaseChange}
            placeholder="Select releases..."
            searchPlaceholder="Search releases..."
            emptyMessage="No releases found"
            className="mb-2"
          />
          
          <AssignmentBadges
            items={releaseAssignments}
            onRemove={handleRemoveRelease}
            emptyText="No release assignments"
          />
        </div>
      </div>
    </section>
  );
}