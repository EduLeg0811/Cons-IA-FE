import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/lora/500.css';
import '@fontsource/lora/500-italic.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/500-italic.css';
import { LandingApp } from './landing/LandingApp';
import './index.css';
import './landing/landing.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>,
);
