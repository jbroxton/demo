# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It documents established patterns, recommended practices, and architectural decisions to ensure consistency across the codebase.

## Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run eslint
- `npm test` - Run Jest tests (when implemented)

## Project Structure
- `/src` - Main source code directory
  - `/app` - Next.js App Router components and API routes
  - `/components` - Reusable React components
  - `/hooks` - Custom React hooks
  - `/providers` - Context providers
  - `/services` - Backend service functions
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions
- `/public` - Static assets
- `/docs` - Documentation files

## Code Style Guidelines
- **Imports**: Group imports by type (React, stores, components, utils)
- **Import Order**: Follow consistent import order:
  1. React and Next.js imports
  2. External libraries
  3. Internal components and hooks
  4. Types and interfaces
  5. Utilities and helpers
  6. Styles (if any)
- **Types**: Use TypeScript interfaces for component props, strict typing enabled
- **Naming**: Use PascalCase for components, camelCase for functions/variables
- **File Naming**: Use kebab-case for files (e.g., `feature-card.tsx`)
- **Components**: React functional components with hook state management
- **Error Handling**: Use try/catch blocks for async operations, log errors with console.error
- **Styling**: Tailwind CSS with shadcn/ui components, following dark theme
- **State Management**: React Query for server state, React's useState/useReducer for local state
- **File Structure**: Group by feature in `/src` directory
- **Component Structure**: Declare all hooks at top, then handlers, then JSX return
- **Code Formatting**: Follow project's Prettier and ESLint configuration
- **Line Length**: Keep lines under 100 characters when possible
- **Components**: Do not build custom components. ONLY use existing pre-built components. If one does not exist and we need to choose a new one then choose the most popular and lightweight option that solves the need. Existing components and libraries:
   - shadcn/ui components (from @/components/ui)
   - Lucide React icons library
   - React built-in components
   - Use React's built-in hooks (useState, useEffect, useContext, etc.)
   - Use React Query for remote data management
- **Styling**:
   - Only use Tailwind CSS classes for styling
   - Follow the project's existing design tokens and color scheme
   - Do not use inline CSS or external CSS libraries
   - Group Tailwind classes by category (layout, spacing, colors, etc.)
   - Do not use any custom classes

## State Management & Data Fetching

### Project Configuration
- **Provider Setup**: The application uses React Query through the provider in `/src/providers/query-provider.tsx`
- **Configuration**: Default settings are centralized in the provider; don't create separate instances
- **Import**: Always import React Query hooks from '@tanstack/react-query', not other packages
- **Client Access**: Access QueryClient using `useQueryClient()` hook when needed

### React Query for Server State
- **Purpose**: Use React Query as the primary tool for managing server state
- **Benefits**: Provides caching, background updates, optimistic updates, and request deduplication
- **File Location**: Place all query hooks directly in `/src/hooks/` directory (not in sub-folders)
- **Naming**: Use kebab-case with `use-` prefix and `-query` suffix (e.g., `use-attachments-query.ts`)
- **Query Keys**: Follow consistent pattern for query keys:
  ```typescript
  // Simple query key pattern
  const queryKey = ['entityName', entityId];

  // Query key with filters
  const queryKey = ['entityName', entityId, { filters }];
  ```

### Query Hook Implementation
- **Structure**: Implement query hooks with consistent pattern:
  ```typescript
  export function useEntityQuery(id: string) {
    const queryClient = useQueryClient();
    const queryKey = ['entity', id];

    // Main query
    const entityQuery = useQuery({
      queryKey,
      queryFn: () => fetchEntity(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Mutations in the same file
    const addMutation = useMutation({
      mutationFn: (data) => addEntity(data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey })
    });

    // Return combined result
    return {
      data: entityQuery.data,
      isLoading: entityQuery.isLoading,
      error: entityQuery.error,
      add: addMutation.mutateAsync,
      isAdding: addMutation.isLoading,
      // other operations...
    };
  }
  ```

