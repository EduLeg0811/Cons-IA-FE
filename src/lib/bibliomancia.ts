import { callLlm, callRandomPensata, type LlmResponse } from './api';
import { CONFIG } from './config';
import { COMMENTARY_INSTRUCTIONS } from './prompts';

export interface BibliomanciaPensata {
  text: string;
  reference: string;
}

export async function drawBibliomanciaPensata(signal?: AbortSignal): Promise<BibliomanciaPensata> {
  // O backend antigo usava o sentinela 'none' para "sem filtro"; no Main-Server
  // isso vira um termo de busca literal e devolve 404. Vazio = sorteio livre.
  const response = await callRandomPensata({ term: '', book: 'LO', signal });
  const text = String(response?.text ?? '').trim();

  if (!text) {
    throw new Error('Não foi possível sortear uma pensata.');
  }

  const page = String(response?.pagina ?? '').trim();
  const reference = page ? `Léxico de Ortopensatas, 2019, pág. ${page}` : 'Léxico de Ortopensatas, 2019';

  return { text, reference };
}

export async function commentBibliomanciaPensata(text: string, signal?: AbortSignal): Promise<LlmResponse> {
  return callLlm({
    query: `Comente a seguinte Pensata: ${text}`,
    model: CONFIG.MODEL_LLM,
    reasoningEffort: CONFIG.REASONING_EFFORT,
    verbosity: CONFIG.VERBOSITY,
    vectorMaxResults: CONFIG.LLM_MAX_RESULTS,
    maxOutputTokens: CONFIG.MAX_OUTPUT_TOKENS,
    // Rótulo; o servidor resolve para o id do vector store.
    vectorStores: [CONFIG.OPENAI_RAGBOT],
    systemPrompt: COMMENTARY_INSTRUCTIONS,
    timeout_ms: 30000,
    signal,
  });
}
