import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BookPills } from '../components/BookPills';
import { ResultsPanel } from '../components/ResultsPanel';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { callLexical, downloadFile, type DownloadPayload } from '../lib/api';
import { CONFIG, logFeatureAccess } from '../lib/config';
import { flattenDataEntries, delDuplicateItems, sortData, limitResultsPerSource, type FlattenedItem } from '../lib/formatters';

const BOOK_OPTIONS = [
  { value: 'LO', label: 'Léxico de Ortopensatas' },
  { value: 'DAC', label: 'Dicionário de Argumentos da Conscienciologia' },
  { value: 'TNP', label: 'Manual da Tenepes' },
  { value: 'DUPLA', label: 'Manual da Dupla Evolutiva' },
  { value: 'PROEXIS', label: 'Manual da Proéxis' },
  { value: '700EXP', label: '700 Experimentos' },
  { value: '200TEAT', label: '200 Teáticas da Conscienciologia' },
  { value: 'TEMAS', label: 'Temas da Conscienciologia' },
  { value: 'HSR', label: 'Homo sapiens reurbanisatus' },
  { value: 'HSP', label: 'Homo sapiens pacificus' },
  { value: 'PROJ', label: 'Projeciologia' },
];

const STORAGE_KEY = 'appConfig_searchBook';
const PANEL_SEEN_SESSION_KEY = 'searchBookSettingsPanelSeen';
const MAX_SELECTED_BOOKS = 3;

interface ModuleSettings {
  books: string[];
  maxResults: number;
  groupResults: boolean;
}

function loadSettings(): ModuleSettings {
  const defaults: ModuleSettings = { books: ['LO', 'DAC'], maxResults: 10, groupResults: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      books: Array.isArray(parsed.books) ? parsed.books : defaults.books,
      maxResults: typeof parsed.maxResults === 'number' ? parsed.maxResults : defaults.maxResults,
      groupResults: typeof parsed.groupResults === 'boolean' ? parsed.groupResults : defaults.groupResults,
    };
  } catch {
    return defaults;
  }
}

function shouldOpenSettingsPanel(): boolean {
  try {
    return sessionStorage.getItem(PANEL_SEEN_SESSION_KEY) !== 'true';
  } catch {
    return true;
  }
}

type Stage = 'idle' | 'searching' | 'done' | 'error';

