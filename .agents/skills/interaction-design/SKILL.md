---
name: interaction-design
description: Guidelines for premium dual-theme interaction design, supporting both high-vibrancy Blue and neutral Glass profiles.
---

# Dual-Theme Interaction System

This project implements a dual-theme interaction system that respects the user's `isGlassEnabled` setting. Interactive elements MUST handle both states to maintain visual consistency.

## Interaction Profiles

### 1. Standard Profile (Glass OFF)
Uses a vibrant **Blue Interaction** theme for clear visual feedback and a modern aesthetic.

- **Primary Color**: `blue-600` (Light) / `blue-500` (Dark)
- **Hover Transitions**: Higher contrast blue variants.
- **Shadows**: Blue-tinted glow (`shadow-blue-500/20`).

### 2. Glass Profile (Glass ON)
Restores the original **Neutral/Emerald** aesthetic for a cleaner, high-fidelity glassmorphic look.

- **Primary Color**: `text-primary` / `bg-primary` (Neutral pills)
- **Highlights**: Subtle emerald accents for status and specific KPI feedback.
- **Shadows**: Neutral glass reflections and standard shadows.

## Implementation Pattern

Always use the `isGlassEnabled` setting from `useAppStore` to toggle classes.

```tsx
const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);

const activeClass = isGlassEnabled
  ? "bg-text-primary text-bg-primary shadow-lg"
  : "bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/20";
```

## Element Guidelines

### Buttons
Primary buttons should use the dynamic `activeClass` logic above.

### Navigation Pills
Top and sub-navigation active states must switch between the blue-pill and neutral-glass styles.

### Charts & Progress
- **Standard**: Blue gradients and blue progress bars.
- **Glass**: Custom linear gradients (neutral) and neutral/emerald progress bars.

### Transaction Hovers
Hovers on lists should use blue text highlights in Standard mode and neutral text/background highlights in Glass mode.

