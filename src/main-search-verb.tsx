import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixedBookSearchPage } from './pages/FixedBookSearchPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FixedBookSearchPage
      navTitle="Verbetes"
      navSubtitle="Busca Léxica"
      moduleKey="search_verb"
      storageKey="appConfig_verb"
      fixedBook="EC"
      fixedBookLabel="Enciclopédia da Conscienciologia"
      placeholder="Termo para buscar na Definologia..."
    />
  </StrictMode>
);
