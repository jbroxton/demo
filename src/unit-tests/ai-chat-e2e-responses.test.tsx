/**
 * @file End-to-End AI Chat Response Tests
 * @description Tests actual AI responses to real user queries about tenant data
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIChat } from '@/components/ai-chat';

// Mock the API routes
global.fetch = jest.fn();

// Mock auth
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123' },
    tenantId: 'tenant-456'
  }))
}));

describe('AI Chat E2E Response Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  const mockTenantData = {
    features: [
      {
        id: 'feat-1',
        name: 'User Authentication',
        priority: 'High',
        status: 'Active',
        description: 'Login and signup system'
      },
      {
        id: 'feat-2', 
        name: 'Dashboard Analytics',
        priority: 'Medium',
        status: 'In Progress',
        description: 'User analytics dashboard'
      },
      {
        id: 'feat-3',
        name: 'Dark Mode',
        priority: 'Low', 
        status: 'Planned',
        description: 'Theme switching capability'
      }
    ],
    products: [
      {
        id: 'prod-1',
        name: 'Web Application',
        description: 'Main SaaS platform',
        status: 'Active'
      }
    ]
  };

  describe('Feature Count Queries', () => {
    beforeEach(() => {
      // Mock successful AI response for feature count
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: `Based on your data, you currently have 3 features:

1. **User Authentication** (High priority, Active)
2. **Dashboard Analytics** (Medium priority, In Progress) 
3. **Dark Mode** (Low priority, Planned)

Is there a specific feature you'd like to know more about?`
        })
      });
    });

    it('should respond correctly to "how many features do I have"', async () => {
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Type the question
      await user.type(input, 'how many features do I have');
      await user.click(sendButton);
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/you currently have 3 features/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify specific features are mentioned
      expect(screen.getByText(/User Authentication/)).toBeInTheDocument();
      expect(screen.getByText(/Dashboard Analytics/)).toBeInTheDocument();
      expect(screen.getByText(/Dark Mode/)).toBeInTheDocument();
      
      // Verify API was called with correct data
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('how many features do I have')
      }));
    });

    it('should handle variations of feature count questions', async () => {
      renderWithProviders(<AIChat />);
      
      const variations = [
        'what features do I have',
        'list my features',
        'show me all features',
        'how many features are there'
      ];
      
      for (const question of variations) {
        const input = screen.getByPlaceholderText(/ask about your data/i);
        const sendButton = screen.getByRole('button', { name: /send/i });
        
        await user.clear(input);
        await user.type(input, question);
        await user.click(sendButton);
        
        await waitFor(() => {
          expect(screen.getByText(/you currently have 3 features/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Feature Priority Queries', () => {
    beforeEach(() => {
      // Mock AI response for specific feature priority
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: `The **User Authentication** feature has a **High** priority.

This feature is currently Active and includes the login and signup system. Given its High priority, it's likely a critical component for user access and security.

Would you like to know about other feature priorities or need more details about this feature?`
        })
      });
    });

    it('should respond correctly to specific feature priority questions', async () => {
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Ask about specific feature priority
      await user.type(input, 'what is the priority of User Authentication');
      await user.click(sendButton);
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/User Authentication.*has.*High.*priority/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify additional context is provided
      expect(screen.getByText(/currently Active/i)).toBeInTheDocument();
      expect(screen.getByText(/login and signup system/i)).toBeInTheDocument();
    });

    it('should handle case-insensitive feature names', async () => {
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Test different case variations
      const variations = [
        'what is the priority of user authentication',
        'What is the priority of USER AUTHENTICATION',
        'priority of User Authentication feature'
      ];
      
      for (const question of variations) {
        await user.clear(input);
        await user.type(input, question);
        await user.click(sendButton);
        
        await waitFor(() => {
          expect(screen.getByText(/High.*priority/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Complex Multi-Entity Queries', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: `Here's a summary of your current setup:

**Products (1):**
- Web Application (Active)

**Features (3):**
- User Authentication (High priority, Active)
- Dashboard Analytics (Medium priority, In Progress)
- Dark Mode (Low priority, Planned)

**Priority Breakdown:**
- High: 1 feature
- Medium: 1 feature  
- Low: 1 feature

Your highest priority feature "User Authentication" is already Active, which is great for security. The "Dashboard Analytics" is in progress with medium priority.`
        })
      });
    });

    it('should handle complex queries about multiple entities', async () => {
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'give me an overview of my products and features with their priorities');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/summary of your current setup/i)).toBeInTheDocument();
      });
      
      // Verify comprehensive response
      expect(screen.getByText(/Products \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Features \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Priority Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText(/High: 1 feature/i)).toBeInTheDocument();
    });
  });

  describe('OpenAI Fully Managed Mode Tests', () => {
    beforeEach(() => {
      // Mock OpenAI fully managed API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: `Based on the uploaded context files, you have 3 features in your system:

1. User Authentication (High priority, Active status)
2. Dashboard Analytics (Medium priority, In Progress status)  
3. Dark Mode (Low priority, Planned status)

The User Authentication feature is your highest priority item and is currently active.`
        })
      });
    });

    it('should work correctly in OpenAI fully managed mode', async () => {
      renderWithProviders(<AIChat />);
      
      // Switch to OpenAI fully managed mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      await waitFor(() => {
        expect(toggle).toBeChecked();
      });
      
      // Ask question in fully managed mode
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'how many features do I have');
      await user.click(sendButton);
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/you have 3 features/i)).toBeInTheDocument();
      });
      
      // Verify it called the fully managed endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-chat-fully-managed', expect.any(Object));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'how many features do I have');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle empty or unclear queries appropriately', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: `I'd be happy to help! Could you please provide more specific information about what you'd like to know? 

For example, you could ask:
- "How many features do I have?"
- "What is the priority of [feature name]?"
- "Show me my products"
- "What features are in progress?"`
        })
      });
      
      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'hello');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/could you please provide more specific/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText(/How many features do I have/i)).toBeInTheDocument();
    });
  });
});