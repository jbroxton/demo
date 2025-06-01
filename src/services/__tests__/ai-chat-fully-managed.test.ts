/**
 * @file Unit Tests for OpenAI Fully Managed Service Layer
 * @description Comprehensive tests for service functions managing OpenAI resources
 */

import OpenAI from 'openai';
import { supabase } from '@/services/supabase';
import * as featuresDb from '@/services/features-db';
import * as productsDb from '@/services/products-db';
import * as requirementsDb from '@/services/requirements-db';
import * as releasesDb from '@/services/releases-db';
import {
  getUserThread,
  createUserThread,
  getOrCreateAssistant,
  exportTenantDataForOpenAI,
  ensureTenantDataSynced
} from '@/services/ai-chat-fully-managed';

// Mock dependencies
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      beta: {
        assistants: {
          create: jest.fn(),
          update: jest.fn(),
          del: jest.fn(),
        },
        threads: {
          create: jest.fn(),
          del: jest.fn(),
          runs: {
            create: jest.fn(),
            retrieve: jest.fn(),
          },
          messages: {
            create: jest.fn(),
            list: jest.fn(),
          },
        },
      },
      files: {
        create: jest.fn(),
        del: jest.fn(),
      },
    }))
  };
});
jest.mock('@/services/supabase');
jest.mock('@/services/features-db');
jest.mock('@/services/products-db');
jest.mock('@/services/requirements-db');
jest.mock('@/services/releases-db');

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockFeaturesDb = featuresDb as jest.Mocked<typeof featuresDb>;
const mockProductsDb = productsDb as jest.Mocked<typeof productsDb>;
const mockRequirementsDb = requirementsDb as jest.Mocked<typeof requirementsDb>;
const mockReleasesDb = releasesDb as jest.Mocked<typeof releasesDb>;

