"use client";

// Import the full AuthContextType to ensure proper typing
import { useAuth as useAuthFromProvider, type AuthContextType } from '@/providers/auth-provider';

// Re-export with type information
export const useAuth: () => AuthContextType = useAuthFromProvider;