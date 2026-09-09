import { API_BASE_URL } from './config';

export interface LexicalSearchParams {
  term: string;
  source: string[];
  maxResults?: number;
  flag_grouping?: boolean;
  fullBadges?: boolean;
}

export interface LexicalSearchResponse {
  results: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export async function callLexical(params: LexicalSearchParams): Promise<LexicalSearchResponse> {
  // flag_grouping/fullBadges são de apresentação; o Main-Server não os recebe.
  const response = await fetch(`${API_BASE_URL}/api/lexical/search/multi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      term: params.term,
      sources: params.source,
      ...(params.maxResults != null ? { limit: params.maxResults } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${err}`);
  }

  return response.json();
}

export type VerbeteSearchField =
  | 'todos'
  | 'titulo'
  | 'especialidade'
  | 'tematologia'
  | 'verbetografo'
  | 'autor'
  | 'definologia'
  | 'texto'
  | 'frase_enfatica'
  | 'questionologia'
  | 'fatologia'
  | 'parafatologia'
  | 'argumentologia';

export const VERBETE_FIELD_MAP: Record<string, string> = {
  todos: 'all',
  titulo: 'title',
  title: 'title',
  especialidade: 'area',
  tematologia: 'theme',
  verbetografo: 'author',
  autor: 'author',
  definologia: 'text',
  texto: 'text',
  frase_enfatica: 'frase_enfatica',
  questionologia: 'questionologia',
  fatologia: 'fatologia',
  parafatologia: 'parafatologia',
  argumentologia: 'argumentologia',
};

export function normalizeVerbeteField(
  raw?: string | null,
  fallback: VerbeteSearchField = 'titulo',
): VerbeteSearchField {
  if (!raw) return fallback;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (cleaned) {
    case 'autor':
    case 'author':
    case 'verbetografo':
      return 'verbetografo';
    case 'titulo':
    case 'title':
      return 'titulo';
    case 'especialidade':
    case 'area':
      return 'especialidade';
    case 'tematologia':
    case 'theme':
      return 'tematologia';
    case 'definologia':
    case 'texto':
    case 'text':
      return 'definologia';
    case 'todos':
    case 'all':
      return 'todos';
    case 'frase_enfatica':
    case 'frase-enfatica':
    case 'fraseenfatica':
    case 'frase':
      return 'frase_enfatica';
    case 'questionologia':
      return 'questionologia';
    case 'fatologia':
      return 'fatologia';
    case 'parafatologia':
      return 'parafatologia';
    case 'argumentologia':
      return 'argumentologia';
    default:
      return fallback;
  }
}

export async function callVerbeteSearch(
  term: string,
  field: VerbeteSearchField = 'titulo',
  limit = 10,
): Promise<LexicalSearchResponse> {
  const normalizedField = normalizeVerbeteField(field, field);
  if (normalizedField === 'todos') {
    return callLexical({
      term,
      source: ['EC'],
      maxResults: limit,
      flag_grouping: false,
      fullBadges: false,
    });
  }

  const bodyKey = VERBETE_FIELD_MAP[normalizedField] ?? VERBETE_FIELD_MAP[field] ?? 'text';
  const response = await fetch(`${API_BASE_URL}/api/lexical/verbetes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [bodyKey]: term, limit }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${err}`);
  }
  const data = await response.json() as LexicalSearchResponse;
  return {
    ...data,
    results: (data.results ?? []).map((raw) => {
      const row = raw as Record<string, unknown>;
      const metadata = (row.data && typeof row.data === 'object' ? row.data : row.metadata) as Record<string, unknown> | undefined;
      return { ...row, source: row.source ?? 'EC', metadata: metadata ?? {}, text: row.text ?? row.page_content ?? '' };
    }),
  };
}

export interface RandomPensataParams {
  term: string;
  book: string;
  signal?: AbortSignal;
}

export interface PensataResponse {
  text: string;
  pagina?: string;
  ref?: string;
  [key: string]: unknown;
}

export async function callRandomPensata(params: RandomPensataParams): Promise<PensataResponse> {
  const { signal, term, book } = params;
  const response = await fetch(`${API_BASE_URL}/api/mancia/random`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, source: book }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${err}`);
  }

  return response.json();
}

// Contrato único de /api/llm. Os modelos GPT-5.6 são de raciocínio e rejeitam
// `temperature`; o comportamento é ajustado por reasoningEffort e verbosity.
export interface LlmQueryParams {
  query: string;
  model: string;
  vectorStores: string[];
  systemPrompt: string | null;
  vectorMaxResults?: number;
  maxOutputTokens?: number;
  reasoningEffort?: string;
  verbosity?: string;
  // Devolvido como `responseId`; reenvie para continuar a conversa.
  previousResponseId?: string;
  signal?: AbortSignal;
  timeout_ms?: number;
}

export interface LlmResponse {
  content: string;
  references?: string[];
  citations?: Array<Record<string, unknown>>;
  responseId?: string;
  model?: string;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function callLlm(params: LlmQueryParams): Promise<LlmResponse> {
  const { signal: externalSignal, timeout_ms, query, systemPrompt, ...rest } = params;
  // O endpoint recebe `messages`; `systemPrompt` ausente cai para o default do
  // servidor, então null é omitido em vez de enviado.
  const body = {
    ...rest,
    messages: [{ role: 'user', content: query }],
    ...(systemPrompt == null ? {} : { systemPrompt }),
  };
  const controller = new AbortController();
  const timeoutMs = Number(timeout_ms) > 0 ? Number(timeout_ms) : 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}/api/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${err}`);
    }

    return response.json();
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      const e = new Error('Request timed out');
      e.name = 'AbortError';
      throw e;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export interface BiblioWvBuildParams {
  book_title: string;
  book_sigla: string;
  style: string;
}

export interface BiblioWvBuildResponse {
  text: string;
  [key: string]: unknown;
}

export async function callBiblioWvBuild(params: BiblioWvBuildParams): Promise<BiblioWvBuildResponse> {
  const response = await fetch(`${API_BASE_URL}/api/biblio/wv/reference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book: params.book_title,
      sigla: params.book_sigla,
      style: params.style,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${err}`);
  }

  return response.json();
}

export interface InsertRefVerbeteParams {
  titles: string;
  style: string;
}

export interface InsertRefVerbeteResponse {
  result?: {
    ref_list?: string;
    ref_biblio?: string;
  };
  [key: string]: unknown;
}

export async function callInsertRefVerbete(params: InsertRefVerbeteParams): Promise<InsertRefVerbeteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/biblio/verbetes/reference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${err}`);
  }

  return response.json();
}

export interface DownloadResultItem {
  text: string;
  source: string;
  type: string;
  metadata: Record<string, unknown>;
}

export interface DownloadPayload {
  results: DownloadResultItem[];
  search_type: string;
  term: string;
  group_results_by_book?: boolean;
}

// O Main-Server só exporta DOCX (/api/export/docx); os formatos pdf/markdown do
// backend antigo não têm equivalente.
export async function callDownload(format: 'docx', payload: DownloadPayload): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/export/docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/octet-stream' },
      body: JSON.stringify({ format, search_term: payload.term, ...payload }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Download failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function downloadFile(format: 'docx', payload: DownloadPayload): Promise<void> {
  const safeTerm = (payload.term || 'results')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);

  const response = await callDownload(format, payload);
  const blob = await response.blob();

  let filename = `${safeTerm}.${format}`;
  const contentDisposition = response.headers.get('Content-Disposition');
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) filename = match[1].replace(/['"]/g, '');
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