describe('AI Chat Fully Managed Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserThread', () => {
    it('should return thread ID when found', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { thread_id: 'thread-123' },
                error: null
              })
            })
          })
        })
      });

      const result = await getUserThread('user-456', 'tenant-789');
      expect(result).toBe('thread-123');
    });

    it('should return null when no thread found', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // No rows found
              })
            })
          })
        })
      });

      const result = await getUserThread('user-456', 'tenant-789');
      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'OTHER_ERROR', message: 'DB error' }
              })
            })
          })
        })
      });

      const result = await getUserThread('user-456', 'tenant-789');
      expect(result).toBeNull();
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await getUserThread('user-456', 'tenant-789');
      expect(result).toBeNull();
    });
  });

  describe('createUserThread', () => {
    beforeEach(() => {
      mockOpenAI.beta = {
        threads: {
          create: jest.fn().mockResolvedValue({ id: 'new-thread-123' }),
          del: jest.fn().mockResolvedValue({})
        }
      } as any;

      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      });
    });

    it('should create thread and store reference successfully', async () => {
      const result = await createUserThread('user-456', 'tenant-789');

      expect(mockOpenAI.beta.threads.create).toHaveBeenCalledWith({
        metadata: {
          userId: 'user-456',
          tenantId: 'tenant-789',
          createdAt: expect.any(String)
        }
      });

      expect(result).toBe('new-thread-123');
    });

    it('should cleanup OpenAI thread on database error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ 
          error: { message: 'DB insert failed' } 
        })
      });

      await expect(createUserThread('user-456', 'tenant-789')).rejects.toThrow(
        'Failed to store thread reference: DB insert failed'
      );

      expect(mockOpenAI.beta.threads.del).toHaveBeenCalledWith('new-thread-123');
    });

    it('should handle OpenAI thread creation failure', async () => {
      mockOpenAI.beta.threads.create = jest.fn().mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(createUserThread('user-456', 'tenant-789')).rejects.toThrow(
        'OpenAI API error'
      );
    });
  });

  describe('getOrCreateAssistant', () => {
    beforeEach(() => {
      mockOpenAI.beta = {
        assistants: {
          create: jest.fn().mockResolvedValue({ id: 'new-asst-123' }),
          del: jest.fn().mockResolvedValue({})
        }
      } as any;
    });

    it('should return existing assistant when found', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { assistant_id: 'existing-asst-456' },
              error: null
            })
          })
        })
      });

      const result = await getOrCreateAssistant('tenant-789');
      expect(result).toBe('existing-asst-456');
      expect(mockOpenAI.beta.assistants.create).not.toHaveBeenCalled();
    });

    it('should create new assistant when none exists', async () => {
      // Mock no existing assistant
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null })
        });

      const result = await getOrCreateAssistant('tenant-789');

      expect(mockOpenAI.beta.assistants.create).toHaveBeenCalledWith({
        name: 'PM Assistant - Tenant tenant-789',
        instructions: expect.stringContaining('Product Management assistant'),
        model: 'gpt-4-1106-preview',
        tools: [{ type: 'file_search' }]
      });

      expect(result).toBe('new-asst-123');
    });

    it('should cleanup assistant on database storage failure', async () => {
      // Mock no existing assistant
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ 
            error: { message: 'Insert failed' } 
          })
        });

      await expect(getOrCreateAssistant('tenant-789')).rejects.toThrow(
        'Failed to store assistant reference: Insert failed'
      );

      expect(mockOpenAI.beta.assistants.del).toHaveBeenCalledWith('new-asst-123');
    });
  });

  describe('exportTenantDataForOpenAI', () => {
    beforeEach(() => {
      mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'feat-1',
            name: 'Authentication',
            priority: 'High',
            workflowStatus: 'Active',
            description: 'User login system',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02'
          }
        ]
      });

      mockProductsDb.getProductsFromDb.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'prod-1',
            name: 'Web App',
            description: 'Main web application',
            status: 'Active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02'
          }
        ]
      });

      mockRequirementsDb.getRequirementsFromDb.mockResolvedValue({
        success: true,
        data: []
      });

      mockReleasesDb.getReleasesFromDb.mockResolvedValue({
        success: true,
        data: []
      });
    });

    it('should export comprehensive tenant data', async () => {
      const result = await exportTenantDataForOpenAI('tenant-789');

      expect(result).toContain('# Product Management Context for Organization');
      expect(result).toContain('## Products (1 total)');
      expect(result).toContain('### Product: Web App');
      expect(result).toContain('## Features (1 total)');
      expect(result).toContain('### Feature: Authentication');
      expect(result).toContain('- **Priority**: High');
    });

    it('should handle empty data gracefully', async () => {
      mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({
        success: true,
        data: []
      });
      mockProductsDb.getProductsFromDb.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await exportTenantDataForOpenAI('tenant-789');

      expect(result).toContain('## Products (0 total)');
      expect(result).toContain('No products found.');
      expect(result).toContain('## Features (0 total)');
      expect(result).toContain('No features found.');
    });

    it('should handle service failures gracefully', async () => {
      mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const result = await exportTenantDataForOpenAI('tenant-789');

      expect(result).toContain('## Features (0 total)');
      expect(result).toContain('No features found.');
    });

    it('should handle service exceptions', async () => {
      mockFeaturesDb.getFeaturesFromDb.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(exportTenantDataForOpenAI('tenant-789')).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('ensureTenantDataSynced', () => {
    beforeEach(() => {
      mockFeaturesDb.getFeaturesFromDb.mockResolvedValue({
        success: true,
        data: [{ id: 'feat-1', name: 'Test Feature' }]
      });
      mockProductsDb.getProductsFromDb.mockResolvedValue({
        success: true,
        data: []
      });
      mockRequirementsDb.getRequirementsFromDb.mockResolvedValue({
        success: true,
        data: []
      });
      mockReleasesDb.getReleasesFromDb.mockResolvedValue({
        success: true,
        data: []
      });

      mockOpenAI.files = {
        create: jest.fn().mockResolvedValue({ id: 'file-123' }),
        del: jest.fn().mockResolvedValue({})
      } as any;

      mockOpenAI.beta = {
        assistants: {
          update: jest.fn().mockResolvedValue({})
        }
      } as any;

      // Mock getOrCreateAssistant to return an assistant ID
      jest.spyOn(require('./ai-chat-fully-managed'), 'getOrCreateAssistant')
        .mockResolvedValue('asst-456');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should complete full sync process', async () => {
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { file_ids: ['old-file-789'] },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        });

      await ensureTenantDataSynced('tenant-789');

      expect(mockOpenAI.files.create).toHaveBeenCalledWith({
        file: expect.any(Blob),
        purpose: 'assistants'
      });

      expect(mockOpenAI.beta.assistants.update).toHaveBeenCalledWith(
        'asst-456',
        {
          file_ids: ['file-123'],
          tools: [{ type: 'file_search' }]
        }
      );

      expect(mockOpenAI.files.del).toHaveBeenCalledWith('old-file-789');
    });

    it('should handle file upload failure', async () => {
      mockOpenAI.files.create = jest.fn().mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(ensureTenantDataSynced('tenant-789')).rejects.toThrow(
        'Upload failed'
      );
    });

    it('should continue on database update failure', async () => {
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { file_ids: [] },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ 
              error: { message: 'Update failed' } 
            })
          })
        });

      // Should not throw - continues despite DB update failure
      await expect(ensureTenantDataSynced('tenant-789')).resolves.not.toThrow();
    });

    it('should continue on old file cleanup failure', async () => {
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { file_ids: ['old-file-999'] },
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        });

      mockOpenAI.files.del = jest.fn().mockRejectedValue(
        new Error('Delete failed')
      );

      // Should not throw - continues despite cleanup failure
      await expect(ensureTenantDataSynced('tenant-789')).resolves.not.toThrow();
    });
  });
});