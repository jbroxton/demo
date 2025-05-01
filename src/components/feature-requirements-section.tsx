"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequirementsGrid } from './requirements-grid';

interface FeatureRequirementsSectionProps {
  featureId: string;
  isNew?: boolean;
}

export function FeatureRequirementsSection({ 
  featureId, 
  isNew = false 
}: FeatureRequirementsSectionProps) {
  console.log('Rendering FeatureRequirementsSection with featureId:', featureId);
  
  // Hard code userId for now
  const userId = 'anonymous';
  
  // If this is a new feature, we won't have a valid ID yet
  if (isNew) {
    return (
      <Card className="dark bg-[#1e1e20] border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[#a0a0a0]">
            Save the feature first to add requirements.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="dark bg-[#1e1e20] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Requirements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col min-h-[400px]">
        <div 
          className="flex-1 w-full" 
          style={{ 
            height: "400px", 
            minHeight: "400px"
          }}
        >
          <RequirementsGrid 
            featureId={featureId} 
            userId={userId} 
          />
        </div>
      </CardContent>
    </Card>
  );
} 