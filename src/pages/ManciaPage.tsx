import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { PensataCard, SimpleCard } from '../components/PensataCard';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { downloadFile, type DownloadPayload } from '../lib/api';
import { drawBibliomanciaPensata, commentBibliomanciaPensata } from '../lib/bibliomancia';
import { logFeatureAccess } from '../lib/config';

type Stage = 'idle' | 'drawing' | 'commenting' | 'done' | 'error';

export function ManciaPage() {
  const [stage, setStage] = useState<Stage>('idle');
  const [pensataText, setPensataText] = useState('');
  const [pensataRef, setPensataRef] = useState('');
  const [commentaryText, setCommentaryText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadPayload, setDownloadPayload] = useState<DownloadPayload | null>(null);
  const [downloading, setDownloading] = useState(false);
  const busyRef = useRef(false);

  const draw = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStage('drawing');
    setErrorMessage('');
    setPensataText('');
    setCommentaryText('');
    setDownloadPayload(null);

    try {
      const pensata = await drawBibliomanciaPensata();
      const { text, reference: ref } = pensata;

      setPensataText(text);
      setPensataRef(ref);
      setStage('commenting');

      const commentaryData = await commentBibliomanciaPensata(text);

      const commentary = commentaryData?.content ?? '';
      setCommentaryText(commentary);
      setStage('done');

      setDownloadPayload({
        results: [
          {
            text,
            source: 'Pensata Sorteada',
            type: 'mancia',
            metadata: { title: 'Pensata Sorteada', content: text, order: 1 },
          },
          {
            text: commentary || '',
            source: 'Comentário',
            type: 'mancia',
            metadata: { title: 'Comentário', content: commentary, order: 2 },
          },
        ],
        search_type: 'mancia',
        term: 'Bibliomancia',
      });

      try {
        logFeatureAccess({
          module: 'mancia',
          action: 'draw',
          label: 'Bibliomancia',
          value: text,
          meta: { commentary_response: commentary },
        });
      } catch {
        // logging failure should not block the UI
      }
    } catch (error) {
      console.error('Error in mancia:', error);
      setErrorMessage((error as Error)?.message || 'An unexpected error occurred');
      setStage('error');
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    const shouldAutostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    if (!shouldAutostart) return;
    const timeoutId = window.setTimeout(() => {
      if (!busyRef.current) draw();
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [draw]);

  const isBusy = stage === 'drawing' || stage === 'commenting';

  const handleDownload = async () => {
    if (!downloadPayload || downloading) return;
    setDownloading(true);
    try {
      await downloadFile('docx', downloadPayload);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${(error as Error)?.message ?? 'unknown error'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Navbar title="Bibliomancia" subtitle="Sorteio e Análise de Ortopensata" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-[90px]">
        <div className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-8 text-center">
          <button
            type="button"
            onClick={draw}
            disabled={isBusy}
            className="mx-auto inline-flex items-center gap-3 rounded-xl bg-apps-primary px-8 py-5 text-lg font-semibold text-white shadow transition-all hover:-translate-y-0.5 hover:bg-apps-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <i className="fas fa-book-open" />
            Ortopensata
          </button>

          <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            Sorteia pensata do Léxico de Ortopensatas
            <br />
            Comenta com auxílio da IA
            <br />
            <br />
            <span className="text-sm leading-snug sm:text-xs">
              <strong>Parabanho.</strong> A <strong>bibliomancia</strong>, em bases energéticas, funciona, sem
              misticismos, e a sua comprovação ocorre pelas indicações dos textos apontados e as energias dos banhos
              energéticos recebidos, confirmadores.{' '}
              <em>(Léxico de Ortopensatas, 2019, pág. 1441)</em>
            </span>
            <br />
            <br />
          </p>
        </div>

        <div>
          {pensataText && stage !== 'error' ? <PensataCard text={pensataText} ref={pensataRef} /> : null}
          {stage === 'drawing' ? <LoadingIndicator message="Sorteando uma Pensata do LO..." /> : null}
          {stage === 'commenting' ? <LoadingIndicator message="Analisando e formulando o comentário..." /> : null}
          {commentaryText ? <SimpleCard text={commentaryText} /> : null}
          {stage === 'error' ? <ErrorMessage message={errorMessage} /> : null}

          {downloadPayload ? (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <i className={downloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-word'} />
                Download DOCX
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
