# Project: Ventory UI Optimization & Consolidation (Produkspeicher_online)

## Architecture
Ventory is a React + Vite + Tailwind CSS frontend app with Zustand for state management and Supabase for backend synchronization.
The UI supports dual styling modes (Glass mode vs Solid mode) and dual theme modes (Light mode vs Dark mode), custom dynamic themes via `ThemeCreatorModal`, haptic feedback on mobile, custom SVG data visualizations in `BudgetView`, and responsive mobile/desktop layouts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Designkonsistenz & Modus-Vereinheitlichung | Standardizing FilterChips, Buttons, Modals, Sidebars, Product Cards across Glass vs Solid and Dark vs Light modes | none | DONE |
| M2 | Überarbeitung des Ausgabenverlaufs (BudgetView) | Responsive SVG curve, Bar/Cumulative toggle, smooth gesture/zoom, interactive receipt (Mobile Bottom-Drawer / Desktop Bon-Panel) | M1 | DONE |
| M3 | Theme-Ersteller Live-Vorschau (ThemeCreatorModal) | Replace abstract preview color boxes with real live miniature interactive app components | M1 | PLANNED |
| M4 | Menüführung, Modale & Einstellungen | Custom Red-Glass confirmation modal for Reset/Delete, Settings options (Haptic, Compact grid, Currency, Glass intensity), App Info & Changelog update | M1 | PLANNED |

## Interface Contracts
### FilterChips & Buttons ↔ App Theme Context / Store
- FilterChips and Buttons must consume unified Tailwind design tokens / Glass backdrop properties (`backdrop-blur-md`/`xl`, border opacities).
- Solid mode must enforce solid background colors with clear contrast borders without backdrop blur artifacts.

### BudgetView ↔ Transaction & Budget State
- `BudgetView` consumes expense transaction data and budget limits from Zustand/Supabase store.
- Interactive receipt component links selected transaction points on the SVG curve / bar chart to line items on the receipt panel.

### ThemeCreatorModal ↔ Live Theme Preview Engine
- `ThemeCreatorModal` provides real-time state overrides to a miniaturized live preview frame containing rendered interactive sample components (`FilterChip`, `ProductCard`, `ActionButton`, `DashboardWidget`).

### Confirmation Modal ↔ Data Action Controllers
- Red-Glass modal replaces standard `window.confirm()` for destructive operations ("Reset / Löschen").
- Exposes promise/callback contract `confirmAction({ title, message, confirmText, dangerLevel })`.

## Code Layout
- `src/components/` — UI components grouped by feature/domain
- `src/components/modals/` — Modal dialogs (ThemeCreatorModal, AppInfoModal, ConfirmationModal, etc.)
- `src/components/budget/` — Budget and expense visualization sub-components (BudgetKpiCards, BudgetChart, ReceiptPanel, etc.)
- `src/components/common/` — Reusable FilterChips, Buttons, Cards, Inputs
- `src/store/` — Zustand state stores
- `src/types/` — TypeScript interfaces and type definitions