### Mutation Patterns
- **Co-location**: Include mutations (create, update, delete) in the same hook file as the queries
- **Naming**: Use action verbs for mutation methods (e.g., `add`, `update`, `remove`)
- **Loading States**: Return `isDoingAction` boolean flags for loading states (e.g., `isAddingAttachment`)
- **Cache Updates**: Always invalidate related queries after successful mutations:
  ```typescript
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  ```
- **Optimistic Updates**: Use optimistic updates for better UX when appropriate:
  ```typescript
  const mutation = useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      // Save current data
      const previousData = queryClient.getQueryData(queryKey);
      // Optimistically update
      queryClient.setQueryData(queryKey, oldData => [...oldData, newData]);
      // Return context for rollback
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Roll back on error
      queryClient.setQueryData(queryKey, context.previousData);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });
  ```

### Error Handling in Queries
- **Global Handling**: Use the `query-provider.tsx` for global error handling
- **Component Level**: Implement component-level error handling using React Query's error states
- **Error Boundaries**: Use React Error Boundaries for catching rendering errors:
  ```typescript
  class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    render() {
      if (this.state.hasError) {
        return <div>Something went wrong. Please try again.</div>;
      }
      return this.props.children;
    }
  }
  ```
- **Using React Query Error State**:
  ```typescript
  const { data, error, isLoading } = useEntityQuery(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  ```

### Local State Management
- **Component State**: Use React's built-in hooks for component-level state:
  - `useState` for simple state
  - `useReducer` for complex state logic
- **Context API**: Use React Context for shared state that doesn't need to be persisted:
  - Create dedicated providers in `/src/providers/`
  - Expose state and update functions through custom hooks

## API Design
- **File Location**: Place API routes in `/src/app/api/` using the Next.js App Router pattern
- **Naming**: Use kebab-case with `-db` suffix for database operations (e.g., `attachments-db`)
- **Route Structure**: Group related operations in the same route.ts file (GET, POST, DELETE)
- **Error Handling**:
  - Use consistent response structure with HTTP status codes
  - Return errors in the format `{ error: string }` with appropriate status codes
  - For 400 errors, include details about validation failures
  - For 500 errors, log the error but return a generic message to the client
- **Response Format**: 
  - For GET requests, return data directly as JSON array or object
  - For POST requests, return the created entity with its ID
  - For DELETE requests, return `{ success: true }` or error
- **Input Validation**: Validate all inputs before database operations
- **Database Services**: 
  - Use service functions from the services directory to handle database operations
  - Keep route handlers thin and focused on request/response handling

## Database & Service Layer

### Database Design
- **Schema Definition**: Define all database tables in `src/services/db.server.ts`
- **SQLite Best Practices**: Follow SQLite-specific best practices:
  - Use TEXT for IDs instead of INTEGER for flexibility
  - Use ISO 8601 strings for dates (YYYY-MM-DD HH:MM:SS.SSS)
  - Add appropriate indexes for frequently queried columns
- **Migrations**: When changing schema, provide migration functions
- **Relationships**: Use foreign keys to maintain data integrity
- **Constraints**: Define appropriate NOT NULL and UNIQUE constraints
- **Default Values**: Provide sensible defaults when appropriate

### Query Patterns
- **Parameterized Queries**: Always use parameterized queries to prevent SQL injection:
  ```typescript
  // CORRECT - Parameterized
  db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  // INCORRECT - String interpolation
  db.prepare(`SELECT * FROM users WHERE id = '${userId}'`).get();
  ```
- **Transactions**: Use transactions for operations that modify multiple tables:
  ```typescript
  // Transaction example
  const createFeatureWithRequirements = (feature, requirements) => {
    const db = getDb();
    db.transaction(() => {
      // Create feature
      const featureId = db.prepare(`
        INSERT INTO features (name, description)
        VALUES (?, ?)
      `).run(feature.name, feature.description).lastInsertRowid;

      // Create requirements with feature ID
      const insertRequirement = db.prepare(`
        INSERT INTO requirements (feature_id, title, description)
        VALUES (?, ?, ?)
      `);

      for (const req of requirements) {
        insertRequirement.run(featureId, req.title, req.description);
      }
    })();
  };
  ```
