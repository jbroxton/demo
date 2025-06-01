/**
 * @file Integration Tests for OpenAI Fully Managed Service Layer
 * @description Tests actual OpenAI API integration with real API calls
 * @warning These tests make real API calls and incur costs
 */

// Polyfill for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import OpenAI from 'openai';
import { supabase } from '@/services/supabase';
import {
  getUserThread,
  createUserThread,
  getOrCreateAssistant,
  exportTenantDataForOpenAI,
  ensureTenantDataSynced
} from './ai-chat-fully-managed';

// Initialize OpenAI client for tests (Node.js environment)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // For testing in Node.js environment that Jest thinks is browser-like
  dangerouslyAllowBrowser: true,
});

// Test configuration - use real user data from env
const TEST_TENANT_ID = process.env.TENANT_ID || 'test-tenant-integration';
const TEST_USER_ID = process.env.USER_ID || 'test-user-integration';
const TEST_TIMEOUT = 30000; // 30 seconds for real API calls

// Track resources for cleanup
const createdResources = {
  threadIds: [] as string[],
  assistantIds: [] as string[],
  fileIds: [] as string[]
};

describe('AI Chat Fully Managed Integration Tests', () => {
  beforeAll(() => {
    // Verify environment
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable required for integration tests');
    }
    
    console.log('🧪 Starting integration tests with real OpenAI APIs');
    console.log('⚠️  These tests will incur OpenAI API costs');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test resources...');
    
    // Cleanup threads
    for (const threadId of createdResources.threadIds) {
      try {
        await openai.beta.threads.del(threadId);
        console.log(`✅ Deleted thread: ${threadId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to delete thread ${threadId}:`, error);
      }
    }

    // Cleanup assistants
    for (const assistantId of createdResources.assistantIds) {
      try {
        await openai.beta.assistants.del(assistantId);
        console.log(`✅ Deleted assistant: ${assistantId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to delete assistant ${assistantId}:`, error);
      }
    }

    // Cleanup files
    for (const fileId of createdResources.fileIds) {
      try {
        await openai.files.del(fileId);
        console.log(`✅ Deleted file: ${fileId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to delete file ${fileId}:`, error);
      }
    }

    // Cleanup database records
    try {
      await supabase
        .from('ai_chat_fully_managed_threads')
        .delete()
        .eq('tenant_id', TEST_TENANT_ID);
        
      await supabase
        .from('ai_chat_fully_managed_assistants')
        .delete()
        .eq('tenant_id', TEST_TENANT_ID);
        
      console.log('✅ Cleaned up database test records');
    } catch (error) {
      console.warn('⚠️  Failed to cleanup database records:', error);
    }
  });

  describe('Thread Management', () => {
    it('should create and retrieve thread successfully', async () => {
      console.log('🔄 Testing thread creation...');
      
      // Create thread
      const threadId = await createUserThread(TEST_USER_ID, TEST_TENANT_ID);
      createdResources.threadIds.push(threadId);
      
      expect(threadId).toBeTruthy();
      expect(typeof threadId).toBe('string');
      console.log(`✅ Created thread: ${threadId}`);
      
      // Verify thread exists in OpenAI
      const thread = await openai.beta.threads.retrieve(threadId);
      expect(thread.id).toBe(threadId);
      expect(thread.metadata?.userId).toBe(TEST_USER_ID);
      expect(thread.metadata?.tenantId).toBe(TEST_TENANT_ID);
      
      // Retrieve thread via our service
      const retrievedThreadId = await getUserThread(TEST_USER_ID, TEST_TENANT_ID);
      expect(retrievedThreadId).toBe(threadId);
      
      console.log('✅ Thread management integration test passed');
    }, TEST_TIMEOUT);

    it('should return null for non-existent thread', async () => {
      const result = await getUserThread('non-existent-user', TEST_TENANT_ID);
      expect(result).toBeNull();
    }, TEST_TIMEOUT);
  });

  describe('Assistant Management', () => {
    it('should create and reuse assistant successfully', async () => {
      console.log('🔄 Testing assistant creation...');
      
      // First call should create assistant
      const assistantId1 = await getOrCreateAssistant(TEST_TENANT_ID);
      createdResources.assistantIds.push(assistantId1);
      
      expect(assistantId1).toBeTruthy();
      expect(typeof assistantId1).toBe('string');
      console.log(`✅ Created assistant: ${assistantId1}`);
      
      // Verify assistant exists in OpenAI
      const assistant = await openai.beta.assistants.retrieve(assistantId1);
      expect(assistant.id).toBe(assistantId1);
      expect(assistant.name).toContain(TEST_TENANT_ID);
      expect(assistant.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'file_search' })
        ])
      );
      
      // Second call should return same assistant
      const assistantId2 = await getOrCreateAssistant(TEST_TENANT_ID);
      expect(assistantId2).toBe(assistantId1);
      
      console.log('✅ Assistant management integration test passed');
    }, TEST_TIMEOUT);
  });

  describe('Data Export', () => {
    it('should export tenant data in correct format', async () => {
      console.log('🔄 Testing data export...');
      
      const exportedData = await exportTenantDataForOpenAI(TEST_TENANT_ID);
      
      expect(exportedData).toBeTruthy();
      expect(typeof exportedData).toBe('string');
      expect(exportedData).toContain('# Product Management Context');
      expect(exportedData).toContain('## Products');
      expect(exportedData).toContain('## Features');
      expect(exportedData).toContain('## Requirements');
      expect(exportedData).toContain('## Releases');
      
      console.log('✅ Data export integration test passed');
      console.log(`📄 Export length: ${exportedData.length} characters`);
    }, TEST_TIMEOUT);
  });

  describe('Full Sync Process', () => {
    it('should complete end-to-end sync successfully', async () => {
      console.log('🔄 Testing full sync process...');
      
      // This will create assistant, export data, upload file, and update assistant
      await ensureTenantDataSynced(TEST_TENANT_ID);
      
      // Verify assistant was created and has file attached
      const assistantId = await getOrCreateAssistant(TEST_TENANT_ID);
      if (!createdResources.assistantIds.includes(assistantId)) {
        createdResources.assistantIds.push(assistantId);
      }
      
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      expect(assistant.tool_resources?.file_search?.vector_store_ids).toBeTruthy();
      
      // Check database record exists
      const { data, error } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .select('file_ids')
        .eq('tenant_id', TEST_TENANT_ID)
        .single();
        
      expect(error).toBeNull();
      expect(data?.file_ids).toBeTruthy();
      expect(Array.isArray(data?.file_ids)).toBe(true);
      expect(data?.file_ids.length).toBeGreaterThan(0);
      
      // Track files for cleanup
      if (data?.file_ids) {
        createdResources.fileIds.push(...data.file_ids);
      }
      
      console.log('✅ Full sync integration test passed');
      console.log(`📎 Files attached: ${data?.file_ids?.length || 0}`);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle invalid tenant gracefully', async () => {
      // Test with empty tenant ID
      await expect(getOrCreateAssistant('')).rejects.toThrow();
    }, TEST_TIMEOUT);

    it('should handle network errors gracefully', async () => {
      // Test with invalid API key temporarily
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'invalid-key';
      
      try {
        await expect(createUserThread(TEST_USER_ID, 'invalid-tenant')).rejects.toThrow();
      } finally {
        process.env.OPENAI_API_KEY = originalKey;
      }
    }, TEST_TIMEOUT);
  });
});

// Helper to run specific test suites
export const runIntegrationTests = {
  threads: () => describe.only('Thread Management', () => {}),
  assistants: () => describe.only('Assistant Management', () => {}),
  sync: () => describe.only('Full Sync Process', () => {}),
  all: () => describe('AI Chat Fully Managed Integration Tests', () => {})
};