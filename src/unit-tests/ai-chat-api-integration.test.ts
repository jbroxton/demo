/**
 * @file API Integration Tests for AI Chat Routes
 * @description Tests actual API route behavior with real data scenarios
 */

import { NextRequest } from 'next/server';
import { POST as aiChatPOST } from '@/app/api/ai-chat/route';
import { POST as aiChatFullyManagedPOST } from '@/app/api/ai-chat-fully-managed/route';

// Mock dependencies
jest.mock('@/services/supabase');
jest.mock('@/services/features-db');
jest.mock('@/services/products-db');
jest.mock('@/services/requirements-db');
jest.mock('@/services/releases-db');
jest.mock('@/services/ai-service');
jest.mock('@/services/ai-chat-fully-managed');

// Mock auth
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'user-123', email: 'test@example.com' }
  }))
}));

jest.mock('@/utils/get-tenant-id', () => ({
  getTenantId: jest.fn(() => 'tenant-456')
}));

const mockFeaturesDb = require('@/services/features-db');
const mockProductsDb = require('@/services/products-db');
const mockRequirementsDb = require('@/services/requirements-db');
const mockReleasesDb = require('@/services/releases-db');
const mockAiService = require('@/services/ai-service');
const mockAiChatFullyManaged = require('@/services/ai-chat-fully-managed');

