interface IllustrationProps {
  primary: string;
  secondary: string;
}

// ---------- Apps IA ----------

export function ManciaIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <g transform="translate(50 58)">
        <path d="M -30 -16 C -20 -22 -8 -20 -1 -15 L -1 17 C -8 12 -20 10 -30 16 Z" fill={primary} />
        <path d="M 30 -16 C 20 -22 8 -20 1 -15 L 1 17 C 8 12 20 10 30 16 Z" fill={primary} opacity="0.82" />
        <path d="M -30 -16 C -20 -22 -8 -20 -1 -15" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
        <path d="M -25 -8 C -17 -12 -8 -11 -2 -7" fill="none" stroke="white" strokeWidth="1.5" opacity="0.45" />
        <path d="M -25 0 C -17 -3 -8 -2 -2 1" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <path d="M -25 8 C -17 5 -8 6 -2 9" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
      </g>
      <g fill={secondary}>
        <path d="M 72 22 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" />
        <path d="M 84 40 l 2 4 l 4 2 l -4 2 l -2 4 l -2 -4 l -4 -2 l 4 -2 Z" opacity="0.7" />
      </g>
    </svg>
  );
}

export function QuizIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <rect x="18" y="18" width="64" height="64" rx="14" fill={primary} opacity="0.12" />
      <text x="50" y="62" textAnchor="middle" fontSize="48" fontWeight="700" fill={primary} fontFamily="system-ui, sans-serif">
        ?
      </text>
      <circle cx="76" cy="76" r="14" fill={secondary} />
      <path d="M 70 76 l 4 4 l 8 -8" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlashcardsIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <rect x="26" y="20" width="48" height="34" rx="6" fill={secondary} opacity="0.45" transform="rotate(-8 50 37)" />
      <rect x="24" y="32" width="48" height="34" rx="6" fill={secondary} opacity="0.7" transform="rotate(-3 48 49)" />
      <rect x="22" y="44" width="52" height="36" rx="6" fill={primary} />
      <rect x="30" y="56" width="28" height="4" rx="2" fill="white" />
      <rect x="30" y="65" width="18" height="4" rx="2" fill="white" opacity="0.8" />
    </svg>
  );
}

// ---------- Bibliografia IA ----------

export function BiblioLivrosIllustration({ primary, secondary }: IllustrationProps) {
  const spines = [
    { x: 22, w: 10, h: 46, c: primary },
    { x: 34, w: 8, h: 56, c: secondary },
    { x: 44, w: 11, h: 40, c: primary },
    { x: 57, w: 9, h: 52, c: secondary },
    { x: 68, w: 10, h: 44, c: primary },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <rect x="16" y="78" width="68" height="4" rx="2" fill={primary} opacity="0.3" />
      {spines.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={78 - s.h} width={s.w} height={s.h} rx="2" fill={s.c} />
          <rect x={s.x} y={78 - s.h + 6} width={s.w} height="3" fill="white" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

export function BiblioVerbeteIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <path d="M 22 18 H 42 V 70 L 32 60 L 22 70 Z" fill={primary} />
      <rect x="50" y="26" width="32" height="5" rx="2.5" fill={secondary} />
      <rect x="50" y="40" width="32" height="5" rx="2.5" fill={secondary} opacity="0.75" />
      <rect x="50" y="54" width="22" height="5" rx="2.5" fill={secondary} opacity="0.5" />
    </svg>
  );
}

// ---------- Bots IA ----------

export function ConsGptIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <path d="M 18 26 a 10 10 0 0 1 10 -10 H 72 a 10 10 0 0 1 10 10 V 56 a 10 10 0 0 1 -10 10 H 42 L 28 78 V 66 H 28 a 10 10 0 0 1 -10 -10 Z" fill={primary} />
      <circle cx="38" cy="41" r="4.5" fill="white" />
      <circle cx="50" cy="41" r="4.5" fill="white" />
      <circle cx="62" cy="41" r="4.5" fill="white" />
      <path d="M 74 16 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 Z" fill={secondary} />
    </svg>
  );
}

export function ConsLmIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <rect x="20" y="18" width="50" height="58" rx="6" fill={primary} />
      <rect x="44" y="18" width="2.5" height="58" fill="white" opacity="0.5" />
      <rect x="26" y="30" width="14" height="3.5" rx="1.5" fill="white" opacity="0.85" />
      <rect x="26" y="40" width="14" height="3.5" rx="1.5" fill="white" opacity="0.6" />
      <rect x="50" y="30" width="14" height="3.5" rx="1.5" fill="white" opacity="0.85" />
      <rect x="50" y="40" width="14" height="3.5" rx="1.5" fill="white" opacity="0.6" />
      <circle cx="74" cy="66" r="14" fill={secondary} />
      <path d="M 74 60 v 8 m -4 4 h 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ConsBotIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <line x1="50" y1="14" x2="50" y2="24" stroke={secondary} strokeWidth="3" />
      <circle cx="50" cy="11" r="4" fill={secondary} />
      <rect x="22" y="24" width="56" height="48" rx="14" fill={primary} />
      <circle cx="38" cy="48" r="6" fill="white" />
      <circle cx="62" cy="48" r="6" fill="white" />
      <rect x="38" y="60" width="24" height="4" rx="2" fill="white" opacity="0.85" />
    </svg>
  );
}

