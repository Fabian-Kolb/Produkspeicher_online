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

  it('sollte customTheme hinzufügen, aktualisieren und löschen', async () => {
    const store = useAppStore.getState();
    
    // Add a custom theme
    await store.addCustomTheme({
      name: 'Custom Pink',
      isDark: true,
      isGlassEnabled: true,
      colors: {
        bg: '#2f1f25',
        card: '#3d252c',
        border: '#4d333b',
        textDark: '#faebf0',
        textGrey: '#cfa1ad',
        accent: '#f472b6',
        accentHover: '#db2777',
        inactiveBtnBg: '#4d333b',
        inactiveBtnText: '#9b7681',
        heart: '#f43f5e',
        glassBg: 'rgba(61, 37, 44, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.1)'
      }
    });

    let updatedStore = useAppStore.getState();
    expect(updatedStore.settings.customThemes.length).toBe(1);
    expect(updatedStore.settings.customThemes[0].name).toBe('Custom Pink');
    expect(updatedStore.settings.customThemes[0].isDark).toBe(true);
    expect(updatedStore.settings.customThemes[0].isGlassEnabled).toBe(true);
    
    // The newly created theme should be set as active and glass enabled
    const createdThemeId = updatedStore.settings.customThemes[0].id;
    expect(updatedStore.settings.activeThemeId).toBe(createdThemeId);
    expect(updatedStore.settings.isGlassEnabled).toBe(true);

    // Update the custom theme name and options
    await store.updateCustomTheme(createdThemeId, {
      name: 'Custom Pink updated',
      isGlassEnabled: false
    });

    updatedStore = useAppStore.getState();
    expect(updatedStore.settings.customThemes[0].name).toBe('Custom Pink updated');
    expect(updatedStore.settings.customThemes[0].isGlassEnabled).toBe(false);
    
    // The active theme settings should update in sync
    expect(updatedStore.settings.isGlassEnabled).toBe(false);

    // Delete the custom theme
    await store.deleteCustomTheme(createdThemeId);
    updatedStore = useAppStore.getState();
    expect(updatedStore.settings.customThemes.length).toBe(0);
    
    // Should fallback to default-dark-glass and enable glass
    expect(updatedStore.settings.activeThemeId).toBe('default-dark-glass');
    expect(updatedStore.settings.isGlassEnabled).toBe(true);
  });

  it('sollte in den Gast-Modus wechseln und Beispieldaten vorbefuellen', () => {
    const store = useAppStore.getState();
    store.enterGuestMode();

    const guestStore = useAppStore.getState();
    expect(guestStore.isGuest).toBe(true);
    expect(guestStore.isDemoMode).toBe(true);
    expect(guestStore.userName).toBe('Gast');
    expect(guestStore.userId).toBe('guest-user');
    expect(guestStore.products.length).toBeGreaterThan(0);
    expect(guestStore.bundles.length).toBeGreaterThan(0);
  });

  it('sollte im Gast-Modus Mutationen isoliert und ohne Supabase-Schreibzugriffe ausführen', async () => {
    const { supabase } = await import('../lib/supabase');
    vi.clearAllMocks();

    const store = useAppStore.getState();
    store.enterGuestMode();

    // Produkt lokal hinzufügen
    const initialCount = useAppStore.getState().products.length;
    await store.addProduct({
      name: 'Test Guest Product',
      shop: 'Demo Store',
      url: 'https://demo.de',
      mainCat: 'Hardware',
      subCats: ['Gadgets'],
      price: 99,
      discount: 0,
      finalPrice: 99,
      rating: 5,
      details: 'Guest Test Item',
      imgs: ['https://placeholder.jpg'],
      isFavorite: false,
      status: 'active'
    });

    const afterAdd = useAppStore.getState();
    expect(afterAdd.products.length).toBe(initialCount + 1);
    const addedProduct = afterAdd.products.find(p => p.name === 'Test Guest Product');
    expect(addedProduct).toBeDefined();

    // Produkt lokal updaten
    await store.updateProduct(addedProduct!.id, { name: 'Updated Guest Product' });
    expect(useAppStore.getState().products.find(p => p.id === addedProduct!.id)?.name).toBe('Updated Guest Product');

    // Produkt lokal löschen
    await store.deleteProduct(addedProduct!.id);
    expect(useAppStore.getState().products.find(p => p.id === addedProduct!.id)).toBeUndefined();

    // Es dürfen keine Supabase 'insert' Aufrufe erfolgt sein
    expect(supabase.from).not.toHaveBeenCalledWith('products');
  });

  it('sollte den Gast-Modus beim Logout sauber zuruecksetzen', () => {
    const store = useAppStore.getState();
    store.enterGuestMode();
    expect(useAppStore.getState().isGuest).toBe(true);

    store.exitGuestMode();
    const cleanStore = useAppStore.getState();
    expect(cleanStore.isGuest).toBe(false);
    expect(cleanStore.isDemoMode).toBe(false);
    expect(cleanStore.userId).toBeNull();
    expect(cleanStore.products).toEqual([]);
    expect(cleanStore.bundles).toEqual([]);
  });
});
