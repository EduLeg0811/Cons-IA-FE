type IconVariant = 'lexical' | 'mancia' | 'biblio' | 'bots' | 'encyclopedia';

const ICON_GRADIENTS: Record<IconVariant, string> = {
  lexical: 'from-search-primary to-search-secondary',
  mancia: 'from-apps-primary to-apps-secondary',
  biblio: 'from-biblio-primary to-biblio-secondary',
  bots: 'from-bots-primary to-bots-secondary',
  encyclopedia: 'from-utils-primary to-utils-secondary',
};

interface ToolCardProps {
  href: string;
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  iconVariant: IconVariant;
  external?: boolean;
  onClick?: () => void;
}

export function ToolCard({ href, title, description, icon, iconVariant, external = false, onClick }: ToolCardProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:gap-3 sm:px-3 sm:py-2.5 dark:border-gray-700 dark:bg-gray-800"
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm text-white sm:h-10 sm:w-10 sm:text-base ${ICON_GRADIENTS[iconVariant]}`}>
        {icon}
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="font-landing-body text-xs leading-tight font-semibold text-gray-800 sm:text-sm dark:text-gray-100">{title}</h3>
        {description && <p className="text-[11px] leading-snug text-gray-500 sm:text-xs dark:text-gray-400">{description}</p>}
      </div>
    </a>
  );
}
