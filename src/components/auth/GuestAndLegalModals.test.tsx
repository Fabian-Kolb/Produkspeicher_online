import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
      useUIStore.setState({ isGuestWelcomeModalOpen: false });
      const { container } = render(<GuestWelcomeModal />);
      expect(container.firstChild).toBeNull();
    });

    it('sollte in Schritt 1 die Schnelleinweisung mit den 4 Kernfunktionen anzeigen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      expect(screen.getByText('Willkommen bei Ventory')).toBeInTheDocument();
      expect(screen.getByText(/Was kann die App\?/i)).toBeInTheDocument();
      expect(screen.getByText('Inventar & Katalog')).toBeInTheDocument();
      expect(screen.getByText('Budget & Ausgaben')).toBeInTheDocument();
      expect(screen.getByText('Bundles & Deals')).toBeInTheDocument();
      expect(screen.getByText('Handy & Wischgesten')).toBeInTheDocument();
      expect(screen.getByText('Weiter zu den Gast-Hinweisen')).toBeInTheDocument();
    });

    it('sollte per Klick auf "Weiter zu den Gast-Hinweisen" zu Schritt 2 wechseln', async () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      const nextBtn = screen.getByRole('button', { name: /Weiter zu den Gast-Hinweisen/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('Willkommen als Gast')).toBeInTheDocument();
        expect(screen.getByText('Vollständig testbar')).toBeInTheDocument();
        expect(screen.getByText('Eingeschränkt im Gast-Modus')).toBeInTheDocument();
        expect(screen.getByText(/Keine Cloud-Speicherung/i)).toBeInTheDocument();
        expect(screen.getByText(/Hinweisfenster jederzeit aufrufbar/i)).toBeInTheDocument();
        expect(screen.getByText('Verstanden & Ausprobieren')).toBeInTheDocument();
      });
    });

    it('sollte zwischen Schritten per Tabs hin- und herwechseln', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      // Tab 2 anklicken
      const tab2 = screen.getByRole('button', { name: /2\. Gast-Hinweise/i });
      fireEvent.click(tab2);
      expect(screen.getByText('Willkommen als Gast')).toBeInTheDocument();

      // Zurück-Button anklicken
      const backBtn = screen.getByRole('button', { name: /Zurück/i });
      fireEvent.click(backBtn);
      expect(screen.getByText('Willkommen bei Ventory')).toBeInTheDocument();
    });

    it('sollte das Modal beim Klick auf "Verstanden & Ausprobieren" schließen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      // Zu Schritt 2
      fireEvent.click(screen.getByRole('button', { name: /Weiter zu den Gast-Hinweisen/i }));

      const button = screen.getByRole('button', { name: /Verstanden & Ausprobieren/i });
      fireEvent.click(button);

      expect(useUIStore.getState().isGuestWelcomeModalOpen).toBe(false);
    });

    it('sollte das App-Logo im Header anzeigen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      const logo = screen.getByAltText('Ventory Logo');
      expect(logo).toBeInTheDocument();
    });

    it('sollte das Modal beim Klick auf den Schließen-Button (X) schließen', () => {
      useUIStore.setState({ isGuestWelcomeModalOpen: true });
      render(<GuestWelcomeModal />);

      const closeBtn = screen.getByTitle('Schließen');
      fireEvent.click(closeBtn);

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
      expect(screen.queryByText('Datenschutz und Nutzungshinweise')).not.toBeInTheDocument();
    });

    it('sollte die 4 Kernpunkte und den exakten Eigenverantwortungs-Schlusssatz enthalten', () => {
      useUIStore.setState({ isLegalDisclaimerModalOpen: true });
      render(<LegalDisclaimerModal />);

      expect(screen.getByText('Datenschutz und Nutzungshinweise')).toBeInTheDocument();
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

      const closeBtn = screen.getByRole('button', { name: /Verstanden & Schließen/i });
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
