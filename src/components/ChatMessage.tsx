import { renderMarkdown } from '../lib/markdown';

interface ChatMessageProps {
  sender: 'user' | 'bot';
  content: string;
  isMarkdown?: boolean;
}

export function ChatMessage({ sender, content, isMarkdown = true }: ChatMessageProps) {
  if (sender === 'user') {
    return (
      <div className="ml-auto flex max-w-[80%] flex-row-reverse items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f6fff8] text-[#3a513a] shadow dark:bg-emerald-950/60 dark:text-emerald-200">
          <i className="fas fa-user" />
        </div>
        <div className="rounded-2xl bg-[#f6fff8] px-4 py-3 text-base text-[#3a513a] dark:bg-emerald-950/60 dark:text-emerald-100">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-full items-start gap-0">
      <div className="w-full flex-1 rounded-2xl border border-transparent bg-white px-6 py-5 text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {isMarkdown ? (
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          content
        )}
      </div>
    </div>
  );
}
