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

// Os modelos GPT-5.6 são de raciocínio e rejeitam `temperature`; o comportamento
// é ajustado por reasoning_effort e verbosity.
export interface LlmQueryParams {
  query: string;
  model: string;
  llm_max_results: number;
  max_output_tokens: number;
  vector_store_names: string | string[];
  instructions: string | null;
  use_session: boolean;
  reasoning_effort?: string;
  verbosity?: string;
  chat_id?: string;
  signal?: AbortSignal;
  timeout_ms?: number;
}

export interface LlmResponse {
  error?: string;
  message?: string;
  abort?: boolean;
  response?: string;
  limit_status?: string;
  text: string;
  citations?: string;
  total_tokens_used?: number;
  type?: string;
  model?: string;
  reasoning_effort?: string;
  verbosity?: string;
  results?: Array<{ text?: string }>;
  [key: string]: unknown;
}

export async function callLlm(params: LlmQueryParams): Promise<LlmResponse> {
  const { signal: externalSignal, timeout_ms, instructions, ...rest } = params;
  // O Main-Server tipa `instructions` como str e cai para o default do backend
  // quando o campo está ausente; enviar null quebraria a validação.
  const body = instructions == null ? rest : { ...rest, instructions };
  const controller = new AbortController();
  const timeoutMs = Number(timeout_ms) > 0 ? Number(timeout_ms) : 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}/api/llm/query`, {
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
