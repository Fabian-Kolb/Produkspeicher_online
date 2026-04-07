import { create } from 'zustand';

// Transient UI state that shouldn't be persisted to localStorage
interface UIState {
  currentView: 'dashboard' | 'products' | 'saved' | 'bundles' | 'analytics' | 'deals';
  isMainMenuOpen: boolean;
  isThemeManagerOpen: boolean;
  isProfileModalOpen: boolean;
  
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

  isProductModalOpen: boolean;
  editingProductId: string | null;
  openProductModal: (productId?: string) => void;
  closeProductModal: () => void;
  
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
  isProductModalOpen: false,
  editingProductId: null,
  
  mainCat: 'Alle',
  selectedSubCats: [],
  sortMode: 'default',
  searchQuery: '',
  statusFilter: 'active',
  
  setView: (view) => set({ currentView: view }),
  toggleMainMenu: () => set((state) => ({ isMainMenuOpen: !state.isMainMenuOpen })),
  toggleThemeManager: () => set((state) => ({ isThemeManagerOpen: !state.isThemeManagerOpen })),
  toggleProfileModal: () => set((state) => ({ isProfileModalOpen: !state.isProfileModalOpen })),
  
  openProductModal: (productId?: string) => set({ isProductModalOpen: true, editingProductId: productId || null }),
  closeProductModal: () => set({ isProductModalOpen: false, editingProductId: null }),
  
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
