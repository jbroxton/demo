"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useRequirementsQuery } from '@/hooks/use-requirements-query';

// We'll create this component next
import { RequirementCanvasContent } from '@/components/requirement-canvas-content';

export default function RequirementEditorPage() {
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const requirementId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const featureId = searchParams.get('featureId');
  
  // Get requirement and feature data for navigation context
  const requirementsQuery = useRequirementsQuery();
  const featuresQuery = useFeaturesQuery();
  
  const requirement = requirementId && !isNew ? requirementsQuery.getRequirementById(requirementId) : null;
  const feature = featureId ? featuresQuery.getFeatureById(featureId) : null;
  
  // When requiring from a requirement that already exists
  const parentFeatureId = requirement?.featureId || featureId;
  const parentFeature = parentFeatureId ? featuresQuery.getFeatureById(parentFeatureId) : null;
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e20] text-[#a0a0a0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mr-3"></div>
        Loading...
      </div>
    );
  }
  
  // Validate required parameters
  if ((!requirementId && !isNew) || (!featureId && !requirement?.featureId)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e20] text-[#a0a0a0]">
        <p className="mb-4">Missing required parameters</p>
        <Link href="/dashboard">
          <Button variant="outline" className="bg-[#232326] border-[#2a2a2c]">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }
  
  const backLink = parentFeatureId 
    ? `/dashboard/features?id=${parentFeatureId}` 
    : '/dashboard';
  
  const featureName = parentFeature?.name || 'Feature';
  
  return (
    <div className="flex flex-col h-screen bg-[#1e1e20]">
      {/* Header with breadcrumb navigation */}
      <div className="flex items-center p-2 bg-[#232326] border-b border-[#2a2a2c]">
        <Link href={backLink} className="mr-4">
          <Button variant="ghost" size="sm" className="text-[#a0a0a0] hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {featureName}
          </Button>
        </Link>
        
        <div className="flex items-center">
          <span className="text-[#a0a0a0] text-sm">{featureName}</span>
          <span className="mx-2 text-[#a0a0a0]">/</span>
          <span className="text-white text-sm font-medium">
            {isNew ? 'New Requirement' : requirement?.name || 'Requirement'}
          </span>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="text-xs text-blue-500 bg-[#1e1e20] px-2 py-1 rounded-md">
          Canvas View
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-grow overflow-auto">
        <RequirementCanvasContent 
          requirementId={requirementId || 'new'} 
          isNew={isNew} 
          featureId={parentFeatureId || undefined}
        />
      </div>
    </div>
  );
}