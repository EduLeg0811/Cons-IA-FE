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
  { value: 'titulo', label: 'Título', placeholder: 'Termo para buscar no título do verbete...' },
  { value: 'verbetografo', label: 'Verbetógrafo', placeholder: 'Nome do verbetógrafo / autor (ex: Waldo Vieira)...' },
  { value: 'especialidade', label: 'Especialidade', placeholder: 'Especialidade da Conscienciologia (ex: Evoluciologia)...' },
  { value: 'definologia', label: 'Definologia', placeholder: 'Termo para buscar na Definologia...' },
  { value: 'todos', label: 'Todo o verbete', placeholder: 'Termo para buscar em todo o verbete...' },
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
  const [selectedFields, setSelectedFields] = useState<VerbeteSearchField[]>(() => {
    if (fixedBook !== 'EC') return ['todos'];
    const raw = getQueryParam(['fields', 'field', 'campo', 'campos']);
    if (!raw) return ['titulo'];
    const parts = raw.split(',').map((p) => normalizeVerbeteField(p, 'titulo'));
    const valid = parts.filter((f) => VERBETE_FIELD_OPTIONS.some((opt) => opt.value === f));
    return valid.length > 0 ? Array.from(new Set(valid)) : ['titulo'];
  });

  const handleToggleField = (field: VerbeteSearchField) => {
    setSelectedFields((prev) => {
      if (field === 'todos') {
        return ['todos'];
      }
      const withoutTodos = prev.filter((f) => f !== 'todos');
      if (withoutTodos.includes(field)) {
        if (withoutTodos.length === 1) return withoutTodos;
        return withoutTodos.filter((f) => f !== field);
      }
      return [...withoutTodos, field];
    });
  };
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
    const url = new URL(window.location.href);
    url.searchParams.delete('campo');
    url.searchParams.delete('field');
    if (selectedFields.length === 1 && selectedFields[0] === 'titulo') {
      url.searchParams.delete('fields');
    } else {
      url.searchParams.set('fields', selectedFields.join(','));
    }
    window.history.replaceState({}, '', url.toString());
  }, [fixedBook, selectedFields]);

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
      let respResults: Array<Record<string, unknown>> = [];

      if (fixedBook !== 'EC') {
        const respLexical = await callLexical({
          term: trimmed,
          source: [fixedBook],
          maxResults: currentSettings.maxResults,
          flag_grouping: false,
          fullBadges: CONFIG.FULL_BADGES,
        });
        respResults = Array.isArray(respLexical.results) ? (respLexical.results as any) : [];
      } else if (selectedFields.includes('todos')) {
        const respLexical = await callVerbeteSearch(trimmed, 'todos', currentSettings.maxResults);
        respResults = Array.isArray(respLexical.results) ? (respLexical.results as any) : [];
      } else if (selectedFields.length === 1) {
        const respLexical = await callVerbeteSearch(trimmed, selectedFields[0], currentSettings.maxResults);
        respResults = Array.isArray(respLexical.results) ? (respLexical.results as any) : [];
      } else {
        const responses = await Promise.all(
          selectedFields.map((f) => callVerbeteSearch(trimmed, f, currentSettings.maxResults))
        );
        respResults = responses.flatMap((r) => (Array.isArray(r.results) ? (r.results as any) : []));
      }

      const flattened = flattenDataEntries(respResults as any);
      const unique = delDuplicateItems(flattened);
      const limited: FlattenedItem[] = fixedBook === 'EC'
        ? unique.slice(0, currentSettings.maxResults)
        : limitResultsPerSource<FlattenedItem>(unique, currentSettings.maxResults);
      const sorted = sortData(limited);

      setSortedResults(sorted);
      setStage('done');

      setDownloadPayload({
        results: limited.map((item, idx) => {
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
          meta: {
            sources: [fixedBook],
            fields: selectedFields,
            results_count: limited.length,
            max_results: currentSettings.maxResults,
          },
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
  }, [term, fixedBook, moduleKey, fixedBookLabel, selectedFields]);

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
            {fixedBook === 'EC' ? (
              <div className="flex flex-wrap items-center gap-5 sm:gap-7 py-1">
                {VERBETE_FIELD_OPTIONS.map((opt) => {
                  const isSelected = selectedFields.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => handleToggleField(opt.value)}
                      className="group inline-flex items-center gap-2 cursor-pointer select-none text-sm sm:text-[15px] font-normal text-[#0066cc] dark:text-[#38bdf8] hover:opacity-85 transition-opacity"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? 'border-2 border-[#0070f3] dark:border-[#38bdf8]'
                            : 'border border-gray-400 dark:border-gray-500 group-hover:border-gray-500'
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0070f3] dark:bg-[#38bdf8]" />
                        )}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="ml-auto flex items-center gap-4">
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
              placeholder={
                fixedBook === 'EC'
                  ? selectedFields.includes('todos')
                    ? 'Termo para buscar em todo o verbete...'
                    : selectedFields.length === 1
                      ? VERBETE_FIELD_OPTIONS.find((opt) => opt.value === selectedFields[0])?.placeholder || placeholder
                      : 'Termo para buscar nos campos selecionados...'
                  : placeholder
              }
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
