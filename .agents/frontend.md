# Frontend Guidelines

## Core Technologies
- React (Vite-based)
- Tailwind CSS für Styling
- Zustand für State Management
- Lucide React für Icons

## Design System & Styling
- Nutze konsistent Tailwind Classes.
- Achte auf ein "Premium"-Gefühl: Verwende Glassmorphismus (z.B. `bg-white/10 backdrop-blur-md`), weiche Schatten (`shadow-lg`, `shadow-xl`) und subtile Transaktionen (`transition-all duration-300`).
- Dark-Mode Kompatibilität ist Pflicht (`dark:bg-slate-900`, `dark:text-white`).
- Keine Inline-Styles, es sei denn sie werden dynamisch in JS berechnet.

## React & Components
- Komponenten sollten funktional und klein gehalten werden (Atomic Design Pattern anstreben).
- Verwende `clsx` und `tailwind-merge` (`cn` Utility) für dynamische Klassen.
- Prop-Types: Immer striktes TypeScript verwenden. Keine `any` Typisierungen!

## State Management
- Lokaler UI-State (z.B. Modal offen/zu) kann in React `useState` bleiben.
- Globaler State (Produkte, Budgets) liegt zwingend im Zustand-Store (`useAppStore.ts` usw.).
