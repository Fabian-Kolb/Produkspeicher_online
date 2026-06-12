import { Settings, Info, Trash2, X, Sparkles, User, Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';
import { triggerHaptic } from '../../utils/haptics';

export const MainMenuSidebar: React.FC = () => {
  const { isMainMenuOpen, toggleMainMenu, toggleThemeManager, toggleProfileModal, toggleAppInfoModal } = useUIStore();
  const { settings, isDemoMode, toggleDemoMode, updateSettings, avatarUrl, userName } = useAppStore();

  
  const handleInfo = () => {
    toggleMainMenu();
    toggleAppInfoModal();
  };

  const handleReset = async () => {
    if (window.confirm("ACHTUNG: Möchtest du wirklich ALLE deine Daten (Produkte & Bundles) löschen? Dies kann nicht rückgängig gemacht werden.")) {
      const { products, bundles, deleteProduct, deleteBundle } = useAppStore.getState();
      
      // Delete all products
      await Promise.all(products.map(p => deleteProduct(p.id)));
      // Delete all bundles
      await Promise.all(bundles.map(b => deleteBundle(b.id)));
      
      alert("Alle Daten wurden gelöscht.");
      toggleMainMenu();
    }
  };

  const handleDemoMode = () => {
    toggleDemoMode();
  };

  return (
    <>
      <div 
        className={cn(
          'fixed inset-0 bg-black/60 z-[100] transition-all duration-300',
          settings.isGlassEnabled && 'backdrop-blur-sm',
          isMainMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggleMainMenu}
      />
      <div 
        className={cn(
          'fixed top-0 right-0 h-full w-[320px] border-l z-[101] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          settings.isGlassEnabled
            ? 'bg-[var(--theme-glass-bg)] backdrop-blur-xl border-[var(--theme-glass-border)]'
            : 'bg-bg-card border-border-primary',
          isMainMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <img 
              src={settings.theme === 'dark' ? logoWhite : logoDark} 
              alt="Ventory Logo" 
              className="h-8 w-auto object-contain" 
            />
            <h2 className="text-xl font-bold font-playfair">Ventory</h2>
          </div>
          <button 
            onClick={toggleMainMenu}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-primary transition-colors text-text-secondary hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-3 relative overflow-y-auto max-h-[calc(100vh-80px)]">
          <button
            onClick={() => {
              triggerHaptic(15);
              toggleMainMenu();
              toggleProfileModal();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group text-left font-medium text-text-primary hover:bg-border-primary"
          >
            <span className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-bg-primary border border-border-primary/50 group-hover:scale-110 transition-transform duration-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName || 'Profil'} className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-text-secondary" />
              )}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">{userName || 'Profil & Account'}</span>
              {userName && <span className="text-[10px] text-text-secondary">Einstellungen verwalten</span>}
            </div>
          </button>
          <MenuButton icon={<Settings size={18} />} onClick={() => { toggleMainMenu(); toggleThemeManager(); }}>
            Design & Themes
          </MenuButton>
          <MenuButton icon={<Sparkles size={18} />} onClick={handleDemoMode} isActive={isDemoMode}>
            {isDemoMode ? 'Demo-Modus: AN' : 'Demo-Modus aktivieren'}
          </MenuButton>
          <MenuButton icon={<Info size={18} />} onClick={handleInfo}>
            Info / Version
          </MenuButton>
          <MenuButton icon={<Trash2 size={18} />} onClick={handleReset} isDestructive>
            Reset / Löschen
          </MenuButton>

          {/* Divider */}
          <div className="h-[1px] bg-border-primary/50 my-2" />
          
          {/* Section Header */}
          <div className="text-[10px] font-black tracking-widest text-text-secondary uppercase mb-1 px-1">
            Einstellungen
          </div>
          
          {/* Theme Toggle Switch Card */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-text-primary/[0.03] border border-border-primary/30">
            <span className="text-sm font-medium text-text-primary">Dunkles Design</span>
            <button
              onClick={() => {
                triggerHaptic(15);
                const targetTheme = settings.theme === 'light' ? 'dark' : 'light';
                const isGlass = settings.isGlassEnabled;
                const nextThemeId = `default-${targetTheme}-${isGlass ? 'glass' : 'solid'}`;
                updateSettings({
                  theme: targetTheme,
                  activeThemeId: nextThemeId
                });
              }}
              className="relative w-11 h-6 rounded-full bg-text-primary/10 flex items-center px-0.5 transition-colors cursor-pointer select-none"
              title={settings.theme === 'light' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-bg-primary shadow-sm flex items-center justify-center transition-transform duration-300",
                  settings.theme === 'dark' ? "translate-x-5" : "translate-x-0"
                )}
              >
                {settings.theme === 'dark' ? <Moon size={10} className="text-text-primary" /> : <Sun size={10} className="text-text-primary" />}
              </div>
            </button>
          </div>

          {/* Vibration Toggle Switch Card */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-text-primary/[0.03] border border-border-primary/30">
            <span className="text-sm font-medium text-text-primary">Vibrations-Feedback</span>
            <button
              onClick={() => {
                const targetVal = !settings.isVibrationEnabled;
                updateSettings({ isVibrationEnabled: targetVal });
                if (targetVal) {
                  // Vibrate to confirm it's turned back on
                  setTimeout(() => triggerHaptic(15), 50);
                }
              }}
              className={cn(
                "relative w-11 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer select-none",
                settings.isVibrationEnabled ? "bg-accent" : "bg-text-primary/10"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-bg-primary shadow-sm transition-transform duration-300",
                  settings.isVibrationEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface MenuButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  isDestructive?: boolean;
  isActive?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, children, onClick, isDestructive, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group text-left font-medium',
        isDestructive 
          ? 'text-heart hover:bg-heart/10' 
          : isActive 
            ? 'bg-accent/10 text-accent ring-1 ring-accent/30'
            : 'text-text-primary hover:bg-border-primary'
      )}
    >
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110',
        isDestructive 
          ? 'text-heart' 
          : isActive 
            ? 'text-accent' 
            : 'text-text-secondary group-hover:text-text-primary'
      )}>
        {icon}
      </span>
      {children}
    </button>
  );
};
