# Supabase Migration

## Objective
Migrate database from SQLite to Supabase PostgreSQL while maintaining existing NextAuth authentication

## About
This document outlines the migration strategy from SQLite to Supabase PostgreSQL for the Speqq platform. This migration will enable better scalability, managed infrastructure, and native vector search capabilities for future AI features. The existing NextAuth authentication system will be maintained to minimize risk and complexity. Since the product is in development, no data migration is required.

## Goals
- Fully migrate database from SQLite to Supabase PostgreSQL
- Maintain existing NextAuth authentication system
- Update application to use PostgreSQL
- Enable future AI/vector capabilities via pgvector
- Simplify database infrastructure management

## Non-Goals
- Data migration (development data can be deleted)
- Authentication migration (deferred to future phase)
- Changing application architecture beyond database layer

## Benefits of Migration
1. **Managed Infrastructure**: No database maintenance required
2. **Native Vector Support**: pgvector for AI features
3. **Better Scalability**: PostgreSQL performance advantages  
4. **Cloud Native**: Automatic backups, scaling, and monitoring
5. **Future-Ready**: Foundation for eventual auth migration and RLS
6. **Incremental Approach**: Lower risk by keeping auth separate

## Migration Strategy (Database Only)

### Phase 1: Supabase Project Setup ✅
1. [x] Create Supabase project
   - Project name: Speqq
   - Project URL: https://cggsslmlqxuwyfwgkjpt.supabase.co
   - API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. [x] Configure environment variables
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_JWT_SECRET

3. [ ] Enable necessary extensions (pgvector)
   - [ ] `uuid-ossp` (for UUID generation)
   - [ ] `pgvector` (for AI chat vector search)
   - [ ] `pg_stat_statements` (for query performance monitoring)

### Phase 2: Database Schema Migration
1. Map SQLite schema to PostgreSQL
2. Create all tables in Supabase
3. Set up foreign key relationships
4. Add necessary indexes
5. Create database views as needed

### Phase 3: Application Code Updates
1. Install Supabase client library (database only)
2. Create Supabase database client configuration
3. Update service layer to use PostgreSQL syntax
4. Replace SQLite queries with PostgreSQL queries
5. Update connection management
6. Remove SQLite dependencies

### Phase 4: Testing & Validation
1. Test all CRUD operations
2. Verify query performance
3. Test multi-tenancy with existing auth
4. Run full application test suite
5. Performance benchmarking

### Phase 5: Deployment
1. Update production environment variables
2. Deploy updated application
3. Monitor for database issues
4. Create backup strategy


## Technical Considerations

### Schema Differences
- SQLite `TEXT` → PostgreSQL `TEXT` or `VARCHAR`
- SQLite `INTEGER` → PostgreSQL `INTEGER` or `BIGINT`
- SQLite `DATETIME` → PostgreSQL `TIMESTAMPTZ`
- SQLite `AUTOINCREMENT` → PostgreSQL `SERIAL` or `IDENTITY`

### Query Adjustments
```sql
-- SQLite
SELECT * FROM features WHERE datetime(created_at) > datetime('now', '-7 days');

-- PostgreSQL
SELECT * FROM features WHERE created_at > NOW() - INTERVAL '7 days';
```

### Connection Management
```typescript
// Current SQLite
import { getDb } from './db.server';
const db = getDb();

// New: Supabase for database only (auth disabled)
import { createClient } from '@supabase/supabase-js';

// Server-side client with auth disabled
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);
```

### Authentication Approach
```typescript
// KEEPING NextAuth - No changes needed
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// In API routes - combine NextAuth + Supabase DB
export async function GET(request: NextRequest) {
  // Use NextAuth for authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use Supabase for database only
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('tenant_id', session.user.currentTenant);

  return NextResponse.json(data);
}
```

### Tenant Isolation (Without RLS)
```typescript
// Manual tenant filtering since we're keeping NextAuth
// Add tenant_id to all queries based on NextAuth session
const features = await supabase
  .from('features')
  .select('*')
  .eq('tenant_id', session.user.currentTenant);
```

## Migration Checklist

### Pre-Migration
- [x] Create Supabase account
- [x] Set up environment variables
- [ ] Audit current SQLite schema
- [ ] Plan schema mapping to PostgreSQL
- [ ] Document all service layer functions using SQLite

