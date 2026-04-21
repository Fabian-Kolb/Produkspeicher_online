import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product, AppSettings, Bundle, Website, CustomTheme } from '../types';
import { createDemoData } from '../utils/demoData';

interface AppState {
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
  setUserId: (id: string | null) => void;
  setUserName: (name: string | null) => void;
  fetchAllData: (userId: string) => Promise<void>;

  // Actions
  toggleDemoMode: () => void;
  _refreshView: () => void;

  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (cat: string) => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (cat: string) => Promise<void>;
  addSubCategory: (mainCat: string, subCat: string) => Promise<void>;
  deleteSubCategory: (mainCat: string, subCat: string) => Promise<void>;

  addWebsite: (web: Website) => Promise<void>;
  deleteWebsite: (name: string) => Promise<void>;
  
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
  customThemes: [
    {
      id: 'default',
      name: 'Default Dark',
      colors: {
        bg: '#1a1a1a', card: '#2a2a2a', textDark: '#ffffff', textGrey: '#a0a0a0', 
        border: '#404040', heart: '#FF3366', glassBg: 'rgba(42, 42, 42, 0.7)', glassBorder: 'rgba(255, 255, 255, 0.1)'
      }
    }
  ],
  activeThemeId: 'default',
  mobileGrid: 'multi',
};

// Helper function to update app_state in Supabase
const syncAppState = async (userId: string, state: any) => {
  if (!userId) return;
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
  isDemoMode: localStorage.getItem('ventory_demo_mode') === 'true',
  _dbProducts: [],
  _dbBundles: [],
  products: [],
  categories: defaultCategories,
  subCats: defaultSubCats,
  websites: [],
  websiteCats: ['Allgemein', 'Mode'],
  bundles: [],
  settings: defaultSettings,
  userId: null,
  userName: null,

  setUserId: (userId) => set({ userId }),
  setUserName: (userName) => set({ userName }),

  toggleDemoMode: () => {
    const newVal = !get().isDemoMode;
    localStorage.setItem('ventory_demo_mode', String(newVal));
    set({ isDemoMode: newVal });
    get()._refreshView();
  },

  _refreshView: () => {
    const { isDemoMode, _dbProducts, _dbBundles } = get();
    if (isDemoMode) {
      const demo = createDemoData();
      set({ products: demo.products, bundles: demo.bundles });
    } else {
      set({ products: _dbProducts, bundles: _dbBundles });
    }
  },

  fetchAllData: async (userId) => {
    set({ userId, isDemoMode: false });
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
        websiteCats: sData.websiteCats || ['Allgemein', 'Mode'],
        settings: sData.settings || defaultSettings
      });
    } else {
      // Initialize app state for new user
      await syncAppState(userId, get());
    }
  },

  updateProduct: async (id, updated) => {
    const { isDemoMode } = get();
    const updateData = { ...updated };
    if (updated.status === 'bought') {
      updateData.dateBought = new Date().toISOString();
    }

    if (isDemoMode) {
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
    const { isDemoMode } = get();
    if (isDemoMode) {
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
    await syncAppState(get().userId!, get());
  },

  renameCategory: async (oldName, newName) => {
    const { userId, products, _dbProducts, subCats, categories } = get();
    if (!userId) return;

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

    await syncAppState(userId, { ...get(), categories: newCategories, subCats: newSubCats });
    await supabase.from('products').update({ mainCat: newName }).eq('user_id', userId).eq('mainCat', oldName);
  },

  deleteCategory: async (cat) => {
    const { userId, products, _dbProducts } = get();
    if (!userId) return;

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
    await syncAppState(userId, get());
    await supabase.from('products').update({ mainCat: 'Alle' }).eq('user_id', userId).eq('mainCat', cat);
  },

  addSubCategory: async (mainCat, subCat) => {
    set((state) => {
      const current = state.subCats[mainCat] || [];
      if (current.includes(subCat)) return state;
      return { subCats: { ...state.subCats, [mainCat]: [...current, subCat] } };
    });
    await syncAppState(get().userId!, get());
  },

  deleteSubCategory: async (mainCat, subCat) => {
    set((state) => {
      const current = state.subCats[mainCat] || [];
      return { subCats: { ...state.subCats, [mainCat]: current.filter(s => s !== subCat) } };
    });
    await syncAppState(get().userId!, get());
  },

  addWebsite: async (web) => {
    const { userId } = get();
    if (!userId) return;
    const newWeb = { ...web, id: crypto.randomUUID() };
    set((state) => ({ websites: [...state.websites, newWeb] }));
    await supabase.from('websites').insert([{ ...newWeb, user_id: userId }]);
  },

  deleteWebsite: async (name) => {
    const { websites } = get();
    const site = websites.find(w => w.n === name);
    if (!site) return;
    set((state) => ({
      websites: state.websites.filter(w => w.n !== name)
    }));
    if ((site as any).id) {
       await supabase.from('websites').delete().eq('id', (site as any).id);
    }
  },

  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
    await syncAppState(get().userId!, get());
  },

  addCustomTheme: async (theme) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customThemes: [...state.settings.customThemes, { ...theme, id: crypto.randomUUID() } as CustomTheme]
      }
    }));
    await syncAppState(get().userId!, get());
  },

  updateCustomTheme: async (id, updatedTheme) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customThemes: state.settings.customThemes.map(t => t.id === id ? { ...t, ...updatedTheme } : t)
      }
    }));
    await syncAppState(get().userId!, get());
  },

  deleteCustomTheme: async (id) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customThemes: state.settings.customThemes.filter(t => t.id !== id),
        activeThemeId: state.settings.activeThemeId === id ? 'default' : state.settings.activeThemeId
      }
    }));
    await syncAppState(get().userId!, get());
  },

  addBundle: async (bundle) => {
    const { userId, isDemoMode } = get();
    if (!userId) return;
    const newBundle = { ...bundle, id: crypto.randomUUID(), dateAdded: new Date().toISOString() };
    if (isDemoMode) {
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
    const { isDemoMode } = get();
    if (isDemoMode) {
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
    const { isDemoMode } = get();
    if (isDemoMode) {
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
