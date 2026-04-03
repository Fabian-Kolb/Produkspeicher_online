import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppContainer } from './components/layout/AppContainer';
import { DashboardView } from './views/DashboardView';
import { KatalogView } from './views/KatalogView';
import { FavoritenView } from './views/FavoritenView';
import { DealsView } from './views/DealsView';
import { BundlesView } from './views/BundlesView';
import { AnalyticsView } from './views/AnalyticsView';

function App() {
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
