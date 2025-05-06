"use client"

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

/**
 * A debug component for testing the auth provider
 * This component displays the current auth state and allows testing various auth functions
 */
export function AuthTest() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    currentTenant,
    allowedTenants,
    switchTenant,
    error,
    clearError,
    logout 
  } = useAuth()
  
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)
  
  // Record when auth state changes
  useEffect(() => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    console.log(`[${timestamp}] Auth state updated:`, { 
      isAuthenticated, 
      isLoading, 
      isInitialized, 
      user: user ? `${user.email} (${user.id})` : 'None',
      currentTenant,
      tenantCount: allowedTenants.length,
      error: error ? `${error.type}: ${error.message}` : 'None'
    })
  }, [isAuthenticated, isLoading, isInitialized, user, currentTenant, allowedTenants, error])
  
  // Test tenant switching
  const handleTenantSwitch = async (tenantId: string) => {
    setLastAction(`Switch to tenant ${tenantId}`)
    setActionResult('In progress...')
    
    try {
      const result = await switchTenant(tenantId)
      setActionResult(result ? 'Success' : 'Failed')
    } catch (err) {
      setActionResult(`Error: ${err}`)
    }
  }
  
  // Test logout
  const handleLogout = async () => {
    setLastAction('Logout')
    setActionResult('In progress...')
    
    try {
      await logout()
      setActionResult('Success')
    } catch (err) {
      setActionResult(`Error: ${err}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auth Provider Test</CardTitle>
        <CardDescription>
          View current auth state and test auth functionality
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">State:</div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {isInitialized ? 'Initialized' : 'Initializing...'}
          </div>
          
          <div className="font-medium">Authenticated:</div>
          <div>{isAuthenticated ? 'Yes' : 'No'}</div>
          
          <div className="font-medium">User:</div>
          <div className="truncate">{user ? user.email : 'None'}</div>
          
          <div className="font-medium">Current Tenant:</div>
          <div className="truncate">
            {currentTenant ? allowedTenants.find(t => t.id === currentTenant)?.name || currentTenant : 'None'}
          </div>
          
          <div className="font-medium">Available Tenants:</div>
          <div>{allowedTenants.length}</div>
          
          <div className="font-medium">Error:</div>
          <div className="text-destructive truncate">
            {error ? `${error.type}: ${error.message}` : 'None'}
          </div>
        </div>
        
        {error && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => clearError()}>
              Clear Error
            </Button>
          </div>
        )}
        
        {allowedTenants.length > 0 && (
          <div className="border rounded-md p-3">
            <h3 className="text-sm font-medium mb-2">Switch Tenant</h3>
            <div className="flex flex-wrap gap-2">
              {allowedTenants.map(tenant => (
                <Button
                  key={tenant.id}
                  size="sm"
                  variant={currentTenant === tenant.id ? "default" : "outline"}
                  onClick={() => handleTenantSwitch(tenant.id)}
                  disabled={currentTenant === tenant.id}
                >
                  {tenant.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {isAuthenticated && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        )}
        
        {lastAction && (
          <div className="border-t pt-3 mt-3 text-sm">
            <div className="font-medium">Last Action:</div>
            <div>{lastAction}</div>
            <div className="font-medium mt-1">Result:</div>
            <div>{actionResult}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}