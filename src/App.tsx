import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';

import { AppContainer } from './components/layout/AppContainer';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { KatalogView } from './views/KatalogView';
import { FavoritenView } from './views/FavoritenView';
import { DealsView } from './views/DealsView';
import { BundlesView } from './views/BundlesView';
import { AnalyticsView } from './views/AnalyticsView';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // We'll call these functions once the store is updated
  const { fetchAllData } = useAppStore();

  useEffect(() => {
    // Initial fetch of session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchAllData(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAllData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-bg-secondary"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContainer />}>
          <Route index element={<DashboardView />} />
          <Route path="katalog" element={<KatalogView />} />
          <Route path="favoriten" element={<FavoritenView />} />
          <Route path="bundles" element={<BundlesView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="deals" element={<DealsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
