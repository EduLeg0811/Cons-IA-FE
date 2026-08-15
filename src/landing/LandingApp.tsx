import { HashRouter, Route, Routes } from 'react-router-dom';
import { CategoryPage } from './CategoryPage';
import { LandingPage } from './LandingPage';

export function LandingApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/categoria/:categoryKey" element={<CategoryPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </HashRouter>
  );
}
