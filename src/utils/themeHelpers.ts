export const applyGlobalTheme = (colors: any) => {
  const root = document.documentElement;
  Object.keys(colors).forEach((key) => {
    // Map the camelCase key to CSS variable format or just use the backend format
    // For simplicity, we assume the object keys match the expected var properties
    const cssVars: Record<string, string> = {
      bg: '--bg-color',
      card: '--card-bg',
      textDark: '--text-dark',
      textGrey: '--text-grey',
      border: '--input-border',
      heart: '--heart-color',
      glassBg: '--theme-glass-bg',
      glassBorder: '--theme-glass-border'
    };

    if (cssVars[key] && colors[key]) {
      root.style.setProperty(cssVars[key], colors[key]);
    }
  });
};

export const applyBaseMode = (theme: string) => {
  const root = document.documentElement;
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#f4f5f9');
    root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--text-dark', '#111827');
    root.style.setProperty('--text-grey', '#4b5563');
    root.style.setProperty('--input-border', 'rgba(255, 255, 255, 0.8)');
    root.style.setProperty('--theme-glass-bg', 'rgba(255, 255, 255, 0.25)');
    root.style.setProperty('--theme-glass-border', 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--scrollbar-glass-thumb', 'rgba(0, 0, 0, 0.2)');
    root.style.setProperty('--scrollbar-glass-hover', 'rgba(0, 0, 0, 0.4)');
  } else {
    // Dark mode defaults
    root.style.setProperty('--bg-color', '#1a1a1a');
    root.style.setProperty('--card-bg', '#2a2a2a');
    root.style.setProperty('--text-dark', '#ffffff');
    root.style.setProperty('--text-grey', '#a0a0a0');
    root.style.setProperty('--input-border', '#404040');
    root.style.setProperty('--theme-glass-bg', 'rgba(42, 42, 42, 0.45)');
    root.style.setProperty('--theme-glass-border', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--scrollbar-glass-thumb', 'rgba(255, 255, 255, 0.2)');
    root.style.setProperty('--scrollbar-glass-hover', 'rgba(255, 255, 255, 0.4)');
  }
};