- **Pagination**: Implement consistent pagination for large data sets:
  ```typescript
  const getPagedRequirements = (featureId, page = 1, pageSize = 20) => {
    const offset = (page - 1) * pageSize;
    return db.prepare(`
      SELECT * FROM requirements
      WHERE feature_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(featureId, pageSize, offset);
  };
  ```
- **Performance**: Use appropriate queries for the task:
  - Use COUNT(*) for checking existence instead of fetching all rows
  - Use indexes for frequently filtered columns
  - Use EXPLAIN QUERY PLAN to verify efficient query execution

### Service Layer
- **File Location**: Place all services directly in `/src/services/` directory (not in sub-folders)
- **Naming**: Use kebab-case with `-db` suffix for database services (e.g., `attachments-db.ts`)
- **Function Naming**: Use descriptive, consistent function names following the pattern:
  - `getEntityFromDb` - For retrieving data
  - `createEntityInDb` - For creating data
  - `updateEntityInDb` - For updating data
  - `deleteEntityFromDb` - For deleting data
- **Return Format**: Use consistent return structure for database operations:
  ```typescript
  return {
    success: boolean,
    data?: T, // for successful operations
    error?: string // for failed operations
  }
  ```
- **Error Handling**: Use try/catch blocks and log detailed errors, but return generic messages
- **Type Safety**: Use TypeScript types for parameters and return values
- **Data Mapping**: Map database column names to camelCase property names:
  ```typescript
  // Map snake_case DB fields to camelCase
  const mapFeature = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productId: row.product_id
  });
  ```

## Providers
- **File Location**: Place all providers in `/src/providers/` directory
- **Naming**: Use kebab-case with `-provider` suffix (e.g., `attachment-provider.tsx`)
- **Component Naming**: Use PascalCase for the actual provider component (e.g., `AttachmentProvider`)
- **Context Naming**: Use PascalCase with `Context` suffix (e.g., `AttachmentContext`)
- **Usage**: Export both the provider component and a custom hook to access the context:
  ```typescript
  export const AttachmentProvider = ({ children }) => {
    // provider implementation
  };

  export const useAttachmentContext = () => {
    // context consumer hook
  };
  ```
- **Provider Composition**: Compose multiple providers together in the layout component
- **Context Creation**: Use `createContext` with a meaningful default value and type
- **Provider Values**: Memoize provider values with `useMemo` to prevent unnecessary re-renders

## Component Reuse
- **Component Composition**: Prioritize composing existing components over creating new ones
- **shadcn/ui**: Use shadcn/ui components for all UI elements:
  - Follow shadcn/ui prop patterns (`open/onOpenChange` for dialogs)
  - Use shadcn/ui Form for form handling with zod validation
  - Use shadcn/ui Card, Button, Dialog for consistent UI
- **Avoid Duplication**: Extract common patterns into reusable helper components
- **Form Handling**: Use React Hook Form with zod validation for all forms

## TypeScript Best Practices
- **Type Definitions**: Place shared types in `/src/types/models/` directory
- **Interface Naming**: Use PascalCase without `I` prefix (e.g., `User`, not `IUser`)
- **Prop Types**: Define component prop interfaces adjacent to components, not in a separate file
- **Enums**: Prefer union types over enums (e.g., `type Status = 'pending' | 'complete'`)
- **Type vs Interface**: Use interfaces for objects and props, types for unions and primitives
- **Export Types**: Export all shared types/interfaces for reuse
- **Generic Types**: Use meaningful generic type names (e.g., `T` for generic data, `K` for keys)
- **Inferred Types**: Leverage TypeScript's type inference where appropriate
- **JSDoc Comments**: Add JSDoc comments to explain complex types

## Testing
- **Test Framework**: Use Jest as the testing framework
- **Test Structure**: Co-locate tests with implementation files using `.test.ts` extension
- **Component Testing**: Use React Testing Library for component tests with data-testid attributes
- **Test Scope**: Write tests for business logic, transformations, and critical functionality
- **Mocking**: Use Jest's mocking capabilities for external dependencies
- **Query Testing**: Mock React Query hooks in tests using the QueryClientProvider
  ```typescript
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>
  );
  ```
- **Coverage**: Aim for high coverage of business logic and transformations
- **Test Naming**: Use descriptive test names that explain the expected behavior
- **Test Pattern**: Use the AAA pattern (Arrange, Act, Assert) for all tests

## Performance
- **Memoization**: Use `useMemo` and `useCallback` for expensive calculations or to prevent unnecessary re-renders
- **Bundle Size**: Be aware of the bundle size impact when adding dependencies
- **Virtualization**: Use virtualization for long lists (e.g., react-window)
- **Lazy Loading**: Use dynamic imports for code splitting where appropriate
- **Query Optimizations**: Use React Query's features for performance:
  - Configure appropriate `staleTime` for cached data (default: 0ms)
  - Use `keepPreviousData` for paginated queries to prevent content flashing
  - Set proper `cacheTime` for retaining inactive query data (default: 5 minutes)
  - Apply optimistic updates for immediate UI feedback
  - Use prefetching for anticipated data needs (`queryClient.prefetchQuery`)
- **Debounce & Throttle**: Apply debouncing and throttling for frequent user events
- **Query Deduplication**: Leverage React Query's automatic deduplication of identical requests

## Security
- **Input Validation**: Validate all user inputs both client-side and server-side
- **SQL Injection**: Use parameterized queries for all database operations
- **XSS Prevention**: Escape user-generated content before rendering
- **API Security**: Validate authentication and authorization for all API routes
- **Sensitive Data**: Never expose sensitive data or configuration in client-side code
- **Environment Variables**: Use environment variables for sensitive configuration

## Accessibility
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **ARIA Attributes**: Use appropriate ARIA roles and attributes
- **Color Contrast**: Maintain sufficient color contrast ratios
- **Focus Management**: Properly manage focus, especially in modals
- **Semantic HTML**: Use appropriate semantic HTML elements
- **Error Messages**: Provide clear error messages and instructions

## React Patterns
- **Conditional Rendering**: Use the ternary operator for simple conditions, extract to variables for complex ones
- **Prop Drilling**: Avoid excessive prop drilling; consider context or composition
- **Key Prop**: Always use stable, unique keys for list items (avoid using array index)
- **Handlers Naming**: Use the `handleX` pattern for event handlers
- **Fragments**: Use React fragments to avoid unnecessary DOM elements
- **State Management**: Keep state as close as possible to where it's used
- **Effect Dependencies**: Always include all dependencies in useEffect dependency arrays
- **Custom Hooks**: Extract reusable logic into custom hooks

## JSX Best Practices

### Avoiding Deep Nesting
- **Maximum Nesting**: Limit JSX nesting to 3-4 levels deep
- **Component Extraction**: Extract nested JSX into separate components:
  ```jsx
  // AVOID
  return (
    <div className="card">
      <div className="card-header">
        <div className="title-area">
          <h2>{title}</h2>
          <div className="actions">
            <button>Edit</button>
            <button>Delete</button>
          </div>
        </div>
      </div>
      <div className="card-body">...</div>
    </div>
  );

  // PREFER
  const CardHeader = ({ title }) => (
    <div className="card-header">
      <div className="title-area">
        <h2>{title}</h2>
        <CardActions />
      </div>
    </div>
  );

  const CardActions = () => (
    <div className="actions">
      <button>Edit</button>
      <button>Delete</button>
    </div>
  );

  return (
    <div className="card">
      <CardHeader title={title} />
      <div className="card-body">...</div>
    </div>
  );
  ```

### Layout Structuring
- **Composition**: Use component composition over deep nesting
- **Layout Components**: Create reusable layout components for common patterns:
  ```jsx
  // Create reusable layout components
  const TwoColumnLayout = ({ left, right }) => (
    <div className="grid grid-cols-2 gap-4">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );

  // Use composition in your components
  return (
    <TwoColumnLayout
      left={<FeaturesList features={features} />}
      right={<FeatureDetails feature={selectedFeature} />}
    />
  );
  ```

### Conditional Rendering Patterns
- **Early Return**: Use early returns for conditional rendering of entire components
- **Component Variables**: Assign JSX to variables for complex conditional structures
- **Conditional Chains**: Avoid nested ternary operators; use component variables instead:
  ```jsx
  // AVOID
  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data ? (
        <DataDisplay data={data} />
      ) : (
        <EmptyState />
      )}
    </div>
  );

  // PREFER
  let content;
  if (isLoading) {
    content = <Spinner />;
  } else if (error) {
    content = <ErrorMessage error={error} />;
  } else if (data) {
    content = <DataDisplay data={data} />;
  } else {
    content = <EmptyState />;
  }

  return <div>{content}</div>;
  ```

### Function Extraction
- **Event Handlers**: Extract inline event handlers to named functions
- **Render Methods**: Extract complex rendering logic to separate functions:
  ```jsx
  // Extract rendering logic
  const renderTableHeaders = () => {
    return columns.map(column => (
      <th key={column.id}>{column.label}</th>
    ));
  };

  const renderTableRows = () => {
    return data.map(row => (
      <tr key={row.id}>
        {columns.map(column => (
          <td key={`${row.id}-${column.id}`}>{row[column.id]}</td>
        ))}
      </tr>
    ));
  };

  return (
    <table>
      <thead><tr>{renderTableHeaders()}</tr></thead>
      <tbody>{renderTableRows()}</tbody>
    </table>
  );
  ```

### Props Organization
- **Prop Spreading**: Avoid prop spreading for better code readability and type safety
- **Prop Grouping**: Group related props using objects
- **Destructuring**: Use destructuring for cleaner prop access

## Multi-Tenancy
- **Tenant Identification**: Use the tenantId attribute consistently across all entities
- **Tenant Context**: Access the current tenant through the unified tenant context provider
- **Data Isolation**: Always include tenant filtering in database queries:
  ```typescript
  // Example of a tenant-aware database query
  const results = db.prepare(`
    SELECT * FROM entities
    WHERE tenant_id = ? AND other_conditions
  `).all(tenantId, otherParams);
  ```
- **Tenant Middleware**: Apply tenant-specific middleware for all API routes
- **Route Handlers**: Always extract and validate tenantId in API route handlers
- **Default Tenant**: Use the default tenant ID for system-wide entities when appropriate
- **Tenant Headers**: Include tenant information in API requests via headers
- **Tenant Switching**: Support tenant switching through the tenant context
- **Multi-Tenant UI**: Use tenant-specific theming and branding when required
- **Tenant Utilities**: Use the tenant utility functions from `/src/utils/tenant-utils.ts`
- **Permission Checks**: Combine tenant validation with permission checks for secure operations

## Form Handling

- **Form Library**: Use React Hook Form for all form implementations
- **Validation**: Use zod for form validation schema
- **Integration**: Use shadcn/ui Form components which integrate with React Hook Form:
  ```typescript
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useForm } from "react-hook-form";
  import * as z from "zod";
  import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";

  // Define schema
  const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email" }),
  });

  // Form component
  function EntityForm() {
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: "",
        email: "",
      },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
      // Handle form submission
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    );
  }
  ```
- **Error Handling**: Display form errors inline using FormMessage
- **Form State**: Use form.formState for submission and error state
- **Form Reset**: Call form.reset() after successful submission

## Next.js Best Practices
- **App Router**: Use the App Router directory structure (/src/app)
- **Route Handlers**: Place API routes in the appropriate route.ts files
- **Server Components**: Use server components by default for data fetching
- **Client Components**: Only use client components when needed for interactivity
- **Metadata**: Use Next.js metadata API for SEO optimization
- **Error Handling**: Implement error.tsx files for graceful error handling
- **Loading States**: Use loading.tsx files for loading states
- **Image Optimization**: Always use Next.js Image component for images
- **Font Optimization**: Use Next.js Font component for custom fonts

## Deployment & CI/CD
- **Environment Variables**: Use .env files for environment-specific configuration
- **Vercel Deployment**: Deploy to Vercel with appropriate settings
- **Build Process**: Ensure all commands pass before deployment
- **Environment Configuration**: Configure separate environments (development, staging, production)
- **Branch Strategy**: Follow the GitFlow branching strategy

## Code Cleanup
- **Unused Code**: Delete unused functions, imports, and variables
- **Commented Code**: Remove commented-out code
- **Duplication**: Refactor duplicate code into shared functions
- **TypeScript**: Fix TypeScript `any` types when possible
- **Simplification**: Optimize overly complex conditionals
- **Dead Code**: Remove unreachable code and unused dependencies

## Lessons Learned

### TypeScript Function Signatures and Adapter Patterns

- **Problem**: React Query mutations and UI components often have incompatible function signatures that cause type errors
- **Solution**: Create adapter functions to bridge different function signatures

```typescript
// INCORRECT: Direct assignment of incompatible signatures
const addAttachment = addAttachmentMutation; // Type error

