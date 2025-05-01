"use client";

import { useState, useEffect } from 'react';

// Simple user type
export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true
  });

  useEffect(() => {
    // In a real app, this would fetch the user from a session
    // For now, create a mock user with a stable ID
    const mockUser: User = {
      id: 'user-001',
      name: 'Demo User',
      email: 'demo@example.com'
    };

    // Simulate loading delay
    const timer = setTimeout(() => {
      setAuthState({
        user: mockUser,
        loading: false
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // For a real app, this would include login/logout functions
  return {
    user: authState.user,
    loading: authState.loading,
    // Mock functions
    login: () => console.log('Mock login'),
    logout: () => setAuthState({ user: null, loading: false })
  };
} 