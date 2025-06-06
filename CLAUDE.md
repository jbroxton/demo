# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Access Code**: "I read md.claude"

## LLM Workflow Protocol

When assigned a task, ALWAYS follow this sequence:
1. **Define Goal**: Clearly state what you're building and why
2. **Read Current State**: Use Read/Glob tools to understand existing code
3. **Research Best Practices**: Reference React/TypeScript/Next.js documentation for optimal patterns
4. **Define Solution**: Plan your implementation approach
5. **Implement with Tests**: Write unit tests (Jest) and E2E tests (Playwright) simultaneously

## App Architecture Overview

**Product Management Platform** - MVP for <100 users, built to scale to production
- **Framework**: Next.js 14 App Router + TypeScript
- **Database**: Supabase (Pages-based architecture, not legacy tables)
- **AI**: OpenAI integration for product management assistance
- **UI**: shadcn/ui components + Tailwind CSS
- **State**: React Query + Context API
- **Testing**: Jest + Playwright + real user testing

## Critical Page-Based Architecture

**Modern Approach** (Use this): All entities are stored as **Pages** with types:
```typescript
type PageType = 'product' | 'project' | 'feature' | 'release' | 'roadmap' | 'feedback'
```

**Legacy Approach** (Avoid): Separate entity tables (Product, Feature, etc.)

### Page Model
```typescript
interface Page {
  id: string
  type: PageType
  title: string
  parent_id?: string | null
  tenant_id: string
  properties: Record<string, AnyPropertyValue>
  blocks: Block[]
  created_at: string
  updated_at: string
}
```

## Essential Service Patterns

### Page Operations (Use This)
```typescript
// Service: /src/services/pages-db.ts
import { getPages, createPage, updatePage, deletePage } from '@/services/pages-db'

// Get all features for a tenant
const result = await getPages({ tenantId, type: 'feature' })

// Create new product (stored as page with type='project') 
const result = await createPage({
  title: 'Product Name',
  type: 'project',
  properties: { description: createTextProperty('desc') },
  tenant_id: tenantId
})
```

### Agent Operations (Current Pattern)
```typescript
// Service: /src/services/agent-operations.ts - Updated for pages
class AgentOperationsService {
  async createProductPage(params: CreateProductParams, tenantId: string): Promise<AgentOperationResult<Page>>
  async createFeaturePage(params: CreateFeatureParams, tenantId: string): Promise<AgentOperationResult<Page>>
  async listFeaturePages(tenantId: string): Promise<AgentOperationResult<Page[]>>
}
```

## Database Access Patterns

### Supabase Configuration
```typescript
// Local Development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-local-key

// Remote/Production  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-remote-key
```

### Multi-Tenant Queries
```typescript
// ALWAYS include tenantId in queries
const { data, error } = await supabase
  .from('pages')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('type', 'feature')
```

## React Query Patterns

### Hook Structure
```typescript
// /src/hooks/use-pages-query.ts
export function usePagesQuery() {
  const { currentTenant } = useAuth()
  
  const pagesQuery = useQuery({
    queryKey: ['pages', currentTenant],
    queryFn: () => fetchPages(currentTenant),
    enabled: !!currentTenant,
    staleTime: 5 * 60 * 1000
  })
  
  const addPage = useMutation({
    mutationFn: addPageMutation,
    onSuccess: () => queryClient.invalidateQueries(['pages'])
  })
  
  return { pages: pagesQuery.data, addPage: addPage.mutateAsync }
}
```

## Component Development Rules

### 1. Use Only shadcn/ui Components
```typescript
// ✅ CORRECT
import { Button, Card, Input } from "@/components/ui/[component]"

// ❌ INCORRECT  
const CustomButton = styled.button`` // Never create custom components
```

### 2. Component Structure
```typescript
export function ComponentName({ prop }: Props) {
  // 1. Hooks (auth, queries, state)
  const { user } = useAuth()
  const { pages } = usePagesQuery()
  const [loading, setLoading] = useState(false)
  
  // 2. Event handlers
  const handleSubmit = useCallback(async () => {}, [])
  
  // 3. Early returns (loading, error states)
  if (!user) return <div>Please sign in</div>
  
  // 4. Main render
  return <div className="flex flex-col gap-4">{/* ... */}</div>
}
```

### 3. Form Handling
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const schema = z.object({
  title: z.string().min(1, "Title required"),
  type: z.enum(['project', 'feature', 'release'])
})

