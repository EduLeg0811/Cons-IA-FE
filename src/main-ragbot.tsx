import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RagbotPage } from './pages/RagbotPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RagbotPage />
  </StrictMode>
);
