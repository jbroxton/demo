-- Agent Action Logging Schema
-- This migration adds tables to track agent operations and user confirmations

-- Agent Actions Table
-- Tracks all operations attempted by the AI agent
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    session_id VARCHAR(255), -- Links to AI chat session
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'read'
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'feature', 'requirement', etc.
    entity_id UUID, -- ID of affected entity (null for create operations before success)
    
    -- Function call details
    function_name VARCHAR(100) NOT NULL,
    function_parameters JSONB NOT NULL,
    openai_function_call_id VARCHAR(255), -- OpenAI's function call ID
    
    -- Status and confirmation
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected', 'completed', 'failed'
    requires_confirmation BOOLEAN NOT NULL DEFAULT true,
    confirmation_requested_at TIMESTAMP WITH TIME ZONE,
    confirmation_received_at TIMESTAMP WITH TIME ZONE,
    confirmed_by_user_id UUID,
    
    -- Results
    result_data JSONB, -- Successful operation result
    error_data JSONB, -- Error details if operation failed
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT fk_agent_actions_tenant FOREIGN KEY (tenant_id) REFERENCES auth.users(id),
    CONSTRAINT fk_agent_actions_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_agent_actions_confirmed_by FOREIGN KEY (confirmed_by_user_id) REFERENCES auth.users(id)
);

-- Agent Confirmation Dialogs Table
-- Tracks confirmation dialog interactions
CREATE TABLE IF NOT EXISTS agent_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_action_id UUID NOT NULL,
    
    -- Dialog details
    dialog_type VARCHAR(50) NOT NULL, -- 'simple', 'detailed', 'bulk'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB, -- Additional dialog data (warnings, affected items, etc.)
    
    -- User response
    user_response VARCHAR(20), -- 'confirmed', 'rejected', 'cancelled'
    response_timestamp TIMESTAMP WITH TIME ZONE,
    response_details JSONB, -- Any additional response data
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-expire confirmations
    
    CONSTRAINT fk_confirmations_action FOREIGN KEY (agent_action_id) REFERENCES agent_actions(id) ON DELETE CASCADE
);

-- Agent Sessions Table
-- Links agent actions to AI chat sessions
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Session metadata
    mode VARCHAR(20) NOT NULL DEFAULT 'agent', -- 'agent' or 'ask'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Session stats
    total_actions INTEGER DEFAULT 0,
    successful_actions INTEGER DEFAULT 0,
    failed_actions INTEGER DEFAULT 0,
    pending_actions INTEGER DEFAULT 0,
    
    CONSTRAINT fk_agent_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES auth.users(id),
    CONSTRAINT fk_agent_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_actions_tenant_user ON agent_actions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_entity ON agent_actions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_session ON agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_confirmations_action ON agent_confirmations(agent_action_id);
CREATE INDEX IF NOT EXISTS idx_agent_confirmations_expires ON agent_confirmations(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_activity ON agent_sessions(last_activity_at);

-- Row Level Security (RLS)
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_actions
CREATE POLICY "Users can view own agent actions" ON agent_actions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = tenant_id
    );

CREATE POLICY "Users can insert own agent actions" ON agent_actions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        auth.uid() = tenant_id
    );

CREATE POLICY "Users can update own agent actions" ON agent_actions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = tenant_id
    );

-- RLS Policies for agent_confirmations
CREATE POLICY "Users can view confirmations for own actions" ON agent_confirmations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agent_actions 
            WHERE agent_actions.id = agent_confirmations.agent_action_id 
            AND (agent_actions.user_id = auth.uid() OR agent_actions.tenant_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert confirmations for own actions" ON agent_confirmations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agent_actions 
            WHERE agent_actions.id = agent_confirmations.agent_action_id 
            AND (agent_actions.user_id = auth.uid() OR agent_actions.tenant_id = auth.uid())
        )
    );

CREATE POLICY "Users can update confirmations for own actions" ON agent_confirmations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM agent_actions 
            WHERE agent_actions.id = agent_confirmations.agent_action_id 
            AND (agent_actions.user_id = auth.uid() OR agent_actions.tenant_id = auth.uid())
        )
    );

-- RLS Policies for agent_sessions
CREATE POLICY "Users can view own agent sessions" ON agent_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = tenant_id
    );

CREATE POLICY "Users can insert own agent sessions" ON agent_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        auth.uid() = tenant_id
    );

CREATE POLICY "Users can update own agent sessions" ON agent_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = tenant_id
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_agent_action_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_agent_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_agent_actions_updated_at
    BEFORE UPDATE ON agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_action_updated_at();

CREATE TRIGGER update_agent_sessions_activity
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_session_activity();

-- Function to clean up expired confirmations
CREATE OR REPLACE FUNCTION cleanup_expired_confirmations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM agent_confirmations 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update session stats
CREATE OR REPLACE FUNCTION update_session_stats(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE agent_sessions SET
        total_actions = (
            SELECT COUNT(*) FROM agent_actions 
            WHERE session_id = session_uuid::text
        ),
        successful_actions = (
            SELECT COUNT(*) FROM agent_actions 
            WHERE session_id = session_uuid::text AND status = 'completed'
        ),
        failed_actions = (
            SELECT COUNT(*) FROM agent_actions 
            WHERE session_id = session_uuid::text AND status = 'failed'
        ),
        pending_actions = (
            SELECT COUNT(*) FROM agent_actions 
            WHERE session_id = session_uuid::text AND status IN ('pending', 'confirmed')
        )
    WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;