"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequirementsPlaceholder } from './requirements/requirements-placeholder';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FeatureRequirementsSectionProps {
  featureId: string;
  isNew?: boolean;
}

export function FeatureRequirementsSectionQuery({
  featureId,
  isNew = false
}: FeatureRequirementsSectionProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  // Theme hook removed
  const router = useRouter();

  // Hard code userId for now
  const userId = 'anonymous';

  // This function is used in two different ways:
  // 1. As an onAddRowCancel handler when in add mode to cancel and go back
  // 2. As a function called from the toolbar's "Add" button to show the add form
  // For clarity, we'll use it as a toggle function
  const handleAddToggle = () => {
    setShowAddRow(!showAddRow);
  };

  // Handle requirement row click to open the editor
  const handleRequirementClick = (requirementId: string, requirementName: string) => {
    router.push(`/dashboard/requirements/editor?id=${requirementId}&featureId=${featureId}`);
  };
  
  // Handle creating new requirement in editor
  const handleNewRequirementInEditor = () => {
    router.push(`/dashboard/requirements/editor?new=true&featureId=${featureId}`);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <p className="text-white/70 text-sm">Requirements</p>
        {!isNew && (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleAddToggle}
              className="text-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Requirement
            </Button>
            <Button
              variant="secondary"
              onClick={handleNewRequirementInEditor}
              className="text-sm"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              New in Editor
            </Button>
          </div>
        )}
      </div>
      <Card className="dark bg-[#0C0C0C] border-0 shadow-sm shadow-black/10 flex flex-col gap-0 py-0 feature-requirements-container">
        <CardContent className="bg-[#0C0C0C] p-0 flex-grow">
        {isNew ? (
          <div className="flex flex-col items-center justify-center py-4 text-center bg-[#0E0E0E] border border-white/[0.03] rounded-md">
            <FileText className="h-8 w-8 text-white/30 mb-2" />
            <p className="text-sm text-white/70 mb-1">
              Save the feature first to add requirements.
            </p>
            <p className="text-xs text-white/50">
              Requirements will be available after saving.
            </p>
          </div>
        ) : (
          <div className="w-full flex-grow">
            <RequirementsPlaceholder
              featureId={featureId}
              userId={userId}
              showAddRow={showAddRow}
              onAddRowCancel={handleAddToggle}
              onRowClick={handleRequirementClick}
            />
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}