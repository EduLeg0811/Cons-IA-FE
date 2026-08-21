/**
 * Helper para detecção de intenção de busca x conversação com o ConsBOT.
 */

const CONVERSATIONAL_TRIGGERS = [
  // Interrogações e pronomes interrogativos
  'o que',
  'oque',
  'o que e',
  'o que significa',
  'o que quer dizer',
  'o que seria',
  'oque e',
  'qual',
  'quais',
  'qual e',
  'qual o',
  'qual a',
  'quais sao',
  'quais os',
  'quais as',
  'quanto',
  'quantos',
  'quanta',
  'quantas',
  'quando',
  'quando ocorre',
  'quando acontece',
  'quando usar',
  'onde',
  'aonde',
  'de onde',
  'onde fica',
  'onde encontrar',
  'onde esta',
  'onde se localiza',
  'em que',
  'no que',
  'na que',
  'como',
  'como funciona',
  'como fazer',
  'como posso',
  'como se',
  'como e',
  'como aplicar',
  'como realizar',
  'por que',
  'porque',
  'por qual',
  'por quais',
  'por qual motivo',
  'por que razao',
  'pra que',
  'para que',
  'quem',
  'quem e',
  'quem foi',
  'quem sao',
  'com quem',
  'de quem',

  // Verbos de comando, exploração e síntese
  'fale sobre',
  'fale me sobre',
  'fale-me sobre',
  'fale de',
  'fale mais sobre',
  'falar sobre',
  'relacione',
  'relacione a',
  'relacione o',
  'relacionar',
  'correlacione',
  'correlacionar',
  'explique',
  'explique sobre',
  'me explique',
  'explicar',
  'esclareca',
  'esclarecer',
  'descreva',
  'descrever',
  'detalhe',
  'detalhar',
  'defina',
  'definir',
  'conceitue',
  'conceituar',
  'resuma',
  'resumir',
  'sintetize',
  'sintetizar',
  'compare',
  'comparar',
  'diferencie',
  'diferenciar',
  'contraste',
  'contrastar',
  'liste',
  'listar',
  'aponte',
  'apontar',
  'analise',
  'analisar',
  'identifique',
  'identificar',
  'comente sobre',
  'comente a respeito',
  'comentar sobre',

  // Pedidos e intenções de diálogo
  'me diga',
  'diga me',
  'diga-me',
  'diga',
  'me conte',
  'conte me',
  'conte-me',
  'conte sobre',
  'quero saber',
  'quero entender',
  'gostaria de saber',
  'gostaria de entender',
  'preciso entender',
  'preciso saber',
  'procuro entender',
  'pode me dizer',
  'poderia explicar',
  'voce pode',
  'voce sabe',
  'voce poderia',
  'da para',
  'e possivel',

  // Relações e comparações
  'qual a diferenca',
  'qual e a diferenca',
  'diferenca entre',
  'relacao entre',
  'semelhanca entre',
  'distincao entre',
  'qual diferenca',
];

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesTrigger(normalized: string, trigger: string): boolean {
  return (
    normalized === trigger ||
    normalized.startsWith(`${trigger} `) ||
    normalized.startsWith(`${trigger},`) ||
    normalized.startsWith(`${trigger}:`) ||
    normalized.startsWith(`${trigger}-`)
  );
}

/**
 * Identifica se o texto inserido pelo usuário tem características de
 * pergunta ou oração conversacional (mais indicada para o ConsBOT)
 * em vez de uma busca léxica de termo ou expressão em livros.
 */
export function isConversationalQuery(rawText: string): boolean {
  const trimmed = rawText.trim();
  if (!trimmed) return false;

  // 1. Contém ponto de interrogação
  if (trimmed.includes('?')) {
    return true;
  }

  const normalized = normalizeText(trimmed);
  const words = normalized.split(/\s+/).filter(Boolean);

  // 2. Inicia com gatilhos conversacionais típicos (garantindo palavra/termo delimitado)
  for (const trigger of CONVERSATIONAL_TRIGGERS) {
    if (matchesTrigger(normalized, trigger)) {
      return true;
    }
  }

  // 3. Quantidade de palavras elevada para uma busca léxica tradicional (>= 3 palavras)
  if (words.length >= 3) {
    return true;
  }

  // 4. Frase longa (>= 20 caracteres e 2+ palavras)
  if (trimmed.length >= 20 && words.length >= 2) {
    return true;
  }

  return false;
}

export const CONSBOT_BASE_URL = 'https://consbot.cons-ia.org';

/**
 * Monta o link para o ConsBOT com a pergunta pré-preenchida, se houver.
 */
export function buildConsBotUrl(query?: string): string {
  const trimmed = query?.trim();
  if (!trimmed) {
    return CONSBOT_BASE_URL;
  }
  const url = new URL(CONSBOT_BASE_URL);
  url.searchParams.set('question', trimmed);
  return url.toString();
}
