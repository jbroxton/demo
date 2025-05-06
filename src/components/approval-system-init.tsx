"use client"

import { useEffect, useState } from 'react';

/**
 * Component to initialize the approval system when the app is loaded
 * This should be included in the providers.tsx file
 */
export function ApprovalSystemInit() {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Only run once on client-side
    if (typeof window !== 'undefined' && !initialized) {
      const initApprovalSystem = async () => {
        try {
          const response = await fetch('/api/approval-init');
          const data = await response.json();
          
          if (data.success) {
            console.log('Approval system initialized successfully');
          } else {
            console.error('Failed to initialize approval system:', data.error);
          }
          
          setInitialized(true);
        } catch (error) {
          console.error('Error initializing approval system:', error);
        }
      };
      
      initApprovalSystem();
    }
  }, [initialized]);
  
  // This component doesn't render anything
  return null;
}