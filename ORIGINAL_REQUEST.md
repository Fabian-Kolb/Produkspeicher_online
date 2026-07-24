# Original User Request

## Initial Request — 2026-07-24T22:10:03Z

Optimierung und Konsolidierung der Benutzeroberfläche und Designsprache von Ventory (Produkspeicher_online) über alle Ansichten hinweg (Dashboard, Katalog, Favoriten, Bundles, Budget & Ausgabenverlauf, Deals, Menü & Einstellungen).

Working directory: c:\Users\Fabia\Desktop\Eigene_Projekte\vibe_codeing\Produkspeicher_online
Integrity mode: development

## Requirements

### R1. Designkonsistenz & Modus-Vereinheitlichung (Glass vs. Solid / Dark vs. Light)
Vereinheitlichung aller Komponenten (Buttons, FilterChips, Modale, Sidebars, Produktkarten), sodass im Glassmode durchgehend konsistente Transparenzen/Weichzeichnungen (`backdrop-blur-md`/`xl`) und Rahmen verwendet werden und im Solid-Modus klare Kontraste herrschen.

### R2. Überarbeitung des Ausgabenverlaufs (BudgetView)
Neugestaltung des Ausgabenverlaufs auf Mobile & Desktop mit responsiver SVG-Kurve, Balken/Kumulativ-Umschaltung, sanfter Gestensteuerung/Zoom und einem interaktiven Kassenzettel (Bottom-Drawer auf Mobile / Kassenbon-Panel auf Desktop).

### R3. Theme-Ersteller Live-Vorschau (ThemeCreatorModal)
Ersetzung der abstrakten Vorschau-Rechtecke durch eine realistische Live-Miniaturansicht echter App-Komponenten (Dashboard-Widget, FilterChip, Produktkarte, Aktions-Button), die Farb- und Glaseinstellungen in Echtzeit spiegelt.

### R4. Überarbeitung der Menüführung, Modale & Einstellungen
Gestaltung eines schicken Bestätigungsmodals für "Reset / Löschen" anstelle von `window.confirm()`, Ergänzung neuer Einstellungen (Haptik-Stärke, Kompakt-Grid, Währung, Glass-Intensität) und Aktualisierung des Changelogs/App-Info-Modals.

## Acceptance Criteria

### UI & Aesthetics
- [ ] Alle FilterChips und Buttons folgen in Light- & Dark-Mode denselben Glas- bzw. Solid-Regeln.
- [ ] Der Ausgabenverlauf passt sich flüssig an jede Bildschirmbreite an ohne unschön abgeschnittene Elemente.
- [ ] Die Live-Vorschau im Theme-Ersteller zeigt echte interaktive UI-Komponenten.
- [ ] Die Datenlöschung erfolgt über ein eigens gestaltetes Red-Glass Bestätigungsmodal.
- [ ] Build (`npx tsc`) schließt ohne Fehler ab.
