interface LoadingIndicatorProps {
  message: string;
}

export function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
    <div className="my-4 flex items-center justify-center gap-3 rounded-lg bg-white/80 p-8 dark:bg-gray-800/80">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</span>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="my-4 rounded-md border border-error-border bg-error-bg p-4 text-error-text">{message}</div>
  );
}
