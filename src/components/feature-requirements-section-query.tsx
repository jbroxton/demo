"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequirementsPlaceholder } from './requirements/requirements-placeholder';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureRequirementsSectionProps {
  featureId: string;
  isNew?: boolean;
}

export function FeatureRequirementsSectionQuery({ 
  featureId, 
  isNew = false 
}: FeatureRequirementsSectionProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  
  // Hard code userId for now
  const userId = 'anonymous';
  
  const handleAddClick = () => {
    setShowAddRow(true);
  };
  
  const handleAddCancel = () => {
    setShowAddRow(false);
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[#a0a0a0] text-sm">Requirements</p>
        {!isNew && !showAddRow && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Requirement
          </Button>
        )}
      </div>
      <Card className="dark bg-[#1e1e20] border-0 shadow-none flex flex-col feature-requirements-container">
        <CardContent className="bg-[#1e1e20] p-0 flex-grow">
        {isNew ? (
          <div className="flex flex-col items-center justify-center py-4 text-center bg-[#1e1e20] border border-[#2a2a2c] rounded-md">
            <FileText className="h-8 w-8 text-[#3a3a3c] mb-2" />
            <p className="text-sm text-[#a0a0a0] mb-1">
              Save the feature first to add requirements.
            </p>
            <p className="text-xs text-[#666668]">
              Requirements will be available after saving.
            </p>
          </div>
        ) : (
          <div className="w-full flex-grow">
            <RequirementsPlaceholder 
              featureId={featureId} 
              userId={userId}
              showAddRow={showAddRow}
              onAddRowCancel={handleAddCancel}
            />
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}