// ---------- Busca IA ----------

function MagnifierBadge({ secondary }: { secondary: string }) {
  return (
    <g transform="translate(66 66)">
      <circle cx="0" cy="0" r="13" fill="none" stroke={secondary} strokeWidth="6" />
      <line x1="9" y1="9" x2="18" y2="18" stroke={secondary} strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}

export function SearchBookIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <g transform="translate(42 46)">
        <path d="M -24 -5 Q -26 -19 -2 -17 L -2 15 Q -24 13 -24 -5 Z" fill={primary} />
        <path d="M 24 -5 Q 26 -19 2 -17 L 2 15 Q 24 13 24 -5 Z" fill={primary} opacity="0.85" />
      </g>
      <MagnifierBadge secondary={secondary} />
    </svg>
  );
}

export function SearchVerbIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <path d="M 22 18 H 46 V 62 L 34 52 L 22 62 Z" fill={primary} />
      <rect x="52" y="26" width="22" height="4.5" rx="2" fill={primary} opacity="0.55" />
      <rect x="52" y="38" width="16" height="4.5" rx="2" fill={primary} opacity="0.4" />
      <MagnifierBadge secondary={secondary} />
    </svg>
  );
}

export function SearchCcgIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <rect x="20" y="18" width="22" height="22" rx="4" fill={primary} />
      <rect x="46" y="18" width="22" height="22" rx="4" fill={primary} opacity="0.55" />
      <rect x="20" y="44" width="22" height="22" rx="4" fill={primary} opacity="0.55" />
      <rect x="46" y="44" width="22" height="22" rx="4" fill={primary} opacity="0.8" />
      <MagnifierBadge secondary={secondary} />
    </svg>
  );
}

// ---------- Links Externos ----------

export function GlobeIllustration({ primary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <circle cx="50" cy="50" r="32" fill="none" stroke={primary} strokeWidth="5" />
      <ellipse cx="50" cy="50" rx="13" ry="32" fill="none" stroke={primary} strokeWidth="3.5" opacity="0.7" />
      <line x1="18" y1="50" x2="82" y2="50" stroke={primary} strokeWidth="3.5" opacity="0.7" />
      <line x1="22" y1="34" x2="78" y2="34" stroke={primary} strokeWidth="2.5" opacity="0.45" />
      <line x1="22" y1="66" x2="78" y2="66" stroke={primary} strokeWidth="2.5" opacity="0.45" />
    </svg>
  );
}

export function EnciclopediaIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <circle cx="50" cy="38" r="22" fill="none" stroke={primary} strokeWidth="4.5" />
      <ellipse cx="50" cy="38" rx="9" ry="22" fill="none" stroke={primary} strokeWidth="3" opacity="0.7" />
      <line x1="28" y1="38" x2="72" y2="38" stroke={primary} strokeWidth="3" opacity="0.7" />
      <path d="M 30 66 H 70 V 80 H 30 Z" fill={secondary} />
      <line x1="50" y1="66" x2="50" y2="80" stroke="white" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

export function PeriodicosIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <path d="M 22 18 H 64 L 78 32 V 82 H 22 Z" fill={primary} />
      <path d="M 64 18 V 32 H 78 Z" fill="white" opacity="0.5" />
      <rect x="30" y="42" width="16" height="14" rx="1.5" fill={secondary} />
      <rect x="50" y="42" width="20" height="4" rx="1.5" fill="white" opacity="0.85" />
      <rect x="50" y="50" width="20" height="4" rx="1.5" fill="white" opacity="0.6" />
      <rect x="30" y="62" width="40" height="4" rx="1.5" fill="white" opacity="0.7" />
      <rect x="30" y="70" width="28" height="4" rx="1.5" fill="white" opacity="0.5" />
    </svg>
  );
}

export function PdfIllustration({ primary, secondary }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20">
      <path d="M 28 14 H 60 L 74 28 V 70 H 28 Z" fill={primary} />
      <path d="M 60 14 V 28 H 74 Z" fill="white" opacity="0.5" />
      <rect x="36" y="40" width="28" height="5" rx="2" fill="white" opacity="0.8" />
      <rect x="36" y="50" width="20" height="5" rx="2" fill="white" opacity="0.55" />
      <g transform="translate(51 84)">
        <circle r="16" fill={secondary} />
        <path d="M 0 -7 v 11 m -5 -4 l 5 5 l 5 -5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
