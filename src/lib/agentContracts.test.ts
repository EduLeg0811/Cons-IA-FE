import { afterEach, describe, expect, it, vi } from 'vitest';
import { callVerbeteSearch } from './api';
import { BOOK_OPTIONS, normalizeBookCode } from '../pages/SearchBookPage';

describe('contratos do Agent', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['700EXP', 'EXP'], ['DUPLA', 'MDE'], ['PROEXIS', 'MP'], ['TEMAS', 'TC'], ['200TEAT', 'TEAT'],
  ])('migra %s para %s', (legacy, canonical) => {
    expect(normalizeBookCode(legacy)).toBe(canonical);
  });

  it('expõe as quatro fontes novas com códigos canônicos', () => {
    const values = BOOK_OPTIONS.map((item) => item.value);
    expect(values).toEqual(expect.arrayContaining(['MINI_ARLINDO', 'PROJ1986', 'QUEST', 'ZEFIRO']));
    expect(values).not.toEqual(expect.arrayContaining(['700EXP', 'DUPLA', 'PROEXIS', 'TEMAS', '200TEAT']));
  });

  it.each([
    ['titulo', 'title'], ['autor', 'author'], ['especialidade', 'area'],
  ] as const)('traduz field=%s para o contrato %s', async (field, expectedKey) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ title: 'Teste', text: 'Trecho', data: { author: 'Autor' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await callVerbeteSearch('tenepes', field, 7);
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ [expectedKey]: 'tenepes', limit: 7 });
    expect(result.results[0]).toMatchObject({ source: 'EC', metadata: { author: 'Autor' } });
  });
});
