import { describe, it, expect, beforeEach } from 'vitest';
import { applyBaseMode } from './themeHelpers';

describe('themeHelpers', () => {
  beforeEach(() => {
    // Setzen wir die Dokument-Styles und Klassen vor jedem Test zurück
    document.documentElement.style.cssText = '';
    document.documentElement.className = '';
  });

  it('applies light mode CSS variables to the document root and removes dark class', () => {
    applyBaseMode('light');
    
    // Prüfen, ob die korrekten Hex-Codes für Light Mode gesetzt wurden
    expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#f4f5f9');
    expect(document.documentElement.style.getPropertyValue('--text-dark')).toBe('#111827');
    expect(document.documentElement.style.getPropertyValue('--input-border')).toBe('#e2e8f0');
    expect(document.documentElement.style.getPropertyValue('--theme-glass-bg')).toBe('rgba(255, 255, 255, 0.7)');
    expect(document.documentElement.style.getPropertyValue('--theme-glass-border')).toBe('rgba(0, 0, 0, 0.06)');
    
    // Prüfen, dass 'dark' Klasse nicht gesetzt ist
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies dark mode CSS variables to the document root and adds dark class', () => {
    applyBaseMode('dark');
    
    // Prüfen, ob die korrekten Hex-Codes für Dark Mode gesetzt wurden
    expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#1a1a1a');
    expect(document.documentElement.style.getPropertyValue('--text-dark')).toBe('#ffffff');
    
    // Prüfen, dass 'dark' Klasse gesetzt ist
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
