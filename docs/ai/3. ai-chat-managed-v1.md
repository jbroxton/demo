# Introduction
 - Speqq AI Auto Embeddings

# Purpose
- The purpose of this document propose a fully managed implementation of AI Chat with open AI vs the current custom RAG solution. 

# Scope
- The scope of this document is supporting AI functionality within Speqq

# References
- Supabase existing schema
- **Existing ai code files**
    - AI Chat component: `src/components/ai-chat`
    - AI API: `src/app/api/ai-chat/route.ts`
    - AI Hooks: `src/hooks/use-ai-chat.ts`
    - AI Service: `src/services/ai-service.ts`
    - Query supabase and look for tables with `ai_` prefix

# Overview
- Currently Speqq's AI chat is very static and offers simple query responses with the using Open AI for response completion. To move faster, I want to test a fully managed solution with OpenAI to offer a more imrpoved UX

# Overall description
This section describes the general factors that affect the product and its requirements. This
section does not state specific requirements. Instead, it provides a background for those requirements,

# Product perspective
- Speqq: Product Managmer Platform for Product Managers to maanger their Feature Requirements, Goal, and Launches
- Speqq AI: A set of Query and Agent features to allow a user to query their data with natual language and make changes to their data or files
- Speqq Chat: A user interface for interacting with Speqq AI
- Supabase: DB storing all data 
- Supabase pgvector: part of Supabase for storing embeddings
- Versel AI SDK: Uses for AI Support in chat and some RAG
- Open AI API: LLM Support for natual laungage responses 
- Open AI Embeddings API: Creates embedding to be stored in Supbase pgvector 

# Product functions
- Query their user data (eg, what is the Priority of foo feature) via a Chat UI
- As of now user data queries offer support for only Feature entity queries

# User characteristics
- Users are Product Managers who want to know about their features or other features that may impact their features

# Constraints
- None as of now

# Specific requirements

## Functional Requirements

### FR-1: Chat Mode Toggle **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: Users must be able to toggle between Custom RAG and OpenAI Fully Managed chat modes
- **Acceptance Criteria**: 
  - Toggle switch visible in chat header
  - Clear visual indicator of current mode
  - Separate conversation threads per mode
  - No data loss when switching modes
- **Implementation Notes**: Essential for A/B testing and fallback capability

### FR-2: Basic Query Support **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: AI must answer basic questions about user's product data
- **Acceptance Criteria**:
  - "What is [feature name] about?" - Returns feature description and details
  - "How can I improve [feature name]?" - Provides actionable suggestions
  - "What features are high priority?" - Lists and explains priority features
  - "Show me features in [product/interface]" - Filters and displays relevant features
  - Support for Features, Products, Requirements entities in queries
- **Implementation Notes**: Core value proposition - users must be able to query their data effectively

### FR-3: Context Awareness **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: AI must understand user's product context and provide relevant responses
- **Acceptance Criteria**:
  - AI knows about user's specific products, features, and requirements
  - Responses reference actual data from user's workspace
  - AI understands relationships between entities (features → products → requirements)
  - Context maintained within single conversation session
- **Implementation Notes**: This differentiates from generic AI - must understand user's specific product context

### FR-4: Conversation Memory
- **Priority**: Should Have (Enhanced UX)
- **Requirement**: OpenAI Fully Managed mode must maintain conversation context across sessions
- **Acceptance Criteria**:
  - User can reference previous conversations
  - Context persists when user closes/reopens browser
  - Conversation history accessible per user/tenant
  - Thread management handles multiple concurrent conversations
- **Implementation Notes**: Key differentiator vs Custom RAG, but not MVP-critical

### FR-5: Data Synchronization
- **Priority**: Should Have (Operational)
- **Requirement**: User's product data must be synchronized to OpenAI Files for context
- **Acceptance Criteria**:
  - Initial data export and upload on first use
  - Incremental updates when data changes
  - Support for Features, Products, Requirements, Releases
  - Tenant data isolation maintained
- **Implementation Notes**: Required for context awareness, but can start with manual sync

