 # Introduction
 - Speqq AI Auto Embeddings

# Purpose
- The purpose of this document is to change the embedding process from manual to automatic for Speqq

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
- Currently Speqq's AI chat does not support up-to-date AI data. This reason is because the embedding made in Supabase are done manually
- The current embedding process uses Supbases pg-vector and OpenAI's embedding API with custon software made in Speqq to connect Supabase and OpenAI
- This document outlines the requirements to move from a manual to automated process to keep-embedding up to data

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
- When a user quries their data, their data must be up to data and reflect the current state of all saved data in Supabase

-----------------------------
# Goal
- Add auto embedding support in Supabase (https://supabase.com/docs/guides/ai/automatic-embeddings)

# Task to complete
- Read reference files and link in "# References"
- Create a list of task needed to implement the solution with the current Speqq achitecture
- Add list to "# Implementation Tasks"
- Group tasks into testible units
- Create unit test for each testible unit: Have: Test name given x input we should have y output
- Add unit test under the task

Unit tests example
- After a change in the data, vector embedding as autimatically updated
- AI chat is able to prduct accurate answers to sample questions
    - What are the names of my featurs
    - How many features do I have
    -  Then make a change and see if the test is successful after the data update (eg, rename a feature and see if the embeddings are updated and the chat picks up the change)


# Implementation Tasks

## Task 1: Setup Supabase Native Auto-Embeddings Infrastructure
**Description**: Implement Supabase's built-in automatic embeddings system using PostgreSQL extensions and Edge Functions.

**Implementation Steps**:
1. Enable required PostgreSQL extensions: `pgvector`, `pgmq`, `pg_net`, `pg_cron`
2. Create utility SQL functions for auto-embedding system
3. Set up message queue table for embedding jobs
4. Create Supabase Edge Function for OpenAI embedding generation
5. Configure cron job to process embedding queue

**Unit Tests** (`src/unit-tests/ai-supabase-infrastructure.test.ts`):
- **Test Name**: `test_postgres_extensions_enabled`
  - **Given**: Auto-embedding setup is run
  - **Expected**: All required extensions (pgvector, pgmq, pg_net, pg_cron) are enabled
- **Test Name**: `test_message_queue_created`
  - **Given**: Auto-embedding infrastructure is set up
  - **Expected**: Message queue table exists and can store embedding jobs
- **Test Name**: `test_edge_function_deployment`
  - **Given**: Edge Function is deployed to Supabase
  - **Expected**: Function can be invoked and generates embeddings successfully

## Task 2: Implement Database Triggers for Content Change Detection
**Description**: Create PostgreSQL triggers that automatically detect changes in Features/Releases and enqueue embedding jobs.

**Implementation Steps**:
1. Create trigger functions that detect content changes
2. Set up triggers on `features` and `releases` tables for INSERT/UPDATE
3. Implement content change detection logic (only re-embed if content changed)
4. Add tenant-aware job enqueuing with proper metadata

**Unit Tests** (`src/unit-tests/ai-database-triggers.test.ts`):
- **Test Name**: `test_feature_insert_enqueues_job`
  - **Given**: A new feature is created via API
  - **Expected**: Embedding job is automatically enqueued in message queue
- **Test Name**: `test_feature_update_conditional_enqueue`
  - **Given**: Feature is updated but only `updated_at` changes
  - **Expected**: No embedding job is enqueued (content unchanged)
- **Test Name**: `test_content_change_enqueues_job`
  - **Given**: Feature description is updated from "Auth system" to "Authentication module"
  - **Expected**: Embedding job is enqueued with new content

## Task 3: Create Supabase Edge Function for Embedding Generation
**Description**: Develop a Supabase Edge Function that processes embedding jobs from the queue and generates vectors using OpenAI.

**Implementation Steps**:
1. Create Edge Function with TypeScript/Deno runtime
2. Implement job processing logic with queue polling
3. Add OpenAI API integration for embedding generation
4. Store generated embeddings back in `ai_embeddings` table
5. Implement retry logic for failed embedding generations

**Unit Tests** (`src/unit-tests/ai-edge-function-processing.test.ts`):
- **Test Name**: `test_edge_function_processes_queue`
  - **Given**: Embedding job is in the message queue
  - **Expected**: Edge Function picks up job and processes it successfully
- **Test Name**: `test_embedding_generation_success`
  - **Given**: Valid feature content is in embedding job
  - **Expected**: OpenAI embedding is generated and stored in database
- **Test Name**: `test_failed_job_retry_logic`
  - **Given**: OpenAI API returns error for embedding generation
  - **Expected**: Job is retried up to 3 times before marking as failed

## Task 4: Configure Cron Job for Queue Processing
**Description**: Set up pg_cron scheduled task to regularly process the embedding queue.

**Implementation Steps**:
1. Create cron job that runs every 30 seconds
2. Configure job to invoke the Edge Function for queue processing
3. Add monitoring to track queue processing performance
4. Implement graceful handling of processing failures

**Unit Tests** (`src/unit-tests/ai-cron-queue-processing.test.ts`):
- **Test Name**: `test_cron_job_scheduled`
  - **Given**: Auto-embedding system is configured
  - **Expected**: Cron job is scheduled and runs every 30 seconds
- **Test Name**: `test_queue_processing_performance`
  - **Given**: 10 embedding jobs are in queue
  - **Expected**: All jobs are processed within 60 seconds
- **Test Name**: `test_cron_failure_handling`
  - **Given**: Edge Function is temporarily unavailable
  - **Expected**: Cron job logs error and continues on next cycle

## Task 5: Adapt Existing AI Service for Auto-Embedding Compatibility
**Description**: Modify the current AI service to work seamlessly with the new automatic embedding system.

**Implementation Steps**:
1. Update `ai-service.ts` to detect if auto-embeddings are enabled
2. Modify manual indexing functions to work with new queue system
3. Add monitoring capabilities for queue status and processing
4. Maintain backward compatibility with manual sync button

**Unit Tests** (`src/unit-tests/ai-service-compatibility.test.ts`):
- **Test Name**: `test_ai_service_auto_detection`
  - **Given**: Auto-embedding system is enabled
  - **Expected**: AI service detects automatic mode and adjusts behavior
- **Test Name**: `test_manual_sync_compatibility`
  - **Given**: User clicks manual sync button
  - **Expected**: System can still manually trigger embeddings when needed
- **Test Name**: `test_queue_status_monitoring`
  - **Given**: Embedding jobs are in queue
  - **Expected**: AI service can report current queue status and processing state

## Task 6: Update Frontend UI for Auto-Embedding Status
**Description**: Modify AI chat component to show automatic embedding status and remove manual intervention needs.

**Implementation Steps**:
1. Update sync button to show auto-embedding status
2. Add real-time indicators for embedding queue processing
3. Implement notifications for embedding completion
4. Add settings to configure auto-embedding behavior

**Unit Tests** (`src/unit-tests/ai-frontend-auto-status.test.tsx`):
- **Test Name**: `test_auto_sync_indicator`
  - **Given**: Auto-embedding is active
  - **Expected**: UI shows "Auto-sync enabled" instead of manual sync button
- **Test Name**: `test_queue_progress_display`
  - **Given**: 5 embedding jobs are processing
  - **Expected**: UI shows progress indicator "Processing 5 items..."
- **Test Name**: `test_embedding_completion_notification`
  - **Given**: Feature embedding is completed
  - **Expected**: User sees subtle notification "Data synchronized"

## Task 7: End-to-End Supabase Auto-Embedding Integration Testing
**Description**: Create comprehensive tests that verify the entire Supabase native auto-embedding pipeline works correctly.

**Implementation Steps**:
1. Set up test environment with Supabase auto-embedding infrastructure
2. Create test scenarios that exercise the full trigger → queue → processing pipeline
3. Implement automated testing for PostgreSQL trigger behavior
4. Add performance testing for cron-based queue processing

**Unit Tests** (`src/unit-tests/ai-end-to-end-integration.test.ts`):
- **Test Name**: `test_full_pipeline_feature_creation`
  - **Given**: Feature "Mobile Login" is created via API
  - **Expected**: Database trigger → message queue → cron job → Edge Function → embedding stored in under 60 seconds
- **Test Name**: `test_content_change_detection_accuracy`
  - **Given**: Feature description updated from "Basic auth" to "OAuth authentication"
  - **Expected**: Only content change triggers re-embedding, not metadata-only updates
- **Test Name**: `test_bulk_import_queue_handling`
  - **Given**: 50 features imported simultaneously
  - **Expected**: All items queued properly and processed by cron without duplicates or failures
- **Test Name**: `test_chat_reflects_auto_updated_data`
  - **Given**: Feature renamed and auto-embedding completes
  - **Expected**: AI chat immediately uses new data without manual sync

## Task 8: Mark and Comment Out Manual Embedding Code
**Description**: Safely identify and comment out manual embedding code that will no longer be needed with the auto-embedding system.

**Implementation Steps**:
1. Audit existing codebase for manual embedding functionality
2. Add "// TODO: DELETE - Manual embedding no longer needed with auto-embedding" comments
3. Comment out manual embedding functions while preserving auto-embedding compatibility
4. Keep manual sync UI temporarily for fallback during transition
5. Document all commented code locations for final deletion after testing

**Code Areas to Mark for Deletion**:
- Manual `indexFeature()` and `indexRelease()` calls in API routes
- Manual embedding generation in `handleIndexing()` function
- Batch embedding processing logic in `ai-service.ts`
- Manual sync button click handlers (keep UI element for status display)

**Unit Tests** (`src/unit-tests/ai-manual-code-cleanup.test.ts`):
- **Test Name**: `test_manual_code_safely_commented`
  - **Given**: Manual embedding code is commented out
  - **Expected**: Auto-embedding system continues to work without manual code
- **Test Name**: `test_no_manual_embedding_calls`
  - **Given**: Feature or Release is created/updated
  - **Expected**: No manual embedding functions are called, only auto-embedding triggers
- **Test Name**: `test_commented_code_documented`
  - **Given**: Manual code is commented out
  - **Expected**: All commented blocks have clear "TODO: DELETE" markers for cleanup
- **Test Name**: `test_fallback_compatibility_maintained`
  - **Given**: Auto-embedding system fails temporarily
  - **Expected**: System gracefully handles failure without calling non-existent manual functions

## Task 9: Production Deployment and Monitoring Setup
**Description**: Deploy Supabase auto-embedding system to production with comprehensive monitoring.

**Implementation Steps**:
1. Create SQL migration scripts for production deployment
2. Deploy Edge Function to Supabase production environment
3. Set up monitoring for queue processing and embedding generation
4. Create alerts for system failures and performance issues

**Unit Tests** (`src/unit-tests/ai-production-deployment.test.ts`):
- **Test Name**: `test_production_migration_success`
  - **Given**: Migration scripts are run on production database
  - **Expected**: All triggers, functions, and cron jobs are properly configured
- **Test Name**: `test_edge_function_production_deployment`
  - **Given**: Edge Function is deployed to production
  - **Expected**: Function processes test embedding job successfully
- **Test Name**: `test_monitoring_alerts_functionality`
  - **Given**: Queue processing fails for 5 minutes
  - **Expected**: Alert is triggered and team is notified
- **Test Name**: `test_zero_downtime_deployment`
  - **Given**: Auto-embedding system is enabled in production
  - **Expected**: Existing manual AI chat continues working during transition

## Task 10: Final Cleanup - Delete Manual Embedding Code
**Description**: After all tests pass and auto-embedding is proven stable, permanently remove commented manual embedding code.

**Implementation Steps**:
1. Verify all auto-embedding tests are passing consistently
2. Confirm production stability for at least 48 hours
3. Remove all commented manual embedding code blocks
4. Clean up unused imports and dependencies
5. Update documentation to reflect auto-embedding only

**Unit Tests** (`src/unit-tests/ai-final-cleanup-validation.test.ts`):
- **Test Name**: `test_no_manual_embedding_remnants`
  - **Given**: Manual embedding code cleanup is complete
  - **Expected**: No commented manual embedding code exists in codebase
- **Test Name**: `test_clean_imports_after_deletion`
  - **Given**: Manual embedding functions are deleted
  - **Expected**: No unused imports or dead code references remain
- **Test Name**: `test_auto_embedding_stability_post_cleanup`
  - **Given**: Manual code is fully removed
  - **Expected**: Auto-embedding system continues working perfectly for 7 days
