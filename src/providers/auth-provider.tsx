'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tenant, DEMO_TENANTS } from '@/utils/tenant-utils'
import { toast } from 'sonner'

// User type definition for better typing
interface User {
  id: string
  name: string
  email: string
  role: string
  allowedTenants: string[]
  currentTenant: string | null
  tenantData?: any[]
  [key: string]: any // Allow for additional properties
}

// Authentication error types
type AuthError = 'credentials' | 'session' | 'tenant' | 'network' | 'unknown'

// Define the shape of our auth context
export interface AuthContextType {
  // User state
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: { type: AuthError; message: string } | null
  
  // Tenant management
  currentTenant: string | null
  allowedTenants: Tenant[]
  switchTenant: (tenantId: string) => Promise<boolean>
  
  // Auth actions
  login: (email: string, password: string) => Promise<{success: boolean, error: string | undefined}>
  logout: () => Promise<void>
  
  // Utility methods
  clearError: () => void
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default empty auth state for SSR and initialization
const defaultAuthState: Omit<AuthContextType, 'clearError' | 'login' | 'logout' | 'switchTenant'> = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  currentTenant: null,
  allowedTenants: []
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  // Local state
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<{ type: AuthError; message: string } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Set hydration state - centralize this logic here
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Debug session changes with more structured logging
  useEffect(() => {
    console.log("🔐 Auth provider - Session status:", status);
    if (session?.user) {
      console.log("👤 Auth provider - User:", session.user.email);
    }
  }, [session, status]);
  
  // Process session data to extract user and tenant information
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      try {
        // Map session user to our User type
        setUser(session.user as User);
        
        // Process tenant data
        const userAllowedTenants = session.user.allowedTenants || [];
        
        if (userAllowedTenants.length === 0) {
          setError({
            type: 'tenant',
            message: 'No tenants available for this user'
          });
        }
        
        // Filter DEMO_TENANTS based on user's allowed tenants
        const allowedTenantObjects = DEMO_TENANTS.filter(tenant => 
          userAllowedTenants.includes(tenant.id)
        );
        
        setTenants(allowedTenantObjects);
        
        // Clear any previous auth errors
        setError(null);
      } catch (err) {
        console.error('Error processing session data:', err);
        setError({
          type: 'session',
          message: 'Failed to process authentication data'
        });
      } finally {
        // Mark auth as initialized after processing session
        setIsInitialized(true);
      }
    } else if (status === 'unauthenticated') {
      // Clear user data when session is not authenticated
      setUser(null);
      setTenants([]);
      setIsInitialized(true); // Still mark as initialized
    }
  }, [session, status])
  
  // Handle tenant switching with improved validation
  const switchTenant = async (tenantId: string): Promise<boolean> => {
    // Client-side tenant validation
    if (!user?.allowedTenants?.includes(tenantId)) {
      console.error('Cannot switch to unauthorized tenant');
      toast.error('You do not have access to this tenant');
      setError({
        type: 'tenant',
        message: 'Unauthorized tenant access'
      });
      return false;
    }
    
    // Show loading toast for better UX
    const loadingToast = toast.loading('Switching tenant...');
    
    try {
      // Call the API to switch tenants with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to switch tenant');
        setError({
          type: 'tenant',
          message: errorData.error || 'Failed to switch tenant'
        });
        return false;
      }
      
      // Parse the response
      const responseData = await response.json();
      
      // Update session via NextAuth
      await update({ currentTenant: tenantId });
      
      // Update local user state with more details if available
      if (user) {
        setUser({
          ...user,
          currentTenant: tenantId,
          // Update tenant data if provided in the response
          ...(responseData.tenantData ? { tenantData: responseData.tenantData } : {})
        });
      }
      
      // Find the tenant object for display
      const tenantName = tenants.find(t => t.id === tenantId)?.name || tenantId;
      
      toast.success(`Switched to ${tenantName}`);
      setError(null); // Clear any errors
      return true;
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Handle abort specifically
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Tenant switch request timed out');
        toast.error('Tenant switch request timed out');
        setError({
          type: 'network',
          message: 'Tenant switch request timed out'
        });
        return false;
      }
      
      console.error('Error switching tenant:', error);
      toast.error('An error occurred while switching tenants');
      setError({
        type: 'network',
        message: 'Network error while switching tenants'
      });
      return false;
    }
  }
  
  // Login function with enhanced error handling
  const login = async (email: string, password: string) => {
    setError(null); // Clear previous errors
    
    try {
      console.log("🔑 Auth provider - Attempting login for:", email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      console.log("🔐 Auth provider - Login result:", result);
      
      if (result?.error) {
        setError({
          type: 'credentials',
          message: result.error
        });
      }
      
      return { 
        success: !result?.error,
        error: result?.error || undefined
      };
    } catch (error) {
      console.error('Login error:', error);
      setError({
        type: 'network',
        message: 'Network error during authentication'
      });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
  
  // Logout function
  const logout = async () => {
    setError(null); // Clear any errors
    await signOut({ callbackUrl: '/signin' });
  }
  
  // Clear error utility function
  const clearError = () => {
    setError(null);
  }
  
  // Determine current tenant information
  const currentTenant = user?.currentTenant || null;
  
  // Debug auth state with more structured logging
  useEffect(() => {
    console.log("🔐 Auth provider state:", {
      status,
      userExists: !!user,
      tenantCount: tenants.length,
      isAuthenticated: status === 'authenticated' && !!user,
      isInitialized,
      isHydrated,
      error: error ? `${error.type}: ${error.message}` : 'none'
    });
  }, [status, user, tenants, isInitialized, isHydrated, error]);
  
  // Construct the context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: status === 'authenticated' && !!user,
    isLoading: status === 'loading' || !isHydrated,
    isInitialized: isInitialized && isHydrated,
    error,
    
    currentTenant,
    allowedTenants: tenants,
    switchTenant,
    
    login,
    logout,
    clearError
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the hook implementation
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Instead of warning on SSR, return a default state during SSR
  if (typeof window === 'undefined') {
    return {
      ...defaultAuthState,
      switchTenant: async () => false,
      login: async () => ({ success: false, error: 'Auth provider not available' }),
      logout: async () => {},
      clearError: () => {}
    };
  }
  
  if (context === undefined) {
    console.warn('⚠️ useAuth must be used within an AuthProvider');
    return {
      ...defaultAuthState,
      switchTenant: async () => false,
      login: async () => ({ success: false, error: 'Auth provider not available' }),
      logout: async () => {},
      clearError: () => {}
    };
  }
  
  return context;
}