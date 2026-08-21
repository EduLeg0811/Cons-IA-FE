import { buildConsBotUrl } from '../lib/queryIntent';

interface ConversationalPromptProps {
  term: string;
  onContinueLiteral: () => void;
}

export function ConversationalPrompt({ term, onContinueLiteral }: ConversationalPromptProps) {
  const consbotUrl = buildConsBotUrl(term);

  return (
    <div
      aria-label="Sugestão de módulo de conversação"
      className="my-5 px-1 space-y-3 transition-all"
    >
      <div className="space-y-1.5">
        <h3 className="font-heading text-sm font-semibold text-gray-800 dark:text-gray-200">
          Gostaria de conversar sobre esse tema?
        </h3>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Você está procurando o termo literal <span className="font-medium text-gray-800 dark:text-gray-200">"{term}"</span> no texto dos livros, ou gostaria na verdade de explorar, conversar ou perguntar mais detalhes sobre ele? Se for esse o caso, o ideal é usar o módulo de conversação a seguir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={consbotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 sm:text-sm"
        >
          <i className="fas fa-robot text-xs text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Conversar com o ConsBOT</span>
          <i className="fas fa-external-link-alt text-[9px] text-emerald-600/70 dark:text-emerald-400/70" aria-hidden="true" />
        </a>

        <button
          type="button"
          onClick={onContinueLiteral}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 sm:text-sm"
        >
          <i className="fas fa-search text-[11px] text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <span>Continuar a pesquisa do termo literal nos livros</span>
        </button>
      </div>
    </div>
  );
}