### FR-6: Agent Capabilities
- **Priority**: Could Have (Future Enhancement)
- **Requirement**: AI must be able to take actions on user's data
- **Acceptance Criteria**:
  - Create new features via natural language
  - Update feature priorities and statuses
  - Generate reports and analysis
  - Schedule tasks and set reminders
- **Implementation Notes**: Advanced capability for future iterations

### FR-7: Real-time Updates
- **Priority**: Could Have (Polish)
- **Requirement**: Changes made via AI agent must reflect in the application immediately
- **Acceptance Criteria**:
  - Database updates trigger UI refreshes
  - Changes visible in product management interface
  - Data consistency between AI actions and manual actions
- **Implementation Notes**: Nice-to-have for seamless UX, implement after core features work

## Non-Functional Requirements

### NFR-1: Performance **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: Chat responses must be delivered within reasonable time for user testing
- **Acceptance Criteria**:
  - Average response time < 10 seconds (MVP acceptable)
  - No timeout errors during normal usage
  - Basic load handling for <10 concurrent users
- **Implementation Notes**: Focus on working functionality over optimization for MVP

### NFR-2: Data Security **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: All tenant data must remain isolated and secure
- **Acceptance Criteria**:
  - No cross-tenant data leakage
  - Secure transmission to OpenAI
  - Basic tenant isolation in database queries
  - No sensitive data exposed in logs
- **Implementation Notes**: Critical for multi-tenant SaaS - cannot compromise on this

### NFR-3: Reliability **Must**
- **Priority**: Must Have (MVP Core)
- **Requirement**: System must handle basic OpenAI API failures gracefully
- **Acceptance Criteria**:
  - Fallback to Custom RAG if OpenAI unavailable
  - Clear error messages to users (not technical errors)
  - No system crashes from API failures
- **Implementation Notes**: MVP users need reliable experience, even if degraded

### NFR-4: Cost Management
- **Priority**: Should Have (Operational)
- **Requirement**: System should not incur excessive OpenAI API costs during testing
- **Acceptance Criteria**:
  - Basic file cleanup (prevent file accumulation)
  - Simple usage monitoring
  - Cost alerts for unexpected spikes
- **Implementation Notes**: Important for MVP budget control

### NFR-5: Scalability
- **Priority**: Could Have (Future)
- **Requirement**: System architecture should support future scaling
- **Acceptance Criteria**:
  - Clean separation of concerns
  - Modular design for easy enhancement
  - Database schema supports growth
- **Implementation Notes**: Design thoughtfully but don't over-engineer for MVP

-----------------------------
# Goal
- Add a fully managed solution for the AI Chat using OpenAI Assistants API to provide superior user experience with conversation memory, agent capabilities, and automatic context management

# Solution

## Architecture Overview

The solution implements a hybrid chat system where users can toggle between Custom RAG and OpenAI Fully Managed modes. The fully managed solution leverages OpenAI Assistants API with Files for context and automatic conversation memory.

## Data Flow Architecture

### 1. Initial Setup Flow
```
User First Access → Create OpenAI Thread → Export Tenant Data → Upload to OpenAI Files → Create Assistant → Link Files to Assistant
```

**Detailed Steps:**
1. **User Authentication**: Validate user session and extract tenant ID
2. **Thread Creation**: Create OpenAI thread with metadata (userId, tenantId)
3. **Data Export**: Query Supabase for all tenant data (features, products, requirements)
4. **File Upload**: Format data as text and upload to OpenAI Files API
5. **Assistant Creation**: Create tenant-specific assistant with file references
6. **Database Storage**: Store thread ID, assistant ID, and file ID in local database

### 2. Chat Interaction Flow
```
User Message → Add to Thread → Run Assistant → Handle Function Calls → Update Database → Sync Files → Return Response
```

**Detailed Steps:**
1. **Message Reception**: Receive user message via chat interface
2. **Thread Addition**: Add user message to existing OpenAI thread
3. **Assistant Execution**: Create run with assistant ID and handle streaming
4. **Function Call Processing**: If assistant calls functions (create_feature, etc.), execute against local database
5. **Database Updates**: Update Supabase with any changes made by agent
6. **File Synchronization**: Trigger background sync to update OpenAI files with latest data
7. **Response Delivery**: Stream assistant response back to user interface