export function SearchBookPage() {
  const [settings, setSettings] = useState<ModuleSettings>(() => loadSettings());
  const settingsRef = useRef(settings);
  const [panelOpen, setPanelOpen] = useState(() => shouldOpenSettingsPanel());
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [sortedResults, setSortedResults] = useState<Record<string, FlattenedItem[]>>({});
  const [downloadPayload, setDownloadPayload] = useState<DownloadPayload | null>(null);
  const [downloading, setDownloading] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(PANEL_SEEN_SESSION_KEY, 'true');
    } catch {
      // A página continua funcional mesmo quando o armazenamento está indisponível.
    }
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSettings = useCallback((updater: (current: ModuleSettings) => ModuleSettings) => {
    const next = updater(settingsRef.current);
    settingsRef.current = next;
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleSettingsPanel = useCallback(() => {
    if (panelOpen) {
      setPanelOpen(false);
      return;
    }
    setPanelOpen(true);
  }, [panelOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (panelOpen && !settingsPanelRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [panelOpen]);

  const selectedBookOptions = settings.books
    .map((book) => BOOK_OPTIONS.find((option) => option.value === book))
    .filter((option): option is (typeof BOOK_OPTIONS)[number] => Boolean(option));

  const search = useCallback(async () => {
    if (busyRef.current) return;
    const trimmed = term.trim();
    if (!trimmed) {
      setStage('error');
      setErrorMessage('Please enter a search term');
      return;
    }
    if (settings.books.length === 0) {
      setStage('error');
      setErrorMessage('Selecione pelo menos um livro.');
      return;
    }

    busyRef.current = true;
    setStage('searching');
    setErrorMessage('');
    setSortedResults({});
    setDownloadPayload(null);

    try {
      // Cada livro é consultado separadamente para que `maxResults` seja uma
      // cota individual, sem o limite global do backend favorecer a primeira fonte.
      const responses = await Promise.all(
        settings.books.map((book) => callLexical({
          term: trimmed,
          source: [book],
          maxResults: settings.maxResults,
          flag_grouping: settings.groupResults,
          fullBadges: CONFIG.FULL_BADGES,
        })),
      );

      const results = responses.flatMap((response) => (
        Array.isArray(response.results)
          ? limitResultsPerSource(response.results as Array<{ source?: string }>, settings.maxResults)
          : []
      ));

      const flattened = flattenDataEntries(results as any);
      const unique = delDuplicateItems(flattened);
      const sorted = sortData(unique);

      setSortedResults(sorted);
      setStage('done');

      setDownloadPayload({
        results: unique.map((item, idx) => ({
          text: item.mk_text || item.raw_text,
          source: item.source,
          type: 'search_book',
          metadata: {
            title: item.title,
            pagina: item.pagina,
            content: item.mk_text || item.raw_text,
            order: idx,
          },
        })),
        search_type: 'search_book',
        term: trimmed,
        group_results_by_book: settings.groupResults,
      });

      try {
        logFeatureAccess({
          module: 'search_book',
          action: 'search',
          label: 'Busca em livros',
          value: trimmed,
          meta: { sources: settings.books, source_count: settings.books.length, results_count: unique.length, group_results: settings.groupResults, max_results: settings.maxResults },
        });
      } catch {
        // ignore logging errors
      }
    } catch (error) {
      console.error('SEARCH BOOK EXCEPTION:', error);
      setStage('error');
      setErrorMessage((error as Error)?.message || 'An unexpected error occurred');
    } finally {
      busyRef.current = false;
    }
  }, [term, settings]);

  const handleDownload = async () => {
    if (!downloadPayload || downloading) return;
    setDownloading(true);
    try {
      await downloadFile('docx', downloadPayload);
    } catch (error) {
      alert(`Download failed: ${(error as Error)?.message ?? 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Navbar title="Livros & Tratados" subtitle="Busca Léxica" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-[90px]">
        <div>
          <div ref={settingsPanelRef}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleSettingsPanel}
              title={panelOpen ? 'Fechar configurações' : 'Abrir configurações'}
              aria-label={panelOpen ? 'Fechar configurações' : 'Abrir configurações'}
              aria-expanded={panelOpen}
              aria-controls="search-book-settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <i className="fas fa-sliders-h" />
            </button>
            {downloadPayload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                title="Download as Word"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-blue-600 shadow-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800"
              >
                <i className={downloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-word fa-lg'} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-3 focus-within:border-search-primary dark:border-gray-700 dark:bg-gray-900">
            <textarea
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onFocus={() => setPanelOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Termo para buscar nos livros..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={search}
              disabled={stage === 'searching'}
              aria-label="Search"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-search-primary bg-search-primary text-white transition-colors hover:bg-search-secondary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className="fas fa-search" />
            </button>
          </div>

          {panelOpen ? (
            <section
              id="search-book-settings"
              className="mt-3 rounded-xl border border-gray-200 bg-white p-4 font-body shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5"
              aria-label="Configurações da busca em livros"
            >
              <div className="mb-3">
                <h2 className="font-body text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Escolha até {MAX_SELECTED_BOOKS} livros.
                </h2>
              </div>

              <BookPills
                options={BOOK_OPTIONS}
                selected={settings.books}
                onChange={(books) => updateSettings((current) => ({ ...current, books }))}
                maxSelected={MAX_SELECTED_BOOKS}
              />

              <div className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-3">
                  <label className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    Resultados máximos por livro
                    <input
                      type="number"
                      min={1}
                      value={settings.maxResults}
                      onChange={(event) => updateSettings((current) => ({ ...current, maxResults: Number(event.target.value) || 1 }))}
                      className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-search-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.groupResults}
                      onChange={(event) => updateSettings((current) => ({ ...current, groupResults: event.target.checked }))}
                    />
                    Agrupar resultados por livro
                  </label>
                </div>

              </div>
            </section>
          ) : (
            <div className="mt-2 flex flex-wrap justify-end gap-1.5 px-1" aria-label="Livros selecionados">
              {selectedBookOptions.length > 0 ? (
                selectedBookOptions.map((book) => (
                  <span
                    key={book.value}
                    className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] leading-tight text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/40 dark:text-blue-300"
                  >
                    {book.label}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-red-500">Nenhum livro selecionado</span>
              )}
            </div>
          )}
          </div>
        </div>

        <div className="mt-4">
          {stage === 'searching' && <LoadingIndicator message="Busca Léxica" />}
          {stage === 'error' && <ErrorMessage message={errorMessage} />}
          {stage === 'done' && <ResultsPanel sortedData={sortedResults} groupResults={settings.groupResults} accent="search" highlightTerm={term} />}
        </div>
      </div>
    </>
  );
}