### During Migration
- [ ] Enable PostgreSQL extensions
- [ ] Create PostgreSQL schema
- [ ] Install Supabase client (database only)
- [ ] Create database connection wrapper
- [ ] Update all service functions
- [ ] Test with existing NextAuth
- [ ] Run full test suite

### Post-Migration
- [ ] Monitor application performance
- [ ] Check error logs
- [ ] Document new database patterns
- [ ] Create backup procedures
- [ ] Update team documentation



#### Audit current SQLite schema

Based on analysis of `/src/services/db.server.ts` and `/src/services/ai-db.ts`:

**Tables Found (16 total):**

1. **Authentication & Multi-tenancy**
   - `users`: id, email, name, role, passwordHash
   - `tenants`: id, name, slug
   - `user_tenants`: userId, tenantId (junction table)

2. **Product Management Hierarchy**
   - `products`: id, name, description, tenantId
   - `interfaces`: id, name, description, productId, tenantId
   - `features`: id, name, priority, description, interfaceId, tenantId
   - `releases`: id, name, description, releaseDate, priority, featureId, tenantId
   - `requirements`: id, name, owner, description, priority, featureId, releaseId, cuj, acceptanceCriteria, tenantId

3. **Content & Media**
   - `documents`: id, title, content (JSON), featureId, releaseId, requirementId, created_at, updated_at, tenant_id
   - `attachments`: id, title, url, type, thumbnail_url, created_at, updated_at, entity_id, entity_type, metadata, tenant_id

4. **UI State Management**
   - `tabs`: id, title, type, itemId, userId, tenantId
   - `active_tabs`: userId, tabId, tenantId
   - `grid_settings`: userId, gridId, columnState, filterState, sortState, lastUpdated, tenantId

5. **AI/Vector Tables**
   - `ai_documents`: id, content, metadata, tenant_id, created_at
   - `ai_sessions`: id, user_id, tenant_id, last_activity, created_at
   - `ai_vectors`: Virtual table for embeddings (FLOAT[1536])
   - `ai_vectors_metadata`: rowid, document_id, tenant_id

**Key Findings:**
- All primary keys use TEXT (not INTEGER)
- Multi-tenancy via tenantId column in all tables (except users/tenants)
- Timestamps stored as TEXT, not DATETIME
- Inconsistent timestamp naming (created_at vs lastUpdated)
- Foreign key constraints properly defined
- Several indexes for performance
- Runtime migrations for schema evolution
- Demo data with plain text passwords

### Plan schema mapping to PostgreSQL

1. Data Type Mappings

| SQLite Type | PostgreSQL Type | Notes |
|------------|-----------------|-------|
| TEXT (for IDs) | UUID | Use gen_random_uuid() for generation |
| TEXT (general) | TEXT | Keep as-is for most text fields |
| TEXT (timestamps) | TIMESTAMPTZ | Convert all timestamp fields |
| TEXT (JSON) | JSONB | For documents.content and metadata fields |
| INTEGER | INTEGER | Keep as-is |
| FLOAT[1536] | vector(1536) | Requires pgvector extension |

#### 2. Table-by-Table Conversion

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pm', 'user')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**tenants**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**user_tenants**
```sql
CREATE TABLE user_tenants (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tenant_id)
);
```

**products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**interfaces**
```sql
CREATE TABLE interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**features**
```sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  description TEXT,
  interface_id UUID REFERENCES interfaces(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**releases**
```sql
CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  release_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**requirements**
```sql
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner TEXT,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  cuj TEXT,
  acceptance_criteria TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**documents**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
  release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**attachments**
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail_url TEXT,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('feature', 'release', 'requirement', 'document')),
  metadata JSONB,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**tabs**
```sql
CREATE TABLE tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**active_tabs**
```sql
CREATE TABLE active_tabs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tab_id UUID NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

<!-- **grid_settings**
```sql
CREATE TABLE grid_settings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grid_id TEXT NOT NULL,
  column_state JSONB,
  filter_state JSONB,
  sort_state JSONB,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, grid_id, tenant_id)
);
``` -->

<!-- **ai_documents**
```sql
CREATE TABLE ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
``` -->

<!-- **ai_sessions**
```sql
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
``` -->

