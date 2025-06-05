"use client";

import React, { useMemo } from 'react';
import { PageMultiSelectProper as PageMultiSelect, GenericMultiSelect } from './page-multi-select-proper';
import { AssignmentBadges } from './assignment-badges';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import type { Page, PageType } from '@/types/models/Page';
import type { Feature } from '@/types/models/Feature';

// Type definition for feature configuration (inline since not exported)
interface OptionConfig<T> {
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getSearchableText: (item: T) => string[];
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  getSubtitle?: (item: T) => string;
  getIcon?: (item: T) => React.ComponentType<any>;
  getBadge?: (item: T) => { text: string; className: string } | null;
}

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
  const { features } = useFeaturesQuery();
  
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

  // Get current feature assignments for feedback pages
  const currentFeatureAssignments = useMemo(() => {
    const featureRelations = livePage.properties?.assignedFeature?.relation || [];
    return featureRelations.map((rel: { id: string }) => ({
      id: rel.id,
      title: features?.find(f => f.id === rel.id)?.name || 'Unknown Feature'
    }));
  }, [livePage.properties?.assignedFeature?.relation, features]);
  
  // Handle feature assignment changes for feedback pages (supports multiple)
  const handleFeatureAssignmentChange = async (newFeatureAssignments: AssignmentItem[]) => {
    try {
      const currentProperties = livePage.properties || {};
      
      if (newFeatureAssignments.length === 0) {
        // Remove all feature assignments
        const updatedProperties = {
          ...currentProperties,
          assignedFeature: {
            type: 'relation' as const,
            relation: []
          }
        };
        await pagesState.updatePage(pageId, { properties: updatedProperties });
      } else {
        // Assign to features and auto-update status to planned
        const updatedProperties = {
          ...currentProperties,
          assignedFeature: {
            type: 'relation' as const,
            relation: newFeatureAssignments.map(assignment => ({ id: assignment.id }))
          },
          status: {
            type: 'select' as const,
            select: { name: 'planned', color: 'green' }
          }
        };
        await pagesState.updatePage(pageId, { properties: updatedProperties });
      }
    } catch (error) {
      console.error('Failed to update feature assignments:', error);
    }
  };
  
  // Handle removing individual feature assignments
  const handleRemoveFeature = (featureId: string) => {
    const newFeatureAssignments = currentFeatureAssignments.filter((item: AssignmentItem) => item.id !== featureId);
    handleFeatureAssignmentChange(newFeatureAssignments);
  };
  
  // Feature configuration for GenericMultiSelect
  const featureConfig: OptionConfig<Feature> = {
    getId: (feature) => feature.id,
    getTitle: (feature) => feature.name,
    getSearchableText: (feature) => [feature.name, feature.description, feature.priority],
    getSubtitle: (feature) => feature.description,
    getBadge: (feature) => {
      const priorityColors = {
        'High': 'bg-red-500/20 text-red-400 border-red-500/30',
        'Med': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Low': 'bg-green-500/20 text-green-400 border-green-500/30'
      };
      return {
        text: feature.priority,
        className: priorityColors[feature.priority] || 'bg-gray-500/20 text-gray-400'
      };
    }
  };

  // Check if this is a feedback page
  const isFeedbackPage = livePage.type === 'feedback';

  return (
    <section>
      <h3 className="text-sm font-medium text-white/90 mb-3">Assignments</h3>
      
      <div className="space-y-4">
        {/* Feature Assignment for Feedback Pages */}
        {isFeedbackPage && (
          <div>
            <label className="text-white/70 text-sm mb-2 block">Assign to Features</label>
            
            <GenericMultiSelect
              options={features || []}
              selectedItems={currentFeatureAssignments}
              onSelectionChange={handleFeatureAssignmentChange}
              placeholder="Select features..."
              searchPlaceholder="Search features by name, description, or priority..."
              emptyMessage="No features found"
              config={featureConfig}
              className="mb-2"
              testId="feedback-feature-assignment-multiselect"
            />
            
            <AssignmentBadges
              items={currentFeatureAssignments}
              onRemove={handleRemoveFeature}
              emptyText="No feature assignments"
            />
            
            {currentFeatureAssignments.length > 0 && (
              <p className="text-xs text-green-500 mt-2" data-testid="feedback-assignment-confirmation">
                ✓ Feedback assigned to {currentFeatureAssignments.length} feature{currentFeatureAssignments.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Standard Assignments for Non-Feedback Pages */}
        {!isFeedbackPage && (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}