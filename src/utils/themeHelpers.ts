export const THEME_PRESETS = [
  {
    id: 'default-dark',
    name: 'Default Dark',
    isDark: true,
    colors: {
      bg: '#1a1a1a',
      card: '#252525',
      border: '#333333',
      textDark: '#ffffff',
      textGrey: '#a0a0a0',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      inactiveBtnBg: '#333333',
      inactiveBtnText: '#888888',
      heart: '#ef4444',
      glassBg: 'rgba(37, 37, 37, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.08)'
    }
  },
  {
    id: 'default-light',
    name: 'Default Light',
    isDark: false,
    colors: {
      bg: '#f4f5f9',
      card: '#ffffff',
      border: '#e2e8f0',
      textDark: '#111827',
      textGrey: '#4b5563',
      accent: '#3b82f6',
      accentHover: '#1d4ed8',
      inactiveBtnBg: '#f1f5f9',
      inactiveBtnText: '#94a3b8',
      heart: '#ef4444',
      glassBg: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(0, 0, 0, 0.06)'
    }
  },
  {
    id: 'nordic-forest',
    name: 'Nordic Forest',
    isDark: true,
    colors: {
      bg: '#0a1c15',
      card: '#112c21',
      border: '#1b4233',
      textDark: '#e6f4ea',
      textGrey: '#8fa89b',
      accent: '#10b981',
      accentHover: '#059669',
      inactiveBtnBg: '#1b4233',
      inactiveBtnText: '#638575',
      heart: '#f43f5e',
      glassBg: 'rgba(17, 44, 33, 0.65)',
      glassBorder: 'rgba(255, 255, 255, 0.1)'
    }
  },
  {
    id: 'rose-petal',
    name: 'Rose Petal',
    isDark: true,
    colors: {
      bg: '#1f1315',
      card: '#2d1d20',
      border: '#422b2f',
      textDark: '#faebee',
      textGrey: '#bfa1a6',
      accent: '#ec4899',
      accentHover: '#db2777',
      inactiveBtnBg: '#422b2f',
      inactiveBtnText: '#96757c',
      heart: '#f43f5e',
      glassBg: 'rgba(45, 29, 32, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.1)'
    }
  }
];

export function rgbaToHexAndAlpha(rgba: string): { hex: string; alpha: number } {
  if (!rgba) return { hex: '#ffffff', alpha: 0.5 };
  
  // Trim and check format
  const trimmed = rgba.replace(/\s+/g, '');
  const match = trimmed.match(/^rgba?\((\d+),(\d+),(\d+),?([\d.]+)?\)$/);
  if (!match) {
    // Maybe it's a hex already?
    if (trimmed.startsWith('#')) {
      return { hex: trimmed, alpha: 1 };
    }
    return { hex: '#ffffff', alpha: 0.5 };
  }
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return {
    hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    alpha: a
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  // Handle shorthand hex like #fff
  const fullHex = hex.length === 4 
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex;
      
  if (fullHex.startsWith('#') && fullHex.length === 7) {
    r = parseInt(fullHex.slice(1, 3), 16);
    g = parseInt(fullHex.slice(3, 5), 16);
    b = parseInt(fullHex.slice(5, 7), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const applyGlobalTheme = (colors: any, isDark: boolean = true) => {
  const root = document.documentElement;
  
  // Safe fallbacks for backward compatibility
  const accent = colors.accent || '#3b82f6';
  const accentHover = colors.accentHover || (isDark ? '#2563eb' : '#1d4ed8');
  const inactiveBtnBg = colors.inactiveBtnBg || (isDark ? '#333333' : '#f1f5f9');
  const inactiveBtnText = colors.inactiveBtnText || colors.textGrey || (isDark ? '#888888' : '#94a3b8');

  const cssVars: Record<string, string> = {
    bg: '--bg-color',
    card: '--card-bg',
    textDark: '--text-dark',
    textGrey: '--text-grey',
    border: '--input-border',
    heart: '--heart-color',
    glassBg: '--theme-glass-bg',
    glassBorder: '--theme-glass-border',
  };

  Object.entries(cssVars).forEach(([key, varName]) => {
    if (colors[key]) {
      root.style.setProperty(varName, colors[key]);
    }
  });

  // Apply new design system accent / button variables
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--accent-hover-color', accentHover);
  root.style.setProperty('--inactive-btn-bg', inactiveBtnBg);
  root.style.setProperty('--inactive-btn-text', inactiveBtnText);
  root.style.setProperty('--scrollbar-glass-thumb', isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)');
  root.style.setProperty('--scrollbar-glass-hover', isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)');
};

export const applyBaseMode = (theme: string) => {
  const preset = THEME_PRESETS.find(p => p.id === `default-${theme}`) || THEME_PRESETS[0];
  applyGlobalTheme(preset.colors, preset.isDark);
};
