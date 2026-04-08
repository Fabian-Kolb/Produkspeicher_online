export interface Product {
  id: string; // or number depending on how it was generated, legacy used Date.now()
  name: string;
  shop: string;
  url: string;
  mainCat: string;
  subCats: string[];
  price: number;
  discount: number;
  finalPrice: number;
  rating: number;
  details: string;
  imgs: string[];
  mainImgIdx?: number;
  dateAdded: string;
  dateBought?: string | null;
  isFavorite: boolean;
  status: 'active' | 'bought';
  customOrder?: number;
}

export interface BundleItem {
  id: string;
  qty: number;
}

export interface Bundle {
  id: string;
  name: string;
  items: BundleItem[];
  dateAdded: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    card: string;
    textDark: string;
    textGrey: string;
    border: string;
    heart: string;
    glassBg: string;
    glassBorder: string;
  };
}

export interface AppSettings {
  theme: 'dark' | 'light' | string;
  monthlyBudget: number;
  isGlassEnabled: boolean;
  customThemes: CustomTheme[];
  activeThemeId: string;
  mobileGrid?: 'single' | 'multi';
}

export interface AppState {
  products: Product[];
  categories: string[];
  subCats: Record<string, string[]>;
  websites: Website[];
  websiteCats: string[];
  collections: Bundle[];
  settings: AppSettings;
}

export interface Website {
  id?: string;
  n: string; // name
  u: string; // url
  c: string; // category
  s: string; // short initial
}
