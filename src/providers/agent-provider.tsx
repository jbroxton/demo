"use client"

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { 
  AgentAction,
  AgentConfirmation,
  AgentSession,
  AgentMode,
  AgentOperationResult
} from '@/types/models/ai-chat';
// Note: Client-side component should use API routes, not direct service imports
import { useAuth } from '@/hooks/use-auth';

/**
 * API client functions for agent operations
 */
const agentAPI = {
  async upsertSession(sessionId: string, userId: string, tenantId: string, mode: AgentMode) {
    // For now, return a mock response to avoid the server-side dependency
    // TODO: Implement proper API route when needed
    return {
      success: true,
      data: {
        id: sessionId,
        tenantId,
        userId,
        mode,
        status: 'active' as const,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        endedAt: null,
        totalActions: 0,
        successfulActions: 0,
        failedActions: 0,
        pendingActions: 0,
        openAiThreadId: `thread_${sessionId}`
      }
    };
  },

  async updateAgentAction(id: string, updates: any) {
    // Mock response
    return { success: true, data: { id, ...updates } };
  },

  async updateConfirmation(actionId: string, data: any) {
    // Mock response  
    return { success: true, data: { actionId, ...data } };
  },

  async getAgentActions(userId: string, tenantId: string, options: any) {
    // Mock response
    return { success: true, data: [] };
  }
};

/**
 * Agent state interface
 */
interface AgentState {
  // Current session
  currentSession: AgentSession | null;
  sessionId: string | null;
  mode: AgentMode;
  
  // Actions and confirmations
  pendingActions: AgentAction[];
  pendingConfirmations: AgentConfirmation[];
  recentActions: AgentAction[];
  
  // UI state
  isProcessing: boolean;
  showConfirmationDialog: boolean;
  activeConfirmation: AgentConfirmation | null;
  
  // Error state
  lastError: string | null;
  
  // Settings
  autoConfirm: boolean;
  maxPendingActions: number;
}

/**
 * Agent actions
 */
type AgentActionType =
  | { type: 'SET_SESSION'; payload: AgentSession }
  | { type: 'SET_MODE'; payload: AgentMode }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'ADD_PENDING_ACTION'; payload: AgentAction }
  | { type: 'UPDATE_ACTION'; payload: { id: string; updates: Partial<AgentAction> } }
  | { type: 'REMOVE_PENDING_ACTION'; payload: string }
  | { type: 'ADD_CONFIRMATION'; payload: AgentConfirmation }
  | { type: 'UPDATE_CONFIRMATION'; payload: { id: string; updates: Partial<AgentConfirmation> } }
  | { type: 'REMOVE_CONFIRMATION'; payload: string }
  | { type: 'SET_ACTIVE_CONFIRMATION'; payload: AgentConfirmation | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_RECENT_ACTIONS'; payload: AgentAction[] }
  | { type: 'CLEAR_STATE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Pick<AgentState, 'autoConfirm' | 'maxPendingActions'>> };

/**
 * Agent reducer
 */
function agentReducer(state: AgentState, action: AgentActionType): AgentState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
      
    case 'SET_MODE':
      return { ...state, mode: action.payload };
      
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
      
    case 'ADD_PENDING_ACTION':
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.payload],
        recentActions: [action.payload, ...state.recentActions].slice(0, 50) // Keep last 50
      };
      
    case 'UPDATE_ACTION': {
      const updateAction = (actions: AgentAction[]) =>
        actions.map(a => a.id === action.payload.id ? { ...a, ...action.payload.updates } : a);
      
      return {
        ...state,
        pendingActions: updateAction(state.pendingActions),
        recentActions: updateAction(state.recentActions)
      };
    }
    
    case 'REMOVE_PENDING_ACTION':
      return {
        ...state,
        pendingActions: state.pendingActions.filter(a => a.id !== action.payload)
      };
      
    case 'ADD_CONFIRMATION':
      return {
        ...state,
        pendingConfirmations: [...state.pendingConfirmations, action.payload],
        showConfirmationDialog: true,
        activeConfirmation: state.activeConfirmation || action.payload
      };
      
    case 'UPDATE_CONFIRMATION':
      return {
        ...state,
        pendingConfirmations: state.pendingConfirmations.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        )
      };
      
    case 'REMOVE_CONFIRMATION': {
      const remaining = state.pendingConfirmations.filter(c => c.id !== action.payload);
      return {
        ...state,
        pendingConfirmations: remaining,
        showConfirmationDialog: remaining.length > 0,
        activeConfirmation: remaining.length > 0 ? remaining[0] : null
      };
    }
    
    case 'SET_ACTIVE_CONFIRMATION':
      return {
        ...state,
        activeConfirmation: action.payload,
        showConfirmationDialog: !!action.payload
      };
      
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
      
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
      
    case 'LOAD_RECENT_ACTIONS':
      return { ...state, recentActions: action.payload };
      
    case 'CLEAR_STATE':
      return {
        ...initialState,
        mode: state.mode, // Preserve mode
        autoConfirm: state.autoConfirm, // Preserve settings
        maxPendingActions: state.maxPendingActions
      };
      
    case 'UPDATE_SETTINGS':
      return { ...state, ...action.payload };
      
    default:
      return state;
  }
}

