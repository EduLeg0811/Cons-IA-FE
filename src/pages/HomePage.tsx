import { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { ToolCard } from '../components/ToolCard';
import { LandingNavbar } from '../landing/components/LandingNavbar';
import { logFeatureAccess } from '../lib/config';

const SECTION_TITLES = ['Apps IA', 'Bibliografia IA', 'Bots IA', 'Busca IA', 'Links Externos'];

const PANEL_TONES: Record<string, string> = {
  apps: 'blush',
  biblio: 'butter',
  bots: 'mint',
  search: 'sky',
  utils: 'peach',
};

function Panel({ accent, title, subtitle, children }: { accent: string; title: string; subtitle: string; children: React.ReactNode }) {
  const tone = PANEL_TONES[accent] ?? 'sand';
  return (
    <div
      className="font-landing-body fade-in relative overflow-hidden rounded-3xl border bg-white p-3 shadow-[0_8px_24px_-12px_rgba(80,70,120,0.10)] sm:p-5 dark:border-gray-700 dark:bg-gray-800"
      style={{ borderColor: `var(--tone-${tone}-soft)` }}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: `var(--tone-${tone}-strong)` }} />
      <div className="mb-2 text-center">
        <h2 className="font-landing-body text-lg leading-tight font-semibold tracking-tight text-gray-900 sm:text-xl dark:text-gray-100">{title}</h2>
        <span
          className="mt-0.5 inline-block text-[9px] leading-tight font-semibold uppercase tracking-[0.14em] sm:text-[10px]"
          style={{ color: `var(--tone-${tone}-strong)` }}
        >
          {subtitle}
        </span>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export function HomePage() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  const logClick = (module: string, label: string, href: string) => {
    try {
      const isExternal = /^https?:\/\//i.test(href) || /^mailto:/i.test(href);
      if (!isExternal) {
        return;
      }
      logFeatureAccess({ module, action: 'click', label, value: href, meta: { href } });
    } catch {
      // ignore logging errors
    }
  };

  const sendFeedback = () => {
    const msg = feedbackText.trim();
    if (!msg) {
      setFeedbackStatus('Digite uma mensagem.');
      return;
    }
    try {
      logFeatureAccess({ module: 'feedback', action: 'send', label: 'Feedback enviado', value: msg });
      setFeedbackStatus('Feedback enviado! Agradecemos sua mensagem.');
    } catch {
      setFeedbackStatus('Falha ao enviar. Tente novamente.');
    }
    setTimeout(() => setFeedbackOpen(false), 1000);
  };

  return (
    <>
      <LandingNavbar navigationHref="index.html" navigationTitle="Voltar à página principal" />

      <main className="min-h-[calc(100vh-4rem)] bg-gray-100 px-4 py-7 sm:px-6 sm:py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col items-center gap-2 pt-2 text-center sm:mb-8 sm:gap-3 sm:pt-4">
            <h2 className="font-display text-3xl font-normal leading-[1.02] text-foreground sm:text-5xl sm:leading-[1.05]">
              Inteligência Artificial
              <br />
              <span className="italic text-primary/80">a serviço da Consciência</span>
            </h2>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm sm:leading-relaxed">
              {SECTION_TITLES.join(' • ')}
            </p>
          </div>
          {/*
          <a
            href="https://cons-ia.org/new.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logClick('homepage_banner', 'New', 'https://cons-ia.org/new.html')}
            className="fade-in bg-white group relative mb-8 flex items-center justify-between overflow-hidden rounded-3xl border px-6 py-6 shadow-[0_8px_24px_-12px_rgba(80,70,120,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(80,70,120,0.18)] dark:border-white/10 dark:bg-gray-900"
            style={{ borderColor: 'var(--tone-lilac-strong)' }}
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: 'var(--tone-lilac-strong)' }} />
            <span className="shimmer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative z-10 font-body">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'var(--tone-lilac-strong)' }}
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
                Nova experiência
              </span>
              <h1 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Experimente a nova página de abertura do Cons-IA
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">https://cons-ia.org/new.html</p>
            </div>
            <div
              className="relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'var(--tone-lilac-strong)' }}
            >
              <span>Abrir</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
            </div>
          </a>

 */}
          <div className="mb-6 -mt-2 text-left sm:mb-8 sm:-mt-4">
            <a
              href="index.html"
              onClick={() => logClick('homepage_new_link', 'Nova página de abertura', 'index.html')}
              className="text-xs text-gray-500 hover:text-apps-primary hover:underline sm:text-sm dark:text-gray-400"
            >
              Voltar à nova página de abertura →
            </a>
          </div>


          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
            <Panel accent="apps" title="Apps IA" subtitle="Aplicativos Diversos">
              <ToolCard
                href="index_mancia.html"
                title="Bibliomancia Digital"
                description={<em>Sorteio de ortopensatas do Léxico</em>}
                icon={<i className="fas fa-book-open" />}
                iconVariant="mancia"
              />
              <ToolCard
                href="https://lexicons.cons-ia.org/"
                title="LexiCons"
                description={<em>Dicionários diversos</em>}
                icon={<i className="fas fa-book-atlas" />}
                iconVariant="mancia"
                external
                onClick={() => logClick('lexicons', 'LexiCons', 'https://lexicons.cons-ia.org/')}
              />
              <ToolCard
                href="https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67?artifactId=8f6fc286-021f-4184-b572-7f17c8561539"
                title="Quiz Conscienciológico"
                description={<em>Quiz de Perguntas & Respostas</em>}
                icon={<i className="fas fa-graduation-cap" />}
                iconVariant="mancia"
                external
                onClick={() => logClick('quiz_conscienciologico', 'Quiz Conscienciologico', '#')}
              />
              <ToolCard
                href="https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67?artifactId=2da2f57f-996c-4efd-b24c-c2f49ba8b452"
                title="Flashcards de Temas"
                description={<em>Temas da Conscienciologia em cards</em>}
                icon={<i className="fas fa-layer-group" />}
                iconVariant="mancia"
                external
                onClick={() => logClick('flashcards_temas', 'Flashcards de Temas', '#')}
              />
            </Panel>

            <Panel accent="biblio" title="Bibliografia IA" subtitle="Referências de Livros, Artigos e Verbetes">
              <ToolCard
                href="index_biblio_wv.html"
                title="Bibliografia de Livros"
                description={<em>Bibliografia de livros de Waldo Vieira</em>}
                icon={<i className="fas fa-list" />}
                iconVariant="biblio"
              />
              <ToolCard
                href="index_biblio_verbete.html"
                title="Bibliografia de Verbetes"
                description={<em>Listagem e bibliografia de verbetes</em>}
                icon={<i className="fas fa-book" />}
                iconVariant="biblio"
              />
            </Panel>

            <Panel accent="bots" title="Bots IA" subtitle="Assistentes de Conversação">
              <ToolCard
                href="https://chatgpt.com/g/g-68a5d68b96c4819189dd1e6fb0def83f-consgpt"
                title="ConsGPT"
                description={<em>ChatGPT da OpenAI</em>}
                icon={<i className="fas fa-comments" />}
                iconVariant="bots"
                external
                onClick={() => logClick('consgpt', 'ConsGPT', '#')}
              />
              <ToolCard
                href="https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67"
                title="ConsLM"
                description={<em>NotebookLM da Google</em>}
                icon={<i className="fa-brands fa-google" />}
                iconVariant="bots"
                external
                onClick={() => logClick('conslm', 'ConsLM', '#')}
              />
              <ToolCard
                href="https://consbot.cons-ia.org/"
                title="ConsBOT"
                description={<em>NEW ● Chatbot da Conscienciologia</em>}
                icon={<i className="fa-solid fa-graduation-cap" />}
                iconVariant="bots"
              />
            </Panel>

            <Panel accent="search" title="Busca IA" subtitle="Busca de Palavras em Livros">
              <ToolCard
                href="index_search_book.html"
                title="Livros & Tratados"
                description="Busca de palavras em livros"
                icon={<i className="fas fa-book" />}
                iconVariant="lexical"
              />
              <ToolCard
                href="index_search_verb.html"
                title="Verbetes"
                description="Busca na Definologia dos verbetes"
                icon={<i className="fas fa-book" />}
                iconVariant="lexical"
              />
              <ToolCard
                href="index_search_ccg.html"
                title="Questões do Conscienciograma"
                description="Busca no Conscienciograma"
                icon={<i className="fas fa-book" />}
                iconVariant="lexical"
              />
            </Panel>

            <Panel accent="utils" title="Links Externos" subtitle="Páginas Úteis da Conscienciologia">
              <ToolCard
                href="https://www.icge.org.br/"
                title="ICGE"
                description={<em>Site do ICGE</em>}
                icon={<i className="fas fa-globe" />}
                iconVariant="encyclopedia"
                external
                onClick={() => logClick('icge', 'ICGE', 'https://www.icge.org.br/')}
              />
              <ToolCard
                href="https://enciclopediadaconscienciologia.org/"
                title="Enciclopédia da Conscienciologia"
                description={<em>Download de verbetes</em>}
                icon={<i className="fas fa-globe" />}
                iconVariant="encyclopedia"
                external
                onClick={() => logClick('enciclopedia_conscienciologia', 'Enciclopedia da Conscienciologia', '#')}
              />
              <ToolCard
                href="https://periodicos.conscienciologia.org.br/"
                title="Portal de Periódicos"
                description={<em>Portal de periódicos da Conscienciologia</em>}
                icon={<i className="fas fa-globe" />}
                iconVariant="encyclopedia"
                external
                onClick={() => logClick('portal_periodicos', 'Portal de Periodicos', '#')}
              />
              <ToolCard
                href="https://drive.google.com/drive/folders/1Mp6Zfhq-peIYlo9Js0wYRX2DnRjFYyUj?usp=sharing"
                title="Livros em PDF"
                description={<em>Acervo de obras de Waldo Vieira</em>}
                icon={<i className="fas fa-globe" />}
                iconVariant="encyclopedia"
                external
                onClick={() => logClick('livros_pdf', 'Livros em PDF', '#')}
              />
            </Panel>
          </div>
        </div>

        <footer className="mx-auto mt-16 max-w-[1400px] border-t border-border/50 px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-200"
            >
              Envie seu feedback
            </button>
            <div className="text-sm text-muted-foreground">©2026 Cons-IA.org</div>
            <a
              href="mailto:legadologia@gmail.com"
              onClick={() => logClick('footer_email', 'Email do diretor', 'mailto:legadologia@gmail.com')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>Fale com o Diretor:</span>
              <i className="fas fa-envelope text-primary" />
              <em>transmentor@interludium.ccce</em>
            </a>
          </div>
        </footer>
      </main>

      {feedbackOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackOpen(false);
          }}
        >
          <div className="w-[min(420px,92vw)] rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enviar Feedback</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Sua mensagem será enviada aos desenvolvedores.</p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="Escreva aqui sua mensagem..."
              className="mt-3 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:border-apps-primary focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendFeedback}
                className="rounded-lg bg-apps-primary px-4 py-2 text-sm font-medium text-white hover:bg-apps-secondary"
              >
                Enviar
              </button>
            </div>
            {feedbackStatus && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{feedbackStatus}</div>}
          </div>
        </div>
      )}
    </>
  );
}
