export function getQueryParam(keys: string | string[]): string | null {
  if (typeof window === 'undefined') return null;

  const keyList = Array.isArray(keys) ? keys : [keys];

  // 1. Check window.location.search
  const searchParams = new URLSearchParams(window.location.search);
  for (const k of keyList) {
    const val = searchParams.get(k);
    if (val !== null && val.trim() !== '') {
      return val.trim();
    }
  }

  // 2. Check window.location.hash in case query params are in hash (e.g. #/?q=...)
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
    const hashParams = new URLSearchParams(hashQuery);
    for (const k of keyList) {
      const val = hashParams.get(k);
      if (val !== null && val.trim() !== '') {
        return val.trim();
      }
    }
  }

  return null;
}

export function getInitialSearchQuery(): string {
  return getQueryParam(['q', 'query', 'term', 'termo', 'search', 'busca']) || '';
}
