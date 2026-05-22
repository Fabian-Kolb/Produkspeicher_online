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

  it('sollte Kategorien erfolgreich sortieren/reordnen', async () => {
    const store = useAppStore.getState();
    await store.reorderCategories(['Software', 'Hardware']);

    const updatedStore = useAppStore.getState();
    expect(updatedStore.categories).toEqual(['Software', 'Hardware']);
  });

  it('sollte eine Website-Kategorie hinzufügen', async () => {
    const store = useAppStore.getState();
    useAppStore.setState({ websiteCats: ['Allgemein', 'Mode'] });
    await store.addWebsiteCat('Elektronik');

    const updatedStore = useAppStore.getState();
    expect(updatedStore.websiteCats).toContain('Elektronik');
  });

  it('sollte eine Website-Kategorie loeschen und Shops zu Allgemein aendern', async () => {
    const store = useAppStore.getState();
    useAppStore.setState({
      websiteCats: ['Allgemein', 'Mode', 'Elektronik'],
      websites: [
        { n: 'Shop1', u: 'https://shop1.de', c: 'Elektronik', s: 'S' },
        { n: 'Shop2', u: 'https://shop2.de', c: 'Mode', s: 'S' }
      ]
    });
    await store.deleteWebsiteCat('Elektronik');

    const updatedStore = useAppStore.getState();
    expect(updatedStore.websiteCats).not.toContain('Elektronik');
    expect(updatedStore.websites.find(w => w.n === 'Shop1')?.c).toBe('Allgemein');
    expect(updatedStore.websites.find(w => w.n === 'Shop2')?.c).toBe('Mode');
  });

  it('sollte Website-Kategorien erfolgreich sortieren/reordnen', async () => {
    const store = useAppStore.getState();
    useAppStore.setState({ websiteCats: ['Allgemein', 'Mode'] });
    await store.reorderWebsiteCats(['Mode', 'Allgemein']);

    const updatedStore = useAppStore.getState();
    expect(updatedStore.websiteCats).toEqual(['Mode', 'Allgemein']);
  });
});
