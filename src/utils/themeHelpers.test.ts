import { describe, it, expect, beforeEach } from 'vitest';
import { applyBaseMode } from './themeHelpers';

describe('themeHelpers', () => {
  beforeEach(() => {
    // Setzen wir die Dokument-Styles vor jedem Test zurück
    document.documentElement.style.cssText = '';
  });

  it('applies light mode CSS variables to the document root', () => {
    applyBaseMode('light');
    
    // Prüfen, ob die korrekten Hex-Codes für Light Mode gesetzt wurden
    expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#f4f5f9');
    expect(document.documentElement.style.getPropertyValue('--text-dark')).toBe('#111827');
  });

  it('applies dark mode CSS variables to the document root', () => {
    applyBaseMode('dark');
    
    // Prüfen, ob die korrekten Hex-Codes für Dark Mode gesetzt wurden
    expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#1a1a1a');
    expect(document.documentElement.style.getPropertyValue('--text-dark')).toBe('#ffffff');
  });
});
