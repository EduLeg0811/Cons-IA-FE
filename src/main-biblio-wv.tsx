import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BiblioWvPage } from './pages/BiblioWvPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BiblioWvPage />
  </StrictMode>
);
