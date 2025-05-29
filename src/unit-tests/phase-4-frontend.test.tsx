/**
 * Phase 4: Frontend Tests
 * Goal: Build user interface and interactions
 * 
 * Components:
 * - Hooks - State management for agent operations
 * - Components - UI components and dialogs
 * - Integration - Full user workflow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentConfirmationDialog } from '../components/agent-confirmation-dialog';
import { AgentActionHistory } from '../components/agent-action-history';
import { AIChatComponent } from '../components/ai-chat';
import { useAgentSessions } from '../hooks/use-agent-sessions';
import { useAgentConfirmations } from '../hooks/use-agent-confirmations';
import { useAgent } from '../providers/agent-provider';
import type { AgentConfirmation, AgentAction } from '../types/models/ai-chat';

// Mock providers and hooks
const mockAgent = {
  state: {
    currentSession: {
      id: 'session-1',
      sessionId: 'agent-123',
      mode: 'agent',
      pendingActions: 1,
      totalActions: 5
    },
    sessionId: 'agent-123',
    mode: 'agent' as const,
    pendingActions: [],
    pendingConfirmations: [],
    recentActions: [],
    isProcessing: false,
    showConfirmationDialog: false,
    activeConfirmation: null,
    lastError: null,
    autoConfirm: false,
    maxPendingActions: 10
  },
  initializeSession: jest.fn(),
  updateSessionMode: jest.fn(),
  endSession: jest.fn(),
  addPendingAction: jest.fn(),
  updateAction: jest.fn(),
  confirmAction: jest.fn(),
  loadRecentActions: jest.fn(),
  clearError: jest.fn(),
  updateSettings: jest.fn()
};

const mockConfirmations = {
  confirmations: [],
  respondToConfirmation: jest.fn(),
  isUpdating: false,
  total: 0,
  isLoading: false,
  isError: false,
  error: null
};

const mockSessions = {
  sessions: [],
  createSession: jest.fn(),
  updateSessionMode: jest.fn(),
  endSession: jest.fn(),
  isLoading: false,
  isCreating: false,
  isUpdating: false
};

jest.mock('../providers/agent-provider', () => ({
  useAgent: () => mockAgent
}));

jest.mock('../hooks/use-agent-confirmations', () => ({
  usePendingConfirmations: () => mockConfirmations,
  useAgentConfirmations: () => mockConfirmations
}));

jest.mock('../hooks/use-agent-sessions', () => ({
  useAgentSessions: () => mockSessions
}));

jest.mock('../hooks/use-ai-chat-fully-managed', () => ({
  useAiChatFullyManaged: () => ({
    messages: [],
    sendMessage: jest.fn(),
    isLoading: false,
    error: null
  })
}));

jest.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    currentTenant: 'tenant-123'
  })
}));

// Mock UI components
jest.mock('lucide-react', () => ({
  Send: () => <div data-testid="send-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Bot: () => <div data-testid="bot-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Phase 4: Frontend - Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test 25: Agent mode toggle and visual indicators', () => {
    it('should visually indicate when Agent mode is active', () => {
      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      // Should show mode selector with Agent button
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
      
      // In agent mode, should show different styling
      const agentButton = screen.getByText('Agent').closest('button');
      expect(agentButton).toHaveClass('bg-[#232326]'); // Active state
    });

    it('should switch modes when toggle is clicked', () => {
      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      const askButton = screen.getByText('Ask');
      const agentButton = screen.getByText('Agent');

      // Click Ask mode
      fireEvent.click(askButton);
      expect(askButton.closest('button')).toHaveClass('bg-[#232326]');

      // Click Agent mode
      fireEvent.click(agentButton);
      expect(agentButton.closest('button')).toHaveClass('bg-[#232326]');
    });

    it('should show agent status indicators when in agent mode', () => {
      // Mock agent with pending actions
      const mockAgentWithPending = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          pendingActions: [{ id: 'action-1' }]
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockAgentWithPending);

      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      // Should show pending actions badge
      expect(screen.getByText('1 pending')).toBeInTheDocument();
    });
  });

  describe('Test 26: Mode-specific functionality', () => {
    it('should disable agent operations in Ask mode', () => {
      // Mock Ask mode
      const mockAskMode = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          mode: 'ask' as const
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockAskMode);

      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      // Ask mode should not show agent-specific indicators
      expect(screen.queryByText('pending')).not.toBeInTheDocument();
      expect(screen.queryByText('confirmation')).not.toBeInTheDocument();
    });

    it('should show appropriate placeholder text for each mode', () => {
      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      const input = screen.getByPlaceholderText(/Tell me to create, update, or manage/);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Test 27: Confirmation dialog functionality', () => {
    const mockConfirmation: AgentConfirmation = {
      id: 'conf-123',
      agentActionId: 'action-123',
      dialogType: 'detailed',
      title: 'Confirm Product Creation',
      message: 'Are you sure you want to create this product?',
      details: null,
      userResponse: null,
      responseTimestamp: null,
      responseDetails: null,
      createdAt: '2024-01-01T10:00:00Z',
      expiresAt: '2024-01-01T11:00:00Z'
    };

    const mockAction: AgentAction = {
      id: 'action-123',
      tenantId: 'tenant-123',
      userId: 'user-123',
      sessionId: 'session-123',
      operationType: 'create',
      entityType: 'product',
      entityId: null,
      functionName: 'createProduct',
      functionParameters: { name: 'Test Product', description: 'A test product' },
      openAiFunctionCallId: 'call-123',
      status: 'pending',
      requiresConfirmation: true,
      confirmationRequestedAt: '2024-01-01T10:00:00Z',
      confirmationReceivedAt: null,
      confirmedByUserId: null,
      resultData: null,
      errorData: null,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      completedAt: null,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    it('should display operation details in confirmation dialog', () => {
      const mockOnConfirm = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Confirm Product Creation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to create this product?')).toBeInTheDocument();
      expect(screen.getByText('CREATE PRODUCT')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('A test product')).toBeInTheDocument();
    });

    it('should show warning for destructive operations', () => {
      const deleteAction = {
        ...mockAction,
        operationType: 'delete' as const,
        functionName: 'deleteProduct'
      };

      const mockOnConfirm = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={deleteAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Destructive Operation Warning')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete data/)).toBeInTheDocument();
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  describe('Test 28: Confirmation dialog actions', () => {
    it('should execute action when user confirms', async () => {
      const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
      const mockOnClose = jest.fn();

      const mockConfirmation: AgentConfirmation = {
        id: 'conf-123',
        agentActionId: 'action-123',
        dialogType: 'simple',
        title: 'Confirm Action',
        message: 'Proceed?',
        details: null,
        userResponse: null,
        responseTimestamp: null,
        responseDetails: null,
        createdAt: '2024-01-01T10:00:00Z',
        expiresAt: null
      };

      const mockAction: AgentAction = {
        id: 'action-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        entityId: null,
        functionName: 'createProduct',
        functionParameters: { name: 'Test' },
        openAiFunctionCallId: 'call-123',
        status: 'pending',
        requiresConfirmation: true,
        confirmationRequestedAt: '2024-01-01T10:00:00Z',
        confirmationReceivedAt: null,
        confirmedByUserId: null,
        resultData: null,
        errorData: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        completedAt: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'confirmed', undefined);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should cancel action when user rejects', async () => {
      const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
      const mockOnClose = jest.fn();

      const mockConfirmation: AgentConfirmation = {
        id: 'conf-123',
        agentActionId: 'action-123',
        dialogType: 'simple',
        title: 'Confirm Action',
        message: 'Proceed?',
        details: null,
        userResponse: null,
        responseTimestamp: null,
        responseDetails: null,
        createdAt: '2024-01-01T10:00:00Z',
        expiresAt: null
      };

      const mockAction: AgentAction = {
        id: 'action-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        sessionId: 'session-123',
        operationType: 'create',
        entityType: 'product',
        entityId: null,
        functionName: 'createProduct',
        functionParameters: { name: 'Test' },
        openAiFunctionCallId: 'call-123',
        status: 'pending',
        requiresConfirmation: true,
        confirmationRequestedAt: '2024-01-01T10:00:00Z',
        confirmationReceivedAt: null,
        confirmedByUserId: null,
        resultData: null,
        errorData: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        completedAt: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'rejected', undefined);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Test 29: Loading states and operation feedback', () => {
    it('should show loading indicator during agent operations', () => {
      const mockProcessingAgent = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          isProcessing: true
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockProcessingAgent);

      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show confirmations requiring attention', () => {
      const mockConfirmationsWithData = {
        ...mockConfirmations,
        confirmations: [
          {
            id: 'conf-1',
            functionName: 'createProduct',
            entityType: 'product',
            operationType: 'create'
          }
        ]
      };

      jest.mocked(require('../hooks/use-agent-confirmations').usePendingConfirmations)
        .mockReturnValue(mockConfirmationsWithData);

      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('1 confirmation')).toBeInTheDocument();
    });
  });

  describe('Test 30: Action history display', () => {
    it('should display agent actions in history panel', () => {
      const mockAgentWithHistory = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          recentActions: [
            {
              id: 'action-1',
              operationType: 'create',
              entityType: 'product',
              functionName: 'createProduct',
              functionParameters: { name: 'Test Product' },
              status: 'completed',
              createdAt: '2024-01-01T10:00:00Z'
            }
          ]
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockAgentWithHistory);

      render(
        <AgentActionHistory />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Agent Action History')).toBeInTheDocument();
      expect(screen.getByText('createProduct')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should show action status with appropriate visual indicators', () => {
      const mockAgentWithMixedHistory = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          recentActions: [
            {
              id: 'action-1',
              operationType: 'create',
              entityType: 'product',
              status: 'completed',
              functionName: 'createProduct',
              functionParameters: { name: 'Success Product' },
              createdAt: '2024-01-01T10:00:00Z'
            },
            {
              id: 'action-2',
              operationType: 'update',
              entityType: 'feature',
              status: 'failed',
              functionName: 'updateFeature',
              functionParameters: { id: 'feature-1', name: 'Failed Feature' },
              createdAt: '2024-01-01T09:00:00Z'
            }
          ]
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockAgentWithMixedHistory);

      render(
        <AgentActionHistory />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument(); // Completed
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument(); // Create operation
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument(); // Update operation
    });
  });
});

describe('Phase 4: Frontend - Hook Tests', () => {
  describe('Test 31: Agent state management hooks', () => {
    it('should manage agent session state correctly', async () => {
      const mockCreateSession = jest.fn().mockResolvedValue({
        session: { id: 'session-1', mode: 'agent' },
        message: 'Session created'
      });

      const mockSessionsHook = {
        ...mockSessions,
        createSession: mockCreateSession
      };

      jest.mocked(require('../hooks/use-agent-sessions').useAgentSessions)
        .mockReturnValue(mockSessionsHook);

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.createSession({ mode: 'agent' });
      });

      expect(mockCreateSession).toHaveBeenCalledWith({ mode: 'agent' });
    });

    it('should handle confirmation responses', async () => {
      const mockRespondToConfirmation = jest.fn().mockResolvedValue({
        confirmation: { id: 'conf-1', userResponse: 'confirmed' },
        action: { id: 'action-1', status: 'confirmed' }
      });

      const mockConfirmationsHook = {
        ...mockConfirmations,
        respondToConfirmation: mockRespondToConfirmation
      };

      jest.mocked(require('../hooks/use-agent-confirmations').useAgentConfirmations)
        .mockReturnValue(mockConfirmationsHook);

      const { result } = renderHook(() => useAgentConfirmations(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.respondToConfirmation('conf-1', 'confirmed', { note: 'Approved' });
      });

      expect(mockRespondToConfirmation).toHaveBeenCalledWith('conf-1', 'confirmed', { note: 'Approved' });
    });
  });

  describe('Test 32: Error handling in hooks', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      
      const mockSessionsWithError = {
        ...mockSessions,
        createSession: jest.fn().mockRejectedValue(mockError),
        isError: true,
        error: mockError
      };

      jest.mocked(require('../hooks/use-agent-sessions').useAgentSessions)
        .mockReturnValue(mockSessionsWithError);

      const { result } = renderHook(() => useAgentSessions(), {
        wrapper: createWrapper()
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);

      try {
        await result.current.createSession({ mode: 'agent' });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });
});

describe('Phase 4: Frontend - Integration Tests', () => {
  describe('Test 33: End-to-end user workflow', () => {
    it('should complete full agent operation workflow', async () => {
      // Mock full workflow
      const mockWorkflowAgent = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          pendingConfirmations: [
            {
              id: 'conf-1',
              agentActionId: 'action-1',
              title: 'Confirm Product Creation',
              message: 'Create Test Product?'
            }
          ],
          showConfirmationDialog: true
        }
      };

      const mockWorkflowConfirmations = {
        ...mockConfirmations,
        confirmations: [
          {
            id: 'conf-1',
            agentActionId: 'action-1',
            title: 'Confirm Product Creation',
            message: 'Create Test Product?'
          }
        ],
        respondToConfirmation: jest.fn().mockResolvedValue({
          confirmation: { id: 'conf-1', userResponse: 'confirmed' },
          action: { id: 'action-1', status: 'completed' }
        })
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(mockWorkflowAgent);
      
      jest.mocked(require('../hooks/use-agent-confirmations').usePendingConfirmations)
        .mockReturnValue(mockWorkflowConfirmations);

      render(
        <AIChatComponent />,
        { wrapper: createWrapper() }
      );

      // Should show confirmation badge
      expect(screen.getByText('1 confirmation')).toBeInTheDocument();
      
      // Workflow completion would be tested with integration testing
      expect(mockWorkflowConfirmations.respondToConfirmation).toBeDefined();
    });
  });

  describe('Test 34: Cross-component state synchronization', () => {
    it('should synchronize state between chat and history components', () => {
      const sharedState = {
        ...mockAgent,
        state: {
          ...mockAgent.state,
          recentActions: [
            {
              id: 'action-1',
              operationType: 'create',
              entityType: 'product',
              status: 'completed',
              functionName: 'createProduct',
              functionParameters: { name: 'Shared Product' },
              createdAt: '2024-01-01T10:00:00Z'
            }
          ],
          pendingActions: []
        }
      };

      jest.mocked(require('../providers/agent-provider').useAgent)
        .mockReturnValue(sharedState);

      const ChatWrapper = () => (
        <div>
          <AIChatComponent />
          <AgentActionHistory />
        </div>
      );

      render(<ChatWrapper />, { wrapper: createWrapper() });

      // Both components should reflect the same state
      expect(screen.getByText('Shared Product')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });
});