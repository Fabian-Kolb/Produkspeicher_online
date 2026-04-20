---
name: responsive-layout
description: Rules and patterns for making all views and components responsive across mobile, tablet, and desktop. Use when building or editing any layout, view, grid, or modal in this project.
---

# Responsive Layout

This project uses **Tailwind CSS breakpoints** exclusively to handle responsive design. The target breakpoints are:

| Breakpoint | Min-width | Use case |
|---|---|---|
| *(default)* | 0px | Mobile-first base styles (≤ 639px) |
| `sm` | 640px | Large phones, landscape |
| `md` | 768px | Tablets, iPad portrait |
| `lg` | 1024px | Small laptops, iPad landscape |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop / 4K |

## When to use this skill

- Use when adding or modifying any grid, flex layout, padding, or font size in a view or component.
- Use when creating new modals, cards, or navigation elements.
- Use when a component currently uses fixed widths (`w-64`, `w-1/3`) that would break on mobile.

## How to use it

### 1. Mobile-First Principle

Always write base styles for mobile first, then add larger-screen overrides:

```tsx
// ✅ Correct – mobile first
<div className="text-xl md:text-3xl lg:text-4xl">

// ❌ Wrong – desktop first, breaks on mobile
<div className="text-4xl">
```

### 2. Product Grids

All product card grids (Katalog, Favoriten, Deals) must use **2 columns on mobile**:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
```

- `gap-3` on mobile (tighter), `sm:gap-6` on larger screens.

### 3. Search Inputs in List Views

Search inputs must be full-width on mobile:

```tsx
<div className="relative w-full sm:w-auto">
  <input
    className="w-full sm:w-64 ..."
  />
</div>
```

### 4. Flex Rows That Stack on Mobile

Any horizontal `flex` row with multiple items that could overflow must stack on mobile:

```tsx
// Headers, control bars
<div className="flex flex-col sm:flex-row sm:items-center gap-4">

// Section header with title + button
<div className="flex flex-wrap items-center justify-between gap-3">
```

### 5. Fixed-Width Sidebar Splits

Avoid `w-1/3` / `w-2/3` splits without a breakpoint guard. Always stack on mobile:

```tsx
// ✅ Correct
<div className="flex flex-col md:flex-row flex-1 overflow-hidden">
  <div className="w-full md:w-1/3 ...">
  <div className="w-full md:w-2/3 ...">

// ❌ Wrong
<div className="flex">
  <div className="w-1/3">
  <div className="w-2/3">
```

### 6. Main Content Area Padding

The `<main>` element in `AppContainer.tsx` must account for:
- **TopNav height** on mobile: `pt-16` (smaller nav) vs. `pt-24` on `md+`
- **BottomNav height** on mobile: `pb-24` vs. `pb-8` on `md+`

```tsx
<main className="pt-16 md:pt-24 pb-24 md:pb-8 px-4 md:px-8 w-full min-h-screen">
```

### 7. Modals

All modals must:
- Use `p-4 sm:p-6` padding (not fixed `p-6`)
- Have a **mobile close button** always visible (`md:hidden` + `absolute top-3 right-3`)
- Limit heights on mobile where needed: `max-h-[45vh] md:max-h-none` for image panels

```tsx
{/* Mobile Close */}
<button className="absolute top-3 right-3 md:hidden w-10 h-10 ...">
  <X size={20} />
</button>

{/* Desktop Close */}
<button className="hidden md:flex w-14 h-14 ...">
  <X size={32} />
</button>
```

### 8. Typography Scale

Adjust heading sizes for small screens:

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold">
<h2 className="text-xl md:text-2xl font-playfair font-bold">
<p  className="text-sm md:text-base text-text-secondary">
```

### 9. Price / Form Field Grids

Three-column form grids (e.g., Preis / Rabatt / Endpreis) must collapse to 1-col on mobile:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

### 10. Safe Area Insets (iOS Notch)

Any fixed bottom element must include safe-area padding:

```tsx
style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
```

### Dos and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Write mobile-first base classes | Start with desktop-only values |
| Use `flex-wrap` on multi-item rows | Use un-wrapped `flex` for controls |
| Cap modal heights on mobile | Let modals overflow the viewport |
| Use `gap-3 sm:gap-6` on grids | Use fixed `gap-6` everywhere |
| Use `w-full sm:w-auto` for inputs | Use fixed `w-64` without breakpoint |
