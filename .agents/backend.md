# Backend & Data fetching Guidelines

## Database & Authentication
- Wir nutzen Supabase für die Datenbank und Auth.
- Supabase-Clients werden extern instanziiert und nach Möglichkeit geteilt.
- Keine direkten SQL-Abfragen im Client. Nutze die Supabase JS Library (`supabase.from(...)`).

## Data Flow
- Alles was vom Backend kommt, muss zur Sicherheit validiert oder entsprechend stark typisiert werden.
- Fehler beim Laden oder Speichern müssen im Frontend sichtbar abgefangen werden (z.B. per Toast/Notification).

## Store Synchrnization
- Zustand-Stores fungieren als Zwischenschicht. Wenn Daten geladen werden, fließen sie vom Supabase-Client in den Zustand-Store und von dort in die UI.
