import { useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { SimpleCard } from '../components/PensataCard';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { callBiblioWvBuild } from '../lib/api';
import { logFeatureAccess } from '../lib/config';

interface BookOption {
  sigla: string;
  title: string;
}

const BOOK_OPTIONS: BookOption[] = [
  { sigla: 'PC', title: 'Projeções da Consciência' },
  { sigla: 'PROJ', title: 'Projeciologia' },
  { sigla: 'EXP', title: '700 Experimentos' },
  { sigla: 'CCG', title: 'Conscienciograma' },
  { sigla: 'T100', title: '100 Testes' },
  { sigla: 'T200', title: '200 Teáticas' },
  { sigla: 'TNP', title: 'Manual da Tenepes' },
  { sigla: 'MP', title: 'Manual da Proéxis' },
  { sigla: 'MDE', title: 'Manual da Dupla' },
  { sigla: 'NE', title: 'Nossa Evolução' },
  { sigla: 'TC', title: 'Temas da Conscienciologia' },
  { sigla: 'MRC', title: 'Manual de Redação' },
  { sigla: 'HSR', title: 'Homo sapiens reurbanisatus' },
  { sigla: 'HSP', title: 'Homo sapiens pacificus' },
  { sigla: 'MMT', title: 'Manual dos Megapensenes' },
  { sigla: 'DAC', title: 'Dicionário de Argumentos (DAC))' },
  { sigla: 'DNC', title: 'Dicionário de Neologismos' },
  { sigla: 'LO1', title: 'Léxico (LO - 1a ed.)' },
  { sigla: 'LO2', title: 'Léxico (LO - 2a ed.)' },
  { sigla: 'EC10', title: 'Enciclopédia (10 ed.)' },
  { sigla: 'ECNEW', title: 'Enciclopédia (novos)' },
];

function mountBibliographyText(bibliografia: string): string {
  const biblio = String(bibliografia || '').trim().replace(/[.;\s]+$/, '');
  return `${biblio}.`;
}

type Stage = 'idle' | 'mounting' | 'done' | 'error';

export function BiblioWvPage() {
  const [selectedSigla, setSelectedSigla] = useState('');
  const [style, setStyle] = useState<'simples' | 'bee'>('bee');
  const [stage, setStage] = useState<Stage>('idle');
  const [resultText, setResultText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const busyRef = useRef(false);

  const mount = async (book: BookOption, bibliographyStyle: 'simples' | 'bee' = style) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setSelectedSigla(book.sigla);
    setStage('mounting');
    setErrorMessage('');
    setResultText('');

    try {
      const response = await callBiblioWvBuild({
        book_title: book.title,
        book_sigla: book.sigla,
        style: bibliographyStyle,
      });

      const finalText = mountBibliographyText(response?.text || '');
      setResultText(finalText);
      setStage('done');

      try {
        logFeatureAccess({
          module: 'biblio_wv',
          action: 'generate',
          label: book.title,
          value: book.title,
          meta: { book_sigla: book.sigla, style: bibliographyStyle },
        });
      } catch {
        // ignore logging errors
      }
    } catch (error) {
      setStage('error');
      setErrorMessage((error as Error)?.message || 'Erro ao montar bibliografia.');
    } finally {
      busyRef.current = false;
    }
  };

  const handleStyleChange = (nextStyle: 'simples' | 'bee') => {
    if (busyRef.current) return;

    setStyle(nextStyle);
    const selectedBook = BOOK_OPTIONS.find((book) => book.sigla === selectedSigla);
    if (selectedBook) void mount(selectedBook, nextStyle);
  };

  return (
    <>
      <Navbar title="Bibliografia Livros" subtitle="Obras Waldo Vieira" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-[90px]">
        {!selectedSigla && (
          <div className="mx-auto max-w-[600px] px-6 pb-5 text-center">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Selecione um livro para gerar a bibliografia
            </p>
          </div>
        )}

        <div className="mb-4">
          {stage === 'mounting' && <LoadingIndicator message="Consultando bibliografia da obra selecionada..." />}
          {stage === 'error' && <ErrorMessage message={errorMessage} />}
          {stage === 'done' && <SimpleCard text={resultText} />}
        </div>

        <div className="mx-auto grid max-w-[680px] gap-6 justify-items-center">
          <div className="flex flex-wrap justify-center gap-2">
            {(['simples', 'bee'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleStyleChange(opt)}
                disabled={stage === 'mounting'}
                className={`h-9 min-w-[100px] rounded-full border px-4 text-sm font-medium shadow-sm transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  style === opt
                    ? 'border-yellow-500 bg-yellow-100 text-gray-900 dark:border-yellow-500/70 dark:bg-yellow-950/50 dark:text-yellow-200'
                    : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {opt === 'simples' ? 'Simplificada' : 'BEE'}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-wrap justify-center gap-x-2 gap-y-2">
            {BOOK_OPTIONS.map((book) => (
              <button
                key={book.sigla}
                type="button"
                onClick={() => void mount(book)}
                disabled={stage === 'mounting'}
                aria-pressed={selectedSigla === book.sigla}
                title={book.title}
                className={`inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center text-[11px] font-medium leading-tight shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biblio-primary/40 focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-70 md:text-xs ${
                  selectedSigla === book.sigla
                    ? 'border-yellow-500 bg-yellow-100 text-gray-900 dark:border-yellow-500/70 dark:bg-yellow-950/50 dark:text-yellow-200'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {book.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