export function PageForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  })
  
  const onSubmit = async (values: z.infer<typeof schema>) => {
    await createPage(values)
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="title" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </form>
    </Form>
  )
}
```

## API Route Patterns

### Standard Structure
```typescript
// /src/app/api/pages-db/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPages, createPage } from '@/services/pages-db'
import { getTenantId } from '@/utils/get-tenant-id'

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as PageType
    
    const result = await getPages({ tenantId, type })
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/pages-db:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const body = await request.json()
    
    const result = await createPage({ ...body, tenant_id: tenantId })
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/pages-db:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Testing Framework

### Jest Unit Testing
```typescript
// /src/__tests__/component.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils/test-providers'
import { TEST_USERS } from '@/test-utils/test-users'

describe('ComponentName', () => {
  it('should render with real user session', async () => {
    const mockSession = {
      user: TEST_USERS.PM1, // Real test user
      expires: new Date().toISOString()
    }
    
    renderWithProviders(<ComponentName />, { session: mockSession })
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('should handle page creation', async () => {
    const { result } = renderHook(() => usePagesQuery(), {
      wrapper: ({ children }) => renderWithProviders(children, { session: mockSession })
    })
    
    await act(async () => {
      await result.current.addPage({ title: 'Test', type: 'feature' })
    })
    
    expect(result.current.pages).toContainEqual(expect.objectContaining({ title: 'Test' }))
  })
})
```

### Playwright E2E Testing
```typescript
// /tests/e2e/page-management.spec.ts
import { test, expect } from '@playwright/test'

// Use real test users - NEVER fake data
const TEST_USER = {
  email: 'pm1@test.com',
  password: 'testpassword123'
}

test.describe('Page Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login with real user
    await page.goto('/signin')
    await page.fill('[data-testid="email-input"]', TEST_USER.email)
    await page.fill('[data-testid="password-input"]', TEST_USER.password)
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should create new feature page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Open create dialog
    await page.click('[data-testid="create-page-button"]')
    await page.selectOption('[data-testid="page-type-select"]', 'feature')
    await page.fill('[data-testid="page-title-input"]', 'E2E Test Feature')
    await page.click('[data-testid="save-page-button"]')
    
    // Verify creation
    await expect(page.locator('[data-testid="page-item"]')).toContainText('E2E Test Feature')
    
    // Verify in database (optional)
    // Use API call to verify data persistence
  })
  
  test('should maintain tenant isolation', async ({ page, context }) => {
    // Current user's data count
    await page.goto('/dashboard')
    const userPages = await page.locator('[data-testid="page-item"]').count()
    
    // Switch to different tenant user in new tab
    const newPage = await context.newPage()
    await newPage.goto('/signin')
    await newPage.fill('[data-testid="email-input"]', 'pm2@demo.com')
    await newPage.fill('[data-testid="password-input"]', 'testpassword123')
    await newPage.click('[data-testid="login-button"]')
    
    await newPage.goto('/dashboard')
    const otherUserPages = await newPage.locator('[data-testid="page-item"]').count()
    
    // Should see different data sets
    expect(userPages).not.toBe(otherUserPages)
  })
})
```

## Test User Configuration

### Real Test Users (Use These)
```typescript
// /src/test-utils/test-users.ts
export const TEST_USERS = {
  PM1: {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'pm1@test.com',
    name: 'Sarah Chen',
    tenantId: '22222222-2222-2222-2222-222222222222'
  },
  PM2: {
    id: '20000000-0000-0000-0000-000000000002', 
    email: 'pm2@demo.com',
    name: 'Mike Johnson',
    tenantId: '33333333-3333-3333-3333-333333333333'
  }
}
```

### Environment Setup
```typescript
// /src/jest-setup-env.ts
// Local Supabase for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-local-service-key'

// Real test user credentials
process.env.TEST_USER_EMAIL = 'pm1@test.com'
process.env.TEST_USER_PASSWORD = 'testpassword123'
process.env.TEST_TENANT_ID = '22222222-2222-2222-2222-222222222222'
```

## AI Integration Patterns

