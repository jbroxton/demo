import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentConfirmationDialog } from '../components/agent-confirmation-dialog';
import type { AgentConfirmation, AgentAction } from '@/types/models/ai-chat';

// Mock the icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="button" 
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />
}));

describe('AgentConfirmationDialog', () => {
  const mockConfirmation: AgentConfirmation = {
    id: 'conf-123',
    agentActionId: 'action-123',
    dialogType: 'detailed',
    title: 'Confirm Product Creation',
    message: 'Are you sure you want to create this product?',
    details: { warning: 'This will create a new product in your system' },
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
    functionParameters: {
      name: 'Test Product',
      description: 'A test product for demonstration'
    },
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

  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open with confirmation and action', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Confirm Product Creation');
      expect(screen.getByTestId('dialog-description')).toHaveTextContent('Are you sure you want to create this product?');
    });

    it('should not render when closed', () => {
      render(
        <AgentConfirmationDialog
          isOpen={false}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should not render when confirmation is null', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={null}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should not render when action is null', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={null}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Operation Type Display', () => {
    it('should display create operation correctly', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByText('CREATE PRODUCT')).toBeInTheDocument();
    });

    it('should display delete operation with warning', () => {
      const deleteAction = {
        ...mockAction,
        operationType: 'delete' as const,
        functionName: 'deleteProduct'
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={deleteAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      expect(screen.getByText('DELETE PRODUCT')).toBeInTheDocument();
      expect(screen.getByText('Destructive Operation Warning')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete data/)).toBeInTheDocument();
    });

    it('should display update operation with high impact warning', () => {
      const updateAction = {
        ...mockAction,
        operationType: 'update' as const,
        functionName: 'updateProduct'
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={updateAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByText('UPDATE PRODUCT')).toBeInTheDocument();
      expect(screen.getByText('High Impact Operation')).toBeInTheDocument();
      expect(screen.getByText(/modify existing data/)).toBeInTheDocument();
    });
  });

  describe('Parameters Display', () => {
    it('should display function parameters correctly', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('name:')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('description:')).toBeInTheDocument();
      expect(screen.getByText('A test product for demonstration')).toBeInTheDocument();
    });

    it('should not display parameters section when no parameters', () => {
      const actionWithoutParams = {
        ...mockAction,
        functionParameters: {}
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={actionWithoutParams}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      const buttons = screen.getAllByTestId('button');
      expect(buttons).toHaveLength(3);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should show "Confirm Delete" for destructive operations', () => {
      const deleteAction = {
        ...mockAction,
        operationType: 'delete' as const
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={deleteAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    it('should disable buttons when processing', () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
          isProcessing={true}
        />
      );

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm with confirmed response when confirm button clicked', async () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'confirmed', undefined);
      });
    });

    it('should call onConfirm with rejected response when reject button clicked', async () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Reject'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'rejected', undefined);
      });
    });

    it('should call onConfirm with cancelled response when cancel button clicked', async () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'cancelled', undefined);
      });
    });

    it('should include response details when note is provided', async () => {
      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      const textarea = screen.getByPlaceholderText('Add any notes about your decision...');
      fireEvent.change(textarea, { target: { value: 'Looks good to me' } });
      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith('conf-123', 'confirmed', { note: 'Looks good to me' });
      });
    });

    it('should call onClose when response is successful', async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not call onClose when response fails', async () => {
      mockOnConfirm.mockRejectedValue(new Error('Network error'));

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Additional Details', () => {
    it('should display additional details when provided', () => {
      const confirmationWithDetails = {
        ...mockConfirmation,
        details: { 
          warning: 'This action cannot be undone',
          affectedItems: 5 
        }
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={confirmationWithDetails}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Additional Information')).toBeInTheDocument();
      expect(screen.getByText(/warning.*This action cannot be undone/)).toBeInTheDocument();
    });

    it('should not display additional details section when no details', () => {
      const confirmationWithoutDetails = {
        ...mockConfirmation,
        details: null
      };

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={confirmationWithoutDetails}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Additional Information')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show "Processing..." when submitting', async () => {
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <AgentConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          confirmation={mockConfirmation}
          action={mockAction}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByText('Confirm'));

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});