import type { ComponentType } from 'react';

// ============================================================================
// 📐 TAMANHO DOS CARDS DOS MÓDULOS — altere aqui para redimensionar a Vitrine
// CARD_MIN_WIDTH_PX  = largura mínima de cada card (px)
// CARD_ASPECT_RATIO  = proporção largura:altura do card no desktop (ex.: '4 / 5')
// CARD_MOBILE_ASPECT = proporção largura:altura do card em telas pequenas
// CARD_SCALE_PERCENT = escala geral do card em relação à célula do grid (%)
//                      ex.: 100 = tamanho normal, 80 = 20% menor
// CARD_GRID_GAP_PX   = distância entre os cards no grid (px)
// ============================================================================
export const CARD_MIN_WIDTH_PX = 200;
export const CARD_ASPECT_RATIO = 'aspect-[4/5]';
export const CARD_MOBILE_ASPECT_RATIO = 'max-sm:aspect-[4/4.2]';
export const CARD_SCALE_PERCENT = 100;
export const CARD_GRID_GAP_PX = 20;
// ============================================================================

type Category = 'apps' | 'grafia' | 'escriba' | 'biblio' | 'bots' | 'search' | 'utils' | 'estudo' | 'extras';

export const CATEGORY_COLORS: Record<Category, { primary: string; secondary: string }> = {
  apps: { primary: '#7c3aed', secondary: '#a855f7' },
  grafia: { primary: 'var(--tone-peach-strong)', secondary: 'var(--tone-peach-soft)' },
  escriba: { primary: 'var(--tone-blush-strong)', secondary: 'var(--tone-blush-soft)' },
  biblio: { primary: '#edc93a', secondary: '#f6da5b' },
  bots: { primary: '#10b981', secondary: '#34d399' },
  search: { primary: '#0ea5e9', secondary: '#38bdf8' },
  utils: { primary: '#f87171', secondary: '#fca5a5' },
  estudo: { primary: '#ec4899', secondary: '#f472b6' },
  extras: { primary: '#6366f1', secondary: '#818cf8' },
};

const RING_CLASSES: Record<Category, string> = {
  apps: 'focus-visible:ring-apps-primary',
  grafia: 'focus-visible:ring-grafia-primary',
  escriba: 'focus-visible:ring-escriba-primary',
  biblio: 'focus-visible:ring-biblio-primary',
  bots: 'focus-visible:ring-bots-primary',
  search: 'focus-visible:ring-search-primary',
  utils: 'focus-visible:ring-utils-primary',
  estudo: 'focus-visible:ring-estudo-primary',
  extras: 'focus-visible:ring-extras-primary',
};

export interface IllustrationProps {
  primary: string;
  secondary: string;
}

interface AppTileProps {
  href: string;
  title: string;
  description: string;
  illustration?: ComponentType<IllustrationProps>;
  image?: string;
  category: Category;
  external?: boolean;
  onClick?: () => void;
}

export function AppTile({ href, title, description, illustration: Illustration, image, category, external = false, onClick }: AppTileProps) {
  const colors = CATEGORY_COLORS[category];

  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`group relative flex ${CARD_ASPECT_RATIO} ${CARD_MOBILE_ASPECT_RATIO} flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 ${RING_CLASSES[category]}`}
      style={{ width: `${CARD_SCALE_PERCENT}%`, minWidth: CARD_MIN_WIDTH_PX }}
    >
      {external && (
        <span className="absolute right-3 top-3 z-10 text-xs text-gray-400 opacity-70">
          <i className="fas fa-arrow-up-right-from-square" />
        </span>
      )}

      <div className="relative flex flex-[0_0_65%] min-h-0 items-center justify-center bg-white dark:bg-gray-900">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-contain p-3 transition-transform duration-200 group-hover:scale-110"
          />
        ) : Illustration ? (
          <span className="transition-transform duration-200 group-hover:scale-110">
            <Illustration primary={colors.primary} secondary={colors.secondary} />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100 p-4 text-left dark:border-gray-700">
        <h3 className="font-display text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="font-body line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </a>
  );
}
