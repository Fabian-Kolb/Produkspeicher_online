import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product, AppSettings, Bundle, Website, CustomTheme } from '../types';
import { createDemoData } from '../utils/demoData';

interface AppState {
  isGuest: boolean;
  isDemoMode: boolean;
  _dbProducts: Product[];
  _dbBundles: Bundle[];
  products: Product[];
  categories: string[];
  subCats: Record<string, string[]>;
  websites: Website[];
  websiteCats: string[];
  bundles: Bundle[];
  settings: AppSettings;
  
  // Auth helper
  userId: string | null;
  userName: string | null;
  avatarUrl: string | null;
  setUserId: (id: string | null) => void;
  setUserName: (name: string | null) => void;
  setAvatarUrl: (url: string | null) => void;
  fetchAllData: (userId: string) => Promise<void>;

  // Actions
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  toggleDemoMode: () => void;
  _refreshView: () => void;

  addProduct: (product: Omit<Product, 'id' | 'dateAdded'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (cat: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (cat: string) => Promise<void>;
  reorderCategories: (newCats: string[]) => Promise<void>;
  addSubCategory: (mainCat: string, subCat: string) => Promise<void>;
  deleteSubCategory: (mainCat: string, subCat: string) => Promise<void>;

  addWebsite: (web: Website) => Promise<void>;
  deleteWebsite: (name: string) => Promise<void>;
  addWebsiteCat: (cat: string) => Promise<void>;
  deleteWebsiteCat: (cat: string) => Promise<void>;
  reorderWebsiteCats: (newCats: string[]) => Promise<void>;
  
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  addCustomTheme: (theme: Omit<CustomTheme, 'id'>) => Promise<void>;
  updateCustomTheme: (id: string, theme: Partial<CustomTheme>) => Promise<void>;
  deleteCustomTheme: (id: string) => Promise<void>;

  addBundle: (bundle: Omit<Bundle, 'id' | 'dateAdded'>) => Promise<void>;
  updateBundle: (id: string, bundle: Partial<Bundle>) => Promise<void>;
  deleteBundle: (id: string) => Promise<void>;
}

const defaultCategories = ['Hardware', 'Software', 'Setup', 'Clothing', 'Home'];
const defaultSubCats = {
  'Hardware': ['Laptops', 'Kameras', 'Monitore', 'Tastaturen', 'Mäuse', 'Audio', 'Tablets', 'Gaming', 'Gadgets'],
  'Software': ['Design', 'Audio', 'Coding', 'Web', 'Produktivität'],
  'Setup': ['Tische', 'Stühle', 'Beleuchtung', 'Mikrofone', 'Deko'],
  'Clothing': ['Jacken', 'Schuhe', 'Hosen', 'T-Shirts', 'Accessoires', 'Outdoor', 'Bags'],
  'Home': ['Audio', 'Beleuchtung', 'Gadgets', 'Küche', 'Deko']
};
const defaultSettings: AppSettings = {
  theme: 'dark',
  monthlyBudget: 2000,
  isGlassEnabled: true,
  modalStyle: 'glass',
  modalTheme: 'auto',
  customThemes: [],
  activeThemeId: 'default-dark-glass',
  mobileGrid: 'multi',
  isVibrationEnabled: true,
};

// Helper function to update app_state in Supabase
const syncAppState = async (userId: string | null, state: any) => {
  if (!userId || state.isGuest || state.isDemoMode || userId === 'guest-user') return;
  const { categories, subCats, websiteCats, settings } = state;
  await supabase.from('app_state').upsert({
    user_id: userId,
    categories,
    "subCats": subCats,
    "websiteCats": websiteCats,
    settings
  });
};

export const useAppStore = create<AppState>()((set, get) => ({
  isGuest: localStorage.getItem('ventory_is_guest') === 'true',
  isDemoMode: localStorage.getItem('ventory_demo_mode') === 'true',
  _dbProducts: [],
  _dbBundles: [],
  products: [],
  categories: defaultCategories,
  subCats: defaultSubCats,
  websites: [],
  websiteCats: ['Allgemein', 'Mode', 'Elektronik', 'Wohnen', 'Sport', 'Musik'],
  bundles: [],
  settings: defaultSettings,
  userId: null,
  userName: null,
  avatarUrl: null,

  setUserId: (userId) => set({ userId }),
  setUserName: (userName) => set({ userName }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

  enterGuestMode: () => {
    const demo = createDemoData();
    localStorage.setItem('ventory_is_guest', 'true');
    localStorage.setItem('ventory_demo_mode', 'true');
    set({
      isGuest: true,
      isDemoMode: true,
      userId: 'guest-user',
      userName: 'Gast',
      avatarUrl: null,
      products: demo.products,
      bundles: demo.bundles,
      _dbProducts: [],
      _dbBundles: [],
      categories: defaultCategories,
      subCats: defaultSubCats,
      websites: [],
      websiteCats: ['Allgemein', 'Mode', 'Elektronik', 'Wohnen', 'Sport', 'Musik'],
      settings: defaultSettings
    });
  },

  exitGuestMode: () => {
    localStorage.removeItem('ventory_is_guest');
    localStorage.removeItem('ventory_demo_mode');
    set({
      isGuest: false,
      isDemoMode: false,
      userId: null,
      userName: null,
      avatarUrl: null,
      products: [],
      bundles: [],
      _dbProducts: [],
      _dbBundles: []
    });
  },

  toggleDemoMode: () => {
    const newVal = !get().isDemoMode;
    localStorage.setItem('ventory_demo_mode', String(newVal));
    set({ isDemoMode: newVal });
    get()._refreshView();
  },

  _refreshView: () => {
    const { isDemoMode, isGuest, _dbProducts, _dbBundles } = get();
    if (isDemoMode || isGuest) {
      if (get().products.length === 0) {
        const demo = createDemoData();
        set({ products: demo.products, bundles: demo.bundles });
      }
    } else {
      set({ products: _dbProducts, bundles: _dbBundles });
    }
  },

  fetchAllData: async (userId) => {
    set({ userId, isGuest: false, isDemoMode: false });
    localStorage.setItem('ventory_is_guest', 'false');
    localStorage.setItem('ventory_demo_mode', 'false');
    
    // Fetch Products
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', userId);
    if (pData) set({ _dbProducts: pData as Product[] });

    // Fetch Websites
    const { data: wData } = await supabase.from('websites').select('*').eq('user_id', userId);
    if (wData) set({ websites: wData as Website[] });

    // Fetch Bundles
    const { data: bData } = await supabase.from('bundles').select('*').eq('user_id', userId);
    if (bData) set({ _dbBundles: bData as Bundle[] });

    // Refresh view state based on demo mode
    get()._refreshView();

    // Fetch App State
    const { data: sData } = await supabase.from('app_state').select('*').eq('user_id', userId).maybeSingle();
    if (sData) {
      set({
        categories: sData.categories || defaultCategories,
        subCats: sData.subCats || defaultSubCats,
        websiteCats: sData.websiteCats || ['Allgemein', 'Mode', 'Elektronik', 'Wohnen', 'Sport', 'Musik'],
        settings: sData.settings || defaultSettings
      });
    } else {
      // Initialize app state for new user
      await syncAppState(userId, get());
    }
  },

  addProduct: async (product) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';

    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString()
    } as Product;

    if (isLocalOnly) {
      set((state) => ({
        products: [...state.products, newProduct]
      }));
      return;
    }

    set((state) => ({
      products: [...state.products, newProduct],
      _dbProducts: [...state._dbProducts, newProduct]
    }));

    await supabase.from('products').insert([{ ...newProduct, user_id: userId }]);
  },

  updateProduct: async (id, updated) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';
    const updateData = { ...updated };
    if (updated.status === 'bought') {
      updateData.dateBought = new Date().toISOString();
    }

    if (isLocalOnly) {
      set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updateData } : p)
      }));
      return;
    }
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updateData } : p),
      _dbProducts: state._dbProducts.map(p => p.id === id ? { ...p, ...updateData } : p)
    }));
    await supabase.from('products').update(updateData).eq('id', id);
  },
  
  deleteProduct: async (id) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';
    if (isLocalOnly) {
      set((state) => ({
        products: state.products.filter(p => p.id !== id)
      }));
      return;
    }
    set((state) => ({
      products: state.products.filter(p => p.id !== id),
      _dbProducts: state._dbProducts.filter(p => p.id !== id)
    }));
    await supabase.from('products').delete().eq('id', id);
  },

  addCategory: async (cat) => {
    set((state) => ({
      categories: [...state.categories, cat],
      subCats: { ...state.subCats, [cat]: [] }
    }));
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  renameCategory: async (oldName, newName) => {
    const { userId, products, _dbProducts, subCats, categories, isGuest, isDemoMode } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';

    const newCategories = categories.map(c => c === oldName ? newName : c);
    const newSubCats = { ...subCats };
    if (newSubCats[oldName]) {
      newSubCats[newName] = newSubCats[oldName];
      delete newSubCats[oldName];
    }

    const updatedProducts = products.map(p => p.mainCat === oldName ? { ...p, mainCat: newName } : p);
    const updatedDbProducts = _dbProducts.map(p => p.mainCat === oldName ? { ...p, mainCat: newName } : p);

    set({
      categories: newCategories,
      subCats: newSubCats,
      products: updatedProducts,
      _dbProducts: updatedDbProducts
    });

    if (!isLocalOnly) {
      await syncAppState(userId, { ...get(), categories: newCategories, subCats: newSubCats });
      await supabase.from('products').update({ mainCat: newName }).eq('user_id', userId).eq('mainCat', oldName);
    }
  },

  deleteCategory: async (cat) => {
    const { userId, products, _dbProducts, isGuest, isDemoMode } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';

    const updatedProducts = products.map(p => p.mainCat === cat ? { ...p, mainCat: 'Alle' } : p);
    const updatedDbProducts = _dbProducts.map(p => p.mainCat === cat ? { ...p, mainCat: 'Alle' } : p);

    set((state) => {
      const newCats = state.categories.filter(c => c !== cat);
      const newSubCats = { ...state.subCats };
      delete newSubCats[cat];
      return { 
        categories: newCats, 
        subCats: newSubCats,
        products: updatedProducts,
        _dbProducts: updatedDbProducts
      };
    });

    if (!isLocalOnly) {
      await syncAppState(userId, get());
      await supabase.from('products').update({ mainCat: 'Alle' }).eq('user_id', userId).eq('mainCat', cat);
    }
  },

  reorderCategories: async (newCats) => {
    set({ categories: newCats });
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  addSubCategory: async (mainCat, subCat) => {
    set((state) => {
      const current = state.subCats[mainCat] || [];
      if (current.includes(subCat)) return state;
      return { subCats: { ...state.subCats, [mainCat]: [...current, subCat] } };
    });
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  deleteSubCategory: async (mainCat, subCat) => {
    set((state) => {
      const current = state.subCats[mainCat] || [];
      return { subCats: { ...state.subCats, [mainCat]: current.filter(s => s !== subCat) } };
    });
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  addWebsite: async (web) => {
    const { userId, isGuest, isDemoMode } = get();
    const newWeb = { ...web, id: crypto.randomUUID() };
    set((state) => ({ websites: [...state.websites, newWeb] }));
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await supabase.from('websites').insert([{ ...newWeb, user_id: userId }]);
    }
  },

  deleteWebsite: async (name) => {
    const { websites, userId, isGuest, isDemoMode } = get();
    const site = websites.find(w => w.n === name);
    if (!site) return;
    set((state) => ({
      websites: state.websites.filter(w => w.n !== name)
    }));
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user' && (site as any).id) {
      await supabase.from('websites').delete().eq('id', (site as any).id);
    }
  },

  addWebsiteCat: async (cat) => {
    const trimmed = cat.trim();
    if (!trimmed || get().websiteCats.includes(trimmed)) return;
    set((state) => ({
      websiteCats: [...state.websiteCats, trimmed]
    }));
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  deleteWebsiteCat: async (cat) => {
    const { userId, websites, isGuest, isDemoMode } = get();
    const updatedWebsites = websites.map(w => w.c === cat ? { ...w, c: 'Allgemein' } : w);

    set({
      websiteCats: get().websiteCats.filter(c => c !== cat),
      websites: updatedWebsites
    });

    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
      await supabase.from('websites').update({ c: 'Allgemein' }).eq('user_id', userId).eq('c', cat);
    }
  },

  reorderWebsiteCats: async (newCats) => {
    set({ websiteCats: newCats });
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  addCustomTheme: async (theme) => {
    const id = crypto.randomUUID();
    const newTheme = { ...theme, id } as CustomTheme;
    set((state) => ({
      settings: {
        ...state.settings,
        customThemes: [...state.settings.customThemes, newTheme],
        activeThemeId: id,
        isGlassEnabled: !!newTheme.isGlassEnabled
      }
    }));
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  updateCustomTheme: async (id, updatedTheme) => {
    set((state) => {
      const isEditingActive = state.settings.activeThemeId === id;
      const updatedThemes = state.settings.customThemes.map(t => t.id === id ? { ...t, ...updatedTheme } : t);
      const activeTheme = updatedThemes.find(t => t.id === id);
      return {
        settings: {
          ...state.settings,
          customThemes: updatedThemes,
          ...(isEditingActive && activeTheme ? {
            isGlassEnabled: activeTheme.isGlassEnabled !== undefined ? activeTheme.isGlassEnabled : state.settings.isGlassEnabled
          } : {})
        }
      };
    });
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  deleteCustomTheme: async (id) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customThemes: state.settings.customThemes.filter(t => t.id !== id),
        activeThemeId: state.settings.activeThemeId === id ? 'default-dark-glass' : state.settings.activeThemeId,
        isGlassEnabled: state.settings.activeThemeId === id ? true : state.settings.isGlassEnabled
      }
    }));
    const { userId, isGuest, isDemoMode } = get();
    if (!isGuest && !isDemoMode && userId && userId !== 'guest-user') {
      await syncAppState(userId, get());
    }
  },

  addBundle: async (bundle) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';
    const newBundle = { ...bundle, id: crypto.randomUUID(), dateAdded: new Date().toISOString() };
    if (isLocalOnly) {
      set((state) => ({
        bundles: [...state.bundles, newBundle as Bundle]
      }));
      return;
    }
    set((state) => ({
      bundles: [...state.bundles, newBundle as Bundle],
      _dbBundles: [...state._dbBundles, newBundle as Bundle]
    }));
    await supabase.from('bundles').insert([{ ...newBundle, user_id: userId }]);
  },

  updateBundle: async (id, updated) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';
    if (isLocalOnly) {
      set((state) => ({
        bundles: state.bundles.map(b => b.id === id ? { ...b, ...updated } : b)
      }));
      return;
    }
    set((state) => ({
      bundles: state.bundles.map(b => b.id === id ? { ...b, ...updated } : b),
      _dbBundles: state._dbBundles.map(b => b.id === id ? { ...b, ...updated } : b)
    }));
    await supabase.from('bundles').update(updated).eq('id', id);
  },

  deleteBundle: async (id) => {
    const { userId, isDemoMode, isGuest } = get();
    const isLocalOnly = isGuest || isDemoMode || !userId || userId === 'guest-user';
    if (isLocalOnly) {
      set((state) => ({
        bundles: state.bundles.filter(b => b.id !== id)
      }));
      return;
    }
    set((state) => ({
      bundles: state.bundles.filter(b => b.id !== id),
      _dbBundles: state._dbBundles.filter(b => b.id !== id)
    }));
    await supabase.from('bundles').delete().eq('id', id);
  }
}));
