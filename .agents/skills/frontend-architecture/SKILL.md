---
name: frontend-architecture
description: Guidelines for architecture, state management, and basic styling standards.
---

# Frontend Development

Guidelines for building a consistent, high-quality, and premium React frontend.

## When to use this skill
- Use this when building or modifying React components in the project.
- Use this when applying styling or updating the design system.
- Use this when implementing state management logic.

## How to use it

### Core Technologies
- **Framework:** React (Vite-powered)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React

### Design System & Styling
- **Consistency:** Use Tailwind classes exclusively. Avoid custom CSS files unless absolutely necessary.
- **Premium Aesthetics:**
    - Use **Glassmorphism**: `bg-white/10 backdrop-blur-md` or similar for floating panels.
    - Use **Soft Shadows**: `shadow-lg`, `shadow-xl` for depth.
    - Use **Micro-Transitions**: `transition-all duration-300` for all interactive elements.
- **Dark Mode:** Always ensure dark mode compatibility using `dark:` variants (e.g., `dark:bg-slate-900`, `dark:text-white`).
- **No Inline Styles:** Except for dynamically calculated values (e.g., animation offsets).

### React & Components
- **Atomic Design:** Keep components functional and small. Reusable pieces should go into `src/components/`.
- **Class Utilities:** Use `clsx` and `tailwind-merge` (the `cn` helper) for dynamic class merging.
- **TypeScript:** Use strict typing. **No `any` types allowed.** Use interfaces for Props.

### State Management
- **Local State:** Use `useState` for simple UI toggles (e.g., isModalOpen).
- **Global State:** All domain data (Products, Budgets, User Settings) MUST reside in a Zustand store (e.g., `src/store/useAppStore.ts`).