/**
 * Initial state
 */
const initialState: AgentState = {
  currentSession: null,
  sessionId: null,
  mode: 'agent',
  pendingActions: [],
  pendingConfirmations: [],
  recentActions: [],
  isProcessing: false,
  showConfirmationDialog: false,
  activeConfirmation: null,
  lastError: null,
  autoConfirm: false,
  maxPendingActions: 10
};

/**
 * Agent context interface
 */
interface AgentContextType {
  // State
  state: AgentState;
  
  // Session management
  initializeSession: (mode?: AgentMode) => Promise<void>;
  updateSessionMode: (mode: AgentMode) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Action management
  addPendingAction: (action: AgentAction) => void;
  updateAction: (id: string, updates: Partial<AgentAction>) => Promise<void>;
  confirmAction: (actionId: string, confirmed: boolean, details?: any) => Promise<void>;
  
  // Confirmation management
  handleConfirmation: (confirmationId: string, response: 'confirmed' | 'rejected' | 'cancelled', details?: any) => Promise<void>;
  dismissConfirmation: (confirmationId: string) => void;
  
  // Utilities
  loadRecentActions: () => Promise<void>;
  clearError: () => void;
  updateSettings: (settings: Partial<Pick<AgentState, 'autoConfirm' | 'maxPendingActions'>>) => void;
}

/**
 * Agent context
 */
const AgentContext = createContext<AgentContextType | null>(null);

/**
 * Agent provider props
 */
interface AgentProviderProps {
  children: React.ReactNode;
}

/**
 * Agent provider component
 */
