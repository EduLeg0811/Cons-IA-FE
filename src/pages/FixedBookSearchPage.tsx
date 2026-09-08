import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ResultsPanel } from '../components/ResultsPanel';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { ConversationalPrompt } from '../components/ConversationalPrompt';
import { callLexical, callVerbeteSearch, downloadFile, type DownloadPayload, type VerbeteSearchField } from '../lib/api';
import { CONFIG, logFeatureAccess } from '../lib/config';
import { flattenDataEntries, delDuplicateItems, sortData, limitResultsPerSource, type FlattenedItem } from '../lib/formatters';
import { isConversationalQuery } from '../lib/queryIntent';
import { getQueryParam, getInitialSearchQuery } from '../lib/urlParams';
import { useContainerWidth } from '../lib/containerWidth';

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
  const requestedField = getQueryParam(['field']);
  const verbeteField: VerbeteSearchField =
    requestedField === 'titulo' || requestedField === 'autor' || requestedField === 'especialidade'
      ? requestedField
      : 'texto';
  const { containerClass } = useContainerWidth();
  const [settings, setSettings] = useState<ModuleSettings>(() => loadSettings(storageKey));
  const settingsRef = useRef(settings);
  const [panelOpen, setPanelOpen] = useState(false);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
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

  const updateSettings = useCallback((next: ModuleSettings) => {
    setSettings(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (panelOpen && !settingsPanelRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [panelOpen]);

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
      const respLexical = fixedBook === 'EC' && verbeteField !== 'texto'
        ? await callVerbeteSearch(trimmed, verbeteField, currentSettings.maxResults)
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
  }, [term, fixedBook, moduleKey, fixedBookLabel, verbeteField]);

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
          <div ref={settingsPanelRef}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              title={panelOpen ? 'Fechar configurações' : 'Abrir configurações'}
              aria-label={panelOpen ? 'Fechar configurações' : 'Abrir configurações'}
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

          {panelOpen && (
            <div className="absolute left-0 top-12 z-50 w-[min(420px,92vw)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="w-full rounded-full bg-search-primary px-2 py-2 text-center text-sm font-medium text-white">
                {fixedBookLabel}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  Resultados (máximo)
                  <input
                    type="number"
                    min={1}
                    value={settings.maxResults}
                    onChange={(e) => updateSettings({ maxResults: Number(e.target.value) || 1 })}
                    className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>
            </div>
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
              placeholder={placeholder}
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
