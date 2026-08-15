export interface RawResultItem {
  source?: string;
  score?: number | string | null;
  number?: number | string;
  paragraph_number?: number | string;
  page_content?: string;
  text?: string;
  markdown?: string;
  title?: string;
  argumento?: string;
  argument?: string;
  section?: string;
  folha?: string;
  pagina?: string | number;
  page?: string | number;
  date?: string;
  link?: string;
  area?: string;
  theme?: string;
  author?: string;
  sigla?: string;
  citation?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FlattenedItem {
  source: string;
  score: number | null;
  paragraph_number: string | number | null;
  raw_text: string;
  mk_text: string;
  title: string;
  argument: string;
  section: string;
  folha: string;
  pagina: string | number;
  date: string;
  link: string;
  area: string;
  theme: string;
  author: string;
  sigla: string;
  citation: string;
}

export function limitResultsPerSource<T extends { source?: string }>(results: T[], maxResults: number): T[] {
  const grouped: Record<string, T[]> = {};
  const limited: T[] = [];
  for (const item of results) {
    const src = item.source || 'Unknown';
    if (!grouped[src]) grouped[src] = [];
    if (grouped[src].length < maxResults) {
      grouped[src].push(item);
      limited.push(item);
    }
  }
  return limited;
}

export function flattenDataEntries(data: RawResultItem[]): FlattenedItem[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const metadata = item.metadata || {};
    const getField = (field: string) => (item as any)[field] ?? (metadata as any)[field] ?? null;

    let score = getField('score');
    score = score !== null && score !== undefined && !Number.isNaN(parseFloat(score)) ? parseFloat(score) : null;

    const rawText = item.page_content || item.text || '';
    const mkText = (metadata as any).markdown || item.markdown || item.text || '';

    return {
      source: getField('source') ?? '',
      score,
      paragraph_number: getField('number') || getField('paragraph_number'),
      raw_text: rawText,
      mk_text: mkText,
      title: getField('title') ?? '',
      argument: getField('argumento') || getField('argument') || '',
      section: getField('section') ?? '',
      folha: getField('folha') ?? '',
      pagina: getField('pagina') || getField('page') || '',
      date: getField('date') ?? '',
      link: getField('link') ?? '',
      area: getField('area') ?? '',
      theme: getField('theme') ?? '',
      author: getField('author') ?? '',
      sigla: getField('sigla') ?? '',
      citation: getField('citation') ?? '',
    };
  });
}

export function delDuplicateItems(items: FlattenedItem[]): FlattenedItem[] {
  const seen = new Set<string>();
  const normalize = (str: string) => {
    if (!str) return '';
    let cleaned = str.replace(/\*|_|`|~|__|#/g, '');
    cleaned = cleaned.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return cleaned.toLowerCase().trim();
  };

  return items.filter((item) => {
    const text = item.raw_text || item.mk_text || '';
    const normalized = normalize(text);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function sortData(items: FlattenedItem[]): Record<string, FlattenedItem[]> {
  const grouped: Record<string, FlattenedItem[]> = {};
  for (const item of items) {
    const src = item.source || 'Unknown';
    if (!grouped[src]) grouped[src] = [];
    grouped[src].push(item);
  }

  for (const source in grouped) {
    const group = grouped[source];
    const zeroScoreItems = group
      .filter((it) => (it.score ?? 0) === 0)
      .sort((a, b) => {
        const numA = Number(a.paragraph_number) || Number.POSITIVE_INFINITY;
        const numB = Number(b.paragraph_number) || Number.POSITIVE_INFINITY;
        return numA - numB;
      });
    const scoredItems = group
      .filter((it) => (it.score ?? 0) !== 0)
      .sort((a, b) => {
        const scoreA = Number(a.score) || Number.POSITIVE_INFINITY;
        const scoreB = Number(b.score) || Number.POSITIVE_INFINITY;
        return scoreA - scoreB;
      });
    grouped[source] = [...zeroScoreItems, ...scoredItems];
  }

  return grouped;
}
