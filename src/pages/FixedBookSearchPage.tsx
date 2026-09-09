import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ResultsPanel } from '../components/ResultsPanel';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { ConversationalPrompt } from '../components/ConversationalPrompt';
import {
  callLexical,
  callVerbeteSearch,
  downloadFile,
  type DownloadPayload,
  type VerbeteSearchField,
  VERBETE_FIELD_MAP,
  normalizeVerbeteField,
} from '../lib/api';
import { CONFIG, logFeatureAccess } from '../lib/config';
import { flattenDataEntries, delDuplicateItems, sortData, limitResultsPerSource, type FlattenedItem } from '../lib/formatters';
import { isConversationalQuery } from '../lib/queryIntent';
import { getQueryParam, getInitialSearchQuery } from '../lib/urlParams';
import { useContainerWidth } from '../lib/containerWidth';

export { normalizeVerbeteField };

export const VERBETE_FIELD_OPTIONS: Array<{ value: VerbeteSearchField; label: string; placeholder: string }> = [
  { value: 'todos', label: 'Todos (envia todos)', placeholder: 'Termo para buscar em todos os campos do verbete...' },
  { value: 'titulo', label: 'Título', placeholder: 'Termo para buscar no título do verbete...' },
  { value: 'especialidade', label: 'Especialidade', placeholder: 'Especialidade da Conscienciologia (ex: Evoluciologia)...' },
  { value: 'tematologia', label: 'Tematologia', placeholder: 'Tematologia (Homeostático, Neutro ou Nosográfico)...' },
  { value: 'verbetografo', label: 'Verbetógrafo', placeholder: 'Nome do verbetógrafo / autor (ex: Waldo Vieira)...' },
  { value: 'definologia', label: 'Definologia', placeholder: 'Termo para buscar na Definologia...' },
  { value: 'frase_enfatica', label: 'Frase Enfática', placeholder: 'Termo para buscar na Frase Enfática...' },
  { value: 'questionologia', label: 'Questionologia', placeholder: 'Termo para buscar na Questionologia...' },
  { value: 'fatologia', label: 'Fatologia', placeholder: 'Termo para buscar na Fatologia...' },
  { value: 'parafatologia', label: 'Parafatologia', placeholder: 'Termo para buscar na Parafatologia...' },
  { value: 'argumentologia', label: 'Argumentologia', placeholder: 'Termo para buscar na Argumentologia...' },
];

interface FixedBookSearchPageProps {
  navTitle: string;
  navSubtitle: string;
  moduleKey: string;
  storageKey: string;
  fixedBook: string;
  fixedBookLabel: string;
  placeholder: string;
}

interface ModuleSettings {
  maxResults: number;
}

type Stage = 'idle' | 'searching' | 'done' | 'error' | 'conversational_prompt';

function loadSettings(storageKey: string): ModuleSettings {
  const defaults: ModuleSettings = { maxResults: 10 };
  let current = defaults;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      current = { maxResults: typeof parsed.maxResults === 'number' ? parsed.maxResults : defaults.maxResults };
    }
  } catch {
    current = defaults;
  }

  const maxResultsParam = getQueryParam(['limit', 'maxResults', 'max_results']);
  const maxResults = maxResultsParam && !Number.isNaN(Number(maxResultsParam))
    ? Math.max(1, Number(maxResultsParam))
    : current.maxResults;

  return { maxResults };
}

