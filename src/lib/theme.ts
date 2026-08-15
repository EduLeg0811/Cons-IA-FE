import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function detectInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  try {
    root.style.colorScheme = theme;
  } catch {
    // ignore
  }
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => detectInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggleTheme];
}
