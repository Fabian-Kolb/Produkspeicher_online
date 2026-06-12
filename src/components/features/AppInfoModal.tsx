import React, { useEffect, useState } from 'react';
import { X, Info, Sparkles, Zap, ShieldCheck, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

interface LogEntry {
  version: string;
  date: string;
  changes: {
    added?: string[];
    fixed?: string[];
    improved?: string[];
  };
}

const CHANGELOG: LogEntry[] = [
  {
    version: '0.8.20',
    date: '12. Juni 2026',
    changes: {
      added: [
        'Bilder Drag-and-Drop & Clipboard-Paste: Gestrichelte Drop-Zone für Bilder mit Dateityp-Validierung und intelligentem globalen Paste-Handler (Strg+V).',
        'Suchbares Subkategorie-Dropdown: Vollständiges Dropdown mit Suche und dynamischer Subkategorie-Schnellerstellung.'
      ],
      improved: [
        'Layout-Optimierung des Produkt-Modals: Hauptkategorie und Subkategorie befinden sich nun nebeneinander mit runden Triggern (rounded-full). Bewertung und Favoriten-Button teilen sich die nächste Zeile (46px Höhe).',
        'Clean-Up & Speicher-Schonung: Der ungenutzte "Gekauft"-Status wurde aus dem Hinzufügen-Modal entfernt. Bild-Thumbnails verwenden Objektreferenzen (createObjectURL) anstelle von Base64, inklusive sauberem Revoke beim Modal-Close und Unmount.'
      ]
    }
  },
  {
    version: '0.8.19',
    date: '12. Juni 2026',
    changes: {
      improved: [
        'Shop-Verwaltungs-Pille im Dashboard: Der "Shop hinzufügen"-Button und das Einstellungs-Zahnrad wurden in einer gemeinsamen, weißen Pille mit Schatten (bg-white dark:bg-white/10 shadow-md) und blauer Umrandung (border-accent) gebündelt.',
        'Visual Styles verfeinert: Das Zahnrad leuchtet nicht mehr rund auf, sondern passt sich farblich flexibel an das Theme an (text-text-primary) und färbt sich bei Hover blau (hover:text-accent).',
        'Kompaktere Filterleiste: Das Zahnrad wurde aus der Filterleiste entfernt, sodass diese nur noch reine Kategorie-Filter enthält. Zudem wurde die überflüssige Shop-Anzahl-Anzeige entfernt.'
      ]
    }
  },
  {
    version: '0.8.18',
    date: '12. Juni 2026',
    changes: {
      added: [
        'Wischbares KPI-Widget-Karussell: Budget-Tracker, Favoriten und Preisalarme sind auf Mobilgeräten nun nebeneinander angeordnet und wischbar (Carousel) mit Snap-Effekt.',
        'Widget-Seitennavigation: Punkte-Indikatoren (Dots) unter dem Karussell zeigen die aktive Seite an und erlauben schnelles Hinspringen per Klick.'
      ],
      improved: [
        'Platzersparnis auf Mobilgeräten: Die Höhe des KPI-Bereichs wurde auf die Höhe einer einzelnen Karte reduziert, wodurch die Shop-Liste weiter nach oben rückt.',
        'Responsive Karten-Höhen: Favorites- und Price-Alerts-Karten dehnen sich nun automatisch auf die Höhe des Budget-Trackers aus, um ein harmonisches Bild zu erzeugen.'
      ]
    }
  },
  {
    version: '0.8.17',
    date: '12. Juni 2026',
    changes: {
      improved: [
        'Einheitliche Button-Rundung: Systemweit alle Aktions-Buttons, Filter-Chips und Sidebar-Elemente auf ein vollkommen rundes Design (rounded-full) umgestellt.',
        'Taktile Interaktionen: Alle Filter-Chips, Haupt- und Aktionsbuttons nutzen die flüssige 300ms Skalierungs-Animation (hover:scale-105, active:scale-95) des Header-Neu-Buttons.',
        'Modal-Farbschema vereinheitlicht: Aktive Zustände von Toggles (Favoriten, Gekauft, Subkategorien) und Bild-Hinzufügen-Buttons leuchten einheitlich im blauen Akzent-Design.',
        'Action-Farbkodierung: Abbrechen-Schaltflächen in Modals sind rot (variant="danger") und Speichern-Buttons blau (variant="primary") eingefärbt.'
      ]
    }
  },
  {
    version: '0.8.16',
    date: '11. Juni 2026',
    changes: {
      added: [
        'Echtzeit-Wisch-Navigation für Navbars: Unbegrenztes horizontales Durchscrollen (Multi-Page Swiping) direkt auf der oberen und unteren Menüleiste im mobilen Modus.'
      ],
      improved: [
        'Präzisions-Gestensteuerung: 6.5x Scroll-Empfindlichkeit ermöglicht das Durchqueren aller 6 Seiten mit einer einzigen Daumenbewegung über die Breite des Displays.',
        'Intelligente Scroll-Physik: Dynamische Berechnung der Seiten-Wechsel-Schwellenwerte für präzises Snapping an beliebigen Seitenindizes und flüssige Rand-Dämpfung (Rubber-Banding) über die gesamte Karussell-Breite.',
        'Fehlauslösungsschutz: Klick-Interzepierung verhindert das unbeabsichtigte Auslösen von Tab-Links beim Anheben des Daumens nach dem Wischen.'
      ]
    }
  },
  {
    version: '0.8.15',
    date: '11. Juni 2026',
    changes: {
      improved: [
        'Diagramm-Modusschalter: Neben die Zeitraumauswahl (z. B. Juni 2026) verschoben, um mobile Touch-Flächen kompakter zu machen.',
        'Kompakte Diagrammlegende: Schriftgröße verringert und Abstände optimiert, damit alle Legenden-Elemente auf Mobilgeräten in eine einzige Zeile passen.',
        'Responsive Budget-Karten: Der Budget Tracker und die Top-Kategorien werden auf Mobilgeräten nebeneinander (2-Spalten-Raster) angezeigt. Abstände und Schriftgrößen wurden verkleinert, damit die Karten auch bei 360px Bildschirmbreite lesbar bleiben.',
        'Hierarchie für Mobilgeräte: Die Belegkarte (Tagesbeleg) wird auf Mobilgeräten direkt unter dem Ausgabenverlauf (Diagramm) und über den Budget-Karten platziert, während das Desktop-Layout unverändert bleibt.'
      ]
    }
  },
  {
    version: '0.8.14',
    date: '11. Juni 2026',
    changes: {
      improved: [
        'Monatsbudget-Interaktion: Deutlichere Klickbarkeit durch Stiftsymbol und interaktives Pill-Design.',
        'Größere Modusschalter (Tag/Woche/Monat): Bessere mobile Touch-Flächen durch flex-1 Aufteilung.',
        'Erweiterte Bedienung: Speichern-/Abbrechen-Buttons und Escape-Tastenschlüssel hinzugefügt.'
      ],
      fixed: [
        'Umschalter-Fehlverhalten behoben: Eingabeschließung durch vorzeitigen onBlur-Verlust verhindert, dank robuster Click-Outside-Steuerung.'
      ]
    }
  },
  {
    version: '0.8.13',
    date: '11. Juni 2026',
    changes: {
      added: [
        'Pinch-to-Zoom-Gestensteuerung (Zwei-Finger-Zoom) für das Budget-Diagramm implementiert (X- und Y-Achse unabhängig zoombar).'
      ],
      improved: [
        'Stationäre Gridlinien im Diagramm mit dynamischen Y-Achsen-Beschriftungen bei vertikalem Zoom. SVG-Elemente werden nun sauber an den Rändern abgeschnitten.',
        'Schwebender "Zoom zurücksetzen"-Button ermöglicht das schnelle Wiederherstellen der Standardansicht.'
      ]
    }
  },
  {
    version: '0.8.12',
    date: '11. Juni 2026',
    changes: {
      improved: [
        'KPI-Statistikkarten (Ausgaben, Ø Preis, Käufe) auf der Budgetseite für Mobilgeräte platzsparend in einer 3-spaltigen Zeile nebeneinander platziert und das Monatsbudget darunter angeordnet.',
        'Zahnrad-Symbol als Haupt-Navigationstaste für die Kategoriesteuerung wiederhergestellt.',
        'Fragezeichen-Button mit interaktivem Info-Tooltip links neben dem Schließen-Kreuz im Kategoriesteuerung-Fenster hinzugefügt.',
        'Kopfzeilentext (Titel/Untertitel) aus der Kategoriesteuerung entfernt und in den Hover-Tooltip des neuen Fragezeichens überführt.',
        'Hover-Färbung von Kategorien im Kategoriesteuerung-Fenster auf Blau vereinheitlicht.',
        'Delete-Button (Kreuz) vergrößert sich bei Hover taktil (125% Skalierung) und färbt das betroffene Element rot.',
        'Fehlverhalten beim Budget-Diagramm behoben: Ein neuer rechter Seitenabstand (MARGIN_RIGHT = 20) verhindert das Überstehen der rechten Achsen-Labels und SVG-Punkte, was unnötige Scrollbars auf breiten Bildschirmen beseitigt.'
      ]
    }
  },
  {
    version: '0.8.11',
    date: '11. Juni 2026',
    changes: {
      improved: [
        'Vollständige Umstellung aller verbleibenden statischen Farb-Overlays (z. B. in Budget, Listen, Navigationen) auf dynamische Theme-Variablen (bg-text-primary/5 und /10).',
        'Save- und Cancel-Buttons im Theme-Creator modularisiert und auf die globale Button-Komponente umgestellt.',
        'Regeln für variable Overlays und Button-Nutzung im Interaction-Design Skill hinterlegt.'
      ]
    }
  },
  {
    version: '0.8.10',
    date: '11. Juni 2026',
    changes: {
      added: [
        'Escape-Tastatursteuerung im Bearbeitungsmodus für Produkte (ProductModal) implementiert.'
      ],
      fixed: [
        'Vertikales Scrollen im Budget-Diagramm verhindert (X-Achsen-Datumsbeschriftung verschoben)',
        'Zuschneiden des aktiven Navigations-Indikators (Pille) im Desktop-Header behoben'
      ],
      improved: [
        'Schließen-Button im Produkt-Editor optisch vereinheitlicht (Pill-Style).',
        'Projekt-Skills bereinigt und an den echten Code-Stand angepasst (Entfernung von Wiggle-Animationen, Tag 0 Ursprung, 2px-Notches, strict-any Verbot).',
        'Budget-Diagramm-Skalierung optimiert (Mindestbreite 750px/500px vor horizontalem Scrollen mit Premium Scrollbar)'
      ]
    }
  },
  {
    version: '0.8.9',
    date: '30. Mai 2026',
    changes: {
      added: [
        'Präzise Klick-Zonen im Diagramm: In der kumulativen Trendkurve wurde eine unsichtbare 20px-Klickzone um jeden Punkt integriert, um die Auswahl per Touch/Maus extrem treffsicher zu gestalten. In der Balkenansicht sind nun direkt die Balken-Rechtecke anklickbar.',
        'Diagramm-Hintergrund-Deselektion: Ein Klick auf die freie Diagrammfläche des SVGs deselektiert den aktuell ausgewählten Tag augenblicklich.',
        'Segmentierter Budget-Rechner in KPI-Karte: Die vierte Statistikkarte bietet nun beim Editieren einen segmentierten Umschalter für [Tag], [Woche] oder [Monat]. Der Wert kann in der Wunsch-Einheit eingegeben werden und wird im Hintergrund automatisch in das monatliche Budget konvertiert und persistent gespeichert.',
        'Dynamische Beleg-Überschriften: Die Belegkarte rechts passt ihren Titel automatisch an und heißt im Gesamt-Modus "MONATSBELEG", während sie in der Wochen-/Monatsansicht "TAGESBELEG" heißt.',
        'Premium Differenz-Visualisierung: Negative Beträge bei der Budgetdifferenz im Beleg wurden durch absolute Zahlen ersetzt, die unmissverständlich als grüne "ERSPARNIS" oder rote "ÜBERSCHREITUNG" dargestellt werden.'
      ],
      improved: [
        'Hover-Verhalten korrigiert: Das Hovern über dem Diagramm manipuliert nun nicht mehr die Opazität der anderen Balken, um störende Helligkeitssprünge beim Bewegen des Mauszeigers zu vermeiden. Das Ausblenden nicht ausgewählter Elemente wird rein durch die aktive Selektion (Klick) gesteuert.',
        'Feste Belegkarten-Höhe: Die Höhe der Belegkarte bleibt unabhängig vom ausgewählten Tag permanent auf h-[390px] fixiert, was unschöne vertikale Layout-Verschiebungen ausschließt.'
      ]
    }
  },
  {
    version: '0.8.8',
    date: '30. Mai 2026',
    changes: {
      added: [
        'Wochen-Prognose (Forecast): Das Woche-Diagramm (cumulative Trendkurve) zeigt nun ebenfalls eine gestrichelte Prognoselinie bis zum Sonntag der aktuellen Woche, basierend auf dem durchschnittlichen Konsumverhalten der vergangenen Wochentage.',
        'Wochen-Prognose-Ausblendung: Die Wochenprognose wird sonntags automatisch ausgeblendet, da die Woche an diesem Tag bereits abgeschlossen ist.',
        'Interaktive Kalender-Wochenauswahl: Im Woche-Modus (ehemals "7 Tage") führt die Auswahl eines Monats nun zu einem zweiten Schritt, der die Kalenderwochen dieses Monats zur genauen Auswahl anzeigt.',
        'Freie Spanne für Gesamtübersicht: Im Gesamt-Modus kann der Nutzer durch aufeinanderfolgende Klicks im Kalender eine vollkommen flexible Start- und Endmonatsspanne bestimmen.',
        'Wochentage auf X-Achse: Das Woche-Diagramm zeigt anstelle von kalendarischen Datumsangaben Wochentage ("Mo" bis "So") als Beschriftung.',
        'Mobile X-Achsen-Scrollbarkeit erweitert: Die Scrollbarkeit und Kanten-Ausblendung auf Mobilgeräten ist nun auch für die Woche- und Gesamt-Diagramme aktiv (mit angepasster Breite von 500px).'
      ],
      improved: [
        'Y-Achsen-Maximum im Woche-Modus: Der Skalierungswert (roundedMax) des Woche-Diagramms berechnet sich nun auf Basis des wöchentlichen Budgets, statt des monatlichen Budgets, was eine deutlich präzisere Kurven- und Säulendarstellung bewirkt.',
        'Zentriertes Schließen des Kalenders: Alle Kalender-Unterzustände und Range-Highlights werden beim Schließen sauber zurückgesetzt.'
      ]
    }
  },
  {
    version: '0.8.7',
    date: '30. Mai 2026',
    changes: {
      added: [
        'Logout-Option im Profil- und Account-Modal hinzugefügt.',
        'Profilbild (oder Platzhalter) im Header integriert, das per Klick direkt das Profil-Modal öffnet (anstelle des alten Logout-Buttons).'
      ]
    }
  },
  {
    version: '0.8.6',
    date: '30. Mai 2026',
    changes: {
      added: [
        'Historischer Budget-Zeitkapsel-Explorer: Ein voll funktionsfähiger Zeitraum-Navigation-Umschalter ermöglicht es, monats- oder wochenweise in die Vergangenheit zu reisen. Alle Statistiken, Budgets, Kategorien und Transaktionslisten passen sich dem historischen Kontext an.',
        'Desktop-Kalender-Popover & Mobile Bottom Drawer: Per Klick auf das Datum öffnet sich auf Desktops ein elegantes Dropdown-Raster und auf Mobilgeräten ein verglastes Slide-up-Bodenpanel (Bottom Drawer) zur schnellen Monats-/Jahreswahl.',
        'Horizontale X-Achsen-Scrollbarkeit auf Mobilgeräten: In der Monatsansicht wird das Diagramm auf Handys mit einer lesbaren Mindestbreite von 750px gerendert und ist wischbar. Ein intelligenter Effekt scrollt den Chart beim Laden automatisch an das rechte Ende (zum aktuellsten Tag).'
      ],
      improved: [
        'Kontextbasierte Budget-Tracker-Texte: Für beendete historische Monate ändert sich die Anzeige von "Noch X € übrig" auf "Budget-Ergebnis: X € gespart" oder "X € über dem Budget abgeschlossen".',
        'Ausblenden der Prognose-Linie für historische Monate: Die gestrichelte Burn-Rate-Forecast-Linie wird nur im aktuell laufenden Monat gerendert.'
      ]
    }
  },
  {
    version: '0.8.5',
    date: '30. Mai 2026',
    changes: {
      added: [
        'Icon-basierte Diagramm-Steuerung: Die Text-Buttons im Ausgabenverlauf wurden durch reine, ansprechende Icons (Säulen vs. Trendkurve) ersetzt.',
        'Visuelle Diagramm-Typen (Säulen vs. Trend): Tägliche Ausgabenspitzen (und monatliche Spikes im Gesamt-Zeitraum) werden nun als modernes Säulendiagramm dargestellt, während der kumulative Verlauf weiterhin als weiche Trendkurve gerendert wird.'
      ],
      improved: [
        'Automatische Deaktivierung des Modus-Toggles: Im 6-Monate-Gesamtzeitraum wird der Steuerungsschalter automatisch ausgeblendet, da dort ausschließlich monatliche Spikes sinnvoll sind.'
      ]
    }
  },
  {
    version: '0.8.4',
    date: '29. Mai 2026',
    changes: {
      added: [
        'Täglich/Gesamtverlauf Budget-Diagramm: Umschalter für tägliche Ausgaben-Wellen vs. kumulativen Monatsverlauf.',
        'Gestrichelte Soll-Pace-Kurve: Im Gesamtverlauf zeigt eine diagonal ansteigende Kurve den idealen Ausgabenpfad im Monat an.',
        'Interaktiver Burn-Rate-Forecast: In der kumulativen Monatsansicht wird eine gestrichelte Prognoselinie bis zum Monatsende projiziert (grün bei Einhaltung, rot/orange bei Budgetüberschreitung) basierend auf dem täglichen Konsumverhalten.',
        'Interaktive Diagramm-Legende: Eine dynamische Legende in der Diagramm-Überschrift erklärt nun kontextabhängig die verschiedenen Linientypen (Ausgaben, Soll-Pace, Prognose).'
      ],
      improved: [
        'Standardmäßige Gesamtverlauf-Monatsansicht: Die Budgetseite öffnet sich standardmäßig in der kumulativen Monatsansicht zur direkten Visualisierung von Soll-Pace und Prognosen.',
        'Ausrichtung des Soll-Pace-Starts: Die Soll-Pace-Linie startet nun exakt im Koordinatenursprung (0 €) bei Tag 0.',
        'Soll-Pace-Sichtbarkeit verbessert: Die Soll-Pace-Linie ist durch eine angepasste Farb- und Kontraststärke in hellen und dunklen Themes bestens erkennbar.',
        'Bereinigung des Gesamt-Zeitraums: Das horizontale Monatsbudget-Limit und die entsprechende Beschriftung wurden aus der 6-Monate-Übersicht (Gesamt) entfernt, da sie dort inhaltlich nicht zutreffend waren.',
        'Einheitliches Design des Budget-Trackers: Der Budget-Tracker auf dem Dashboard wurde optisch komplett an die Premium-Variante der Budgetseite angeglichen (inkl. Shimmer-Effekt, Background-Glow, Restbudget-Badge und wahlweise grün/rotem Warnzustand).',
        'Dynamischer Warnzustand für Budget-Tracker: Beide Tracker-Karten färben sich augenblicklich rot (Heart-Farbton), zeigen das genaue Ausmaß der Überschreitung an und passen den Begleittext entsprechend an, sobald das Monatsbudget überschritten wird.',
        'Diagramm-Skill aktualisiert: Die Entwickler-Richtlinien für Diagramme im Projekt wurden an das neue System angepasst.'
      ],
      fixed: [
        'UTC-Zeitzonen-Offset Fehler: Die Zuordnung von getätigten Einkäufen zu Datumsschlüsseln wurde von UTC-Methoden auf die lokale Zeitzone umgestellt.',
        'NaN-Fehler bei virtuellem Tag 0: Behebung eines Javascript-Datumsfehlers bei der Berechnung von Tag 0.'
      ]
    }
  },
  {
    version: '0.8.3',
    date: '28. Mai 2026',
    changes: {
      added: [
        'Premium Slide-Down Kategoriesteuerung im Dashboard: Das Hinzufügen, Löschen und Umsortieren von Shop-Kategorien wurde von der Inline-Ansicht in ein elegantes zentriertes Slide-Down-Editiermenü (identisch zum Katalog) überführt.',
        'Custom Inline-Löschbestätigung für Filter: Statt des störenden, blockierenden System-Popups (confirm) heben sich zu löschende Filter-Chips nun direkt in der Leiste mit einer weichen Animation rot hervor und bieten eine direkte Bestätigung/Abbrechen-Schaltfläche.'
      ],
      improved: [
        'Wiederverwendbare CategoryEditMenu Komponente: Das Editiermenü wurde vollständig modularisiert und nimmt nun Daten sowie Store-Callbacks (Katalog/Dashboard) flexibel über Props entgegen.',
        'Hervorragende Eingabefelder-Aktivierung: Neue Shop- und Produktkategorie-Eingabefelder unterstützen die einheitliche, tactile 102%-Skalierungs- und Hebeanimation ohne unästhetische blaue Fokus-Ringe.'
      ]
    }
  },
  {
    version: '0.8.2',
    date: '28. Mai 2026',
    changes: {
      improved: [
        'Premium Navigations-Hover und Klick-Animationen (Header & Subnavigation): Umstellung auf das robuste Parent-Tracked Bounding Indicator Design. Eine einzelne, permanente Hintergrund-Kapsel im Navigations-Track slides und morpht dynamisch über Offset-Messungen (offsetLeft/clientWidth) zur aktiven Schaltfläche. Dies eliminiert alle Z-Index-Browserbugs und Framer Motion LayoutId-Konflikte zu 100%.'
      ]
    }
  },
  {
    version: '0.8.1',
    date: '23. Mai 2026',
    changes: {
      improved: [
        'Einheitliche Button-Farben im Glasmodus: Alle interaktiven Haupt- und Aktionsbuttons (wie „Shop hinzufügen“, „Neues Bundle“, Zeitraum-Umschalter im Budget, Card-Buttons und Editor-Buttons) nutzen nun auch im Glasmodus konsistent die blaue Akzentfarbe zur klaren Kennzeichnung ihrer Interaktivität.'
      ],
      fixed: [
        'Navigationspille im Helles Design sichtbar: Durch die Aktivierung klassenbasierter Dark-Mode-Selektoren in Tailwind v4 und dynamische Synchronisierung der CSS-Klasse .dark ist die Desktop-Navigationsleiste nun auch auf hellen und verglasten Hintergründen perfekt erkennbar.'
      ]
    }
  },
  {
    version: '0.8.0',
    date: '23. Mai 2026',
    changes: {
      fixed: [
        'Header-Pillen-Kontrast im Helles Design: Das Kontrastverhältnis der Kategorie-Navigationsleiste (Solid und Glass) im Light Mode wurde durch Anpassung der Standard-Rahmenfarben und Hinzufügen eines weichen Schattens deutlich erhöht, um die Erkennbarkeit zu verbessern.',
        'Light/Dark-Modus-Umschalter repariert: Der Theme-Wechsel über das Mond-/Sonnensymbol in der oberen rechten Ecke behält nun den aktiven Glassmorphismus-Status (Solid oder Glass) korrekt bei und wählt das entsprechende Standardpreset aus.'
      ],
      improved: [
        'Skill-Dokumentation aktualisiert: Die zentralen Interaktionsrichtlinien des Designsystems in den Skill-Dateien wurden um die neuen Preset-Strukturen und Theme-Schnittstellen erweitert.'
      ]
    }
  },
  {
    version: '0.7.9',
    date: '23. Mai 2026',
    changes: {
      added: [
        'Separation von Preset-Modi: Default Dark und Default Light stehen nun jeweils als eigenständige Solid- und Glass-Presets (z. B. "Default Dark (Solid)" und "Default Dark (Glass)") in der Auswahlliste bereit, um das Design mit einem Klick exakt einzustellen.',
        'Bedingter Glassmorphismus-Schalter: Die globale Glassmorphismus-Option wurde aus den Preset-Sidebar-Einstellungen entfernt und stattdessen direkt in den Theme-Ersteller integriert. Das Häkchen wird nun nur noch während der Custom-Theme-Konfiguration angezeigt.'
      ],
      improved: [
        'Echtzeit-Glas-Vorschau: Die Live-Vorschau und die App-Oberfläche passen sich beim Konfigurieren des Custom-Themes augenblicklich dem aktiven Entwurfs-Morphismus-Status an.',
        'Reorganisation von Presets: Veraltete Presets (Nordic Forest, Rose Petal) wurden entfernt, um Platz für die getrennten Standard-Presets zu schaffen.'
      ]
    }
  },
  {
    version: '0.7.8',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Drag-and-Drop-Filtersteuerung: Kategoriefilter im Dashboard (Deine Shops) und Katalog (Produkte) können jetzt interaktiv per Drag and Drop umsortiert werden. Die Sortierreihenfolge bleibt nach dem Neuladen erhalten.',
        'Neues Katalog-Kategorie-Editiermenü: Die Verwaltung der Produktkategorien wurde von einem seitlichen Dropdown in ein elegantes, zentriertes Slide-Down-Menü überführt, das sich geschmeidig per Framer Motion direkt unter der Pill-Navigation öffnet.'
      ],
      improved: [
        'Zentrale Persistenz für Shop-Kategorien: Shop-Filterkategorien werden nun im globalen App-Zustand gespeichert und automatisch mit Supabase synchronisiert. Bei Löschung einer Shop-Kategorie werden verknüpfte Shops automatisch zu "Allgemein" umgeordnet.',
        'Einheitliche Editier-UX: Der Bearbeitungsmodus für Filter-Chips (gestrichelte Ränder, Lösch-Badges auf Hover, wackelnde Animationen) sieht jetzt auf dem Dashboard und im Katalog vollkommen identisch aus.'
      ]
    }
  },
  {
    version: '0.7.7',
    date: '22. Mai 2026',
    changes: {
      fixed: [
        'Abruptes Springen der Kärtchen/Boxen und Eingabefelder behoben: Standardwerte für `translate` (0 0) und `scale` (1) wurden für `.glass-panel` und globale Eingabefelder festgelegt und explizit in die Transition-Eigenschaften aufgenommen. Dadurch gleiten alle Boxen nun sanft und absolut flüssig über 500ms in Größe und Position, statt sofort zu springen.'
      ]
    }
  },
  {
    version: '0.7.6',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Premium-Hover- und Fokus-Animationen verfeinert: Alle interaktiven Kärtchen, Widgets, Shop-Karten und Eingabefelder nutzen nun eine einheitliche, neutrale Transformation ohne blaue Akzente, blaue Ränder oder leuchtende Schatten-Glows auf Hover/Fokus.',
        'Verzögerungsfreie Transformationen behoben: Durch die Zuweisung expliziter Tailwind-Übergangsklassen animieren alle Kärtchen und Boxen nun ihre Größe (Scale) und Position (Translation) flüssig über 500ms mit einer organischen Timing-Kurve.'
      ],
      improved: [
        'Farbneutralität hergestellt: Unerwünschte blaue Standardhintergründe und -ränder bei Hover und Fokus wurden systemweit entfernt und durch feine neutrale Rahmenübergänge (hover:border-text-secondary) ersetzt.',
        'Budget-Eingabe & Theme-Name-Eingabe angepasst: Das Budget-Eingabefeld und die Theme-Manager-Eingabefelder nutzen jetzt ebenfalls die premium 500ms neutrale Skalierungs- und Hebeanimation.'
      ]
    }
  },
  {
    version: '0.7.5',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Premium-Fokus- und Hover-Animationen für alle Textboxen, Suchfelder und Eingaben hinzugefügt. Fokussierte Eingabefelder heben sich nun taktil hervor durch minimale Skalierung (101.5% bis 102%) und einen leuchtenden Border-Glow in der aktiven Accent-Farbe.'
      ],
      improved: [
        'Engabefelder-Expansion: Suchfelder im Katalog, in Favoriten und Bundles vergrößern sich bei Fokus flüssig von 256px auf 320px Breite auf größeren Bildschirmen.',
        'Notizen-Feld-Expansion: Das Details/Notizen-Textfeld in der Produkt-Modalansicht vergrößert bei Fokus organisch seine minimale Höhe von 100px auf 160px.'
      ]
    }
  },
  {
    version: '0.7.4',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Einheitliche, premium Hover-Animationen für alle interaktiven Karten (Produktkarten, Dashboard KPI-Widgets, Shop-Karten und Bundle-Produktkarten) hinzugefügt. Diese nutzen eine elastische Höhen-Verschiebung (-6px), minimale Skalierung (102%), Border-Glow mit der Akzentfarbe und einen weichen Akzent-Schatten.'
      ],
      improved: [
        'Interaktivität im Bundle-Bereich verbessert: Produkt-Kärtchen in der horizontalen Bundle-Vorschau sind nun anklickbar und öffnen direkt die Produktdetail-Modalansicht.'
      ]
    }
  },
  {
    version: '0.7.3',
    date: '22. Mai 2026',
    changes: {
      improved: [
        'Systemweite Bereinigung hardcodierter Farbcodes: Alle verbleibenden Instanzen von blau-basierten Styles (z. B. in BudgetView, BundlesView, DashboardView und Produktdetails) wurden durch dynamische Accent-Token (bg-accent, text-accent) ersetzt, sodass benutzerdefinierte Farbmuster perfekt funktionieren.'
      ]
    }
  },
  {
    version: '0.7.2',
    date: '22. Mai 2026',
    changes: {
      improved: [
        'Filter-Styling vereinheitlicht: Favoriten- und Bundle-Editor-Filter nutzen nun dieselben dynamischen Accent-Farben wie der Katalog'
      ]
    }
  },
  {
    version: '0.7.1',
    date: '22. Mai 2026',
    changes: {
      improved: [
        'Theme-Customizer für Mobilgeräte optimiert (dynamische Modal-Höhe, Ausblenden von Sidebar/Editor zur Platzersparnis)',
        'Neuer, prominenter Button zur Theme-Erstellung eingeführt',
        'Farb-Auswahlelemente im Editor auf Mobilgeräten im 2-Spalten-Layout angeordnet',
        'Framer Motion Übergangsanimationen beim Wechseln zwischen Presets und Editor integriert'
      ],
      fixed: [
        'Unerwünschte Größenänderungen des Desktop-Modals beim Tab-Wechsel behoben',
        'Überflüssiges Emoji-Icon aus dem Theme-Manager Infofeld entfernt'
      ]
    }
  },
  {
    version: '0.7.0',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Semantisches Design-Token-System mit 12 zentralen CSS-Variablen eingeführt',
        'Komplett überarbeiteter Theme-Creator mit RGBA-Farbreglern und Live-Vorschau',
        'Globale Vereinheitlichung des Glassmorphismus-Designs (Modals, Sidebar, Navigation)'
      ],
      improved: [
        'Design-Einstellungen vereinfacht durch Vereinheitlichung von Theme und Glassmorphismus'
      ]
    }
  },
  {
    version: '0.6.1',
    date: '22. Mai 2026',
    changes: {
      fixed: [
        'Übergangsanimation bei mobilen Wischgesten auf Release-Ebene flüssig animiert (Reflow-getriggert)'
      ]
    }
  },
  {
    version: '0.6.0',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Echtzeit-Gestensteuerung (Wisch-Navigation) für Mobilgeräte integriert'
      ],
      improved: [
        'Seitenübergänge mit performanten CSS-Transforms und Ease-Out-Expo-Kurven',
        'Einzeln scrollbare Ansichten zur Isolation der Scroll-Positionen zwischen Tabs',
        'Rubber-Band-Effekt bei den äußeren Seitenrändern (Dashboard & Deals)'
      ],
      fixed: [
        'Vermeidung von Wisch-Konflikten bei Eingabefeldern und horizontal scrollbaren Listen'
      ]
    }
  },
  {
    version: '0.5.9',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Produktions-Build (npm run build) wiederhergestellt',
        'Unbenutzte Imports (AnimatePresence, Play) entfernt',
        'Unbenutzte Variable "settings" in KatalogView entfernt'
      ]
    }
  },
  {
    version: '0.5.8',
    date: '21. April 2026',
    changes: {
      fixed: [
        'TypeScript-Fehler "unused variable settings" in FavoritenView behoben'
      ]
    }
  },
  {
    version: '0.5.7',
    date: '21. April 2026',
    changes: {
      improved: [
        'Solid Blue Interaction Standard für den Solid-Modus verfeinert',
        'Bundle-Editor Buttons (+, -, ×) jetzt mit blauem Rand und weißem Inhalt',
        'Status-Filter (Gekauft/Reduziert) nutzen jetzt konsistent das Blue-Interaction Design',
        'Optimierte Sichtbarkeit der Preis-Anzeige (dezentes Grau im Solid-Modus)',
        'Filter-Chips (Kategorien, Status, Sub-Cats) jetzt deutlich grau wenn nicht ausgewählt',
        'Trash-Icon Standard: Solid Blau + Weißes Icon standardmäßig im Solid-Modus',
        'Trash-Icon Farbumschlag zu Solid Rot (bg-heart) nur auf Hover'
      ]
    }
  },
  {
    version: '0.5.4',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Fehlende "cn" Utility-Imports in Katalog-, Favoriten- und BudgetView behoben'
      ]
    }
  },
  {
    version: '0.5.3',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Import-Fehler "Cannot find name cn" in BudgetView behoben'
      ]
    }
  },
  {
    version: '0.5.2',
    date: '21. April 2026',
    changes: {
      fixed: [
        'ReferenceError: settings is not defined in BundlesView behoben'
      ]
    }
  },
  {
    version: '0.5.1',
    date: '21. April 2026',
    changes: {
      added: [
        'Dual-Theme Interaktions-System implementiert',
        'Intelligente Style-Wiederherstellung für den Glass-Modus',
        'Dokumentation des dualen Design-Systems im Interaction-Skill'
      ],
      improved: [
        'Dynamische Budget-Visualisierung (Emerald/Blue Switch)',
        'Navigation-Pills passen sich jetzt nahtlos dem Glass-Setting an',
        'Katalog-Filter und Shop-Buttons unterstützen beide Design-Profile'
      ]
    }
  },
  {
    version: '0.5.0',
    date: '21. April 2026',
    changes: {
      added: [
        'Premium Blue Interaction Design System eingeführt',
        'Neuer Agent Skill für Interaction-Design & Button-Regeln',
        'SVG Bar Chart mit blauen Verläufen und Glow-Effekten'
      ],
      improved: [
        'Skill-Struktur reorganisiert (Frontend-Architecture)',
        'Ganze App auf konsistentes "Blue Pill" Feedback umgestellt',
        'Optimierte Hover-Zustände für Transaktionen und Charts'
      ]
    }
  },
  {
    version: '0.4.0',
    date: '21. April 2026',
    changes: {
      added: [
        'Vier Premium Modal-Modi: Solid Dark, Solid White, Glass Dark, Glass White',
        'Neue Design-Kontrollen im Theme-Manager für Modal-Style & Theme',
        'Agent Skill für Modal-Design-Standards hinterlegt'
      ],
      improved: [
        'Optimierte Typografie und Abstände in Modals',
        'Verbesserte Kontraste für helle Modal-Modi'
      ]
    }
  },
  {
    version: '0.3.5',
    date: '21. April 2026',
    changes: {
      added: [
        'Neues App-Info Fenster mit Versionierung & Changelog',
        'Agent Skill für automatisierte Update-Logs hinterlegt'
      ],
      improved: [
        'Design-System "Luminous Sanctuary" weiter verfeinert',
        'Responsive Animationen für Modals'
      ]
    }
  },
  {
    version: '0.2.8',
    date: '20. April 2026',
    changes: {
      added: [
        'Vollständiger Responsive Support (Mobile & Tablet)',
        'Bottom-Navigation für Mobilgeräte',
        'Swipe-Gesten zur Kategorie-Navigation'
      ],
      fixed: [
        'Zustand Store Persistenz-Fehler bei Neustart behoben'
      ]
    }
  },
  {
    version: '0.1.0',
    date: '15. April 2026',
    changes: {
      added: [
        'Initialer Release von Ventory (Alpha)',
        'Produkt-Katalog mit Filter & Sortierung',
        'Favoriten & Budget-Tracking',
        'Theme-Manager mit Custom Themes'
      ]
    }
  }
];

