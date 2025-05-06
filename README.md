# Specky Demo Application

This is a Next.js application for feature management and requirements tracking.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

### Storage Implementation Options

This application supports two different implementations for data storage:

1. **Zustand with LocalStorage** (Original Implementation)
   - Client-side state management with Zustand
   - Data persisted to localStorage
   - Used for initial development and prototyping

2. **React Query with SQLite** (New Implementation)
   - Server-side data storage in SQLite database
   - React Query for data fetching and mutations
   - Consistent data across sessions and devices

### Implementation Toggle

The application includes a toggle to switch between these implementations at runtime. This allows for:
- Side-by-side comparison of implementations
- Testing the database-backed version without removing the original
- Graceful migration path from client-side to server-side storage

To use the toggle:
1. Look for the switch in the bottom-right corner of the dashboard
2. Toggle between "Client Storage (Zustand)" and "Database Storage (React Query)"

## Documentation

- [Database Migration Plan](docs/zustand-deprecation.md) - Comprehensive plan for migrating from Zustand to SQLite
- [Testing the Migration](docs/testing-db-migration.md) - Guidelines for testing the database implementation

## Project Structure

- `/src/stores` - Zustand stores for client-side state management
- `/src/hooks` - React Query hooks for data fetching
- `/src/services` - Database services for SQLite
- `/src/app/api` - API routes for database access
- `/src/components` - UI components
  - Original components use Zustand directly
  - Components with `-query-` in their name use React Query

## Authentication

The application uses NextAuth.js for authentication. You'll need to sign in to access protected features and API endpoints.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [SQLite Documentation](https://www.sqlite.org/docs.html)