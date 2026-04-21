---
name: app-info-modal
description: Rule for keeping the App Info & Versioning modal up-to-date. Every agent must update the changelog when making changes.
---

# App Info & Versioning Skill

Use this skill whenever you add a new feature, fix a bug, or improve an existing functionality in the codebase. This ensures the user is always informed about the latest state of the application.

## When to use this skill
- **After every successful implementation**: Once a task is finished and verified.
- **Before ending a session**: Ensure the "Current Release" reflects the total progress of the turn.

## How to use it

### 1. Update the Changelog
Open [AppInfoModal.tsx](file:///c:/Users/Fabia/Desktop/Eigene_Projekte/vibe_codeing/Produkspeicher_online/src/components/features/AppInfoModal.tsx) and update the `CHANGELOG` array.

- **Current Turn Entry**: Add your changes to the first item in the array (`CHANGELOG[0]`).
- **New Release Entry**: If the latest entry is finalized or you are starting a new major phase, push a new entry to the top.
- **Collapsible State**: The component handles collapsing automatically. The first entry is expanded by default via the `useState` initialization: `const [expandedVersions, setExpandedVersions] = useState<string[]>([CHANGELOG[0].version]);`.

### 2. Versioning Rules (SemVer)
- **Pre-Release Phase**: Use `0.x.x` (e.g., `0.3.5`). Do NOT use `1.x.x` until the app is ready for a production release.
- **Patch (v0.x.Y)**: For bug fixes or small UI tweaks.
- **Minor (v0.X.0)**: For new features or major layout changes.

### 3. UI Implementation Patterns
Follow the "Boxed & Nested" design for new entries:
- **Main Container**: Each version resides in a `motion.div` with the `AnimatePresence` component for smooth expansion.
- **Nested Boxes**: Use the predefined styles for change categories:
    - **Added**: `bg-emerald-500/5 border-emerald-500/10`
    - **Improved**: `bg-blue-500/5 border-blue-500/10`
    - **Fixed**: `bg-heart/5 border-heart/10`

### 4. Text Style
- **Brevity**: Short, impactful descriptions.
- **Language**: German (Deutsch).

## Example Update

```typescript
const CHANGELOG: LogEntry[] = [
  {
    version: '0.3.6', // Incremented from 0.3.5
    date: '22. April 2026',
    changes: {
      added: [
        'Multi-Bild Upload Unterstützung'
      ],
      improved: [
        'Lade-Geschwindigkeit des Dashboards optimiert'
      ]
    }
  },
  // ... existing entries
];
```

> [!IMPORTANT]
> **Maintain Default Expand**: When adding a new version entry, the `useState` initialization in `AppInfoModal.tsx` might need a manual check to ensure it still targets `CHANGELOG[0].version` for the default expansion.
