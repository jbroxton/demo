"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeatureCanvasContent } from '@/components/feature-canvas-content';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFeaturesQuery } from '@/hooks/use-features-query';

export default function FeatureCanvasPage() {
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const featureId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const interfaceId = searchParams.get('interfaceId');
  
  // Get feature data for title
  const featuresQuery = useFeaturesQuery();
  const feature = featureId && !isNew ? featuresQuery.getFeatureById(featureId) : null;
  
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
  
  if (!featureId && !isNew) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e20] text-[#a0a0a0]">
        <p className="mb-4">No feature ID provided</p>
        <Link href="/dashboard">
          <Button variant="outline" className="bg-[#232326] border-[#2a2a2c]">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-[#1e1e20]">
      <div className="flex items-center p-2 bg-[#232326] border-b border-[#2a2a2c]">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="sm" className="text-[#a0a0a0] hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="text-white text-sm font-medium">
          {isNew ? 'New Feature Canvas' : feature?.name || 'Feature Canvas'}
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="text-xs text-[#a0a0a0] bg-[#1e1e20] px-2 py-1 rounded-md">
          Canvas View (Beta)
        </div>
      </div>
      
      <div className="flex-grow overflow-auto">
        <FeatureCanvasContent 
          featureId={featureId || 'new'} 
          isNew={isNew} 
          productId={interfaceId || undefined}
        />
      </div>
    </div>
  );
}