<!-- **ai_vectors (with pgvector)**
```sql
CREATE TABLE ai_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embedding vector(1536) NOT NULL,
  document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
); -->

#### 3. Indexes

```sql
-- Performance indexes
CREATE INDEX idx_releases_feature_id ON releases(feature_id);
CREATE INDEX idx_requirements_feature_id ON requirements(feature_id);
CREATE INDEX idx_requirements_release_id ON requirements(release_id);
CREATE INDEX idx_documents_feature_id ON documents(feature_id);
CREATE INDEX idx_documents_release_id ON documents(release_id);
CREATE INDEX idx_documents_requirement_id ON documents(requirement_id);
CREATE INDEX idx_attachments_entity ON attachments(entity_id, entity_type);
-- CREATE INDEX idx_ai_vectors_embedding ON ai_vectors USING ivfflat(embedding);

-- Multi-tenancy indexes
-- CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_features_tenant_id ON features(tenant_id);
CREATE INDEX idx_releases_tenant_id ON releases(tenant_id);
CREATE INDEX idx_requirements_tenant_id ON requirements(tenant_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
-- CREATE INDEX idx_attachments_tenant_id ON attachments(tenant_id);
CREATE INDEX idx_tabs_tenant_id ON tabs(tenant_id);
--CREATE INDEX idx_ai_documents_tenant_id ON ai_documents(tenant_id);
--CREATE INDEX idx_ai_sessions_tenant_id ON ai_sessions(tenant_id);
--CREATE INDEX idx_ai_vectors_tenant_id ON ai_vectors(tenant_id);
```

#### 4. Additional PostgreSQL Features

**Updated timestamp triggers**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Repeat for all tables with updated_at column
```

#### 5. Migration Considerations

1. **ID Conversion**: Need to map TEXT IDs to UUIDs during migration
2. **Timestamp Conversion**: Parse TEXT timestamps to TIMESTAMPTZ
3. **JSON Migration**: Convert stringified JSON to JSONB
4. **Vector Migration**: Recreate vectors with pgvector
5. **Demo Data**: Create new UUIDs for demo data
6. **Password Hashing**: Implement proper bcrypt hashing

#### 6. Required Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pgvector";      -- For vector similarity search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- For text similarity
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- For advanced indexing
```

#### Task list to get supdabase and indexes and setup client
Phase 1: Setup Supabase Client

  1. [x]Install Supabase client package
  2. [x]Create client configuration file
  <!-- 3. []Create TypeScript types will do after tables are created -->
  4. [x]Verify environment variables

  Phase 2: Create Tables

  1. [x]Enable PostgreSQL extensions
  2. [x]Create all 13 tables with proper constraints (code is in supabase)
  3. [x] Run unit test to ensure tables exist ()
  4. [x]Create trigger function for updated_at
  5. [x]Apply triggers to relevant tables





  Phase 3: Create Indexes

  1. Performance indexes for foreign keys
  2. Multi-tenancy indexes
  3. Composite index for attachments

  Phase 4: Verification (Before Application Code)

  1. Test database connection
  2. Insert test data
  3. Verify relationships

  Phase 5: Application Code Migration

  Once the above steps are complete, you can start converting:
  1. Service layer files (one at a time)
  2. API route files
  3. Remove SQLite dependencies
  4. Update package.json

Phase 2: Create Tables

## Phase 3: Application code updates

Files That Must Be Updated for SQLite to Supabase Migration:

  1. [x]Core Database Files
```typescript
  - /src/services/db.server.ts - Main SQLite database initialization and schema definition
 
```

  2. Service Layer Files (All database operations)
```ts
  - []/src/services/products-db.ts
  - []/src/services/interfaces-db.ts
  - []/src/services/features-db.ts
  - []/src/services/releases-db.ts
  - []/src/services/requirements-db.ts
  - []/src/services/documents-db.ts
  - /src/services/attachments-db.ts
  - /src/services/tabs-db.ts
  - /src/services/approval-stages-db.ts
  - /src/services/approval-statuses-db.ts
  - /src/services/entity-approvals-db.ts
  - /src/services/roadmaps-db.ts
  - /src/services/grid-settings.ts
  - /src/services/auth.server.ts (for user/tenant operations)
  // - /src/services/db-migration.ts
  // - /src/services/db-migration-roadmap.ts

## 3. API Route Files (All need connection updates)

  **Goal**: Implement best practices for API routes to improve code consistency, reduce boilerplate, and add multi-tenancy support.

  #### Phase 1: Create Utility Files

1. **Create API Response Helper** (`/src/utils/api-response.ts`)
   - [x] Create `apiResponse.success(data)` function for successful responses
   - [x] Create `apiResponse.error(message, status)` function for error responses
   - [x] Create `apiResponse.unauthorized()` function for 401 responses
   - [x] Export all functions as a single object

2. **Create Validation Helper** (`/src/utils/validate.ts`)
   - [x]Create `validateRequired(body, fields[])` function
   - [x] Return error message if any required field is missing
   - [x] Format field names with proper capitalization in error messages
   - [x] Return null if all validations pass

3. **Create Async Handler Wrapper** (`/src/utils/api-async-handler.ts`)
   - Create `asyncHandler(fn)` higher-order function
   - Wrap route handlers to catch all errors automatically
   - Log errors to console with proper context
   - Return standardized error response using apiResponse.error()

4. **Create Request Context Helper** (`/src/utils/api-request-context.ts`)
   - Create `getRequestContext(request)` function
   - Extract searchParams from request URL
   - Parse JSON body for non-GET requests
   - Extract tenantId from session using getServerSession
   - Return object with { searchParams, body, tenantId }

5. **Create Unit Tests** (`/src/utils/__tests__/`)
   - Test api-response.ts functions return correct format
   - Test validate.ts with various input scenarios
   - Test async-handler.ts error catching behavior
   - Test request-context.ts extraction logic

#### Phase 2: Update API Routes

For each route file in `/src/app/api/*/route.ts`:

1. **Import New Utilities**
   - Import apiResponse from '@/utils/api-response'
   - Import validateRequired from '@/utils/validate'
   - Import asyncHandler from '@/utils/async-handler'
   - Import getRequestContext from '@/utils/request-context'

2. **Refactor GET Handlers**
   - Wrap with asyncHandler to remove try-catch
   - Use getRequestContext to extract params and tenantId
   - Check tenantId and return apiResponse.unauthorized() if missing
   - Pass tenantId to all service functions
   - Use apiResponse.success() and apiResponse.error() for responses

3. **Refactor POST Handlers**
   - Wrap with asyncHandler to remove try-catch
   - Use getRequestContext to extract body and tenantId
   - Use validateRequired for input validation
   - Pass tenantId to service create functions
   - Use consistent response patterns

4. **Refactor PATCH/PUT Handlers**
   - Follow same pattern as POST
   - Validate required fields (usually just 'id')
   - Consider adding ownership verification for tenant

5. **Refactor DELETE Handlers**
   - Wrap with asyncHandler
   - Extract id from searchParams
   - Verify tenant ownership before deletion
   - Use standardized responses

#### Phase 3: Add Multi-Tenancy Support

1. **Update Service Layer Functions**
   - Modify all service functions to accept tenantId parameter
   - Add tenant filtering to all database queries
   - Ensure create operations include tenantId
   - Add ownership checks for update/delete operations

2. **Create Integration Tests** (`/src/app/api/__tests__/`)
   - Test each route with valid tenant context
   - Test unauthorized access without tenant
   - Test cross-tenant isolation
   - Test error handling scenarios

#### Phase 4: Documentation and Cleanup

1. **Update API Documentation**
   - Document new utility functions with JSDoc
   - Add examples of refactored route patterns
   - Document tenant context requirements

2. **Remove Old Code**
   - Remove all try-catch blocks from routes
   - Remove redundant error handling code
   - Remove manual response formatting

3. **Code Review Checklist**
   - Verify all routes use asyncHandler
   - Confirm tenant context is properly handled
   - Check that all responses use apiResponse helpers
   - Ensure validation is consistent

#### Routes to Update (Priority Order)

1. Core Entity Routes (Update First):
   - `/src/app/api/products-db/route.ts`
   - `/src/app/api/features-db/route.ts`
   - `/src/app/api/requirements-db/route.ts`
   - `/src/app/api/releases-db/route.ts`

2. Relationship Routes:
   - `/src/app/api/interfaces-db/route.ts`
   - `/src/app/api/attachments-db/route.ts`
   - `/src/app/api/documents-db/route.ts`

3. System Routes:
   - `/src/app/api/tabs-db/route.ts`
   - `/src/app/api/approval-stages-db/route.ts`
   - `/src/app/api/approval-statuses-db/route.ts`
   - `/src/app/api/entity-approvals-db/route.ts`
   - `/src/app/api/roadmaps-db/route.ts`

4. Special Routes:
   - `/src/app/api/attachments-inherited-db/route.ts`
   - `/src/app/api/approval-init/route.ts`
   - `/src/app/api/approval-debug/route.ts`
   - `/src/app/api/store/route.ts`

#### Success Metrics

- 60%+ reduction in route file line count
- Zero try-catch blocks in route files
- 100% consistent response format
- All routes support multi-tenancy
- Improved error messages for debugging
- Faster development of new routes

  These files can be left alone/removed after migration:
  // - /src/services/db-migration.ts
  // - /src/services/db-migration-roadmap.ts
  // - /scripts/* (all SQLite test scripts)
  // - /cleanup-test-stages.js
  // - /fix-approvals.js
  // - /test-sqlite-alias.js
  // - /src/services/grid-settings.ts
   //- /src/services/ai-db.ts - SQLite vector database for AI features (optional for initial migration)


  4. Configuration Files

  - package.json - Remove better-sqlite3, add @supabase/supabase-js
  - .env.local - Add Supabase connection variables

  5. New Files to Create

  - /src/services/supabase.ts - Supabase client configuration
  - /src/types/supabase.ts - TypeScript types for Supabase tables

  6. Testing/Script Files to Update/Remove

  - All files in /scripts/ that reference SQLite
  - /cleanup-test-stages.js
  - /fix-approvals.js
  - /test-sqlite-alias.js

  7. Component Files (Minor updates for ID type changes)

  - /src/app/page.tsx - Has SQLite import reference
  - /src/app/prototype/document-editor/instruction.tsx - Has SQLite import reference
  - Any components that might have hardcoded TEXT ID assumptions

```

## Risk Mitigation
1. **Database Compatibility**: Test all SQL query conversions
2. **Performance**: Optimize queries, add proper indexes
3. **Connection Handling**: Proper error handling for network issues
4. **Tenant Isolation**: Ensure manual filtering works correctly
5. **Rollback Plan**: Keep SQLite code available for quick rollback

## Timeline Estimate
- Phase 1: ✅ Complete (Supabase setup)
- Phase 2: 3 days (Database schema migration)
- Phase 3: 3 days (Application code updates)
- Phase 4: 2 days (Testing & validation)
- Phase 5: 1 day (Deployment)
- **Total: 1.5 weeks**

## Phase 3:

## Success Criteria
- NextAuth continues to work unchanged
- All tables migrated to Supabase PostgreSQL
- Database queries converted to PostgreSQL syntax
- Application connects to Supabase for data
- All features work with new database
- Performance equal or better than SQLite
- Zero authentication changes required

## Next Steps
1. Audit current SQLite database
2. Create detailed schema mapping
3. Enable PostgreSQL extensions
4. Begin database schema migration

## Future Enhancement: Authentication Migration

### Why Defer Auth Migration?
- **Working System**: Current NextAuth multi-tenant system is complex and working
- **Lower Risk**: Database-only migration has less chance of breaking changes  
- **Faster Delivery**: Get benefits of Supabase DB immediately
- **Incremental Approach**: Can migrate auth once database is stable

### Future Auth Migration Benefits
- **Row Level Security (RLS)**: Native tenant isolation at database level
- **Unified Platform**: Single service for auth and data
- **Real-time Subscriptions**: Leverage Supabase real-time with auth
- **Built-in Features**: Magic links, OAuth providers, user management UI
- **Trigger Functions**: Database triggers based on auth events

### When to Consider Auth Migration
- After database migration is stable (3-6 months)
- When adding new auth features (OAuth, magic links)
- When implementing real-time features
- When simplifying infrastructure becomes priority

### Auth Migration Approach (Future)
1. Create Supabase auth schema alongside NextAuth
2. Gradually migrate users with dual-auth period
3. Update middleware and providers
4. Implement RLS policies
5. Remove NextAuth once stable

This phased approach reduces risk while providing immediate benefits from Supabase's managed database infrastructure.