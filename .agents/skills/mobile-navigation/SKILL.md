---
name: mobile-navigation
description: Patterns for the mobile navigation system in this project. Use when editing TopNav, BottomNav, or adding new routes. Defines how navigation is split between desktop (TopNav pills) and mobile (BottomNav).
---

# Mobile Navigation

This project uses a **split navigation architecture**: desktop navigation lives in the `TopNav`, and mobile navigation is handled exclusively by the `BottomNav` component (visible only on `< md`).

## When to use this skill

- Use when adding a new route that needs to appear in navigation.
- Use when modifying `TopNav.tsx` or `BottomNav.tsx`.
- Use when routing breaks on mobile.
- Use when a user reports navigation items are missing on mobile.

## How to use it

### Architecture Overview

```
< md (mobile):    TopNav (logo + compact controls only)
                  BottomNav (6 tabs, fixed bottom)

≥ md (tablet+):   TopNav (logo + nav pills + controls)
                  BottomNav hidden (md:hidden)
```

### TopNav Responsibilities (TopNav.tsx)

`TopNav` is `fixed top-0 w-full z-50`. On mobile it renders:
- Logo (left)
- Theme toggle + Logout + Hamburger (right)

On desktop (`md+`) it also renders:
- Center nav pills via `<NavLink>` (always `hidden md:flex`)

**Never show nav pills without the `hidden md:flex` guard.**

```tsx
{/* Desktop Nav Pills only */}
<nav className="hidden md:flex items-center gap-1 bg-black/5 p-1 rounded-full">
  {navItems.map(item => (
    <NavLink key={item.to} to={item.to} end={item.to === '/'} ...>
      {item.label}
    </NavLink>
  ))}
</nav>
```

### BottomNav (BottomNav.tsx)

The `BottomNav` is `fixed bottom-0 left-0 right-0 z-40 md:hidden`. It renders 6 tabs.

**Current tabs (must stay in sync with router in App.tsx):**

| Tab | Route | Icon |
|---|---|---|
| Start | `/` | `LayoutDashboard` |
| Katalog | `/katalog` | `BookOpen` |
| Favoriten | `/favoriten` | `Heart` |
| Bundles | `/bundles` | `Layers` |
| Budget | `/budget` | `Wallet` |
| Deals | `/deals` | `Tag` |

**Adding a new route:**
1. Add the route to `App.tsx` inside `<AppContainer>`
2. Add the tab to `navItems` array in **both** `TopNav.tsx` and `BottomNav.tsx`
3. Import the matching Lucide icon in `BottomNav.tsx`

**Active state pattern:**

```tsx
<NavLink
  to={to}
  end={to === '/'}  // IMPORTANT: always use `end` for the root route
  className={({ isActive }) =>
    cn(
      'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-semibold transition-all',
      isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
    )
  }
>
  {({ isActive }) => (
    <>
      <span className={cn('w-8 h-6 rounded-full flex items-center justify-center transition-all', isActive && 'bg-text-primary/10 scale-110')}>
        <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 1.8} />
      </span>
      <span className="truncate w-full text-center leading-none">{label}</span>
    </>
  )}
</NavLink>
```

### Safe Area (iOS Notch)

The `BottomNav` must always include iOS safe area inset via inline style (Tailwind cannot cover this):

```tsx
<nav style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
```

### AppContainer Main Padding

The `<main>` content area must always reserve space for both navbars:

```tsx
<main className="pt-16 md:pt-24 pb-24 md:pb-8 px-4 md:px-8 w-full min-h-screen">
```

- `pt-16`: Mobile TopNav height
- `pt-24`: Desktop TopNav height
- `pb-24`: BottomNav height on mobile
- `pb-8`: Desktop fallback spacing

### Glassmorphism Styling (Both Bars)

Both `TopNav` and `BottomNav` use the same glass tokens for visual consistency:

```tsx
className="bg-[var(--theme-glass-bg)] backdrop-blur-xl border-[var(--theme-glass-border)]"
```

- `TopNav` has `border-b`
- `BottomNav` has `border-t`

### Dos and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Keep `navItems` arrays in sync across TopNav + BottomNav | Add a route to only one of the two |
| Always use `end={to === '/'}` on the root NavLink | Forget `end` prop → root route always shows as active |
| Use `md:hidden` on BottomNav container | Render BottomNav without breakpoint guard |
| Include `env(safe-area-inset-bottom)` via inline style | Ignore iOS notch / home bar overlap |
| Use `text-[10px]` tab labels (they must fit 6 tabs) | Use longer label text that doesn't truncate |
