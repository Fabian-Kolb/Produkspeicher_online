import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeCreatorModal } from './ThemeCreatorModal';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { rgbaToHexAndAlpha, hexToRgba, applyGlobalTheme } from '../../utils/themeHelpers';

describe('ThemeCreatorModal Live Preview & Design System Empirical Tests', () => {
  beforeEach(() => {
    // Reset Stores to default state before each test
    useUIStore.setState({
      isThemeManagerOpen: true,
    });

    useAppStore.setState({
      settings: {
        theme: 'dark',
        activeThemeId: 'default-dark-solid',
        isGlassEnabled: true,
        customThemes: [],
        categories: [],
        subCategories: {},
      },
    });

    // Reset DOM style and class mutations
    document.documentElement.style.cssText = '';
    document.documentElement.className = '';
    document.body.className = '';
  });

  it('does not render when isThemeManagerOpen is false', () => {
    useUIStore.setState({ isThemeManagerOpen: false });
    const { container } = render(<ThemeCreatorModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, standard presets, and custom themes section when open', () => {
    render(<ThemeCreatorModal />);
    expect(screen.getByText('Design & Themes')).toBeInTheDocument();
    expect(screen.getByText('Standard Presets')).toBeInTheDocument();
    expect(screen.getByText('Eigene Themes')).toBeInTheDocument();
    expect(screen.getByText('Neues Theme erstellen')).toBeInTheDocument();
  });

  it('switches to custom theme editor when "Neues Theme erstellen" is clicked', () => {
    render(<ThemeCreatorModal />);
    const newThemeBtn = screen.getByText('Neues Theme erstellen');
    fireEvent.click(newThemeBtn);

    // Verify title input, Glassmorphism toggle, and Live Preview section are visible
    expect(screen.getByPlaceholderText('Theme Name')).toBeInTheDocument();
    expect(screen.getByText('Glassmorphismus')).toBeInTheDocument();
    expect(screen.getByText('Live Vorschau')).toBeInTheDocument();
  });

  it('renders live preview with custom hex and transparent glass background colors', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    // Check default draft live preview container background
    const livePreviewTitle = screen.getByText('Live Vorschau');
    const livePreviewContainer = livePreviewTitle.closest('div.rounded-3xl') as HTMLElement;
    expect(livePreviewContainer).not.toBeNull();
    expect(livePreviewContainer.style.background).toBe('rgb(26, 26, 26)'); // #1a1a1a

    // Verify glass background color on mini dashboard widget
    const miniWidget = screen.getByText('Monatsbudget').closest('div.rounded-2xl') as HTMLElement;
    expect(miniWidget).not.toBeNull();
    expect(miniWidget.style.backgroundColor).toBe('rgba(37, 37, 37, 0.7)');
    expect(miniWidget.style.borderColor).toBe('rgba(255, 255, 255, 0.08)');
  });

  it('updates live preview container and widgets when draft theme colors change', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    // Change Theme Background input (bg)
    const inputs = screen.getAllByRole('textbox');
    // Find the input for bg color (default '#1a1a1a')
    const bgInput = inputs.find(i => (i as HTMLInputElement).value === '#1a1a1a') as HTMLInputElement;
    expect(bgInput).not.toBeUndefined();

    act(() => {
      fireEvent.change(bgInput, { target: { value: '#0f172a' } });
    });

    const livePreviewTitle = screen.getByText('Live Vorschau');
    const livePreviewContainer = livePreviewTitle.closest('div.rounded-3xl') as HTMLElement;
    expect(livePreviewContainer.style.background).toBe('rgb(15, 23, 42)');
  });

  it('renders discount badge styling using the custom draft heart color', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    const discountBadge = screen.getByText('-20%');
    expect(discountBadge).toBeInTheDocument();
    // Default heart color is #ef4444 -> rgb(239, 68, 68)
    expect(discountBadge.style.backgroundColor).toBe('rgb(239, 68, 68)');
  });

  it('renders active and inactive filter chips with correct theme colors', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    const activeChip = screen.getByText('Hardware');
    const inactiveChip = screen.getByText('Software');

    // Active chip uses accent bg (#3b82f6), bg text (#1a1a1a), accent border
    expect(activeChip.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(activeChip.style.color).toBe('rgb(26, 26, 26)');

    // Inactive chip uses card bg (#252525), textDark text (#ffffff), border (#333333)
    expect(inactiveChip.style.backgroundColor).toBe('rgb(37, 37, 37)');
    expect(inactiveChip.style.color).toBe('rgb(255, 255, 255)');
  });

  it('triggers hover state style changes on action button in live preview', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    const actionButton = screen.getByText('Aktion ausführen');
    // Initial color is accent #3b82f6 -> rgb(59, 130, 246)
    expect(actionButton.style.backgroundColor).toBe('rgb(59, 130, 246)');

    // Trigger mouseEnter -> accentHover #2563eb -> rgb(37, 99, 235)
    fireEvent.mouseEnter(actionButton);
    expect(actionButton.style.backgroundColor).toBe('rgb(37, 99, 235)');

    // Trigger mouseLeave -> reverts to accent #3b82f6 -> rgb(59, 130, 246)
    fireEvent.mouseLeave(actionButton);
    expect(actionButton.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('toggles glassmorphism and controls opacity slider for glassBg and glassBorder', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    const glassCheckbox = screen.getByRole('checkbox');
    expect(glassCheckbox).toBeChecked();

    // Verify glass color options are rendered
    expect(screen.getByText('Glas-Hintergrund')).toBeInTheDocument();
    expect(screen.getByText('Glas-Rahmen')).toBeInTheDocument();

    // Toggle glass off
    fireEvent.click(glassCheckbox);
    expect(glassCheckbox).not.toBeChecked();

    // Toggle glass back on
    fireEvent.click(glassCheckbox);
    expect(glassCheckbox).toBeChecked();

    // Change Deckkraft opacity range slider for glassBg (70% -> 50%)
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);

    act(() => {
      fireEvent.change(sliders[0], { target: { value: '50' } });
    });

    const miniWidget = screen.getByText('Monatsbudget').closest('div.rounded-2xl') as HTMLElement;
    expect(miniWidget.style.backgroundColor).toBe('rgba(37, 37, 37, 0.5)');
  });

  it('saves new custom theme to app store when "Speichern" is clicked', () => {
    render(<ThemeCreatorModal />);
    fireEvent.click(screen.getByText('Neues Theme erstellen'));

    const nameInput = screen.getByPlaceholderText('Theme Name');
    fireEvent.change(nameInput, { target: { value: 'Neon Cyberpunk' } });

    const saveBtn = screen.getByText('Speichern');
    fireEvent.click(saveBtn);

    const customThemes = useAppStore.getState().settings.customThemes;
    expect(customThemes).toHaveLength(1);
    expect(customThemes[0].name).toBe('Neon Cyberpunk');
  });

  it('closes modal when Escape key is pressed', () => {
    render(<ThemeCreatorModal />);
    expect(useUIStore.getState().isThemeManagerOpen).toBe(true);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useUIStore.getState().isThemeManagerOpen).toBe(false);
  });
});

