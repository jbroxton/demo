# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run eslint

## Code Style Guidelines
- **Imports**: Group imports by type (React, stores, components, utils)
- **Types**: Use TypeScript interfaces for component props, strict typing enabled
- **Naming**: Use PascalCase for components, camelCase for functions/variables 
- **Components**: React functional components with hook state management
- **Error Handling**: Use try/catch blocks for async operations, log errors with console.error
- **Styling**: Tailwind CSS with shadcn/ui components, following dark theme
- **File Structure**: Group by feature in `/src` directory
- **Component Structure**: Declare all hooks at top, then handlers, then JSX return
- **Components**: Do not build custom components. ONLY use existing pre-built components. If one does not exist and we need to choose a new one then choose the most popular and lightweight option that solves the need. Existing components and libraries:
   - shadcn/ui components (from @/components/ui)
   - Lucide React icons library
   - React built-in components
   - Use React's built-in hooks (useState, useEffect, useContext, etc.)
- **Styling**:
   - Only use Tailwind CSS classes for styling
   - Follow the project's existing design tokens and color scheme
   - Do not use inline CSS or external CSS libraries
   - Do not use any custom classes
**Code Cleanup**
- Delete unused function 

- Use React Hook Form for form state management
- Use Zod for validation schema definition
- Use shadcn/ui form components (<Form>, <FormField>, etc.)
- Follow the existing pattern for form submission and error handling

// GOOD: Following the established form pattern
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
name: z.string().min(2).max(50),
description: z.string().optional(),
});

export function ProductForm({ onSubmit }) {
const form = useForm({
resolver: zodResolver(formSchema),
defaultValues: {
name: "",
description: "",
},
});

```
return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Product name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Additional form fields */}
      <Button type="submit">Submit</Button>
    </form>
  </Form>
);

```

}

State Management Rule

For state management, follow these guidelines:

- Use React Query for server state (data fetching, mutations)
- Use React's useState/useReducer for local component state
- Use Context API for shared state within component trees
- Avoid creating new global state stores unless absolutely necessary

// GOOD: Using React Query for data fetching
function ProductList() {
const { data, isLoading, error } = useProductsQuery();

```
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return (
  <div>
    {data.map(product => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
);

```

}

// GOOD: Using local state for UI state
function FilterPanel() {
const [isExpanded, setIsExpanded] = useState(false);

```
return (
  <div>
    <Button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? "Collapse" : "Expand"} Filters
    </Button>
    {isExpanded && <FilterControls />}
  </div>
);

```

}

Database Access Rule

When accessing the database:

- Always use the service layer functions
- Never access the database directly from components or API routes
- Follow the transaction pattern for operations that need atomicity
- Ensure all database operations are tenant-aware

// GOOD: Using service layer for database access
// src/services/products-db.ts
import { db } from './db.server';
import { getCurrentTenant } from '../utils/tenant-utils';

export async function getProducts(tenantId: string) {
return db.prepare(      `SELECT * FROM products        WHERE tenant_id = ?       ORDER BY created_at DESC`    ).all(tenantId);
}

// Using the service in API routes
// src/app/api/products/route.ts
import { getProducts } from '@/services/products-db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
const user = await getCurrentUser();
if (!user) return new Response('Unauthorized', { status: 401 });

```
const tenantId = user.tenant_id;
const products = await getProducts(tenantId);

return Response.json(products);

```

}

Multi-tenant Rule

For multi-tenancy support:

- All data access must include tenant filtering
- Use the tenant utilities for getting and setting tenant context
- Never expose data across tenant boundaries
- Include tenant_id in all relevant database tables and queries

// GOOD: Enforcing tenant isolation in service layer
export async function createFeature(data: FeatureCreateInput, tenantId: string) {
return db.prepare(      `INSERT INTO features (name, description, tenant_id)       VALUES (?, ?, ?)`    ).run([data.name](http://data.name/), data.description, tenantId);
}

// GOOD: Ensuring tenant context in API routes
export async function POST(request: Request) {
const user = await getCurrentUser();
if (!user) return new Response('Unauthorized', { status: 401 });

```
const tenantId = user.tenant_id;
const data = await request.json();

try {
  const result = await createFeature(data, tenantId);
  return Response.json(result);
} catch (error) {
  console.error('Failed to create feature:', error);
  return new Response('Failed to create feature', { status: 500 });
}

```

}

Response Format Rule

When returning responses from API routes:

- Use consistent response formats across all endpoints
- Include proper HTTP status codes
- Handle errors gracefully with informative messages
- Sanitize sensitive data before returning responses

// GOOD: Consistent response format
export async function GET(request: Request) {
try {
const user = await getCurrentUser();
if (!user) {
return new Response(JSON.stringify({
success: false,
error: 'Unauthorized'
}), {
status: 401,
headers: { 'Content-Type': 'application/json' }
});
}

```
  const data = await getFeatures(user.tenant_id);

  return Response.json({
    success: true,
    data
  });
} catch (error) {
  console.error('Error fetching features:', error);

  return new Response(JSON.stringify({
    success: false,
    error: 'Failed to fetch features'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

```

}

Type Definition Rule

For TypeScript types and interfaces:

- Define entity types in the /types/models directory
- Reuse and extend existing types rather than creating duplicates
- Export all types from the central index.ts file
- Use descriptive naming that matches the database schema

// GOOD: Defining and exporting types properly
// src/types/models/Feature.ts
export interface Feature {
id: string;
name: string;
description: string | null;
tenant_id: string;
created_at: string;
updated_at: string;
}

export interface FeatureCreateInput {
name: string;
description?: string;
}

export interface FeatureUpdateInput {
id: string;
name?: string;
description?: string;
}

// src/types/models/index.ts
export * from './Feature';
export * from './Product';
export * from './Release';
// export other model types

CSS Rule

For styling components:

- Use Tailwind CSS utility classes exclusively
- Follow the established color scheme and design tokens
- Avoid custom CSS classes unless absolutely necessary
- Use the shadcn/ui component variants system for customization

// GOOD: Using Tailwind CSS for styling
function FeatureCard({ feature }) {
return (
<div className="p-4 rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
<h3 className="text-lg font-semibold mb-2">{[feature.name](http://feature.name/)}</h3>
<p className="text-sm text-muted-foreground">{feature.description}</p>
<div className="flex items-center justify-end mt-4 space-x-2">
<Button variant="outline" size="sm">Edit</Button>
<Button variant="default" size="sm">View</Button>
</div>
</div>
);
}

// BAD: Using custom CSS styles
function FeatureCardBad({ feature }) {
return (
<div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#fff' }}>
<h3 style={{ fontSize: '18px', fontWeight: 600 }}>{[feature.name](http://feature.name/)}</h3>
{/* More custom styling */}
</div>
);
}