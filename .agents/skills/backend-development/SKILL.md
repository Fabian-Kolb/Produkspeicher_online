---
name: backend-development
description: Guidelines for database interactions with Supabase and data flow synchronization with Zustand.
---

# Backend & Data Development

Guidelines for interacting with the backend (Supabase) and managing data flows within the application.

## When to use this skill
- Use this when implementing database queries or mutations.
- Use this when setting up authentication logic.
- Use this when synchronizing backend data with global state (Zustand).

## How to use it

### Database & Authentication
- **Provider:** Use Supabase for both Database and Authentication.
- **Client Instance:** Always use a shared Supabase client (e.g., from `src/lib/supabase.ts`) instead of instantiating new ones.
- **Querying:** Use the Supabase JS Library (`supabase.from(...)`). **Direct SQL queries in the client-side code are prohibited.**

### Data Flow & Safety
- **Validation:** Always strongly type or validate data received from the backend to ensure runtime safety.
- **Error Handling:** Gracefully handle all backend errors. Ensure failures (e.g., save failed, unauthorized) are communicated to the user via UI components like Toasts or Notifications.

### Store Synchronization
- **Zustand as Source of Truth:** Use Zustand stores as the intermediary layer between the database and the UI.
- **Flow:** Data should flow from the Supabase client -> into the Zustand store -> and finally be consumed by React components via hooks.