// CORRECT: Adapter function that transforms parameters and preserves return type
const addAttachment = async (url: string, title?: string): Promise<Attachment> => {
  return await addAttachmentMutation({ url, title });
};
```

### Missing UI Components

- **Problem**: Using components that haven't been installed (e.g., shadcn/ui components)
- **Solution**: Install the component before using it via the CLI

```bash
# Always install shadcn components before use
npx shadcn@latest add badge
```

### Auth Context Imports

- **Problem**: Importing auth context from the wrong location (e.g., from API routes that don't export it)
- **Solution**: Always import from the definitive source

```typescript
// INCORRECT: Importing from an API route that doesn't export the object
import { authOptions } from '../auth/[...nextauth]/route';

// CORRECT: Import from the source where it's defined
import { authOptions } from '@/lib/auth';
```

### Type Safety Best Practices

- **Avoid `Promise<void>` when functions return meaningful values**
- **Avoid `any` types in favor of specific types (e.g., `Promise<Attachment>` instead of `Promise<any>`)**
- **Use proper TypeScript type annotations for function parameters and return values**
- **Ensure consistent type usage across related components**

### Null vs Undefined in TypeScript

- **Problem**: TypeScript treats `null` and `undefined` as distinct types, causing errors with optional properties
- **Solution**: Use `undefined` for optional properties unless `null` is explicitly included in the type

```typescript
// TypeScript type definition
type Requirement = {
  id: string;
  owner?: string; // Can be string or undefined, but NOT null
};

