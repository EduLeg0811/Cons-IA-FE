type BadgeStyle = 'estilo1' | 'estilo2' | 'estilo3' | 'estilo4' | 'estilo5' | 'badge-page';

const STYLE_CLASSES: Record<BadgeStyle, string> = {
  estilo1: 'bg-[#e3ecff] text-black border-[#c8e6c9] dark:border-blue-800/70 dark:bg-blue-950/55 dark:text-blue-200',
  estilo2: 'bg-[#fef3db] text-black border-[#f5d9a3] dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-100',
  estilo3: 'bg-[#ddffda] text-black border-[#c8e6c9] dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-100',
  estilo4: 'bg-[#f0dcff] text-black border-[#d8b8e8] dark:border-purple-800/60 dark:bg-purple-950/45 dark:text-purple-100',
  estilo5: 'bg-[#dcffff] text-black border-[#c8e6c9] dark:border-cyan-800/60 dark:bg-cyan-950/45 dark:text-cyan-100',
  'badge-page': 'bg-[#e6ffe0] text-[#216205] border-[#c8e6c9] dark:border-lime-800/60 dark:bg-lime-950/40 dark:text-lime-200',
};

interface MetadataBadgeProps {
  variant: BadgeStyle;
  children: React.ReactNode;
  compact?: boolean;
}

export function MetadataBadge({ variant, children, compact = false }: MetadataBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border font-medium leading-tight ${
        compact ? 'px-1.5 py-px text-[10px] sm:text-[11px]' : 'px-2 py-0.5 text-xs'
      } ${STYLE_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
