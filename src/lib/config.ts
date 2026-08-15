export interface AppConfig {
  MODEL_LLM: string;
  MODEL_RAGBOT: string;
  TEMPERATURE: number;
  LLM_MAX_RESULTS: number;
  MAX_OUTPUT_TOKENS: number;
  MAX_RESULTS_DISPLAY: number;
  OPENAI_RAGBOT: string;
  FULL_BADGES: boolean;
  DESCRITIVOS: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  MODEL_LLM: 'gpt-5.4-mini',
  MODEL_RAGBOT: 'gpt-5.4-mini',
  TEMPERATURE: 0.3,
  LLM_MAX_RESULTS: 3,
  MAX_OUTPUT_TOKENS: 1000,
  MAX_RESULTS_DISPLAY: 100,
  OPENAI_RAGBOT: 'ALLWV',
  FULL_BADGES: false,
  DESCRITIVOS: true,
};

const STORAGE_KEY = 'appConfig_main';

function loadRuntimeConfig(): AppConfig {
  let stored: Partial<AppConfig> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) ?? {};
  } catch {
    // ignore malformed storage
  }

  const merged = { ...DEFAULT_CONFIG };
  for (const key of Object.keys(DEFAULT_CONFIG) as Array<keyof AppConfig>) {
    const value = stored[key];
    if (value !== undefined && value !== null && value !== ('' as never)) {
      (merged as any)[key] = value;
    }
  }
  return merged;
}

export const CONFIG: AppConfig = loadRuntimeConfig();

const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const PROD_BASE = envApi || 'https://cons-ai-server.onrender.com';

function resolveApiBaseUrl(): string {
  const isFile = location.protocol === 'file:';
  const host = location.hostname || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');

  if (isLocalHost) {
    return '';
  }

  return isFile ? 'http://127.0.0.1:8000' : PROD_BASE;
}

export const API_BASE_URL = resolveApiBaseUrl();

// ---------------- Client logging ----------------
function getSessionId(): string | undefined {
  try {
    const key = 'client_session_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function trim(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

export interface LogEventData {
  event?: string;
  category?: string;
  module?: string;
  action?: string;
  label?: string;
  module_label?: string;
  page?: string;
  page_label?: string;
  chat_id?: string;
  value?: string;
  meta?: unknown;
}

export function logEvent(data: LogEventData): void {
  try {
    const url = `${API_BASE_URL}/api/logs`;
    const enriched = {
      event: trim(data.event, 'feature_access'),
      category: trim(data.category),
      module: trim(data.module),
      action: trim(data.action),
      label: trim(data.label || data.module_label),
      page: trim(data.page || location.pathname || ''),
      page_label: trim(data.page_label),
      session_id: getSessionId(),
      chat_id: trim(data.chat_id),
      value: trim(data.value),
      meta: data.meta ?? null,
    };
    const body = JSON.stringify(enriched);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  } catch {
    // ignore logging failures
  }
}

export function logFeatureAccess(data: LogEventData = {}): void {
  logEvent({ event: 'feature_access', category: 'feature', ...data });
}
