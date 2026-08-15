import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SearchBookPage } from './pages/SearchBookPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SearchBookPage />
  </StrictMode>
);