describe('AI Chat API Integration Tests', () => {
  const mockTenantData = {
    features: [
      {
        id: 'feat-1',
        name: 'User Authentication',
        priority: 'High',
        workflowStatus: 'Active',
        description: 'Login and signup system',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      },
      {
        id: 'feat-2',
        name: 'Dashboard Analytics', 
        priority: 'Medium',
        workflowStatus: 'In Progress',
        description: 'User analytics dashboard',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      },
      {
        id: 'feat-3',
        name: 'Dark Mode',
        priority: 'Low',
        workflowStatus: 'Planned', 
        description: 'Theme switching capability',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      }
    ],
    products: [
      {
        id: 'prod-1',
        name: 'Web Application',
        description: 'Main SaaS platform',
        status: 'Active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      }
    ],
    requirements: [],
    releases: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful data retrieval
    mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({
      success: true,
      data: mockTenantData.features
    });
    
    mockProductsDb.getProductsFromDb.mockResolvedValue({
      success: true,
      data: mockTenantData.products
    });
    
    mockRequirementsDb.getRequirementsFromDb.mockResolvedValue({
      success: true,
      data: mockTenantData.requirements
    });
    
    mockReleasesDb.getReleasesFromDb.mockResolvedValue({
      success: true,
      data: mockTenantData.releases
    });
  });

  describe('Custom RAG API Route Tests', () => {
    beforeEach(() => {
      mockAiService.processAIChatMessage.mockResolvedValue({
        success: true,
        response: 'AI response here'
      });
    });

    it('should handle "how many features" query correctly', async () => {
      mockAiService.processAIChatMessage.mockResolvedValue({
        success: true,
        response: 'You currently have 3 features: User Authentication (High priority), Dashboard Analytics (Medium priority), and Dark Mode (Low priority).'
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'how many features do I have',
          conversationHistory: []
        })
      });

      const response = await aiChatPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toContain('3 features');
      expect(data.content).toContain('User Authentication');
      expect(data.content).toContain('High priority');
      
      // Verify AI service was called with proper context
      expect(mockAiService.processAIChatMessage).toHaveBeenCalledWith(
        'how many features do I have',
        expect.stringContaining('User Authentication'),
        []
      );
    });

    it('should handle specific feature priority queries', async () => {
      mockAiService.processAIChatMessage.mockResolvedValue({
        success: true,
        response: 'The User Authentication feature has High priority and is currently Active.'
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'what is the priority of User Authentication',
          conversationHistory: []
        })
      });

      const response = await aiChatPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toContain('High priority');
      expect(data.content).toContain('User Authentication');
      expect(data.content).toContain('Active');
    });

    it('should include comprehensive context in AI calls', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'tell me about my data',
          conversationHistory: []
        })
      });

      await aiChatPOST(request);

      const [message, context, history] = mockAiService.processAIChatMessage.mock.calls[0];
      
      expect(message).toBe('tell me about my data');
      expect(context).toContain('Products:');
      expect(context).toContain('Web Application');
      expect(context).toContain('Features:');
      expect(context).toContain('User Authentication');
      expect(context).toContain('Dashboard Analytics');
      expect(context).toContain('Dark Mode');
      expect(history).toEqual([]);
    });

    it('should handle conversation history properly', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help?' }
      ];

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'how many features do I have',
          conversationHistory
        })
      });

      await aiChatPOST(request);

      const [, , history] = mockAiService.processAIChatMessage.mock.calls[0];
      expect(history).toEqual(conversationHistory);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAiService.processAIChatMessage.mockResolvedValue({
        success: false,
        error: 'AI service unavailable'
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test message',
          conversationHistory: []
        })
      });

      const response = await aiChatPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('AI service unavailable');
    });
  });

  describe('OpenAI Fully Managed API Route Tests', () => {
    beforeEach(() => {
      mockAiChatFullyManaged.ensureTenantDataSynced.mockResolvedValue();
      mockAiChatFullyManaged.getUserThread.mockResolvedValue('thread-123');
      mockAiChatFullyManaged.getOrCreateAssistant.mockResolvedValue('asst-456');
    });

    it('should handle feature count queries in fully managed mode', async () => {
      // Mock OpenAI assistant response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{
            content: [{
              text: {
                value: 'Based on the uploaded files, you have 3 features: User Authentication (High priority), Dashboard Analytics (Medium priority), and Dark Mode (Low priority).'
              }
            }]
          }]
        })
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'how many features do I have'
        })
      });

      const response = await aiChatFullyManagedPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toContain('3 features');
      expect(data.response).toContain('User Authentication');
      
      // Verify data sync was called
      expect(mockAiChatFullyManaged.ensureTenantDataSynced).toHaveBeenCalledWith('tenant-456');
    });

    it('should create new thread for new users', async () => {
      mockAiChatFullyManaged.getUserThread.mockResolvedValue(null);
      mockAiChatFullyManaged.createUserThread.mockResolvedValue('new-thread-789');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ content: [{ text: { value: 'Hello! How can I help?' } }] }]
        })
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'hello'
        })
      });

      await aiChatFullyManagedPOST(request);

      expect(mockAiChatFullyManaged.createUserThread).toHaveBeenCalledWith('user-123', 'tenant-456');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('OpenAI API error'));

      const request = new NextRequest('http://localhost:3000/api/ai-chat-fully-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test message'
        })
      });

      const response = await aiChatFullyManagedPOST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toContain('OpenAI API error');
    });
  });

  describe('Data Context Building Tests', () => {
    it('should build proper context when all data types are present', async () => {
      // Add requirements and releases to mock data
      mockRequirementsDb.getRequirementsFromDb.mockResolvedValue({
        success: true,
        data: [{
          id: 'req-1',
          title: 'Login Form Validation',
          description: 'Form should validate email format',
          priority: 'High',
          status: 'Active'
        }]
      });

      mockReleasesDb.getReleasesFromDb.mockResolvedValue({
        success: true,
        data: [{
          id: 'rel-1',
          name: 'v1.0.0',
          description: 'Initial release',
          status: 'Planned',
          targetDate: '2024-12-01'
        }]
      });

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'give me an overview',
          conversationHistory: []
        })
      });

      await aiChatPOST(request);

      const [, context] = mockAiService.processAIChatMessage.mock.calls[0];
      
      expect(context).toContain('Products:');
      expect(context).toContain('Features:');
      expect(context).toContain('Requirements:');
      expect(context).toContain('Releases:');
      expect(context).toContain('Web Application');
      expect(context).toContain('User Authentication');
      expect(context).toContain('Login Form Validation');
      expect(context).toContain('v1.0.0');
    });

    it('should handle empty data sets gracefully', async () => {
      // Mock empty data
      mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({ success: true, data: [] });
      mockProductsDb.getProductsFromDb.mockResolvedValue({ success: true, data: [] });
      mockRequirementsDb.getRequirementsFromDb.mockResolvedValue({ success: true, data: [] });
      mockReleasesDb.getReleasesFromDb.mockResolvedValue({ success: true, data: [] });

      const request = new NextRequest('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'what do I have',
          conversationHistory: []
        })
      });

      await aiChatPOST(request);

      const [, context] = mockAiService.processAIChatMessage.mock.calls[0];
      
      expect(context).toContain('No products found');
      expect(context).toContain('No features found');
      expect(context).toContain('No requirements found');
      expect(context).toContain('No releases found');
    });
  });
});