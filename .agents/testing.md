# Testing Guidelines & Workflow

## Aktueller Status
- **Test-Framework:** Vitest + React Testing Library + JSDOM
- **Aktuelle Testanzahl:** 4 Tests in 2 Test-Dateien (`themeHelpers.test.ts` und `useAppStore.test.ts`)
- Letzter Stand: Alle Tests bestehen erfolgreich (Status: Pass).

## Wie führe ich Tests aus? (Anleitung)

Die Tests in diesem Projekt laufen standardmäßig im sogenannten **Watch-Modus**. Das bedeutet, sie überwachen deinen Code und aktualisieren sich bei jedem Speichervorgang automatisch.

1. **Terminal öffnen:** Öffne ein neues Terminalfenster in deiner Entwicklungsumgebung.
2. **Start-Befehl ausführen:** Tippe den folgenden Befehl ein:
   ```bash
   npm run test
   ```
3. **Der Watch-Modus:** Das Terminal bleibt nun aktiv. Vitest wartet im Hintergrund. Sobald du eine beliebige Code-Datei oder Test-Datei änderst und auf **Speichern** drückst (Strg+S / Cmd+S), erkennt Vitest die Änderung sofort und lässt genau die Tests neu durchlaufen, die davon betroffen sind.
4. **Visuelles Interface (UI-Modus):** Wenn du lieber eine schöne, visuelle Ansicht im Browser bevorzugst, starte die Tests stattdessen mit:
   ```bash
   npm run test:ui
   ```

## Datei-Struktur (Colocation)
- Test-Dateien werden in diesem Projekt **immer direkt neben den Originaldateien** abgelegt (Colocation).
- *Beispiel:* Die Datei `src/components/Button.tsx` bekommt ihren Test exakt im selben Ordner unter dem Namen `src/components/Button.test.tsx`.
- Separate Test-Ordner dienen ausschließlich globalen Einstellungen (wie der `tests/setup.ts`).

## Test-Philosophie für zukünftigen Code
- **Behavior-Driven:** "Test behavior, not implementation details." Wir testen, was der Nutzer sieht (über `getByRole` oder `findByText`), und nicht die internen Statusvariablen von React.
- **Mocking ist Pflicht:** Externe API-Aufrufe (z.B. Supabase) werden IMMER im Test gemockt (`vi.mock('@supabase/supabase-js')`), um die Tests extrem schnell, sicher und deterministisch zu halten. Echte Datenbanken werden lokal nicht bei jedem Unit-Test überschrieben!
- **Kernabdeckung:** Store-Logiken (Zustand) und Utilities (`/utils`) müssen zwingend abgedeckt sein, da sie das funktionale Herz der App bilden.
