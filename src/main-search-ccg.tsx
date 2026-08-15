import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixedBookSearchPage } from './pages/FixedBookSearchPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FixedBookSearchPage
      navTitle="Conscienciograma"
      navSubtitle="Busca Léxica"
      moduleKey="search_ccg"
      storageKey="appConfig_CCG"
      fixedBook="CCG"
      fixedBookLabel="Conscienciograma"
      placeholder="Termo para buscar nos livros..."
    />
  </StrictMode>
);
