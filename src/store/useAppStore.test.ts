import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './useAppStore';

// Wir mocken den Supabase-Client, damit bei Tests niemals echte Netzwerk-Calls abgefeuert werden.
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      select: vi.fn(),
    })),
  },
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Vor jedem Test setzen wir den Zustand Store in einen definierten, isolierten Status (Demo-Modus).
    useAppStore.setState({
      isDemoMode: true,
      products: [],
      categories: ['Hardware', 'Software'],
      subCats: { 'Hardware': ['Gaming'] },
      userId: 'test-user-id' // Wichtig, damit Aktionen nicht blockiert werden
    });
  });

  it('sollte eine neue Kategorie erfolgreich hinzufügen', async () => {
    const store = useAppStore.getState();
    await store.addCategory('Furniture');

    const updatedStore = useAppStore.getState();
    // Prüfen, ob Furniture im Array ist
    expect(updatedStore.categories).toContain('Furniture');
    // Prüfen, ob ein leeres Array für Unterkategorien angelegt wurde
    expect(updatedStore.subCats['Furniture']).toEqual([]);
  });
});
