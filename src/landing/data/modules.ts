import type { ComponentType } from 'react';
import {
  Book,
  BookA,
  BookOpen,
  Globe,
  GraduationCap,
  List,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { logFeatureAccess } from '../../lib/config';

export interface LandingModule {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  external?: boolean;
  badge?: string;
  hidden?: boolean;
  moduleKey?: string;
}

export function logModuleClick(item: LandingModule): void {
  try {
    const isExternal = Boolean(item.external) || /^https?:\/\//i.test(item.href) || /^mailto:/i.test(item.href);
    if (!isExternal) {
      return;
    }
    const moduleKey = item.moduleKey || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    logFeatureAccess({
      module: moduleKey,
      action: 'click',
      label: item.title,
      value: item.href,
      meta: { href: item.href },
    });
  } catch {
    // ignore logging errors
  }
}

export interface LandingCategory {
  key: string;
  title: string;
  subtitle: string;
  accentVar: string;
  bgVar: string;
  landingLabel: string;
  landingDescription: string;
  landingIcon: ComponentType<{ className?: string }>;
  items: LandingModule[];
}

export const landingCategories: LandingCategory[] = [
  {
    key: 'busca',
    title: 'Busca IA',
    subtitle: 'Busca inteligente de palavras em livros, verbetes e questões',
    accentVar: '--landing-search',
    bgVar: '--landing-search-soft',
    landingLabel: 'Buscar em Livros e Verbetes',
    landingDescription: 'Busque palavras ou termos específicos nos livros, tratados e verbetes da Conscienciologia.',
    landingIcon: Search,
    items: [
      {
        title: 'Livros & Tratados',
        description: 'Encontre palavras e termos exatos nos livros e tratados de Waldo Vieira.',
        icon: Search,
        href: 'index_search_book.html',
        moduleKey: 'search_book',
      },
      {
        title: 'Verbetes',
        description: 'Pesquise palavras e termos dentro da Definologia dos verbetes.',
        icon: Book,
        href: 'index_search_verb.html',
        moduleKey: 'search_verb',
      },
      {
        title: 'Conscienciograma',
        description: 'Busque palavras e termos nas questões do Conscienciograma.',
        icon: Book,
        href: 'index_search_ccg.html',
        moduleKey: 'search_ccg',
      },
    ],
  },
  {
    key: 'biblio',
    title: 'Biblio IA',
    subtitle: 'Referências de livros, artigos e verbetes',
    accentVar: '--landing-biblio',
    bgVar: '--landing-biblio-soft',
    landingLabel: 'Consultar Bibliografia',
    landingDescription: 'Consulte referências bibliográficas completas de livros e verbetes.',
    landingIcon: List,
    items: [
      {
        title: 'Bibliografia de Livros',
        description: 'Referências bibliográficas completas das obras de Waldo Vieira.',
        icon: List,
        href: 'index_biblio_wv.html',
        moduleKey: 'biblio_wv',
      },
      {
        title: 'Bibliografia de Verbetes',
        description: 'Referências bibliográficas de verbetes da Enciclopédia da Conscienciologia.',
        icon: Book,
        href: 'index_biblio_verbete.html',
        moduleKey: 'biblio_verbete',
      },
    ],
  },
  {
    key: 'bots',
    title: 'Bots IA',
    subtitle: 'Assistentes inteligentes de conversação',
    accentVar: '--landing-bots',
    bgVar: '--landing-bots-soft',
    landingLabel: 'Conversar com a IA',
    landingDescription: 'Converse e explore temas conscienciológicos com assistentes de IA.',
    landingIcon: MessageSquare,
    items: [
      {
        title: 'ConsGPT',
        description: 'Assistente ChatGPT especializado em Conscienciologia.',
        icon: MessageSquare,
        href: 'https://chatgpt.com/g/g-68a5d68b96c4819189dd1e6fb0def83f-consgpt',
        external: true,
        moduleKey: 'consgpt',
      },
      {
        title: 'ConsLM',
        description: 'Notebook IA do Google treinado com fontes conscienciológicas.',
        icon: Sparkles,
        href: 'https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67',
        external: true,
        moduleKey: 'conslm',
      },
      {
        title: 'ConsBOT',
        description: 'Chatbot RAG desenvolvido pela Conscienciologia.',
        icon: GraduationCap,
        href: 'https://consbot-owr0.onrender.com/',
        moduleKey: 'ragbot',
        external: true,
      },
    ],
  },
  {
    key: 'apps',
    title: 'Apps IA',
    subtitle: 'Aplicativos diversos com inteligência artificial',
    accentVar: '--landing-apps',
    bgVar: '--landing-apps-soft',
    landingLabel: 'Usar Aplicativos IA',
    landingDescription: 'Bibliomancia digital, quiz e flashcards para estudo conscienciológico.',
    landingIcon: Sparkles,
    items: [
      {
        title: 'Bibliomancia Digital',
        description: 'Sorteie pensatas aleatórias do Léxico de Ortopensatas.',
        icon: BookOpen,
        href: 'index_mancia.html',
        moduleKey: 'mancia',
      },
      {
        title: 'LexiCons',
        description: 'Dicionários diversos.',
        icon: BookA,
        href: 'https://lexicons.cons-ia.org/',
        external: true,
        hidden: false,
        moduleKey: 'lexicons',
      },
      {
        title: 'Quiz Conscienciológico',
        description: 'Teste seus conhecimentos com questões conscienciológicas.',
        icon: Sparkles,
        href: 'https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67?artifactId=8f6fc286-021f-4184-b572-7f17c8561539',
        external: true,
        moduleKey: 'quiz',
      },
      {
        title: 'Flashcards',
        description: 'Estude temas conscienciológicos com flashcards gerados por IA.',
        icon: BookOpen,
        href: 'https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67?artifactId=2da2f57f-996c-4efd-b24c-c2f49ba8b452',
        external: true,
        moduleKey: 'flashcards',
      },
    ],
  },
  {
    key: 'links',
    title: 'Links Externos',
    subtitle: 'Páginas úteis da Conscienciologia',
    accentVar: '--landing-links',
    bgVar: '--landing-links-soft',
    landingLabel: 'Explorar a Conscienciologia',
    landingDescription: 'Acesse portais, enciclopédias e acervos da Conscienciologia.',
    landingIcon: Globe,
    items: [
      {
        title: 'ICGE',
        description: 'Instituto Cognopolitano de Geografia e Estatística.',
        icon: Globe,
        href: 'https://www.icge.org.br/',
        external: true,
        moduleKey: 'icge',
      },
      {
        title: 'Enciclopédia',
        description: 'Enciclopédia da Conscienciologia.',
        icon: Globe,
        href: 'https://enciclopediadaconscienciologia.org/',
        external: true,
        moduleKey: 'enciclopedia',
      },
      {
        title: 'Periódicos',
        description: 'Portal de periódicos da Conscienciologia.',
        icon: Globe,
        href: 'https://periodicos.conscienciologia.org.br/',
        external: true,
        moduleKey: 'periodicos',
      },
      {
        title: 'Livros em PDF',
        description: 'Acervo de livros em PDF.',
        icon: Globe,
        href: 'https://drive.google.com/drive/folders/1Mp6Zfhq-peIYlo9Js0wYRX2DnRjFYyUj?usp=sharing',
        external: true,
        moduleKey: 'livros_pdf',
      },
    ],
  },
];
