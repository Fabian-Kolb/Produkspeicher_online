import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, AppSettings, Bundle, Website, CustomTheme } from '../types';

interface AppState {
  products: Product[];
  categories: string[];
  subCats: Record<string, string[]>;
  websites: Website[];
  websiteCats: string[];
  collections: Bundle[];
  settings: AppSettings;
  bundles: Bundle[];

  // Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setProducts: (products: Product[]) => void;
  setBundles: (bundles: Bundle[]) => void;

  addCategory: (cat: string) => void;
  deleteCategory: (cat: string) => void;
  addSubCategory: (mainCat: string, subCat: string) => void;
  deleteSubCategory: (mainCat: string, subCat: string) => void;

  addWebsite: (web: Website) => void;
  deleteWebsite: (name: string) => void;
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  addCustomTheme: (theme: Omit<CustomTheme, 'id'>) => void;
  updateCustomTheme: (id: string, theme: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;

  addBundle: (bundle: Omit<Bundle, 'id' | 'dateAdded'>) => void;
  updateBundle: (id: string, bundle: Partial<Bundle>) => void;
  deleteBundle: (id: string) => void;
}

const defaultCategories = ['Hardware', 'Software', 'Setup', 'Clothing', 'Home'];
const defaultSubCats = {
  'Hardware': ['Laptops', 'Kameras', 'Monitore', 'Tastaturen', 'Mäuse', 'Audio', 'Tablets', 'Gaming', 'Gadgets'],
  'Software': ['Design', 'Audio', 'Coding', 'Web', 'Produktivität'],
  'Setup': ['Tische', 'Stühle', 'Beleuchtung', 'Mikrofone', 'Deko'],
  'Clothing': ['Jacken', 'Schuhe', 'Hosen', 'T-Shirts', 'Accessoires', 'Outdoor', 'Bags'],
  'Home': ['Audio', 'Beleuchtung', 'Gadgets', 'Küche', 'Deko']
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      products: [],
      categories: defaultCategories,
      subCats: defaultSubCats,
      websites: [],
      websiteCats: ['Allgemein', 'Mode'],
      collections: [],
      settings: {
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
        lastSyncDate: new Date().toISOString()
      },
      bundles: [],

      addProduct: (product) => set((state) => ({ 
        products: [...state.products, { ...product, id: crypto.randomUUID() }] 
      })),
      updateProduct: (id, updated) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updated } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      setProducts: (products) => set({ products }),

      addCategory: (cat) => set((state) => ({
        categories: [...state.categories, cat],
        subCats: { ...state.subCats, [cat]: [] }
      })),
      deleteCategory: (cat) => set((state) => {
        const newCats = state.categories.filter(c => c !== cat);
        const newSubCats = { ...state.subCats };
        delete newSubCats[cat];
        return { categories: newCats, subCats: newSubCats };
      }),
      addSubCategory: (mainCat, subCat) => set((state) => {
        const current = state.subCats[mainCat] || [];
        if (current.includes(subCat)) return state;
        return { subCats: { ...state.subCats, [mainCat]: [...current, subCat] } };
      }),
      deleteSubCategory: (mainCat, subCat) => set((state) => {
        const current = state.subCats[mainCat] || [];
        return { subCats: { ...state.subCats, [mainCat]: current.filter(s => s !== subCat) } };
      }),

      addWebsite: (web) => set((state) => ({ websites: [...state.websites, web] })),
      deleteWebsite: (name) => set((state) => ({
        websites: state.websites.filter(w => w.n !== name)
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      addCustomTheme: (theme) => set((state) => ({
        settings: {
          ...state.settings,
          customThemes: [...state.settings.customThemes, { ...theme, id: crypto.randomUUID() } as CustomTheme]
        }
      })),
      updateCustomTheme: (id, updatedTheme) => set((state) => ({
        settings: {
          ...state.settings,
          customThemes: state.settings.customThemes.map(t => t.id === id ? { ...t, ...updatedTheme } : t)
        }
      })),
      deleteCustomTheme: (id) => set((state) => ({
        settings: {
          ...state.settings,
          customThemes: state.settings.customThemes.filter(t => t.id !== id),
          activeThemeId: state.settings.activeThemeId === id ? 'default' : state.settings.activeThemeId
        }
      })),

      addBundle: (bundle) => set((state) => ({
        bundles: [...state.bundles, { ...bundle, id: crypto.randomUUID(), dateAdded: new Date().toISOString() }]
      })),
      updateBundle: (id, updated) => set((state) => ({
        bundles: state.bundles.map(b => b.id === id ? { ...b, ...updated } : b)
      })),
      deleteBundle: (id) => set((state) => ({
        bundles: state.bundles.filter(b => b.id !== id)
      })),
      setBundles: (bundles) => set({ bundles })
    }),
    {
      name: 'produktspeicher-storage',
    }
  )
);