describe('Color Helpers Utility Tests', () => {
  it('correctly converts rgba to hex and alpha', () => {
    const res1 = rgbaToHexAndAlpha('rgba(37, 37, 37, 0.7)');
    expect(res1.hex).toBe('#252525');
    expect(res1.alpha).toBe(0.7);

    const res2 = rgbaToHexAndAlpha('#3b82f6');
    expect(res2.hex).toBe('#3b82f6');
    expect(res2.alpha).toBe(1);

    const res3 = rgbaToHexAndAlpha('');
    expect(res3.hex).toBe('#ffffff');
    expect(res3.alpha).toBe(0.5);
  });

  it('correctly converts hex and alpha to rgba string', () => {
    expect(hexToRgba('#3b82f6', 0.8)).toBe('rgba(59, 130, 246, 0.8)');
    expect(hexToRgba('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('applies global CSS theme variables safely', () => {
    applyGlobalTheme({
      bg: '#000000',
      card: '#111111',
      accent: '#ff0000',
      accentHover: '#cc0000',
      inactiveBtnBg: '#222222',
      inactiveBtnText: '#888888',
      heart: '#ff0055',
    }, true);

    expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#000000');
    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--accent-hover-color')).toBe('#cc0000');
    expect(document.documentElement.style.getPropertyValue('--heart-color')).toBe('#ff0055');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
