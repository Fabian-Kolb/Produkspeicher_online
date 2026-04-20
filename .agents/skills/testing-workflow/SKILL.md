---
name: testing-workflow
description: Procedures for running and writing tests using Vitest and React Testing Library in this project.
---

# Testing Workflow

Guidelines for maintaining and executing tests to ensure code quality and reliability.

## When to use this skill
- Use this when running tests locally to verify changes.
- Use this when creating new components or utilities that require unit/integration tests.
- Use this when debugging failing tests.

## How to use it

### Execution Commands
- **Watch Mode (Primary):** Run `npm run test`. This monitors code changes and re-runs relevant tests automatically.
- **UI Mode:** Run `npm run test:ui` for a visual testing interface in the browser.

### File Structure (Colocation)
- **Rule:** Test files MUST be placed directly next to the source file they test.
- **Example:** `src/components/Button.tsx` -> `src/components/Button.test.tsx`.
- The `tests/` root directory is reserved for global configuration (e.g., `setup.ts`).

### Testing Philosophy
- **Behavior-Driven:** Focus on what the user experiences. Use `getByRole` or `findByText` instead of checking internal state.
- **Mandatory Mocking:** Always mock external API calls (e.g., Supabase) using `vi.mock('@supabase/supabase-js')`. Local unit tests should never hit the real database.
- **Prioritized Coverage:**
    - **Zustand Stores:** Must have high test coverage as they hold the application logic.
    - **Utilities:** Any logic in `/utils` or `/helpers` must be thoroughly tested.

### Current Project Status
- **Framework:** Vitest + React Testing Library + JSDOM.
- **Stable State:** Ensure all tests pass before committing new code.
