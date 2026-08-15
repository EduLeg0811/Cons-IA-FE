import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ManciaPage } from './pages/ManciaPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ManciaPage />
  </StrictMode>
);