### 3. Data Synchronization Flow

#### Option A: Webhook-Based Sync (Recommended)
```
Database Change → Webhook Trigger → Queue Sync Job → Export Updated Data → Upload New File → Update Assistant → Cleanup Old File
```

**Implementation:**
```sql
-- Database trigger function
CREATE OR REPLACE FUNCTION notify_ai_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_chat_fully_managed_sync_queue (tenant_id, change_type, entity_type, entity_id)
  VALUES (NEW.tenant_id, TG_OP, TG_TABLE_NAME, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER features_ai_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON features
  FOR EACH ROW EXECUTE FUNCTION notify_ai_sync();
```

**Processing Function:**
```typescript
// Process sync queue every 2 minutes
async function processSyncQueue() {
  const pendingJobs = await getPendingSyncJobs();
  
  for (const job of pendingJobs) {
    // 1. Export fresh data for tenant
    const updatedData = await exportTenantData(job.tenant_id);
    
    // 2. Upload new file to OpenAI
    const newFile = await openai.files.create({
      file: new Blob([updatedData]),
      purpose: 'assistants'
    });
    
    // 3. Update assistant with new file
    const assistantId = await getAssistantId(job.tenant_id);
    await openai.beta.assistants.update(assistantId, {
      file_ids: [newFile.id]
    });
    
    // 4. Cleanup old file
    const oldFileId = await getOldFileId(job.tenant_id);
    if (oldFileId) await openai.files.del(oldFileId);
    
    // 5. Mark job as processed
    await markSyncJobComplete(job.id);
  }
}
```


### 4. Function Calling Flow
```
Assistant Decides Action → Function Call → Validate Parameters → Execute Database Operation → Return Result → Continue Conversation
```

**Detailed Steps:**
1. **Function Detection**: OpenAI assistant determines action needed (e.g., "create_feature")
2. **Parameter Extraction**: Assistant extracts structured parameters from user intent
3. **Validation**: Validate parameters against business rules and permissions
4. **Database Execution**: Execute operation using existing service layer functions
5. **Response Formatting**: Format success/error response for assistant
6. **Conversation Continuation**: Assistant uses result to provide natural language response

**Function Implementation Example:**
```typescript
const functionHandlers = {
  create_feature: async (args: any, tenantId: string) => {
    // Validate input
    if (!args.name || args.name.length < 2) {
      throw new Error("Feature name must be at least 2 characters");
    }
    
    // Use existing service
    const result = await createFeatureInDb({
      ...args,
      tenantId
    });
    
    // Trigger sync
    await queueSyncJob(tenantId, 'feature_created', result.id);
    
    return { success: true, featureId: result.id, name: result.name };
  }
};
```

### 5. Error Handling Flow
```
API Failure → Detect Error Type → Log Error → Fallback to Custom RAG → Notify User → Retry Queue
```

**Implementation:**
```typescript
async function handleOpenAIFailure(error: Error, fallbackData: any) {
  // Log error for monitoring
  console.error('OpenAI API failure:', error);
  
  // Determine fallback strategy
  if (error.message.includes('rate_limit')) {
    // Wait and retry
    await delay(5000);
    return retryWithBackoff();
  } else if (error.message.includes('service_unavailable')) {
    // Fall back to custom RAG
    return await customRAGFallback(fallbackData);
  } else {
    // Unknown error - use custom RAG
    return await customRAGFallback(fallbackData);
  }
}
```

## Current Migration Status

**Existing Infrastructure:**
- ✅ Auto-embeddings system already implemented (`/migrations/setup-auto-embeddings.sql`)
- ✅ pg_cron, pg_net, pgmq extensions enabled
- ✅ Database triggers for features and releases tables
- ✅ Queue-based embedding processing (30-second cron job)
- ✅ Vector search infrastructure with ai_embeddings table

