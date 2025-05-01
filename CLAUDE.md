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
- **State Management**: Zustand for global state
- **File Structure**: Group by feature in `/src` directory
- **Component Structure**: Declare all hooks at top, then handlers, then JSX return