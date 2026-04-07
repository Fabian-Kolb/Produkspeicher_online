import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product, AppSettings, Bundle, Website, CustomTheme } from '../types';

interface AppState {
  products: Product[];
  categories: string[];
  subCats: Record<string, string[]>;
  websites: Website[];
  websiteCats: string[];
  bundles: Bundle[];
  settings: AppSettings;
  
  // Auth helper
  userId: string | null;
  setUserId: (id: string | null) => void;
  fetchAllData: (userId: string) => Promise<void>;

  // Actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (cat: string) => Promise<void>;
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
  
  injectDemoData: (products: Product[], bundles: Bundle[]) => Promise<void>;
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
  products: [],
  categories: defaultCategories,
  subCats: defaultSubCats,
  websites: [],
  websiteCats: ['Allgemein', 'Mode'],
  bundles: [],
  settings: defaultSettings,
  userId: null,

  setUserId: (userId) => set({ userId }),

  fetchAllData: async (userId) => {
    set({ userId });
    
    // Fetch Products
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', userId);
    if (pData) set({ products: pData as Product[] });

    // Fetch Websites
    const { data: wData } = await supabase.from('websites').select('*').eq('user_id', userId);
    if (wData) set({ websites: wData as Website[] });

    // Fetch Bundles
    const { data: bData } = await supabase.from('bundles').select('*').eq('user_id', userId);
    if (bData) set({ bundles: bData as Bundle[] });

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

  addProduct: async (product) => {
    const { userId } = get();
    if (!userId) return;
    const newProduct = { ...product, id: crypto.randomUUID() };
    set((state) => ({ products: [...state.products, newProduct as Product] }));
    await supabase.from('products').insert([{ ...newProduct, user_id: userId }]);
  },
  
  updateProduct: async (id, updated) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updated } : p)
    }));
    await supabase.from('products').update(updated).eq('id', id);
  },
  
  deleteProduct: async (id) => {
    set((state) => ({
      products: state.products.filter(p => p.id !== id)
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

  deleteCategory: async (cat) => {
    set((state) => {
      const newCats = state.categories.filter(c => c !== cat);
      const newSubCats = { ...state.subCats };
      delete newSubCats[cat];
      return { categories: newCats, subCats: newSubCats };
    });
    await syncAppState(get().userId!, get());
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
    const { userId } = get();
    if (!userId) return;
    const newBundle = { ...bundle, id: crypto.randomUUID(), dateAdded: new Date().toISOString() };
    set((state) => ({
      bundles: [...state.bundles, newBundle as Bundle]
    }));
    await supabase.from('bundles').insert([{ ...newBundle, user_id: userId }]);
  },

  updateBundle: async (id, updated) => {
    set((state) => ({
      bundles: state.bundles.map(b => b.id === id ? { ...b, ...updated } : b)
    }));
    await supabase.from('bundles').update(updated).eq('id', id);
  },

  deleteBundle: async (id) => {
    set((state) => ({
      bundles: state.bundles.filter(b => b.id !== id)
    }));
    await supabase.from('bundles').delete().eq('id', id);
  },

  injectDemoData: async (products, bundles) => {
    const { userId } = get();
    if (!userId) return;
    
    const pWithUser = products.map(p => ({ ...p, user_id: userId }));
    const bWithUser = bundles.map(b => ({ ...b, user_id: userId }));
    
    // Update local state
    set(state => ({
      products: [...state.products, ...products],
      bundles: [...state.bundles, ...bundles]
    }));
    
    // Push DB
    await supabase.from('products').insert(pWithUser);
    await supabase.from('bundles').insert(bWithUser);
  }
}));