// INCORRECT: Using null with optional properties
const requirement = {
  id: '123',
  owner: someValue || null // Type error
};

// CORRECT: Using undefined with optional properties
const requirement = {
  id: '123',
  owner: someValue || undefined // Works correctly
};
```

### Type Imports

- **Problem**: Using types without importing them causes "Cannot find name" errors
- **Solution**: Always explicitly import all used types, even from barrel files

```typescript
// INCORRECT: Missing type import
const addAttachment = async (url: string): Promise<Attachment> => {}; // Error: Cannot find name 'Attachment'

// CORRECT: Properly import the type before using it
import { Attachment } from '@/types/models';
const addAttachment = async (url: string): Promise<Attachment> => {};
```

### Type Assertions vs. Type Guards

- **Problem**: Type assertions (`as Type`) bypass TypeScript's type checking and can lead to runtime errors
- **Solution**: Use type guards to safely narrow types with runtime checks

```typescript
// AVOID: Unsafe type assertion
const features: Feature[] = data as Feature[]; // Could fail at runtime

// BETTER: Type guard with runtime check
const isFeatureArray = (data: unknown): data is Feature[] =>
  Array.isArray(data) && (data.length === 0 || 'id' in data[0]);

const features = isFeatureArray(data) ? data : [];
```

### React Query Typing

- **Problem**: React Query's type inference can be confusing with destructuring assignments
- **Solution**: Use explicit generic type parameters and avoid complex destructuring with defaults

```typescript
// AVOID: Complex destructuring with defaults can cause type errors
const { data: features = [] } = useQuery(...);

