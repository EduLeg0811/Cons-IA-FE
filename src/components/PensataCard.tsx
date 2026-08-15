import { renderMarkdown } from '../lib/markdown';

interface PensataCardProps {
  text: string;
  ref: string;
}

export function PensataCard({ text, ref }: PensataCardProps) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-orange-200/70 border-l-4 border-l-orange-400/70 bg-[#fffdf6] shadow-sm">
      <div className="relative p-5">
        <div
          className="markdown-content text-[0.96rem] leading-relaxed text-[#3f3a2a]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
        <div className="mt-2.5 text-[0.78rem] leading-snug text-[#7d7252]">{ref}</div>
      </div>
    </div>
  );
}

interface SimpleCardProps {
  text: string;
  reference?: string;
}

export function SimpleCard({ text, reference }: SimpleCardProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="p-5">
        <div
          className="markdown-content text-gray-800 dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
        {reference ? (
          <div className="mt-1 text-right text-sm italic text-gray-500 dark:text-gray-400">{reference}</div>
        ) : null}
      </div>
    </div>
  );
}
