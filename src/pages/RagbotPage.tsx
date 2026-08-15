import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { ChatMessage } from '../components/ChatMessage';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { callLlm } from '../lib/api';
import { CONFIG, logFeatureAccess } from '../lib/config';
import { getOrCreateChatId, newConversationId, ragbotReset } from '../lib/chatId';
import { INSTRUCTIONS_RAGBOT, INST_ENGLISH } from '../lib/prompts';

const STORAGE_KEY = 'appConfig_ragbot';
const USED_KEY = 'appConfig_ragbot_used';
const ALLOWED_SOURCES = new Set(['ALLWV', 'AUTORES', 'ENGLISH', 'MINI']);

const BOOK_OPTIONS = [
  { value: 'ALLWV', label: 'Bibliografia Waldo Vieira', desc: 'Livros & Tratados de autoria de Waldo Vieira' },
  { value: 'AUTORES', label: 'Autores Diversos', desc: 'Livros de outros autores da Conscienciologia' },
  { value: 'ENGLISH', label: 'Bibliography in English', desc: 'Fontes conscienciológicas em língua inglesa' },
];

const FIXED_QUESTIONS: Record<string, string[]> = {
  ENGLISH: [
    'List five essential steps I need to take in order to begin the practice of Tenepes (Penta).',
    'How can I determine where I stand on the Evolutionary Scale of the Consciousness?',
    'What does Proexis (Existential Program) mean, and how can one identify their own existential programming?',
    'What is the role of Extraphysical Reurbanizations (Reurbexes) in the evolutionary context of the planet?',
    'Discuss the Extraphysical Communities (Communexes) and their connection with Intermissive Courses.',
  ],
  AUTORES: [
    'Como saber se sou completista na proéxis? Quais indicadores devo observar?',
    'Cite os principais sinais da autodesassimilação energética (desassim).',
    'O que é a Conscienciometria e como aplicar o Conscienciograma na autoavaliação pessoal?',
    'Faça uma comparação entre recin e recéxis',
    'Fale sobre o papel da Autopesquisa na Conscienciologia e como aplicá-la na prática diária',
  ],
  MINI: [
    'Quais são as principais características do evoluciólogo, e como sua atuação difere da de outros amparadores?',
    'Quais são os indicadores do completismo existencial mais debatidos nas minitertúlias, e como avaliá-los?',
    'Como o conceito de autodesassedialidade é explorado nos debates avançados das minitertúlias?',
    'Quais os exemplos de parafenômenos avançados relatados e analisados nas minitertúlias?',
    'Como a Pré-Intermissiologia aborda a questão da liderança interassistencial e seus efeitos evolutivos?',
  ],
  DEFAULT_PT: [
    'Liste 5 coisas que preciso fazer para iniciar a prática da Tenepes.',
    'Com posso saber onde me localizo nos níveis da Escala Evolutiva?',
    'O que significa Proéxis e como identificar a própria programação existencial?',
    'Qual o papel das Reurbanizações Extrafísicas (Reurbexes) no contexto evolutivo do planeta?',
    'Fale sobre as Comunidades Extrafísicas (Comunexes) e sua relação com os Cursos Intermissivos.',
  ],
};

interface ChatEntry {
  id: string;
  sender: 'user' | 'bot';
  content: string;
}

function loadBooks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ['ALLWV'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.books) && parsed.books.length ? parsed.books : ['ALLWV'];
  } catch {
    return ['ALLWV'];
  }
}

function hasUsedConfig(): boolean {
  try {
    return localStorage.getItem(USED_KEY) === 'true';
  } catch {
    return false;
  }
}

function instructionsForBooks(books: string[]): string {
  if (books.includes('ENGLISH')) return INST_ENGLISH;
  return INSTRUCTIONS_RAGBOT;
}

function fixedQuestionsForBooks(books: string[]): string[] {
  if (books.includes('ENGLISH')) return FIXED_QUESTIONS.ENGLISH;
  if (books.includes('AUTORES')) return FIXED_QUESTIONS.AUTORES;
  if (books.includes('MINI')) return FIXED_QUESTIONS.MINI;
  return FIXED_QUESTIONS.DEFAULT_PT;
}

