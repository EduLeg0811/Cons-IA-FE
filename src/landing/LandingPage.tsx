import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LandingFooter } from './components/LandingFooter';
import { LandingBibliomanciaCard } from './components/LandingBibliomanciaCard';
import { LandingHighlightsBar } from './components/LandingHighlightsBar';
import { LandingNavbar } from './components/LandingNavbar';
import { landingCategories, logModuleClick, type LandingCategory } from './data/modules';

const rotatingWords = [
  'pesquisar',
  'consultar',
  'entender',
  'conversar',
  'estudar',
  'aprender',
  'perguntar',
  'aprofundar',
  'explorar',
  'escrever',
  'investigar',
  'organizar',
  'comparar',
  'compreender',
  'analisar',
  'produzir',
  'relacionar',
  'avaliar',
  'interpretar',
  'sistematizar',
];

const categoryVideos: Record<string, string> = {
  busca: '/Modules_Figures/Book_Page_Flip.mp4',
  biblio: '/Modules_Figures/hero-biblio.mp4',
  bots: '/Modules_Figures/hero_chatbot.mp4',
  apps: '/Modules_Figures/hero-apps.mp4',
  links: '/Modules_Figures/hero-links.mp4',
};

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % rotatingWords.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <span className="relative left-1 top-[0.1em] inline-flex h-[1.28em] w-[13ch] justify-end overflow-hidden text-right align-bottom">
      <span className="invisible w-full text-right">compreender</span>
      <motion.span
        key={rotatingWords[index]}
        className="absolute inset-0 bg-gradient-to-r from-primary via-violet-500 to-rose-500 bg-clip-text text-transparent"
        initial={reduceMotion ? false : { y: '75%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {rotatingWords[index]}
      </motion.span>
    </span>
  );
}

function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 42 }}
      animate={isInView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 42 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function CategoryCard({ category, reversed }: { category: LandingCategory; reversed: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoInView = useInView(videoRef, { margin: '180px 0px' });
  const reduceMotion = useReducedMotion();
  const Icon = category.landingIcon;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoInView && !reduceMotion) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [reduceMotion, videoInView]);

  return (
    <RevealSection>
      <article
        className={`group flex flex-col items-stretch overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/[.06] dark:hover:shadow-black/30 ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'
          }`}
      >
        <div
          className="relative flex h-48 w-full items-center justify-center overflow-hidden sm:h-56 md:min-h-[280px] md:h-auto md:w-1/2"
          style={{ backgroundColor: `var(${category.bgVar})` }}
        >
          <motion.video
            ref={videoRef}
            src={categoryVideos[category.key]}
            className={`absolute inset-0 h-full w-full object-cover object-center ${category.key === 'apps' || category.key === 'links' ? 'scale-[1.2]' : 'scale-[1.08]'
              }`}
            muted
            loop
            playsInline
            preload="metadata"
            whileHover={reduceMotion ? undefined : { scale: category.key === 'apps' || category.key === 'links' ? 1.24 : 1.12 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        <div className="flex w-full flex-col justify-center p-6 sm:p-8 md:w-1/2">
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: `var(${category.accentVar})` }}
            >
              <Icon className="h-3 w-3" />
              {category.title}
            </span>
          </div>

          <h2 className="mb-3 text-xl font-bold leading-snug text-foreground sm:text-2xl">{category.landingLabel}</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{category.landingDescription}</p>

          <div className="mb-6 flex flex-wrap gap-2">
            {category.items.filter((item) => !item.hidden).map((item) => (
              <a
                key={item.title}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                title={item.description}
                onClick={() => logModuleClick(item)}
                className="rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: `color-mix(in srgb, var(${category.accentVar}) 42%, transparent)`,
                  backgroundColor: `color-mix(in srgb, var(${category.accentVar}) 10%, transparent)`,
                  color: `var(${category.accentVar})`,
                }}
              >
                {item.title}
              </a>
            ))}
          </div>

          <Link
            to={`/categoria/${category.key}`}
            className="flex w-fit items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
            style={{ color: `var(${category.accentVar})` }}
          >
            Explorar
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </article>
    </RevealSection>
  );
}

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const totalModules = landingCategories.reduce(
    (total, category) => total + category.items.filter((item) => !item.hidden).length,
    0,
  );

  return (
    <div className="landing-shell flex min-h-screen flex-col overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <LandingNavbar />

      <motion.section
        ref={heroRef}
        style={reduceMotion ? undefined : { opacity: heroOpacity, scale: heroScale }}
        className="relative mx-auto w-full max-w-5xl px-5 pt-5 pb-0 text-center sm:pt-8 sm:pb-0"
      >
        <div className="landing-dot-grid absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.07]" />
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-4xl leading-[1.2] font-extrabold tracking-tight text-foreground sm:text-5xl md:text-7xl"
        >
          <span className="inline-flex flex-col items-stretch">
            <span className="mb-5 text-2xl sm:text-3xl md:text-4xl">Olá Conscienciólogo!</span>
            <span>O que você quer</span>
            <span className="relative left-[-1.5ch] inline-flex items-baseline justify-end whitespace-nowrap">
              <RotatingWord />
              <span className="relative top-[0.1em] ml-[0.15em]">?</span>
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mb-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Explore <strong className="font-extrabold text-primary">{totalModules - 4}</strong> ferramentas de IA para estudo e
          pesquisa da Conscienciologia.
        </motion.p>

        <LandingBibliomanciaCard />

      </motion.section>

      <LandingHighlightsBar />

      <div className="mt-8 mb-10 flex flex-col items-center gap-2 sm:mb-14" aria-hidden="true">
        <span className="text-[11px] tracking-widest text-muted-foreground/60 uppercase">Explore abaixo</span>
        <motion.div
          className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-muted-foreground/20 pt-1.5"
          animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="h-1.5 w-1 rounded-full bg-muted-foreground/40" />
        </motion.div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-20 sm:px-8">
        {landingCategories.map((category, index) => (
          <CategoryCard key={category.key} category={category} reversed={index % 2 === 1} />
        ))}

        <RevealSection>
          <a
            href="classic.html"
            className="group relative flex items-center gap-6 overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/[.06] sm:p-9 dark:hover:shadow-black/30"
          >
            <div className="landing-checker absolute inset-0 opacity-[0.025] dark:opacity-[0.05]" />
            <motion.div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary"
              whileHover={reduceMotion ? undefined : { rotate: -8, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <LayoutGrid className="h-6 w-6 text-white" />
            </motion.div>
            <div className="relative min-w-0 flex-1">
              <h2 className="mb-1 text-lg font-bold text-foreground sm:text-xl">Todos os Módulos</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Veja todos os aplicativos, bots, buscas e referências em uma única página.
              </p>
            </div>
            <ArrowRight className="relative h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </a>
        </RevealSection>
      </main>

      <LandingFooter />
    </div>
  );
}
