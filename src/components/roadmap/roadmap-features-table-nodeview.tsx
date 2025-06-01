"use client";

import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { DataTable } from '@/components/requirements/data-table';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { getRoadmapFeaturesColumns, RoadmapFeatureRow } from './roadmap-features-columns';
import type { Page } from '@/types/models/Page';

export function RoadmapFeaturesTableNodeView({ node, updateAttributes }: NodeViewProps) {
  const { pages } = usePagesQuery();
  const { openTab } = useTabsQuery();
  
  // Get roadmap ID from node attributes
  const roadmapId = node.attrs.roadmapId;

  // Filter features assigned to this roadmap using client-side filtering
  const assignedFeatures = useMemo(() => {
    return pages.filter((page: Page) => 
      page.type === 'feature' &&
      page.properties?.assignedTo?.roadmaps?.some((roadmap: any) => roadmap.id === roadmapId)
    );
  }, [pages, roadmapId]);

  // Convert features to table row format
  const featureRows = useMemo((): RoadmapFeatureRow[] => {
    return assignedFeatures.map((feature: Page) => ({
      id: feature.id,
      name: feature.title || 'Untitled Feature',
      status: feature.properties?.status?.select?.name || 'No Status',
      priority: feature.properties?.priority?.select?.name || 'No Priority',
      assignees: feature.properties?.owner?.people?.map((person: any) => person.name) || [],
      page: feature
    }));
  }, [assignedFeatures]);

  // Handle opening a feature in a new tab
  const handleOpenFeature = (featureId: string) => {
    const feature = assignedFeatures.find(f => f.id === featureId);
    if (feature) {
      openTab({
        title: feature.title,
        type: 'page',
        itemId: feature.id,
        hasChanges: false
      });
    }
  };

  // Get columns with open feature handler
  const columns = useMemo(() => 
    getRoadmapFeaturesColumns(handleOpenFeature), 
    [handleOpenFeature]
  );

  return (
    <NodeViewWrapper className="roadmap-features-table-node">
      {/* Container gets px-6 from unified editor, add top padding for spacing from header */}
      <div className="pt-6 pb-0">
        {/* Data Table with clean, professional layout */}
        {featureRows.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <p className="text-lg mb-2">No features assigned to this roadmap yet.</p>
            <p className="text-sm text-white/50">
              Assign features to this roadmap using the Details drawer on feature pages.
            </p>
          </div>
        ) : (
          <div className="roadmap-data-table">
            <DataTable
              columns={columns}
              data={featureRows}
              onRowClick={(row) => handleOpenFeature(row.id)}
            />
          </div>
        )}
      </div>
      
      {/* Clean layout styling */}
      <style jsx>{`
        /* Node wrapper layout */
        .roadmap-features-table-node {
          margin: 0 !important;
          display: block !important;
        }
      `}</style>
    </NodeViewWrapper>
  );
}