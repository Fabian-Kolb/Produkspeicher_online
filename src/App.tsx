import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';

import { AppContainer } from './components/layout/AppContainer';
import { LoginView } from './views/LoginView';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { DashboardView } from './views/DashboardView';
import { KatalogView } from './views/KatalogView';
import { FavoritenView } from './views/FavoritenView';
import { DealsView } from './views/DealsView';
import { BundlesView } from './views/BundlesView';
import { BudgetView } from './views/BudgetView';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Tracks whether the login came from the form (not a page refresh)
  const loginFromForm = useRef(false);

  const { fetchAllData, setUserName } = useAppStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchAllData(session.user.id);
        const name = session.user.user_metadata?.display_name || 'User';
        setUserName(name);
        
        const hasDisplayName = !!session.user.user_metadata?.display_name;
        if (!hasDisplayName) setShowOnboarding(true);
        // Already logged in on page load — hide login immediately, no animation
        setShowLogin(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchAllData(session.user.id);
        setSession(session);
        const name = session.user.user_metadata?.display_name || 'User';
        setUserName(name);

        const hasDisplayName = !!session.user.user_metadata?.display_name;

        if (loginFromForm.current) {
          // Came from the login form → keep LoginView visible for exit animation
          // The original LoginView is still mounted with its running animations
          // Dashboard now renders UNDERNEATH it (LoginView is position:fixed)
          loginFromForm.current = false;
          setTimeout(() => {
            setShowLogin(false);
            if (!hasDisplayName) setShowOnboarding(true);
          }, 1800);
        } else {
          // Page refresh or token refresh — no animation
          setShowLogin(false);
          if (!hasDisplayName) setShowOnboarding(true);
        }
      } else {
        setSession(null);
        setUserName(null);
        setShowLogin(true);
        setShowOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-bg-secondary"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <>
      {/* Dashboard renders whenever session exists */}
      {session && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppContainer />}>
              <Route index element={<DashboardView />} />
              <Route path="katalog" element={<KatalogView />} />
              <Route path="favoriten" element={<FavoritenView />} />
              <Route path="bundles" element={<BundlesView />} />
              <Route path="budget" element={<BudgetView />} />
              <Route path="deals" element={<DealsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
      {/* LoginView stays mounted with its own animations — position:fixed overlays Dashboard */}
      {showLogin && (
        <LoginView onLoginStart={() => { loginFromForm.current = true; }} />
      )}
      
      {/* Onboarding View overlays Dashboard and blanks it out */}
      {showOnboarding && !showLogin && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}

export default App;
