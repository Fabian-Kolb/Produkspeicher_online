import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GuestWelcomeModal } from './GuestWelcomeModal';
import { LegalDisclaimerModal } from './LegalDisclaimerModal';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';

describe('GuestWelcomeModal & LegalDisclaimerModal', () => {
  beforeEach(() => {
    useUIStore.setState({
      isGuestWelcomeModalOpen: false,
      isLegalDisclaimerModalOpen: false
    });
    useAppStore.setState({
      settings: {
        theme: 'dark',
        monthlyBudget: 2000,
        isGlassEnabled: true,
        modalStyle: 'glass',
        modalTheme: 'auto',
        customThemes: [],
        activeThemeId: 'default-dark-glass'
      }
    });
  });

  describe('GuestWelcomeModal', () => {
    it('sollte das Modal nicht rendern, wenn isGuestWelcomeModalOpen false ist', () => {
      render(<GuestWelcomeModal />);
      expect(screen.queryByText('Willkommen als Gast')).not.toBeInTheDocument();
    });

    it('sollte Inhalte, Einschränkungen und testbare Funktionen anzeigen, wenn geöffnet', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      expect(screen.getByText('Willkommen als Gast')).toBeInTheDocument();
      expect(screen.getByText('Vollständig testbar')).toBeInTheDocument();
      expect(screen.getByText('Eingeschränkt im Gast-Modus')).toBeInTheDocument();
      expect(screen.getByText(/Keine Cloud-Speicherung/i)).toBeInTheDocument();
      expect(screen.queryByText(/Drittanbieter-Schnittstellen/i)).not.toBeInTheDocument();
      expect(screen.getByText('Verstanden & Ausprobieren')).toBeInTheDocument();
    });

    it('sollte das Modal beim Klick auf "Verstanden & Ausprobieren" schließen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      const button = screen.getByRole('button', { name: /Verstanden & Ausprobieren/i });
      fireEvent.click(button);

      expect(useUIStore.getState().isGuestWelcomeModalOpen).toBe(false);
    });

    it('sollte das Modal bei Escape-Taste schließen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useUIStore.getState().isGuestWelcomeModalOpen).toBe(false);
    });
  });

  describe('LegalDisclaimerModal', () => {
    it('sollte das Modal nicht rendern, wenn isLegalDisclaimerModalOpen false ist', () => {
      render(<LegalDisclaimerModal />);
      expect(screen.queryByText('Datenschutz & Haftungsausschluss')).not.toBeInTheDocument();
    });

    it('sollte die 4 Kernpunkte und den exakten Eigenverantwortungs-Schlusssatz enthalten', () => {
      useUIStore.setState({ isLegalDisclaimerModalOpen: true });
      render(<LegalDisclaimerModal />);

      expect(screen.getByText('Datenschutz & Haftungsausschluss')).toBeInTheDocument();
      expect(screen.getByText(/1\. Bereitstellung „Wie besehen“ \(As-Is\)/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Haftungsausschluss & Verfügbarkeit/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Daten- & KI-Inhalte/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Eigenverantwortung/i)).toBeInTheDocument();

      // Exakter Wortlaut des Schlusssatzes
      expect(screen.getByText(/Das Betreten und Ausprobieren dieser App geschieht vollkommen auf eigene Gefahr und in reiner Selbstverantwortung – es gibt hier weder Sicherheiten noch Garantien\./i)).toBeInTheDocument();
    });

    it('sollte das Modal beim Bestätigen schließen', () => {
      useUIStore.setState({ isLegalDisclaimerModalOpen: true });
      render(<LegalDisclaimerModal />);

      const closeBtn = screen.getByRole('button', { name: /Gelesen & Akzeptiert/i });
      fireEvent.click(closeBtn);

      expect(useUIStore.getState().isLegalDisclaimerModalOpen).toBe(false);
    });

    it('sollte das Modal bei Escape-Taste schließen', () => {
      useUIStore.setState({ isLegalDisclaimerModalOpen: true });
      render(<LegalDisclaimerModal />);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useUIStore.getState().isLegalDisclaimerModalOpen).toBe(false);
    });
  });
});
