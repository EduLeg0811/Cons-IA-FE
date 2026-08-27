import { useCallback, useSyncExternalStore } from 'react';

export type ContainerWidth = '5xl' | '6xl' | '7xl' | 'full';

const WIDTH_ORDER: ContainerWidth[] = ['5xl', '6xl', '7xl', 'full'];

const WIDTH_CONFIG: Record<ContainerWidth, { label: string; className: string }> = {
  '5xl': { label: '5XL', className: 'max-w-5xl' },
  '6xl': { label: '6XL', className: 'max-w-6xl' },
  '7xl': { label: '7XL', className: 'max-w-7xl' },
  full: { label: 'Full', className: 'max-w-full' },
};

const STORAGE_KEY = 'container_width';
const DEFAULT_WIDTH: ContainerWidth = '7xl';

function detectInitialWidth(): ContainerWidth {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in WIDTH_CONFIG) {
      return saved as ContainerWidth;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

let currentWidth: ContainerWidth = detectInitialWidth();
const listeners = new Set<() => void>();

function setContainerWidth(nextWidth: ContainerWidth) {
  if (currentWidth === nextWidth) return;
  currentWidth = nextWidth;
  try {
    localStorage.setItem(STORAGE_KEY, nextWidth);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue && e.newValue in WIDTH_CONFIG) {
      currentWidth = e.newValue as ContainerWidth;
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): ContainerWidth {
  return currentWidth;
}

export function useContainerWidth() {
  const width = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_WIDTH);

  const toggleWidth = useCallback(() => {
    const idx = WIDTH_ORDER.indexOf(currentWidth);
    const next = WIDTH_ORDER[(idx + 1) % WIDTH_ORDER.length];
    setContainerWidth(next);
  }, []);

  const config = WIDTH_CONFIG[width] || WIDTH_CONFIG[DEFAULT_WIDTH];

  return {
    width,
    toggleWidth,
    containerClass: config.className,
    label: config.label,
  };
}
