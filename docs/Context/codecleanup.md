#Code Cleanup 

#Overview
The purpose of this project is to clean up the codecase and ensure all code is simpified. By following this methodical approach, we can systematically improve code quality while ensuring the application continues to function correctly throughout the process.

# V1: Code Cleanup 
## Goal
- Clean up the codebase to simplify code and improve maintainability

## Acceptance Criteria
- Remove all custom components and switch them to a well-supported component library that is easy to implement
- Ensure all UI components use the selected component library
- When replacing custom styles, if only one existing style system is present, prefer that over custom. If two or more custom or theme styles exist, choose the simplest, most modern, fastest, and easiest-to-implement style system
- If no standard style/system exists, choose a popular and well-supported UI component library
- No app breaking bugs exists
- Implementation are created notes are created for the next code cleanup with best practices notes are updated
- Sections for the next Version (eg V+1 are updated)
- Code is checked to git and github with with with the message at the very end: "implemented code cleanup: <Describe what you did>"

## Code Cleanup and Standardization Instruction Set
Analyze and improve the codebase by standardizing component usage and implementing best practices. Below is a structured approach to follow:

S1: Scan codebase to identify:
- Custom components that could be replaced with library equivalents
- Inconsistent UI implementations
- Code duplication and redundancies
- Deprecated methods or approaches
- Performance bottlenecks related to component implementation
- Review the SQL.md file for any outdated or custom SQL implementations

S2: Create a "Code Cleanup Tasks" list prioritized by:

- Critical impact: Components causing bugs or performance issues
- High usage: Components used across multiple features
- Maintenance burden: Components requiring frequent updates
- Technical debt severity: How much the custom implementation diverges from standard practices
- Implementation complexity: Effort required to replace with standard components

## Draft Code Cleanup Tasks
1. Refactor `src/components/app-sidebar.tsx` – High usage, complex layout, critical impact.
2. Refactor `src/components/tenant/*` feature components – Direct Tailwind usage, maintenance burden.
3. Refactor `src/components/auth/*` feature components – Direct Tailwind usage, high usage.
4. Standardize UI in `src/app` pages – Replace inline Tailwind classes with UI primitives.
5. Audit and update SQL patterns in `Context/SQL.md` – Outdated/custom SQL implementations.

S3: Planning and Implementation

For the highest priority task, develop a detailed implementation plan:
- Document current component behavior and expected outcomes
- Identify equivalent library components with matching functionality
- Create a migration strategy that minimizes breaking changes
- Establish test cases to verify behavior is preserved
- Define rollback procedures in case of unexpected issues


S4: Review the implementation plan by:
- Verifying the selected library component fully supports required functionality
- Confirming the approach aligns with the project's architecture
- The solution is following simple best practices

S5: Implement the highest priority cleanup task:
- Replace custom implementation with the library equivalent
- Update all instances where the component is used
- Maintain prop naming and behavior where possible to minimize changes
- Add any necessary adapter code for seamless transition


S6: Verification and Documentation

Verify against acceptance criteria:
- Confirm the component uses the supported library
- Test all UI interactions to ensure behavior matches expectations
- Run existing test suites to catch any regressions
- Verify performance is still good


S7: Create implementation notes and instrctions for the next cleanup (V+1...egm if on V1 cleanup then the next is V2, etc ):

- Create V+1 Implementation plan section... at the bottom of the page. Add:
    - Goal of the project
    - Code Cleanup and Standardization Instruction Set
    - Acceptance criteria 
- Create Implementation Notes
   -  Document patterns discovered during implementation
- Highlight unexpected challenges and their solutions
- Record any components that require special handling
- List any technical debt that was identified but not addressed


Commit changes with message: "implemented code cleanup: [add what you did in a short sentense]"

#Best Practices to Maintain Throughout:

- Keep commits focused on one component replacement at a time
- Preserve existing functionality exactly - this is refactoring, not feature development
- Document any behavior differences between custom and library components
- Test thoroughly after each replacement
- Confirm changes with stakeholders before moving to the next component


