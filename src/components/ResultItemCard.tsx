import { renderMarkdown, bookName } from '../lib/markdown';
import { MetadataBadge } from './MetadataBadge';
import type { FlattenedItem } from '../lib/formatters';

const VERBETES_URL = 'https://arquivos.enciclopediadaconscienciologia.org/verbetes/';

interface ResultItemCardProps {
  item: FlattenedItem;
  fullBadges?: boolean;
  highlightTerm?: string;
}

const RESULT_TEXT_CLASSES = 'markdown-content text-[13px] leading-[1.42] text-gray-800 sm:text-sm sm:leading-[1.48] dark:text-gray-200';
const VERBETE_TEXT_CLASSES = 'markdown-content text-xs leading-[1.38] text-gray-800 sm:text-[13px] sm:leading-[1.44] dark:text-gray-200';

function textAlreadyStartsWithTitle(text: string, title: string) {
  const normalizedTitle = title.trim().replace(/[.\s]+$/u, '');
  if (!normalizedTitle) return false;

  const escapedTitle = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleAtStart = new RegExp(
    `^(?:\\*\\*|__)?${escapedTitle}[.:]?(?:\\*\\*|__)?[.:]?(?=\\s|$)`,
    'iu',
  );

  return titleAtStart.test(text.trimStart());
}

function highlightTermInHtml(html: string, term?: string) {
  const normalizedTerm = term?.trim();
  if (!normalizedTerm) return html;

  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termPattern = new RegExp(escapedTerm, 'giu');

  return html
    .split(/(<[^>]+>)/g)
    .map((segment) => (segment.startsWith('<') ? segment : segment.replace(termPattern, '<mark class="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-300">$&</mark>')))
    .join('');
}

export function ResultItemCard({ item, fullBadges = false, highlightTerm }: ResultItemCardProps) {
  const source = bookName(item.source);
  const text = item.mk_text || item.raw_text || '';
  const renderResultText = (value: string) => highlightTermInHtml(renderMarkdown(value), highlightTerm);

  if (item.source === 'EC') {
    const textCompleted = textAlreadyStartsWithTitle(text, 'Definologia')
      ? text
      : `**Definologia.** ${text}`;
    const titleHtml = `<strong>${item.title}</strong> (${item.area}) ● <em>${item.author}</em> ● #${item.paragraph_number ?? ''} ● ${item.date}`;
    const arquivo = (item.title || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
    const pdfHref = VERBETES_URL + encodeURIComponent(arquivo) + '.pdf';
    return (
      <div className="mb-3 border-b border-gray-200 pb-3 last:mb-0 last:border-b-0 last:pb-0 dark:border-gray-700">
        <div className="mb-1.5 flex items-center justify-between text-xs leading-snug font-semibold text-[#3f6488] sm:text-[13px] dark:text-[#9bb8d1]">
          <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
        </div>
        <div className={VERBETE_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: renderResultText(textCompleted) }} />
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {source && <MetadataBadge variant="estilo1" compact><strong>{source}</strong></MetadataBadge>}
          {item.title && <MetadataBadge variant="estilo2" compact><strong>{item.title}</strong></MetadataBadge>}
          {item.pagina && <MetadataBadge variant="badge-page" compact>pág. {item.pagina}</MetadataBadge>}
          {item.area && <MetadataBadge variant="estilo2" compact><em>{item.area}</em></MetadataBadge>}
          {item.paragraph_number && <MetadataBadge variant="estilo2" compact> #{item.paragraph_number}</MetadataBadge>}
          {item.theme && <MetadataBadge variant="estilo2" compact>{item.theme}</MetadataBadge>}
          {item.author && <MetadataBadge variant="estilo2" compact>{item.author}</MetadataBadge>}
          {item.date && <MetadataBadge variant="estilo2" compact>{item.date}</MetadataBadge>}
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir PDF em nova aba"
            className="ml-1 text-red-600 hover:text-red-700"
          >
            <i className="fas fa-file-pdf" />
          </a>
        </div>
      </div>
    );
  }

  if (item.source === 'CCG') {
    const titleHtml = `<strong>${item.title}</strong> ● ${item.folha} ● #${item.paragraph_number ?? ''}`;
    return (
      <div className="mb-4">
        <div className="displaybox-header verbetopedia-header mb-2 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
          <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
        </div>
        <div className={RESULT_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: renderResultText(text) }} />
        <div className="mt-1 flex flex-wrap gap-1">
          {source && <MetadataBadge variant="estilo1"><strong>{source}</strong></MetadataBadge>}
          {item.pagina && <MetadataBadge variant="estilo3">pág. {item.pagina}</MetadataBadge>}
        </div>
      </div>
    );
  }

  if (item.source === 'LO') {
    const textCompleted = item.title && !textAlreadyStartsWithTitle(text, item.title)
      ? `**${item.title}.** ${text}`
      : text;
    return (
      <div className="mb-4">
        <div className={RESULT_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: renderResultText(textCompleted) }} />
        <div className="mt-1 flex flex-wrap gap-1">
          {source && <MetadataBadge variant="estilo1"><strong>{source}</strong></MetadataBadge>}
          {item.title && <MetadataBadge variant="estilo2"><strong>{item.title}</strong></MetadataBadge>}
          {item.pagina && <MetadataBadge variant="badge-page">pág. {item.pagina}</MetadataBadge>}
          {fullBadges && item.paragraph_number && (
            <MetadataBadge variant="estilo2"> #{item.paragraph_number}</MetadataBadge>
          )}
        </div>
      </div>
    );
  }

  if (item.source === 'DAC') {
    return (
      <div className="mb-4">
        <div className={RESULT_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: renderResultText(text) }} />
        <div className="mt-1 flex flex-wrap gap-1">
          {source && <MetadataBadge variant="estilo1"><strong>{source}</strong></MetadataBadge>}
          {item.title && <MetadataBadge variant="estilo2"><strong>{item.title}</strong></MetadataBadge>}
          {item.pagina && <MetadataBadge variant="estilo3">pág. {item.pagina}</MetadataBadge>}
          {fullBadges && item.argument && <MetadataBadge variant="estilo2">{item.argument}</MetadataBadge>}
        </div>
      </div>
    );
  }

  // Default formatter (TNP, DUPLA, PROEXIS, 700EXP, 200TEAT, TEMAS, HSR, HSP, PROJ, ...)
  return (
    <div className="mb-4">
      <div className={RESULT_TEXT_CLASSES} dangerouslySetInnerHTML={{ __html: renderResultText(text) }} />
      <div className="mt-1 flex flex-wrap gap-1">
        {source && <MetadataBadge variant="estilo1"><strong>{source}</strong></MetadataBadge>}
        {item.title && <MetadataBadge variant="estilo2"><strong>{item.title}</strong></MetadataBadge>}
        {item.pagina && <MetadataBadge variant="estilo3">pág. {item.pagina}</MetadataBadge>}
      </div>
    </div>
  );
}
