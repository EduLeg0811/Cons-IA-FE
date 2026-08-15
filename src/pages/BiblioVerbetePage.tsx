import { useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { TitleBox } from '../components/TitleBox';
import { SimpleCard } from '../components/PensataCard';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { callInsertRefVerbete } from '../lib/api';
import { logFeatureAccess } from '../lib/config';

type Stage = 'idle' | 'running' | 'done' | 'error' | 'empty';

function extractApiError(error: unknown): string {
  const fallback = (error as Error)?.message || 'Erro ao processar verbetes.';
  const match = String(fallback).match(/"error"\s*:\s*"([^"]+)"/);
  return match ? match[1] : fallback;
}

export function BiblioVerbetePage() {
  const [verbetes, setVerbetes] = useState('');
  const [style, setStyle] = useState<'simples' | 'bee'>('simples');
  const [stage, setStage] = useState<Stage>('idle');
  const [refList, setRefList] = useState('');
  const [refBiblio, setRefBiblio] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const busyRef = useRef(false);

  const canRun = verbetes.trim().length > 0;

  const run = async () => {
    if (busyRef.current) return;
    const trimmed = verbetes.trim();
    if (!trimmed) {
      setStage('error');
      setErrorMessage('Informe ao menos um verbete.');
      return;
    }

    busyRef.current = true;
    setStage('running');
    setErrorMessage('');
    setRefList('');
    setRefBiblio('');

    try {
      const response = await callInsertRefVerbete({ titles: trimmed, style });
      const list = String(response?.result?.ref_list || '').trim();
      const biblio = String(response?.result?.ref_biblio || '').trim();

      setRefList(list);
      setRefBiblio(biblio);
      setStage(list || biblio ? 'done' : 'empty');

      try {
        const titles = trimmed.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean);
        logFeatureAccess({
          module: 'biblio_verbete',
          action: 'generate',
          label: 'Bibliografia de verbetes',
          value: trimmed,
          meta: { style, titles_count: titles.length, titles },
        });
      } catch {
        // ignore logging errors
      }
    } catch (error) {
      setStage('error');
      setErrorMessage(extractApiError(error) || 'Erro ao inserir bibliografia de verbetes.');
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <>
      <Navbar title="Bibliografia Verbetes" subtitle="Verbetes da Enciclopédia" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-[90px]">
        <div className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-8 text-center">
          <button
            type="button"
            onClick={run}
            disabled={stage === 'running' || !canRun}
            className="mx-auto inline-flex items-center gap-3 rounded-xl bg-biblio-primary px-8 py-5 text-lg font-semibold text-white shadow transition-all hover:-translate-y-0.5 hover:bg-biblio-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <i className={stage === 'running' ? 'fas fa-spinner fa-spin' : 'fas fa-list'} />
            {stage === 'running' ? 'Inserindo' : 'Bibliografia'}
          </button>
          <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            Lista os dados e monta bibliografia para os verbetes informados.
          </p>
        </div>

        <div className="mx-auto grid max-w-[520px] gap-3 justify-items-center">
          <div>
            <label htmlFor="verbetesInput" className="mb-1.5 block w-[40ch] max-w-full text-xs font-semibold text-gray-700 dark:text-gray-300">
              Títulos dos Verbetes
            </label>
            <textarea
              id="verbetesInput"
              value={verbetes}
              onChange={(e) => setVerbetes(e.target.value)}
              rows={5}
              placeholder="Digite os títulos dos verbetes separados por virgula, ponto-e-virgula ou quebra de linha..."
              className="w-[46ch] max-w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-biblio-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
            />
          </div>

          <div className="flex w-[46ch] max-w-full flex-wrap justify-center gap-1">
            {(['simples', 'bee'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStyle(opt)}
                className={`h-9 w-[100px] rounded-full border text-sm font-medium shadow-sm transition-colors ${
                  style === opt
                    ? 'border-gray-200 bg-gray-400 text-yellow-200'
                    : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {opt === 'simples' ? 'Simplificada' : 'BEE'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {stage === 'running' && <LoadingIndicator message="Inserindo bibliografia de verbetes..." />}
          {stage === 'error' && <ErrorMessage message={errorMessage} />}
          {stage === 'empty' && (
            <div className="my-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
              Nenhum resultado foi retornado para os verbetes informados.
            </div>
          )}
          {stage === 'done' && refList && (
            <>
              <TitleBox>Listagem de Verbetes</TitleBox>
              <SimpleCard text={refList} />
            </>
          )}
          {stage === 'done' && refBiblio && (
            <>
              <TitleBox>Bibliografia de Verbetes</TitleBox>
              <SimpleCard text={refBiblio} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
