import { Home, Moon, Sun } from 'lucide-react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../lib/theme';

interface LandingNavbarProps {
  navigationHref?: string;
  navigationTitle?: string;
}

export function LandingNavbar({
  navigationHref = 'classic.html',
  navigationTitle = 'Ver todos os módulos',
}: LandingNavbarProps = {}) {
  const [theme, toggleTheme] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 40));

  return (
    <nav
      className={`sticky top-0 z-50 border-b bg-background/80 backdrop-blur-2xl transition-[border-color,box-shadow] duration-500 ${scrolled ? 'border-border shadow-sm shadow-black/[.03] dark:shadow-black/20' : 'border-transparent'
        }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
        <a href="index.html" className="group flex items-center gap-3" aria-label="Página inicial do Cons-IA">
          <img
            src="/icon.png"
            alt="Cons-IA"
            className="h-12 w-12 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
          />
          <span className="flex min-w-0 items-center gap-2">
            {/* Título Principal: ConsIA */}
            <h1 className="max-w-[14rem] truncate font-nunito text-xl font-normal tracking-tight text-foreground sm:max-w-none">
              Cons<em className="ml-[4px] italic text-primary">IA</em>
            </h1>
            {/* Separador Vertical */}
            <span className="hidden h-4 w-px bg-foreground/20 sm:inline mx-1" />
            {/* Subtítulo: Ferramentas de IA da Conscienciologia */}
            <span className="hidden font-nunito-sans text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
              Ferramentas de IA da Conscienciologia
            </span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={navigationHref}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
            title={navigationTitle}
            aria-label={navigationTitle}
          >
            <Home className="h-3.5 w-3.5" />
          </a>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground"
            title="Alternar tema"
            aria-label={`Ativar tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
