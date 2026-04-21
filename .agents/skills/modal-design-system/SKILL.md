---
name: modal-design-system
description: Rules and guidelines for implementing modal windows with Solid/Glass and Light/Dark support.
---

# Modal Design Standards

All modal windows in Ventory must support four distinct visual modes based on user settings: **Solid Dark**, **Solid White**, **Glass Dark**, and **Glass White**.

## Core Modes

### 1. Solid Modes
Used when `modalStyle === 'solid'`. Prioritizes depth and clarity.
- **Dark**: `bg-bg-card` (usually `#2a2a2a`) or a dark gradient. Border should be a subtle highlight (`border-border-primary/50`).
- **White**: `bg-white` with a clean shadow. High contrast text (`text-[#111827]`).

### 2. Glass Modes
Used when `modalStyle === 'glass'`. Prioritizes luminosity and vibrancy.
- **Dark**: `bg-[#2a2a2a]/80 backdrop-blur-xl`. Border should use a luminous gradient effect (`border-white/10`).
- **White**: `bg-white/70 backdrop-blur-xl`. Border should be soft (`border-white/40`).

## Theme Resolution logic
Modals should resolve their theme based on `settings.modalTheme`:
- `'auto'`: Follows global `settings.theme`.
- `'dark'`: Forces dark appearance regardless of global theme.
- `'light'`: Forces white appearance regardless of global theme.

## Standard Implementation Pattern

### Modal Overlay (Backdrop)
Always use `bg-black/60` and apply `backdrop-blur-sm` if glass is enabled on *any* level.

### Modal Container (The Card)
Use the following class composition (pseudo-logic):
```tsx
const isDark = modalTheme === 'dark' || (modalTheme === 'auto' && globalTheme === 'dark');
const isGlass = modalStyle === 'glass';

const modalClasses = cn(
  "w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
  // Theme & Style
  isDark 
    ? (isGlass ? "bg-[#1a1a1a]/80 backdrop-blur-2xl border-white/10" : "bg-[#2a2a2a] border-border-primary/50")
    : (isGlass ? "bg-white/70 backdrop-blur-2xl border-white/40" : "bg-white border-black/5"),
  // Shadow depth
  isDark ? "shadow-black/40" : "shadow-black/10"
);
```

## Premium Requirements
- **Luminous Borders**: Use `border-white/10` for dark glass and `border-black/5` for white solid to create a high-end "Apple-style" or "Vibe-style" finish.
- **Animations**: Use Framer Motion for entry/exit (`initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`).
- **Spacing**: Generous padding (`p-8`).

> [!IMPORTANT]
> Every modal MUST implement the `useUIStore` hook for visibility and `useAppStore` for theme settings.
