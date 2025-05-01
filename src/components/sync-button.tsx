"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { syncData } from '@/utils/sync-data'
import { toast } from 'sonner'

/**
 * A button that allows users to manually trigger synchronization 
 * between stores and database tables using the immer-based solution
 */
export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  
  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      // Short delay to ensure UI feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Run the synchronization
      const result = syncData()
      
      // Show success toast
      if (result.anyChanged) {
        toast.success('Data synchronized successfully', {
          description: 'Orphaned references have been cleaned up.',
          duration: 3000,
        })
      } else {
        toast.info('No synchronization needed', {
          description: 'All data relationships are already in sync.',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Synchronization error:', error)
      toast.error('Synchronization failed', {
        description: 'There was an error synchronizing the data.',
        duration: 3000,
      })
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
      title="Synchronize data between stores and database"
      className="gap-1"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span>Sync Data</span>
    </Button>
  )
} 