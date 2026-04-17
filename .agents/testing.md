# Testing Guidelines

## Tools
- Vitest als Test-Runner.
- React Testing Library (RTL) für UI/DOM Tests.
- JSDOM zur Simulation der Browser-Umgebung.

## Test-Philosophie
- "Test behavior, not implementation details." -> Klicke Knöpfe und prüfe Ergebnisse, statt interne React-States zu prüfen.
- Mocking: Externe Systeme wie Supabase werden immer gemockt (`vi.mock('@supabase/supabase-js')`), um schnelle und deterministische Tests zu garantieren.
- Jeder Store sollte eine separate `.test.ts` File haben.
- Utility-Funktionen (wie in `/utils`) müssen nahe 100% Testabdeckung haben, da hier keine UI gerendert wird.