**Available Extensions in Local Supabase:**
```sql
-- Already enabled in setup-auto-embeddings.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Updated Implementation Plan - 100% OpenAI Fully Managed

**Core Principle**: NO custom vector search, NO custom embeddings, NO hybrid approaches. Pure OpenAI Assistants + Files.

### Phase 1 (Days 1-2): Basic OpenAI Fully Managed - **Must** Requirements
- **FR-1**: Create `/api/ai-chat-fully-managed` route with toggle UI
- **FR-2**: Pure OpenAI query support (zero custom vector search)
- **FR-3**: Export tenant data to OpenAI Files for context
- **NFR-2**: Ensure tenant isolation in file uploads

**Core Architecture**:
```
User Query → OpenAI Thread → OpenAI Assistant → OpenAI File Search → Response
(Zero custom vector search involved)
```

**Files to Create**:
1. `/src/app/api/ai-chat-fully-managed/route.ts` - Pure OpenAI assistant API
2. `/src/services/ai-chat-fully-managed.ts` - File export and assistant management
3. `/src/hooks/use-ai-chat-fully-managed.ts` - Frontend hook
4. Database tables for thread/assistant tracking

**Deliverable**: Users can toggle to OpenAI mode, ask questions, get responses from uploaded files

### Phase 2 (Days 3-4): Automatic File Sync - **Must** Requirements
- **FR-5**: Database webhooks trigger file re-uploads to OpenAI
- **NFR-1**: Optimize file sync performance
- **NFR-3**: Basic error handling for OpenAI API failures

**New Migration**: `/migrations/ai-chat-fully-managed-webhooks.sql`
```sql
-- Pure OpenAI file sync (no vector search involvement)
CREATE OR REPLACE FUNCTION trigger_openai_file_sync()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'http://host.docker.internal:3000/api/ai-chat-fully-managed/sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'tenantId', COALESCE(NEW.tenant_id, OLD.tenant_id),
      'changeType', TG_OP,
      'table', TG_TABLE_NAME
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER openai_sync_features AFTER INSERT OR UPDATE OR DELETE ON features 
  FOR EACH ROW EXECUTE FUNCTION trigger_openai_file_sync();
CREATE TRIGGER openai_sync_products AFTER INSERT OR UPDATE OR DELETE ON products 
  FOR EACH ROW EXECUTE FUNCTION trigger_openai_file_sync();
CREATE TRIGGER openai_sync_requirements AFTER INSERT OR UPDATE OR DELETE ON requirements 
  FOR EACH ROW EXECUTE FUNCTION trigger_openai_file_sync();
```

**Deliverable**: Real-time file sync to OpenAI when data changes

### Phase 3 (Days 5-6): **Should** Requirements
- **FR-4**: OpenAI conversation memory via persistent threads
- **NFR-4**: File cleanup and cost monitoring
- Polish and bug fixes

**Enhanced Features**:
- Thread persistence across browser sessions
- Old file cleanup to manage storage costs
- Basic usage monitoring

**Deliverable**: Full conversation continuity with automatic file updates

### Phase 4 (Days 7+): **Could** Requirements
- **FR-6**: Agent capabilities via OpenAI function calling
- **FR-7**: Real-time UI updates for agent actions
- User acceptance testing

**Deliverable**: AI can take actions on data, not just query it

## Pure OpenAI Infrastructure

**What We Use from Existing Setup**:
- ✅ **pg_net extension** - for webhook triggers to sync files
- ✅ **Database tables** - source data for file export
- ✅ **Tenant isolation** - already implemented in data model

**What We DON'T Use (Pure OpenAI)**:
- ❌ **ai_embeddings table** - OpenAI handles embeddings
- ❌ **vector search functions** - OpenAI handles search
- ❌ **embedding queue/cron** - OpenAI handles processing
- ❌ **Custom RAG logic** - OpenAI handles retrieval

**Data Flow**:
```
Supabase Data → Export to Text → OpenAI Files → OpenAI Assistant → User
```

## Risk Mitigation

### Technical Risks
- **OpenAI API Limits**: Implement rate limiting and backoff strategies
- **File Sync Delays**: Use webhook triggers for immediate updates
- **Data Consistency**: Atomic operations and transaction management
- **Cost Overruns**: Smart sync triggers and file cleanup automation

### Business Risks
- **User Experience**: Maintain fallback to proven Custom RAG system
- **Data Security**: Implement comprehensive audit logging
- **Performance**: Load testing and optimization before full rollout
