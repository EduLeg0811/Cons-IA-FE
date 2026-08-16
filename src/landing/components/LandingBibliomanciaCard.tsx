import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LoaderCircle, RotateCcw, Shuffle, Sparkles, X } from 'lucide-react';
import { commentBibliomanciaPensata, drawBibliomanciaPensata } from '../../lib/bibliomancia';
import { logFeatureAccess } from '../../lib/config';
import { renderMarkdown } from '../../lib/markdown';

type BibliomanciaStage = 'drawing' | 'commenting' | 'ready' | 'commentError' | 'drawError';

function isAbortError(error: unknown): boolean {
  return (error as Error)?.name === 'AbortError';
}

export function LandingBibliomanciaCard() {
  const [dismissed, setDismissed] = useState(false);
  const [stage, setStage] = useState<BibliomanciaStage>('drawing');
  const [pensataText, setPensataText] = useState('');
  const [pensataReference, setPensataReference] = useState('');
  const [commentaryText, setCommentaryText] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const commentaryId = useId();
  const reduceMotion = useReducedMotion();

  const loadCommentary = useCallback(async (text: string, controller: AbortController) => {
    setStage('commenting');
    setErrorMessage('');
    setCommentaryText('');

    try {
      const response = await commentBibliomanciaPensata(text, controller.signal);
      const commentary = String(response?.content ?? '').trim();
      if (!commentary) throw new Error('O comentário da IA não foi retornado.');
      if (controller.signal.aborted) return;

      setCommentaryText(commentary);
      setStage('ready');

      try {
        logFeatureAccess({
          module: 'mancia',
          action: 'draw',
          label: 'Bibliomancia na landing',
          value: text,
          meta: { source: 'landing', commentary_response: commentary },
        });
      } catch {
        // Logging must not block the experience.
      }
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      console.error('Error preparing landing commentary:', error);
      setErrorMessage('Não foi possível preparar o comentário da IA.');
      setStage('commentError');
    }
  }, []);

  const draw = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStage('drawing');
    setPensataText('');
    setPensataReference('');
    setCommentaryText('');
    setCommentOpen(false);
    setErrorMessage('');

    try {
      const pensata = await drawBibliomanciaPensata(controller.signal);
      if (controller.signal.aborted) return;
      setPensataText(pensata.text);
      setPensataReference(pensata.reference);
      await loadCommentary(pensata.text, controller);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      console.error('Error drawing landing pensata:', error);
      setErrorMessage('Não foi possível sortear a pensata agora.');
      setStage('drawError');
    }
  }, [loadCommentary]);

  const retryCommentary = useCallback(() => {
    if (!pensataText) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void loadCommentary(pensataText, controller);
  }, [loadCommentary, pensataText]);

  useEffect(() => {
    if (dismissed) return undefined;

    // The small delay prevents duplicate network calls during React StrictMode's development check.
    const startTimer = window.setTimeout(() => void draw(), 180);
    return () => {
      window.clearTimeout(startTimer);
      abortRef.current?.abort();
    };
  }, [dismissed, draw]);

  const closeCard = () => {
    abortRef.current?.abort();
    setDismissed(true);
  };

  const toggleCommentary = () => {
    if (stage === 'ready') setCommentOpen((current) => !current);
  };

  const commentaryButton = () => {
    if (stage === 'commentError') {
      return (
        <button
          type="button"
          onClick={retryCommentary}
          className="landing-mancia-icon-btn text-rose-600 dark:text-rose-300"
          aria-label="Tentar preparar o comentário novamente"
          title="Tentar comentário novamente"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      );
    }

    const commentaryLoading = stage === 'drawing' || stage === 'commenting';
    return (
      <button
        type="button"
        onClick={toggleCommentary}
        disabled={commentaryLoading}
        className={stage === 'ready' && !commentOpen ? 'landing-mancia-icon-btn landing-mancia-comment-ready' : 'landing-mancia-icon-btn'}
        aria-label={commentaryLoading ? 'Preparando comentário da IA' : commentOpen ? 'Ocultar comentário da IA' : 'Mostrar comentário da IA'}
        aria-expanded={stage === 'ready' ? commentOpen : false}
        aria-controls={commentaryId}
        title={commentaryLoading ? 'Preparando comentário da IA' : commentOpen ? 'Ocultar comentário' : 'Mostrar comentário'}
      >
        {commentaryLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      </button>
    );
  };

  return (
    <AnimatePresence initial={false}>
      {!dismissed ? (
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="landing-mancia-card mx-auto w-full max-w-[960px] text-left"
          aria-label="Bibliomancia"
        >
          <div className="flex items-center justify-between gap-4 px-4 pt-3.5 sm:px-5">
            <div className="ml-4 flex min-w-0 items-center gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.13em] text-muted-foreground uppercase">Ortopensatologia</p>
                <p className="text-xs text-muted-foreground">Léxico de Ortopensatas</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:mr-7">
              {stage !== 'drawError' ? commentaryButton() : null}
              <button
                type="button"
                onClick={() => void draw()}
                disabled={stage === 'drawing'}
                className="landing-mancia-icon-btn"
                aria-label="Sortear nova pensata"
                title="Sortear nova pensata"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeCard}
                className="landing-mancia-icon-btn"
                aria-label="Fechar Bibliomancia"
                title="Fechar card"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="landing-mancia-expanded-layout px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
            <figure className="landing-mancia-cover-panel" aria-label="Obra de referência da pensata">
              <img
                src="/Modules_Figures/LO-Bibliomancia2.png"
                alt="Capa do livro Léxico de Ortopensatas, de Waldo Vieira"
                loading="eager"
                decoding="async"
                className="landing-mancia-cover-image--light"
              />
              <img
                src="/Modules_Figures/LO-Bibliomancia2-black.png"
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="landing-mancia-cover-image--dark"
              />
            </figure>

            <div className="min-w-0 sm:pr-8">
              {stage === 'drawing' ? (
                <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground" role="status">
                  <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  <span>Sorteando uma pensata para este momento…</span>
                </div>
              ) : null}

              {pensataText ? (
                <div>
                  <div
                    className="landing-bibliomancia-copy landing-mancia-pensata text-[0.92rem] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(pensataText) }}
                  />
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{pensataReference}</p>
                </div>
              ) : null}

              {stage === 'drawError' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 py-1" role="alert">
                  <p className="text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p>
                  <button type="button" onClick={() => void draw()} className="landing-mancia-retry-btn">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              {stage === 'commentError' ? (
                <p className="mt-3 text-[11px] text-rose-600 dark:text-rose-300" role="alert">
                  {errorMessage} Use o ícone para tentar novamente.
                </p>
              ) : null}

              <AnimatePresence initial={false}>
                {stage === 'ready' && commentOpen ? (
                  <motion.div
                    id={commentaryId}
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
                    className="landing-mancia-comment-wrap overflow-hidden"
                  >
                    <div className="landing-mancia-comment mt-4 border-t border-border pt-4">
                      <div
                        className="landing-bibliomancia-copy text-[0.82rem] leading-relaxed text-slate-600 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(commentaryText) }}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