### OpenAI Assistant Integration
```typescript
// /src/services/ai-chat-fully-managed.ts
export async function getOrCreateAssistant(tenantId: string): Promise<string> {
  // 1. Check cache/database for existing assistant
  // 2. Sync tenant data to OpenAI Files
  // 3. Create/update assistant with file_search tool
  // 4. Return assistant ID for chat
}

export async function exportTenantDataForOpenAI(tenantId: string): Promise<string> {
  // Export ALL page data for tenant context
  const [projects, features, releases, roadmaps, feedback] = await Promise.all([
    getPages({ tenantId, type: 'project' }),
    getPages({ tenantId, type: 'feature' }),
    getPages({ tenantId, type: 'release' }),
    getPages({ tenantId, type: 'roadmap' }),
    getPages({ tenantId, type: 'feedback' })
  ])
  
  // Format as comprehensive text for OpenAI
  return formatPagesForAI(projects, features, releases, roadmaps, feedback)
}
```

## Provider Architecture

### Optimized Provider Hierarchy
```typescript
// /src/providers/app-providers.tsx
export function AppProviders({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <ClientOnlyProviders> {/* Dynamic import with ssr: false */}
                {children}
              </ClientOnlyProviders>
            </Suspense>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
```

## Type Safety Requirements

### No Any Types
```typescript
// ❌ INCORRECT
const data: any = await fetchData()

// ✅ CORRECT  
const data: Page[] = await fetchData()

// ✅ CORRECT for unknown API responses
const response: unknown = await fetchData()
const data = response as Page[]
```

### Property Value Handling
```typescript
// Page properties use specific property value types
import { TextPropertyValue, createTextProperty, getTextContent } from '@/types/models/Page'

// Creating properties
const properties = {
  description: createTextProperty('Feature description'),
  priority: createTextProperty('High')
}

// Reading properties  
const description = getTextContent(page.properties?.description)
```

## Commands Reference

```bash
# Development
npm run dev              # Start dev server (port 3001) with .env.local
npm run dev:clear        # Clear Next.js cache and start dev server
npm run build           # Production build with .env.local
npm run lint            # ESLint with auto-fixes
npm run check-env       # Validate authentication environment variables

# Testing
npm test                # Jest unit tests with .env.local
npm run test:watch      # Jest in watch mode
npm run test:coverage   # Jest with coverage report
npm run test:e2e        # Playwright E2E tests
npm run test:e2e:headed # E2E with browser visible
npm run test:e2e:debug  # E2E in debug mode
npm run test:e2e:ui     # Run only UI-specific E2E tests
npm run test:all        # Run both Jest and Playwright tests
npm run playwright:install  # Install Playwright browsers

# Database (Supabase)
npx supabase start      # Start local Supabase (includes PostgreSQL, Auth, Storage)
npx supabase stop       # Stop local Supabase
npx supabase status     # Check local Supabase status and URLs
npx supabase reset      # Reset local database to migrations
```

## Common Debugging

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm install
npm run build
```

### ESLint Issues
```bash
# Clear ESLint cache
rm -rf .eslintcache
npm run lint
```

### Supabase Connection Issues
```bash
# Check local Supabase status
npx supabase status

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

## File Structure Priorities

**High Priority** (Always read these first):
- `/src/types/models/Page.ts` - Core data model
- `/src/services/pages-db.ts` - Database operations  
- `/src/hooks/use-pages-query.ts` - Data fetching
- `/src/providers/auth-provider.tsx` - Authentication
- `/src/services/agent-operations.ts` - AI operations

**Medium Priority**:
- `/src/app/api/` - API routes
- `/src/components/ui/` - UI components
- `/src/utils/` - Utility functions

**Low Priority** (Legacy/deprecated):
- Any files with "entity" in the name
- Separate Product, Feature, Requirement models

## Development Environment Notes

### Port Configuration
- **Development Server**: `localhost:3001` (configured in package.json)
- **Supabase Local**: `http://127.0.0.1:54321` (default)
- **Database Studio**: `http://127.0.0.1:54323` (when Supabase is running)

### Environment Files
- `.env.local` - Primary environment file for all commands
- Environment variables are loaded via `dotenv-cli` for consistency

### TipTap Editor Integration
- Rich text editing with collaborative features via Yjs
- Custom extensions for requirements/roadmap tables
- Markdown support with syntax highlighting

## Success Criteria

When implementing features, ensure:
1. **Type Safety**: No `any` types, proper TypeScript
2. **Page Architecture**: Use Page model, not legacy entities  
3. **Multi-tenancy**: All queries include `tenantId`
4. **Real Testing**: Use actual test users, not mocks
5. **shadcn/ui Only**: No custom components
6. **Error Handling**: Proper error boundaries and messages
7. **Performance**: React Query caching, memo optimization

**Remember**: This is MVP → Production code. Build scalable patterns from day one.