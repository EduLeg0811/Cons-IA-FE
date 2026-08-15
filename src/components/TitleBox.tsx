interface TitleBoxProps {
  children: React.ReactNode;
}

export function TitleBox({ children }: TitleBoxProps) {
  return (
    <div className="mb-3 inline-flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-200 px-4 py-3 text-base font-bold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
      {children}
    </div>
  );
}