export function AgentProvider({ children }: AgentProviderProps) {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const { user, currentTenant } = useAuth();
  
  /**
   * Initialize agent session
   */
  const initializeSession = useCallback(async (mode: AgentMode = 'agent') => {
    if (!user?.id || !currentTenant) return;
    
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const sessionId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await agentAPI.upsertSession(
        sessionId,
        user.id,
        currentTenant,
        mode
      );
      
      if (result.success) {
        // Ensure sessionId is properly set from the service response
        const sessionData = { 
          ...result.data, 
          sessionId: (result.data as any).sessionId || sessionId 
        };
        dispatch({ type: 'SET_SESSION', payload: sessionData });
        dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
        dispatch({ type: 'SET_MODE', payload: mode });
      } else {
        dispatch({ type: 'SET_ERROR', payload: (result as any).error?.userMessage || 'Failed to create session' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize session' });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, [user?.id, currentTenant]);
  
  /**
   * Update session mode
   */
  const updateSessionMode = useCallback(async (mode: AgentMode) => {
    if (!state.sessionId || !user?.id || !currentTenant) return;
    
    try {
      const result = await agentAPI.upsertSession(
        state.sessionId,
        user.id,
        currentTenant,
        mode
      );
      
      if (result.success) {
        dispatch({ type: 'SET_SESSION', payload: { ...result.data, sessionId: state.sessionId || 'unknown' } });
        dispatch({ type: 'SET_MODE', payload: mode });
      } else {
        dispatch({ type: 'SET_ERROR', payload: (result as any).error?.userMessage || 'Failed to update session' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update session mode' });
    }
  }, [state.sessionId, user?.id, currentTenant]);
  
  /**
   * End current session
   */
  const endSession = useCallback(async () => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);
  
  /**
   * Add pending action
   */
  const addPendingAction = useCallback((action: AgentAction) => {
    dispatch({ type: 'ADD_PENDING_ACTION', payload: action });
  }, []);
  
  /**
   * Update action
   */
  const updateAction = useCallback(async (id: string, updates: Partial<AgentAction>) => {
    try {
      const result = await agentAPI.updateAgentAction(id, updates);
      
      if (result.success) {
        dispatch({ type: 'UPDATE_ACTION', payload: { id, updates } });
      } else {
        dispatch({ type: 'SET_ERROR', payload: (result as any).error?.userMessage || 'Failed to update action' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update action' });
    }
  }, []);
  
  /**
   * Confirm action
   */
  const confirmAction = useCallback(async (actionId: string, confirmed: boolean, details?: any) => {
    try {
      const updates: Partial<AgentAction> = {
        status: confirmed ? 'confirmed' : 'rejected',
        confirmationReceivedAt: new Date().toISOString(),
        confirmedByUserId: user?.id
      };
      
      await updateAction(actionId, updates);
      
      if (confirmed) {
        dispatch({ type: 'REMOVE_PENDING_ACTION', payload: actionId });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to confirm action' });
    }
  }, [updateAction, user?.id]);
  
  /**
   * Handle confirmation dialog response
   */
  const handleConfirmation = useCallback(async (
    confirmationId: string, 
    response: 'confirmed' | 'rejected' | 'cancelled',
    details?: any
  ) => {
    try {
      const result = await agentAPI.updateConfirmation(
        confirmationId,
        response
      );
      
      if (result.success) {
        dispatch({ type: 'UPDATE_CONFIRMATION', payload: { id: confirmationId, updates: result.data } });
        dispatch({ type: 'REMOVE_CONFIRMATION', payload: confirmationId });
        
        // If confirmed, also update the associated action
        if (response === 'confirmed') {
          const confirmation = state.pendingConfirmations.find(c => c.id === confirmationId);
          if (confirmation) {
            await confirmAction(confirmation.agentActionId, true, details);
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: (result as any).error?.userMessage || 'Failed to handle confirmation' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to handle confirmation' });
    }
  }, [state.pendingConfirmations, confirmAction]);
  
  /**
   * Dismiss confirmation without response
   */
  const dismissConfirmation = useCallback((confirmationId: string) => {
    dispatch({ type: 'REMOVE_CONFIRMATION', payload: confirmationId });
  }, []);
  
  /**
   * Load recent actions
   */
  const loadRecentActions = useCallback(async () => {
    if (!user?.id || !currentTenant) return;
    
    try {
      const result = await agentAPI.getAgentActions(
        user.id,
        currentTenant,
        { limit: 50 }
      );
      
      if (result.success) {
        dispatch({ type: 'LOAD_RECENT_ACTIONS', payload: result.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: (result as any).error?.userMessage || 'Failed to load recent actions' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load recent actions' });
    }
  }, [user?.id, currentTenant]);
  
  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);
  
  /**
   * Update settings
   */
  const updateSettings = useCallback((settings: Partial<Pick<AgentState, 'autoConfirm' | 'maxPendingActions'>>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);
  
  /**
   * Initialize session on mount if user is available
   */
  useEffect(() => {
    if (user?.id && currentTenant && !state.currentSession) {
      initializeSession();
    }
  }, [user?.id, currentTenant, state.currentSession, initializeSession]);
  
  /**
   * Load recent actions on session start
   */
  useEffect(() => {
    if (state.currentSession) {
      loadRecentActions();
    }
  }, [state.currentSession, loadRecentActions]);
  
  const contextValue: AgentContextType = {
    state,
    initializeSession,
    updateSessionMode,
    endSession,
    addPendingAction,
    updateAction,
    confirmAction,
    handleConfirmation,
    dismissConfirmation,
    loadRecentActions,
    clearError,
    updateSettings
  };
  
  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}

/**
 * Hook to use agent context
 */
export function useAgent(): AgentContextType {
  const context = useContext(AgentContext);
  
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  
  return context;
}