// BETTER: Separate destructuring from type handling
const { data } = useQuery<Feature[]>(...);
const features = data || [];

// BEST: Explicitly type the query and use proper type narrowing
const { data } = useQuery<Feature[], Error>({...});
const features = Array.isArray(data) ? data : [];
```

### Database and Type Alignment

- **Problem**: Mismatches between database schema and TypeScript types cause runtime errors
- **Solution**: Keep database operations aligned with TypeScript models

```typescript
// CORRECT: Update database operations when type definitions change
export async function createInDb(item: Omit<Item, 'id'>): Promise<Item> {
  // Ensure the fields match the TypeScript type structure
  db.prepare(`
    INSERT INTO items (name, description, optional_field)
    VALUES (?, ?, ?)
  `).run(
    item.name,
    item.description,
    item.optionalField || undefined // Use undefined, not null for optional fields
  );
}
```

### State Updates in React Components

- **Problem**: Updating state during component rendering causes infinite re-render loops
- **Solution**: Move state updates to event handlers, effects, or callbacks

```typescript
// INCORRECT: State updates during render phase
function Component() {
  const [isLoading, setIsLoading] = useState(true);

  // This will cause an infinite loop!
  const renderContent = () => {
    setIsLoading(true); // ❌ State update during rendering
    // ...render logic
  };

  return <div>{renderContent()}</div>;
}

// CORRECT: State updates in useEffect
function Component() {
  const [isLoading, setIsLoading] = useState(true);

  // Use effect for state updates based on props/state changes
  useEffect(() => {
    setIsLoading(contentType === 'image'); // ✅ State update in effect
  }, [contentType]);

  // Pure render function without state updates
  const renderContent = () => {
    // ...render logic without state updates
  };

  return <div>{renderContent()}</div>;
}
```
```