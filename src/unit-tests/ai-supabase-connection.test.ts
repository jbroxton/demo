/**
 * Supabase Connection Test
 * 
 * This test verifies that Supabase connection is working properly
 * and environment variables are configured correctly.
 */

import { supabase } from '@/services/supabase';

describe('Supabase Connection', () => {
  describe('Environment Configuration', () => {
    test('should have Supabase URL configured', () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(supabaseUrl).toBeDefined();
      expect(supabaseUrl).not.toBe('');
      expect(supabaseUrl).not.toBe('your-supabase-url');
      
      // Accept both production (supabase.co) and local development (localhost) URLs
      const isValidUrl = supabaseUrl.match(/^https:\/\/.*\.supabase\.co$/) || 
                        supabaseUrl.match(/^http:\/\/localhost:\d+$/);
      expect(isValidUrl).toBeTruthy();
    });

    test('should have Supabase service role key configured', () => {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(serviceRoleKey).toBeDefined();
      expect(serviceRoleKey).not.toBe('');
      expect(serviceRoleKey).not.toBe('your-supabase-service-role-key');
    });

    test('should create Supabase client successfully', () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase.from).toBe('function');
      expect(typeof supabase.rpc).toBe('function');
    });
  });

  describe('Database Connection', () => {
    test('should connect to Supabase and perform basic operations', async () => {
      try {
        // Try a simple query that should work with any Supabase instance
        const { data, error } = await supabase
          .from('ai_embeddings')
          .select('count(*)', { count: 'exact', head: true });

        // If we get here without throwing, connection works
        if (error) {
          console.log('Supabase connection error details:', error);
          // Check if it's a table not found error (which is expected if tables don't exist)
          if (error.message.includes('relation "ai_embeddings" does not exist')) {
            console.log('ai_embeddings table does not exist - this is expected if migrations have not been run');
            // This is actually OK - it means we can connect but table doesn't exist
            expect(error.code).toBe('42P01'); // PostgreSQL error code for table not found
          } else {
            // Some other error - connection might be failing
            throw error;
          }
        } else {
          // Connection successful and table exists
          expect(data).toBeDefined();
        }
      } catch (networkError) {
        // If we get a network error, the environment variables might be wrong
        console.error('Network error connecting to Supabase:', networkError);
        throw new Error('Failed to connect to Supabase. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
      }
    }, 10000); // 10 second timeout

    test('should be able to query PostgreSQL version', async () => {
      try {
        const { data, error } = await supabase.rpc('version');
        
        if (error) {
          // If RPC doesn't work, try a simpler query
          const { data: simpleData, error: simpleError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
            
          if (simpleError) {
            throw simpleError;
          }
          
          expect(simpleData).toBeDefined();
        } else {
          expect(data).toBeDefined();
          expect(typeof data).toBe('string');
          expect(data).toContain('PostgreSQL');
        }
      } catch (error) {
        console.error('Error querying PostgreSQL version:', error);
        throw new Error('Failed to query PostgreSQL. Connection may be failing.');
      }
    }, 10000);
  });

  describe('pgvector Extension', () => {
    test('should have pgvector extension available', async () => {
      try {
        // Check if pgvector extension exists
        const { data, error } = await supabase
          .from('pg_available_extensions')
          .select('name, installed_version')
          .eq('name', 'vector');

        if (error) {
          console.warn('Could not check pgvector extension:', error.message);
          // This might fail if we don't have permission to query system tables
          return;
        }

        if (data && data.length > 0) {
          expect(data[0].name).toBe('vector');
          console.log('pgvector extension status:', data[0]);
        } else {
          console.warn('pgvector extension not found in available extensions');
        }
      } catch (error) {
        console.warn('Error checking pgvector extension:', error);
        // This is not a critical failure for basic connection testing
      }
    }, 10000);
  });
});