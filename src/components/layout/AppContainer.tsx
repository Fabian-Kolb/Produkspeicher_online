import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { MainMenuSidebar } from './MainMenuSidebar';
import { ThemeCreatorModal } from '../features/ThemeCreatorModal';
import { ProductModal } from '../features/ProductModal';
import { ProfileSettingsModal } from '../auth/ProfileSettingsModal';
import { useAppStore } from '../../store/useAppStore';
import { applyGlobalTheme, applyBaseMode } from '../../utils/themeHelpers';

export const AppContainer: React.FC = () => {
  const settings = useAppStore(state => state.settings);
  
  // Apply theme on load and when settings change
  useEffect(() => {
    applyBaseMode(settings.theme);
    if (settings.activeThemeId && settings.activeThemeId !== 'default') {
      const customTheme = settings.customThemes.find(t => t.id === settings.activeThemeId);
      if (customTheme) {
        applyGlobalTheme(customTheme.colors);
      }
    }
    
    // Toggle glass effects
    if (settings.isGlassEnabled) {
      document.body.classList.add('glass-enabled');
      document.documentElement.classList.add('glass-enabled');
    } else {
      document.body.classList.remove('glass-enabled');
      document.documentElement.classList.remove('glass-enabled');
    }
  }, [settings.theme, settings.activeThemeId, settings.customThemes, settings.isGlassEnabled]);


  return (
    <div className="min-h-screen text-text-primary overflow-x-hidden relative bg-transparent">
      {/* Abstract Background Blobs - animated with CSS or keep it simple */}
      {settings.isGlassEnabled && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-100 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/50 rounded-full blur-[140px]" />
          <div className="absolute top-[10%] right-[-20%] w-[60%] h-[70%] bg-fuchsia-600/50 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-20%] left-[15%] w-[50%] h-[50%] bg-blue-600/50 rounded-full blur-[150px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-pink-500/40 rounded-full blur-[120px]" />
        </div>
      )}

      <TopNav />
      <MainMenuSidebar />
      <ThemeCreatorModal />
      <ProductModal />
      <ProfileSettingsModal />
      
      {/* Main Content Area */}
      <main className="pt-24 pb-16 px-4 md:px-8 w-full min-h-screen transition-all duration-300">
        <Outlet />
      </main>

      {/* Put Modals/Toasts here later */}
    </div>
  );
};
