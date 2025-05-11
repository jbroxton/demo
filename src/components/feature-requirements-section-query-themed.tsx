"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequirementsPlaceholder } from './requirements/requirements-placeholder';
import { FileText, Plus } from 'lucide-react';
import { ThemedButton } from '@/components/ui/themed-button';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

interface FeatureRequirementsSectionProps {
  featureId: string;
  isNew?: boolean;
}

export function FeatureRequirementsSectionQueryThemed({ 
  featureId, 
  isNew = false 
}: FeatureRequirementsSectionProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  const appTheme = useAppTheme();
  
  // Hard code userId for now
  const userId = 'anonymous';
  
  // This function toggles the add row form visibility
  // It's passed as onAddRowCancel but is also used when clicking Add Requirement
  const handleAddToggle = () => {
    setShowAddRow(!showAddRow);
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <p className="text-white/70 text-sm">Requirements</p>
      </div>
      <Card className={`${appTheme.card} feature-requirements-container`}>
        <CardContent className={appTheme.cardContent}>
        {isNew ? (
          <div className="flex flex-col items-center justify-center py-4 text-center bg-[#0A0A0A] border border-white/[0.03] rounded-md">
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
            />
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}