export function FixedBookSearchPage({
  navTitle,
  navSubtitle,
  moduleKey,
  storageKey,
  fixedBook,
  fixedBookLabel,
  placeholder,
}: FixedBookSearchPageProps) {
  const [selectedField, setSelectedField] = useState<VerbeteSearchField>(() => {
    if (fixedBook !== 'EC') return 'todos';
    const raw = getQueryParam(['field', 'campo']);
    return normalizeVerbeteField(raw, 'titulo');
  });
  const { containerClass } = useContainerWidth();
  const [settings, setSettings] = useState<ModuleSettings>(() => loadSettings(storageKey));
  const settingsRef = useRef(settings);
  const [term, setTerm] = useState(() => getInitialSearchQuery());
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [sortedResults, setSortedResults] = useState<Record<string, FlattenedItem[]>>({});
  const [downloadPayload, setDownloadPayload] = useState<DownloadPayload | null>(null);
  const [downloading, setDownloading] = useState(false);
  const busyRef = useRef(false);
  const autoSearchTriggeredRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (fixedBook !== 'EC' || typeof window === 'undefined') return;
    const raw = getQueryParam(['field', 'campo']);
    if (!raw) return;
    const normalized = normalizeVerbeteField(raw, 'titulo');
    const searchParams = new URLSearchParams(window.location.search);
    const hasRawParam = searchParams.has('field') || searchParams.has('campo');
    const currentFieldParam = searchParams.get('field');
    if (hasRawParam && (currentFieldParam !== normalized || searchParams.has('campo'))) {
      const url = new URL(window.location.href);
      url.searchParams.delete('campo');
      if (normalized === 'titulo') {
        url.searchParams.delete('field');
      } else {
        url.searchParams.set('field', normalized);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [fixedBook]);

  const updateSettings = useCallback((next: ModuleSettings) => {
    setSettings(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  const search = useCallback(async (forceLiteral = false, overrideTerm?: string) => {
    if (busyRef.current) return;
    const targetTerm = typeof overrideTerm === 'string' ? overrideTerm : term;
    const trimmed = targetTerm.trim();
    if (!trimmed) {
      setStage('error');
      setErrorMessage('Please enter a search term');
      return;
    }

    if (!forceLiteral && isConversationalQuery(trimmed)) {
      setStage('conversational_prompt');
      setErrorMessage('');
      return;
    }

    busyRef.current = true;
    setStage('searching');
    setErrorMessage('');
    setSortedResults({});
    setDownloadPayload(null);

    const currentSettings = settingsRef.current;
    try {
      const respLexical = fixedBook === 'EC'
        ? await callVerbeteSearch(trimmed, selectedField, currentSettings.maxResults)
        : await callLexical({
            term: trimmed,
            source: [fixedBook],
            maxResults: currentSettings.maxResults,
            flag_grouping: false,
            fullBadges: CONFIG.FULL_BADGES,
          });

      const results = Array.isArray(respLexical.results)
        ? limitResultsPerSource(respLexical.results as Array<{ source?: string }>, currentSettings.maxResults)
        : [];

      const flattened = flattenDataEntries(results as any);
      const unique = delDuplicateItems(flattened);
      const sorted = sortData(unique);

      setSortedResults(sorted);
      setStage('done');

      setDownloadPayload({
        results: unique.map((item, idx) => {
          const title = item.title && item.title.toLowerCase() !== 'none' ? item.title.trim() : '';
          return {
            text: item.mk_text || item.raw_text,
            source: item.source,
            type: moduleKey,
            metadata: {
              ...(title ? { title } : {}),
              number: item.paragraph_number,
              pagina: item.pagina,
              area: item.area,
              theme: item.theme,
              author: item.author,
              date: item.date,
              section: item.section,
              folha: item.folha,
              argument: item.argument,
              link: item.link,
              sigla: item.sigla,
              citation: item.citation,
              content: item.mk_text || item.raw_text,
              order: idx,
            },
          };
        }),
        search_type: moduleKey,
        term: trimmed,
      });

      try {
        logFeatureAccess({
          module: moduleKey,
          action: 'search',
          label: `Busca em ${fixedBookLabel}`,
          value: trimmed,
          meta: { sources: [fixedBook], results_count: unique.length, max_results: currentSettings.maxResults },
        });
      } catch {
        // ignore logging errors
      }
    } catch (error) {
      console.error(`${moduleKey} SEARCH EXCEPTION:`, error);
      setStage('error');
      setErrorMessage((error as Error)?.message || 'An unexpected error occurred');
    } finally {
      busyRef.current = false;
    }
  }, [term, fixedBook, moduleKey, fixedBookLabel, selectedField]);

  useEffect(() => {
    const initialQuery = getInitialSearchQuery();
    if (initialQuery && !autoSearchTriggeredRef.current) {
      autoSearchTriggeredRef.current = true;
      search(false, initialQuery);
    }
  }, [search]);

  const handleDownload = async () => {
    if (!downloadPayload || downloading) return;
    setDownloading(true);
    try {
      await downloadFile('docx', downloadPayload);
      try {
        logFeatureAccess({
          module: moduleKey,
          action: 'export_docx',
          label: `Exportar Word (${fixedBookLabel})`,
          value: downloadPayload.term,
          meta: {
            format: 'docx',
            source: fixedBook,
            results_count: downloadPayload.results.length,
            term: downloadPayload.term,
          },
        });
      } catch {
        // ignore logging errors
      }
    } catch (error) {
      alert(`Download failed: ${(error as Error)?.message ?? 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Navbar title={navTitle} subtitle={navSubtitle} />

      <div className={`mx-auto ${containerClass} px-4 pb-16 pt-[90px] transition-all duration-300`}>
        <div className="relative">
          {/* Controles acima do textbox: Seletor de Campo, Resultados (máximo) e Exportar Word */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {fixedBook === 'EC' && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="verbete-field-select"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    <i className="fas fa-filter text-search-primary text-[11px]" />
                    Campo:
                  </label>
                  <div className="relative inline-block">
                    <select
                      id="verbete-field-select"
                      value={selectedField}
                      onChange={(e) => {
                        const next = e.target.value as VerbeteSearchField;
                        setSelectedField(next);
                        const url = new URL(window.location.href);
                        if (next === 'titulo') {
                          url.searchParams.delete('field');
                        } else {
                          url.searchParams.set('field', next);
                        }
                        window.history.replaceState({}, '', url.toString());
                      }}
                      className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-search-primary focus:outline-none focus:ring-2 focus:ring-search-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
                    >
                      {VERBETE_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                      <i className="fas fa-chevron-down" />
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="max-results-input"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  <i className="fas fa-list-ol text-search-primary text-[11px]" />
                  Resultados (máximo):
                </label>
                <input
                  id="max-results-input"
                  type="number"
                  min={1}
                  max={200}
                  value={settings.maxResults}
                  onChange={(e) => updateSettings({ maxResults: Number(e.target.value) || 1 })}
                  className="w-20 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-search-primary focus:outline-none focus:ring-2 focus:ring-search-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
                />
              </div>
            </div>

            {downloadPayload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                title="Download as Word"
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-gray-800"
              >
                <i className={downloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-word fa-lg'} />
                <span>Exportar Word</span>
              </button>
            )}
          </div>

          {/* Caixa de busca principal */}
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-3 focus-within:border-search-primary dark:border-gray-700 dark:bg-gray-900">
            <textarea
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder={fixedBook === 'EC' ? (VERBETE_FIELD_OPTIONS.find((opt) => opt.value === selectedField)?.placeholder || placeholder) : placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => search()}
              disabled={stage === 'searching'}
              aria-label="Search"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-search-primary bg-search-primary text-white transition-colors hover:bg-search-secondary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className="fas fa-search" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          {stage === 'conversational_prompt' && (
            <ConversationalPrompt
              term={term.trim()}
              onContinueLiteral={() => search(true)}
            />
          )}
          {stage === 'searching' && <LoadingIndicator message="Busca Léxica" />}
          {stage === 'error' && <ErrorMessage message={errorMessage} />}
          {stage === 'done' && <ResultsPanel sortedData={sortedResults} groupResults={false} accent="search" highlightTerm={term} />}
        </div>
      </div>
    </>
  );
}
