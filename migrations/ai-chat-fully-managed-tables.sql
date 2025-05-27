-- Migration: OpenAI Fully Managed Chat Tables
-- Description: Database tables for managing OpenAI Assistants, Threads, and Files
-- Created: 2024

-- Enable required extensions (should already be enabled from setup-auto-embeddings.sql)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Table: OpenAI Thread Management
-- Stores mapping between users/tenants and their OpenAI thread IDs
CREATE TABLE IF NOT EXISTS ai_chat_fully_managed_threads (
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  thread_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, tenant_id),
  
  -- Ensure thread_id is unique across the system
  UNIQUE (thread_id)
);

-- Table: OpenAI Assistant Management  
-- Stores mapping between tenants and their OpenAI assistant IDs
CREATE TABLE IF NOT EXISTS ai_chat_fully_managed_assistants (
  tenant_id UUID PRIMARY KEY,
  assistant_id TEXT NOT NULL UNIQUE,
  file_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE
);

-- Table: File Sync Queue (for webhook-triggered syncs)
-- Tracks pending file sync operations triggered by data changes
CREATE TABLE IF NOT EXISTS ai_chat_fully_managed_sync_queue (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,  -- 'features', 'products', etc.
  entity_id UUID,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Table: Usage Tracking (for cost monitoring)
-- Tracks OpenAI API usage for cost management
CREATE TABLE IF NOT EXISTS ai_chat_fully_managed_usage (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- 'thread_create', 'message_send', 'file_upload', etc.
  openai_resource_id TEXT, -- thread_id, assistant_id, file_id, etc.
  tokens_used INTEGER,
  cost_estimate_usd DECIMAL(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_tenant_id 
  ON ai_chat_fully_managed_threads (tenant_id);

CREATE INDEX IF NOT EXISTS idx_threads_last_active 
  ON ai_chat_fully_managed_threads (last_active_at);

CREATE INDEX IF NOT EXISTS idx_assistants_tenant_id 
  ON ai_chat_fully_managed_assistants (tenant_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_tenant_status 
  ON ai_chat_fully_managed_sync_queue (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_sync_queue_triggered_at 
  ON ai_chat_fully_managed_sync_queue (triggered_at);

CREATE INDEX IF NOT EXISTS idx_usage_tenant_date 
  ON ai_chat_fully_managed_usage (tenant_id, created_at);

-- RLS (Row Level Security) policies for multi-tenancy
ALTER TABLE ai_chat_fully_managed_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_fully_managed_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_fully_managed_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_fully_managed_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can access their own threads" ON ai_chat_fully_managed_threads
  FOR ALL USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant_id', true)::uuid,
      auth.jwt() ->> 'tenant_id'::uuid
    )
  );

CREATE POLICY "Users can access their tenant assistants" ON ai_chat_fully_managed_assistants
  FOR ALL USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant_id', true)::uuid,
      auth.jwt() ->> 'tenant_id'::uuid
    )
  );

CREATE POLICY "Users can access their tenant sync queue" ON ai_chat_fully_managed_sync_queue
  FOR ALL USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant_id', true)::uuid,
      auth.jwt() ->> 'tenant_id'::uuid
    )
  );

CREATE POLICY "Users can access their tenant usage" ON ai_chat_fully_managed_usage
  FOR ALL USING (
    tenant_id = COALESCE(
      current_setting('app.current_tenant_id', true)::uuid,
      auth.jwt() ->> 'tenant_id'::uuid
    )
  );

-- Grant permissions to authenticated users
GRANT ALL ON ai_chat_fully_managed_threads TO authenticated;
GRANT ALL ON ai_chat_fully_managed_assistants TO authenticated;
GRANT ALL ON ai_chat_fully_managed_sync_queue TO authenticated;
GRANT ALL ON ai_chat_fully_managed_usage TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ai_chat_fully_managed_sync_queue_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ai_chat_fully_managed_usage_id_seq TO authenticated;

-- Function: Update last_active_at on thread access
CREATE OR REPLACE FUNCTION update_thread_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_fully_managed_threads 
  SET last_active_at = NOW() 
  WHERE user_id = NEW.user_id AND tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update last_updated_at on assistant changes
CREATE OR REPLACE FUNCTION update_assistant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_assistant_timestamp_trigger
  BEFORE UPDATE ON ai_chat_fully_managed_assistants
  FOR EACH ROW EXECUTE FUNCTION update_assistant_timestamp();

-- Comments for documentation
COMMENT ON TABLE ai_chat_fully_managed_threads IS 'Maps users to their OpenAI conversation threads for persistent chat history';
COMMENT ON TABLE ai_chat_fully_managed_assistants IS 'Maps tenants to their OpenAI assistants and associated files';
COMMENT ON TABLE ai_chat_fully_managed_sync_queue IS 'Queue for processing file sync operations triggered by data changes';
COMMENT ON TABLE ai_chat_fully_managed_usage IS 'Tracks OpenAI API usage for cost monitoring and optimization';

-- Log successful migration
DO $$ 
BEGIN 
  RAISE LOG 'OpenAI Fully Managed Chat tables created successfully';
END $$;