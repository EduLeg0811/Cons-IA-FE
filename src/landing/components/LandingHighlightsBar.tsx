import { landingCategories, logModuleClick } from '../data/modules';

type HighlightedAppSelection = {
  categoryKey: string;
  appTitle: string;
  appText: string;
};

// ==========================================================================
// DESTAQUES DA PÁGINA INICIAL
// Para trocar os apps exibidos na barra "Destaques • Acesso Rápido",
// altere SOMENTE a lista abaixo. Use em `categoryKey` e `appTitle` o `key`
// da categoria e o `title` EXATO definidos em ../data/modules.ts. Use
// `appText` para escolher livremente o texto mostrado no pill. A cor, o link
// e a descrição continuam sendo reutilizados a partir da seção original.
// ==========================================================================----
const HIGHLIGHTED_APPS: HighlightedAppSelection[] = [
  { categoryKey: 'busca', appTitle: 'Livros & Tratados', appText: 'Busca em Livros' },
  { categoryKey: 'busca', appTitle: 'Verbetes', appText: 'Busca em Verbetes' },
  { categoryKey: 'biblio', appTitle: 'Bibliografia de Livros', appText: 'Bibliografia de Livros' },
  { categoryKey: 'biblio', appTitle: 'Bibliografia de Verbetes', appText: 'Bibliografia de Verbetes' },
  //{ categoryKey: 'bots', appTitle: 'ConsGPT', appText: 'ConsGPT' },
  { categoryKey: 'bots', appTitle: 'ConsBOT', appText: 'NEW ● ConsBOT' },
  { categoryKey: 'apps', appTitle: 'LexiCons', appText: 'LexiCons' },
];

const highlightedApps = HIGHLIGHTED_APPS.flatMap((selection) => {
  const category = landingCategories.find(({ key }) => key === selection.categoryKey);
  const app = category?.items.find(({ title }) => title === selection.appTitle);

  return category && app ? [{ app, appText: selection.appText, category }] : [];
});

export function LandingHighlightsBar() {
  return (
    <section
      className="mx-auto mt-5 w-full max-w-5xl px-5 text-left sm:mt-6"
      aria-labelledby="landing-highlights-title"
    >
      <div className="mx-auto w-full max-w-[960px] px-1 sm:px-2">
        <div className="flex items-center gap-3">
          <div className="h-px min-w-8 flex-1 bg-muted-foreground/20" aria-hidden="true" />
          <h2
            id="landing-highlights-title"
            className="shrink-0 text-center text-[10px] font-semibold tracking-[0.13em] text-muted-foreground/75 uppercase sm:text-[11px]"
          >
            Destaques <span className="mx-1 text-muted-foreground/40">●</span> Acesso Rápido
          </h2>
          <div className="h-px min-w-8 flex-1 bg-muted-foreground/20" aria-hidden="true" />
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {highlightedApps.map(({ app, appText, category }) => (
            <a
              key={`${category.key}-${app.title}`}
              href={app.href}
              target={app.external ? '_blank' : undefined}
              rel={app.external ? 'noopener noreferrer' : undefined}
              title={app.description}
              onClick={() => logModuleClick(app)}
              className="rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: `color-mix(in srgb, var(${category.accentVar}) 42%, transparent)`,
                backgroundColor: `color-mix(in srgb, var(${category.accentVar}) 10%, transparent)`,
                color: `var(${category.accentVar})`,
              }}
            >
              {appText}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
