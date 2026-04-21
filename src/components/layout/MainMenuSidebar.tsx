import { Settings, Play, Info, Trash2, X, Sparkles, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';

export const MainMenuSidebar: React.FC = () => {
  const { isMainMenuOpen, toggleMainMenu, toggleThemeManager, toggleProfileModal, toggleAppInfoModal } = useUIStore();
  const { settings, isDemoMode, toggleDemoMode } = useAppStore();

  
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
          'fixed top-0 right-0 h-full w-[320px] border-l border-border-primary z-[101] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          settings.isGlassEnabled ? 'bg-bg-card/80 backdrop-blur-xl' : 'bg-bg-card',
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
          <MenuButton icon={<User size={18} />} onClick={() => { toggleMainMenu(); toggleProfileModal(); }}>
            Profil & Account
          </MenuButton>
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
            ? 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30'
            : 'text-text-primary hover:bg-border-primary'
      )}
    >
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110',
        isDestructive 
          ? 'text-heart' 
          : isActive 
            ? 'text-blue-500' 
            : 'text-text-secondary group-hover:text-text-primary'
      )}>
        {icon}
      </span>
      {children}
    </button>
  );
};
