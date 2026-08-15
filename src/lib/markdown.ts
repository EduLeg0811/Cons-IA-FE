import { marked } from 'marked';
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function renderMarkdown(mdText: unknown): string {
  const input = typeof mdText === 'string' ? mdText : String(mdText ?? '');

  const hasBlockHtml = /<\s*(p|div|ul|ol|li|h[1-6]|pre|blockquote|br)\b/i.test(input);
  if (!hasBlockHtml) {
    try {
      const html = marked.parse(input, { async: false }) as string;
      return sanitizeHtml(html);
    } catch {
      // fall through to manual fallback below
    }
  }
  if (hasBlockHtml) {
    return sanitizeHtml(
      input
        .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
        .replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '')
    );
  }

  let normalized = input
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  normalized = normalized.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${sanitizeHtml(code)}</code></pre>`);

  const tmp = normalized
    .replace(/^######\s?(.*)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s?(.*)$/gm, '<h5>$1</h5>')
    .replace(/^####\s?(.*)$/gm, '<h4>$1</h4>')
    .replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    .replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    .replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/^\s*\*\s+(.*)$/gm, '<li>$1</li>')
    .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(?:\s*<li>.*<\/li>\s*)+/gs, (m) => `<ul>${m}</ul>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const paragraphs = tmp.split(/\n{2,}/).filter((p) => p.trim().length);

  const html = paragraphs
    .map((p) => {
      const withBreaks = p.replace(/\n/g, '<br>').replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
      return `<p>${sanitizeHtml(withBreaks)}</p>`;
    })
    .join('');

  const cleaned = html
    .replace(/<p>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '')
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');

  return sanitizeHtml(cleaned);
}

const BOOK_NAMES: Record<string, string> = {
  HSR: 'Homo sapiens reurbanisatus',
  HSP: 'Homo sapiens pacificus',
  '200TEAT': '200 Teáticas da Conscienciologia',
  '700EXP': '700 Experimentos da Conscienciologia',
  TEMAS: 'Temas da Conscienciologia',
  PROEXIS: 'Manual da Proéxis',
  TNP: 'Manual da Tenepes',
  DUPLA: 'Manual da Dupla Evolutiva',
  LO: 'Léxico de Ortopensatas',
  EC: 'Enciclopédia da Conscienciologia',
  DAC: 'Dicionário de Argumentos da Conscienciologia',
  PROJ: 'Projeciologia',
  CCG: 'Conscienciograma',
  QUEST: 'Questões Minitertúlia',
  MINI: 'Anotações Minitertúlia EDU',
};

export function bookName(source: string | undefined | null): string {
  if (!source) return '';
  return BOOK_NAMES[source] ?? source;
}
