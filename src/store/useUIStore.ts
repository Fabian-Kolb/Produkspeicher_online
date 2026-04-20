import { create } from 'zustand';

// Transient UI state that shouldn't be persisted to localStorage
interface UIState {
  currentView: 'dashboard' | 'products' | 'saved' | 'bundles' | 'budget' | 'deals';
  isMainMenuOpen: boolean;
  isThemeManagerOpen: boolean;
  isProfileModalOpen: boolean;
  isCategoryMenuOpen: boolean;

  // Products View State
  mainCat: string;
  selectedSubCats: string[];
  sortMode: 'default' | 'priceAsc' | 'priceDesc' | 'newest' | 'oldest';
  searchQuery: string;
  statusFilter: 'active' | 'bought' | 'reduced';

  // Actions
  setView: (view: UIState['currentView']) => void;
  toggleMainMenu: () => void;
  toggleThemeManager: () => void;
  toggleProfileModal: () => void;
  toggleCategoryMenu: () => void;
  closeCategoryMenu: () => void;

  isProductModalOpen: boolean;
  editingProductId: string | null;
  productDraft: Partial<import('../types').Product> | null;
  bundleDraft: { name: string; items: import('../types').BundleItem[] } | null;
  activeBundleId: string | null;
  openProductModal: (productId?: string) => void;
  closeProductModal: () => void;
  isProductDetailModalOpen: boolean;
  viewingProductId: string | null;
  openProductDetailModal: (productId: string) => void;
  closeProductDetailModal: () => void;
  setProductDraft: (draft: Partial<import('../types').Product> | null) => void;
  setBundleDraft: (draft: { name: string; items: import('../types').BundleItem[] } | null) => void;
  setActiveBundleId: (id: string | null) => void;

  setMainCat: (cat: string) => void;
  toggleSubCat: (subCat: string) => void;
  setSortMode: (mode: UIState['sortMode']) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: UIState['statusFilter']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'dashboard',
  isMainMenuOpen: false,
  isThemeManagerOpen: false,
  isProfileModalOpen: false,
  isCategoryMenuOpen: false,
  isProductModalOpen: false,
  editingProductId: null,
  productDraft: null,
  bundleDraft: null,
  activeBundleId: null,
  isProductDetailModalOpen: false,
  viewingProductId: null,

  mainCat: 'Alle',
  selectedSubCats: [],
  sortMode: 'default',
  searchQuery: '',
  statusFilter: 'active',

  setView: (view) => set({ currentView: view }),
  toggleMainMenu: () => set((state) => ({ isMainMenuOpen: !state.isMainMenuOpen })),
  toggleThemeManager: () => set((state) => ({ isThemeManagerOpen: !state.isThemeManagerOpen })),
  toggleProfileModal: () => set((state) => ({ isProfileModalOpen: !state.isProfileModalOpen })),
  toggleCategoryMenu: () => set((state) => ({ isCategoryMenuOpen: !state.isCategoryMenuOpen, isThemeManagerOpen: false })),
  closeCategoryMenu: () => set({ isCategoryMenuOpen: false }),

  openProductModal: (productId?: string) => set({ isProductModalOpen: true, editingProductId: productId || null }),
  closeProductModal: () => set({ isProductModalOpen: false, editingProductId: null }),
  setProductDraft: (draft) => set({ productDraft: draft }),
  setBundleDraft: (draft) => set({ bundleDraft: draft }),
  setActiveBundleId: (id) => set({ activeBundleId: id }),
  openProductDetailModal: (productId) => set({ isProductDetailModalOpen: true, viewingProductId: productId }),
  closeProductDetailModal: () => set({ isProductDetailModalOpen: false, viewingProductId: null }),

  setMainCat: (cat) => set({ mainCat: cat, selectedSubCats: [] }),
  toggleSubCat: (subCat) => set((state) => {
    if (subCat === 'Alle') return { selectedSubCats: [] };
    const exists = state.selectedSubCats.includes(subCat);
    if (exists) {
      return { selectedSubCats: state.selectedSubCats.filter(s => s !== subCat) };
    } else {
      return { selectedSubCats: [...state.selectedSubCats, subCat] };
    }
  }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
