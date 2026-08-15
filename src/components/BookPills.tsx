interface BookOption {
  value: string;
  label: string;
}

interface BookPillsProps {
  options: BookOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  maxSelected?: number;
}

export function BookPills({ options, selected, onChange, maxSelected = 3 }: BookPillsProps) {
  const toggle = (value: string) => {
    const isActive = selected.includes(value);
    if (isActive) {
      onChange(selected.filter((v) => v !== value));
      return;
    }
    if (selected.length >= maxSelected) return;
    onChange([...selected, value]);
  };

  const limitReached = selected.length >= maxSelected;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Livros disponíveis para busca">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          const disabled = limitReached && !active;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              aria-pressed={active}
              title={disabled ? `Máximo de ${maxSelected} livros selecionados` : opt.label}
              className={`inline-flex min-h-7 w-fit max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-xs leading-tight font-medium whitespace-normal shadow-sm transition-[background-color,border-color,color,opacity] ${
                active
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/40 dark:text-blue-300'
                  : disabled
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 opacity-55 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {selected.length} de {maxSelected} livros selecionados
      </p>
    </div>
  );
}