export function RagbotPage() {
  const [books, setBooks] = useState<string[]>(() => loadBooks());
  const [used, setUsed] = useState<boolean>(() => hasUsedConfig());
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingBooks, setPendingBooks] = useState<string[]>(books);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const busyRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const isEnglish = books.includes('ENGLISH');

  useEffect(() => {
    if (used && messages.length === 0 && suggestions.length === 0) {
      setSuggestions(fixedQuestionsForBooks(books));
    }
  }, [used, books, messages.length, suggestions.length]);

  // Support popup-launch contract from embed widgets: ?source=ALLWV&question=...
  useEffect(() => {
    const pageParams = new URLSearchParams(window.location.search);
    const sourceParam = (pageParams.get('source') || '').trim().toUpperCase();
    if (ALLOWED_SOURCES.has(sourceParam)) {
      setBooks([sourceParam]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ books: [sourceParam], module: 'ragbot' }));
      localStorage.setItem(USED_KEY, 'true');
      setUsed(true);
    }

    const questionParam = (pageParams.get('question') || '').trim();
    if (questionParam) {
      setInput(questionParam);
      const timeoutId = window.setTimeout(() => send(questionParam), 150);
      return () => window.clearTimeout(timeoutId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed || busyRef.current) return;

      busyRef.current = true;
      setBusy(true);
      setSuggestions([]);
      setInput('');

      const userId = `msg-${Date.now()}-user`;
      setMessages((prev) => [{ id: userId, sender: 'user', content: trimmed }, ...prev]);

      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      try {
        const chatId = getOrCreateChatId('ragbot');
        const response = await callLlm({
          query: trimmed,
          model: CONFIG.MODEL_RAGBOT,
          temperature: CONFIG.TEMPERATURE,
          llm_max_results: CONFIG.LLM_MAX_RESULTS,
          max_output_tokens: CONFIG.MAX_OUTPUT_TOKENS,
          vector_store_names: books,
          instructions: instructionsForBooks(books),
          reasoning_effort: 'none',
          verbosity: 'low',
          use_session: true,
          chat_id: chatId,
          timeout_ms: 120000,
          signal: controllerRef.current.signal,
        });

        if (!response || response.error || response.abort) {
          const errorMessage = response?.error || response?.message || 'Erro ao chamar o backend.';
          setMessages((prev) => [{ id: `msg-${Date.now()}-bot`, sender: 'bot', content: `⚠️ ${errorMessage}` }, ...prev]);
          return;
        }

        const botText = response.text ?? response.response ?? '';
        setMessages((prev) => [{ id: `msg-${Date.now()}-bot`, sender: 'bot', content: botText }, ...prev]);

        try {
          logFeatureAccess({
            module: 'ragbot',
            action: 'ask',
            label: 'Consulta ao ConsBOT',
            chat_id: chatId,
            value: trimmed,
            meta: { selected_sources: books, source_count: books.length, limit_status: response.limit_status || 'normal', response_text: botText },
          });
        } catch {
          // ignore logging errors
        }
      } catch (error) {
        const name = (error as Error)?.name;
        const msg = name === 'AbortError' ? 'Request timed out' : (error as Error)?.message || 'An unexpected error occurred';
        setMessages((prev) => [{ id: `msg-${Date.now()}-bot`, sender: 'bot', content: `Sorry, there was an error: ${msg}` }, ...prev]);
      } finally {
        busyRef.current = false;
        setBusy(false);
        controllerRef.current = null;
      }
    },
    [books]
  );

  const handleNewConversation = async () => {
    try {
      logFeatureAccess({ module: 'ragbot', action: 'new_conversation', label: 'New Conversation' });
    } catch {
      // ignore logging errors
    }

    const chatId = getOrCreateChatId('ragbot');
    await ragbotReset(chatId);
    newConversationId('ragbot');
    setMessages([]);

    setGeneratingSuggestions(true);
    try {
      const generated = await generateInitialQuestionsLLM(books, 5, controllerRef);
      setSuggestions(generated && generated.length ? generated : fixedQuestionsForBooks(books));
    } catch {
      setSuggestions(fixedQuestionsForBooks(books));
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const saveConfig = () => {
    const next = pendingBooks.length ? pendingBooks : ['ALLWV'];
    setBooks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ books: next, module: 'ragbot' }));
    localStorage.setItem(USED_KEY, 'true');
    setUsed(true);
    setMessages([]);
    setSuggestions(fixedQuestionsForBooks(next));

    try {
      logFeatureAccess({
        module: 'ragbot',
        action: 'save_config',
        label: 'Configuracao do ConsBOT',
        meta: { books: next, books_count: next.length, selected_sources: next },
      });
    } catch {
      // ignore logging errors
    }

    setPanelOpen(false);
  };

  const togglePendingBook = (value: string) => {
    setPendingBooks((prev) => {
      const isActive = prev.includes(value);
      if (isActive) return prev.filter((v) => v !== value);
      if (prev.length >= 2) return prev;
      return [...prev, value];
    });
  };

  return (
    <>
      <Navbar title="ConsBOT" subtitle="IA da Conscienciologia" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-[90px]">
        <div className="relative mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setPendingBooks(books);
              setPanelOpen((v) => !v);
            }}
            title="Search options"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <i className="fas fa-sliders-h" />
          </button>
          <button
            type="button"
            onClick={handleNewConversation}
            title="New Conversation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <i className="fa-regular fa-file" />
          </button>

          {panelOpen && (
            <div className="absolute left-0 top-12 z-50 w-[min(420px,92vw)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="flex flex-col gap-3">
                {BOOK_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <button
                      type="button"
                      onClick={() => togglePendingBook(opt.value)}
                      className={`h-8 w-full rounded-full border px-3 text-sm font-medium shadow-sm transition-colors ${
                        pendingBooks.includes(opt.value)
                          ? 'border-gray-300 bg-gray-400 text-yellow-200'
                          : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                    <div className="ml-1.5 mt-1 text-xs text-gray-600 dark:text-gray-400">{opt.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={saveConfig}
                  title="Salvar ajustes"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-bots-primary text-white hover:bg-bots-secondary"
                >
                  <i className="fa-solid fa-check" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg focus-within:border-bots-primary dark:border-gray-700 dark:bg-gray-900">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={isEnglish ? 'Hello, Conscientiologist!' : 'Sobre o que você gostaria de conversar?'}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={busy}
            aria-label="Search"
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-bots-primary text-white transition-colors hover:bg-bots-secondary disabled:cursor-not-allowed disabled:opacity-70 ${busy ? 'relative' : ''}`}
          >
            {busy ? (
              <span className="absolute inset-[10px] animate-spin rounded-full border-2 border-white/85 border-t-transparent" />
            ) : (
              <i className="fas fa-paper-plane" />
            )}
          </button>
        </div>

        {!used && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <strong>
              Chatbot de <em>conversação</em> com os textos da Conscienciologia (estilo chatGPT).
            </strong>
            <br />
            <br />
            <strong>Instruções:</strong>
            <br />
            • Clique no ícone de <em>configurações</em> acima para selecionar a <strong>base de dados</strong> do chat.
            <br />
            • Clique no ícone de <em>nova conversa</em> acima para <strong>limpar o chat</strong> e iniciar um assunto ou tema
            diferente.
          </div>
        )}

        <div className="flex flex-col gap-6 py-2">
          {busy && <LoadingIndicator message="Consultando o ConsBOT..." />}
          {messages.map((m) => (
            <ChatMessage key={m.id} sender={m.sender} content={m.content} />
          ))}

          {messages.length === 0 && !busy && (
            <div className="mt-2">
              <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                {generatingSuggestions ? 'Gerando novas perguntas...' : isEnglish ? 'Sample questions:' : 'Sugestões de perguntas:'}
              </div>
              {!generatingSuggestions && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full bg-[#f6fff8] px-3 py-2 text-left text-sm text-[#3a513a] shadow-sm hover:opacity-80"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

async function generateInitialQuestionsLLM(
  books: string[],
  count: number,
  controllerRef: { current: AbortController | null }
): Promise<string[] | null> {
  const isEnglish = books.includes('ENGLISH');
  const prompt = isEnglish
    ? `Generate ${count} short, high-quality sample questions for a Conscienciology RAG chatbot.\nReturn ONLY a valid JSON array of strings (no markdown, no commentary).\nRules:\n- Questions must be varied (practice, concepts, self-research, techniques).\n- Avoid duplicates and near-duplicates.\n- Keep each question under 160 characters.\n- Do not number the items.`
    : `Gere ${count} sugestões de perguntas curtas e inteligentes para um RAGbot de Conscienciologia.\nRetorne SOMENTE um JSON válido no formato: ["pergunta 1", "pergunta 2", ...] (sem markdown, sem comentários).\nRegras:\n- Varie as questões (prática, conceitos, autopesquisa, técnicas, dúvidas comuns).\n- Evite duplicatas e quase-duplicatas.\n- Cada pergunta com no máximo 160 caracteres.\n- Não numere os itens.`;

  let response;
  try {
    response = await callLlm({
      query: prompt,
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      llm_max_results: CONFIG.LLM_MAX_RESULTS,
      max_output_tokens: CONFIG.MAX_OUTPUT_TOKENS,
      vector_store_names: books,
      instructions: instructionsForBooks(books),
      reasoning_effort: 'none',
      verbosity: 'low',
      use_session: false,
      timeout_ms: 120000,
      signal: controllerRef.current?.signal,
    });
  } catch {
    return null;
  }

  const rawText = (response?.text ?? response?.response ?? '').trim();
  if (!rawText) return null;

  const parsed = tryParseJsonArray(rawText);
  if (!parsed) return null;

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of parsed) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
    if (unique.length >= count) break;
  }

  if (unique.length < Math.min(6, count)) return null;
  return unique.slice(0, count);
}

function tryParseJsonArray(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    // fall through to bracket extraction
  }

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}
