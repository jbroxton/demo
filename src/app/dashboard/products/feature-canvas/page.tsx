"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFeaturesQuery } from '@/hooks/use-features-query';
import { useProductsQuery } from '@/hooks/use-products-query';

// We'll create this component next
import { FeatureCanvasContent } from '@/components/feature-canvas-content';

export default function FeatureCanvasPage() {
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const featureId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';
  const productId = searchParams.get('productId');
  
  // Get feature and product data for navigation context
  const featuresQuery = useFeaturesQuery();
  const productsQuery = useProductsQuery();
  
  const feature = featureId && !isNew ? featuresQuery.getFeatureById(featureId) : null;
  const product = productId ? productsQuery.getProductById(productId) : null;
  
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
  if ((!featureId && !isNew) || !productId) {
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
  
  const backLink = productId ? `/dashboard/products?id=${productId}` : '/dashboard';
  const productName = product?.name || 'Product';
  
  return (
    <div className="flex flex-col h-screen bg-[#1e1e20]">
      {/* Header with breadcrumb navigation */}
      <div className="flex items-center p-2 bg-[#232326] border-b border-[#2a2a2c]">
        <Link href={backLink} className="mr-4">
          <Button variant="ghost" size="sm" className="text-[#a0a0a0] hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {productName}
          </Button>
        </Link>
        
        <div className="flex items-center">
          <span className="text-[#a0a0a0] text-sm">{productName}</span>
          <span className="mx-2 text-[#a0a0a0]">/</span>
          <span className="text-white text-sm font-medium">
            {isNew ? 'New Feature' : feature?.name || 'Feature'}
          </span>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="text-xs text-green-500 bg-[#1e1e20] px-2 py-1 rounded-md">
          Canvas View
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-grow overflow-auto">
        <FeatureCanvasContent 
          featureId={featureId || 'new'} 
          isNew={isNew} 
          productId={productId}
        />
      </div>
    </div>
  );
}