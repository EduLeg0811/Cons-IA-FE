import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BiblioVerbetePage } from './pages/BiblioVerbetePage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BiblioVerbetePage />
  </StrictMode>
);