export const AppInfoModal: React.FC = () => {
  const { isAppInfoModalOpen, toggleAppInfoModal } = useUIStore();
  const settings = useAppStore(state => state.settings);
  
  const [expandedVersions, setExpandedVersions] = useState<string[]>([CHANGELOG[0].version]);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAppInfoModalOpen) toggleAppInfoModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isAppInfoModalOpen, toggleAppInfoModal]);

  if (!isAppInfoModalOpen) return null;

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version) 
        : [...prev, version]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      onClick={toggleAppInfoModal}
    >
      <div className={cn(
        "absolute inset-0 bg-black/60 transition-opacity duration-300",
        settings.isGlassEnabled && "backdrop-blur-sm"
      )} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 glass-panel text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b flex items-center justify-between transition-colors border-border-primary/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-accent/20 bg-accent/10 text-accent transition-all">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">App Info & Version</h2>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-45 text-text-secondary">Ventory Ecosystem</p>
            </div>
          </div>
          <button 
            onClick={toggleAppInfoModal}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 hidden-scrollbar space-y-10">
          
          {/* Current Version Card */}
          <div className="p-6 rounded-3xl border relative overflow-hidden group transition-all duration-500 bg-accent/10 border-accent/20 shadow-sm">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors bg-accent/20 group-hover:bg-accent/30" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 block text-accent">Current Release</span>
                <h3 className="text-4xl font-black tracking-tighter">v{CHANGELOG[0].version}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold opacity-40 uppercase mb-1">Status</span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Development Build</span>
              </div>
            </div>
          </div>

          {/* Changelog Sections */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <History size={18} className="opacity-40" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Update Historie</h4>
            </div>

            <div className="space-y-4">
              {CHANGELOG.map((log) => {
                const isExpanded = expandedVersions.includes(log.version);
                return (
                  <div 
                    key={log.version} 
                    className={cn(
                      "rounded-[2rem] border transition-all duration-500 overflow-hidden",
                      isExpanded 
                        ? "bg-black/5 dark:bg-white/5 border-border-primary/50 shadow-sm" 
                        : "bg-transparent border-border-primary/20 hover:border-border-primary/45"
                    )}
                  >
                    {/* Version Header (Clickable) */}
                    <button 
                      onClick={() => toggleVersion(log.version)}
                      className="w-full flex items-center justify-between p-6 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-xs font-black px-3 py-1 rounded-full border transition-all",
                          isExpanded 
                            ? "bg-accent/10 text-accent border-accent/20" 
                            : "bg-inactive-btn-bg text-inactive-btn-text border-border-primary/10 group-hover:border-border-primary/30"
                        )}>
                          v{log.version}
                        </span>
                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-tight">{log.date}</span>
                      </div>
                      <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {/* Version Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-6 pb-8 space-y-5">
                            {log.changes.added && (
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-emerald-500/5 border-emerald-500/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <Zap size={14} /> Neu hinzugefügt
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.added.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
                                      <span className="text-emerald-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {log.changes.improved && (
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-accent/5 border-accent/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                                  <Sparkles size={14} /> Verbesserungen
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.improved.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
                                      <span className="text-accent/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {log.changes.fixed && (
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-heart/5 border-heart/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-heart uppercase tracking-widest">
                                  <ShieldCheck size={14} /> Behoben
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.fixed.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
                                      <span className="text-heart/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t text-center transition-colors border-border-primary/30 bg-black/5 dark:bg-white/5">
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.3em]">
            Built with ❤️ by Vibe-Coding © 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
