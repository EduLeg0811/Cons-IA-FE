---
name: standard-header-design
description: Aplica o padrão de cabeçalho unificado Cons-IA em qualquer projeto ou página, mantendo a identidade visual consistente com ícone de 48px, separador vertical e tipografia harmônica.
---

# Padrão de Cabeçalho Visual Unificado (Cons-IA)

Este guia define as especificações técnicas e de design para implementar e padronizar o cabeçalho (`Header` / `Navbar`) em todos os projetos da suite. O objetivo é estabelecer uma identidade visual forte e coerente entre aplicações distintas, mantendo variações apenas nos títulos e subtítulos.

---

## 📐 Estrutura e Classes CSS (Tailwind CSS)

O cabeçalho deve seguir rigorosamente a seguinte estrutura HTML/React:

```tsx
<nav className="sticky top-0 z-30 border-b border-border/50 bg-card/70 backdrop-blur-xl">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
    {/* Lado Esquerdo: Identidade da Marca (Brand Area) */}
    <a href="index.html" title="Voltar à página inicial" className="group flex items-center gap-3">
      {/* Ícone principal de 48px com micro-animação */}
      <img
        src="/icon.png"
        alt="Logo"
        className="h-12 w-12 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_40%,transparent)]"
      />
      {/* Bloco de Texto Alinhado Verticalmente */}
      <span className="flex items-center gap-2">
        {/* Título Principal */}
        <span className="font-display text-3xl font-medium tracking-tight text-foreground truncate max-w-[14rem] sm:max-w-none">
          Nome<span className="italic text-primary">Projeto</span>
        </span>

        {/* Separador Vertical Discreto */}
        <span className="hidden h-4 w-px bg-border sm:inline" />

        {/* Subtítulo / Categoria */}
        <span className="hidden font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground sm:inline">
          Subtítulo do Projeto
        </span>
      </span>
    </a>

    {/* Lado Direito: Ações Globais (Botões de Ação, Theme Toggle, etc.) */}
    <div className="flex items-center gap-2">
      {/* Exemplo de botão de controle de tema */}
      <button
        type="button"
        title="Alternar Tema"
        onClick={toggleTheme}
        className="nav-icon-btn group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/60 bg-white/60 text-gray-600 transition-colors dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300"
      >
        {theme === 'dark' ? (
          <Sun className="h-[18px] w-[18px] transition-transform duration-300 group-hover:rotate-45" strokeWidth={1.5} />
        ) : (
          <Moon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-12" strokeWidth={1.5} />
        )}
      </button>
    </div>
  </div>
</nav>
```

---

## 🎨 Detalhes Visuais Importantes e Tipografia

1. **Ícone**:
   - Tamanho fixo de **48px** (`h-12 w-12` no Tailwind CSS).
   - Efeito hover com escala leve (`group-hover:scale-110`) e sombra colorida/brilho no hover usando a cor primária do tema (`group-hover:drop-shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_40%,transparent)]`) — nunca uma cor hardcoded, para que o brilho acompanhe automaticamente a paleta de cada projeto e o modo claro/escuro.

2. **Alinhamento**:
   - O container de texto deve usar `flex items-center gap-2` para centralizar verticalmente o título, o separador e o subtítulo, garantindo harmonia.

3. **Título Principal**:
   - **Família de Fonte**: `font-display` (Lora).
   - **Tamanho**: `text-3xl` (30px / 1.875rem).
   - **Peso**: `font-medium` (500) — obrigatório declarar explicitamente; nunca deixar o peso implícito/herdado, pois o reset do Tailwind (`preflight`) zera o `font-weight` de headings para `inherit`, e o resultado fica dependente do contexto onde o cabeçalho é inserido.
   - **Espaçamento**: `tracking-tight` (-0.025em) para um visual moderno e limpo.
   - **Cor base**: `text-foreground` (token de tema, claro/escuro automático) — nunca `text-gray-900`/`dark:text-gray-100` hardcoded.
   - **Destaque da Cor**: O sufixo ou elemento em destaque deve vir em itálico (`italic`) usando `text-primary` (token de tema que mapeia a cor característica de cada projeto via `--primary` em `styles.css`). Convenção: o destaque recai sobre a segunda metade/palavra do nome do projeto (ex.: `Lexi` + `Cons` em itálico).
   - **Overflow**: `truncate` com `max-w-[14rem] sm:max-w-none` — nomes de projeto mais longos não podem quebrar o layout horizontal do cabeçalho em telas pequenas.

4. **Separador Vertical**:
   - Altura de `16px` (`h-4`), largura de `1px` (`w-px`).
   - Cor: `bg-border` (token de tema, equivalente a `--border` em `styles.css`) — nunca `bg-gray-300`/`dark:bg-gray-600` hardcoded.
   - Responsividade: Deve sumir em telas pequenas (`hidden sm:inline`).

5. **Subtítulo / Categoria** (ex.: "Agregador Léxico", após o separador vertical):
   - **Família de Fonte**: `font-sans` (Nunito Sans) — declarar a classe explicitamente no elemento, nunca confiar em herança. Não existe classe `.font-body` no projeto; `font-sans` é a classe Tailwind real mapeada para `--font-sans` em `styles.css`. Sem declaração explícita, se o subtítulo for aninhado dentro de um elemento com `font-display`, ele herdaria a fonte serifada do título por engano.
   - **Tamanho**: Extra pequeno, `text-xs` (`0.75rem` / `12px`).
   - **Espaçamento entre letras**: Customizado e amplo, `0.22em` (`tracking-[0.22em]`).
   - **Formatação**: Caixa alta (`uppercase`).
   - **Cor**: `text-muted-foreground`, o tom cinza/esmaecido do tema (definido em `styles.css` via `--muted-foreground`), que varia conforme o modo:
     - Modo claro: `oklch(0.55 0.025 280)`
     - Modo escuro: `oklch(0.68 0.02 280)`
     - Nunca a cor de destaque do projeto, que fica reservada ao título.
   - **Alinhamento**: dentro do mesmo container flex do bloco de texto (`flex items-center gap-2`), na sequência: título → separador vertical → subtítulo.
   - **Responsividade**: Oculto por padrão em telas muito pequenas (`hidden`) e exibido em linha (`sm:inline`) a partir de `≥640px`, junto com o separador vertical.

   Classes Tailwind de referência:
   ```
   hidden font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground sm:inline
   ```

6. **Botões de Ação (lado direito)** — obrigatório, não apenas exemplo ilustrativo:
   - **Tamanho do botão**: `h-10 w-10`, círculo perfeito (`rounded-full`).
   - **Borda**: `border border-border/60` (token de tema).
   - **Fundo**: `bg-card/60`.
   - **Cor do ícone**: `text-foreground/60` em repouso, `hover:text-primary` no hover, com `hover:border-primary/40` na borda.
   - **Ícone interno**: `18px` (`h-[18px] w-[18px]`), `strokeWidth={1.5}`, com micro-animação no hover (`transition-transform`, ex.: `group-hover:rotate-45` ou `group-hover:-rotate-12`).
   - **Agrupamento**: todos os botões de ação ficam dentro de `flex items-center gap-2`, à direita do cabeçalho.

   Classes Tailwind de referência:
   ```
   group inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/60 text-foreground/60 transition hover:border-primary/40 hover:text-primary
   ```

---

## 🎨 Fundo do Cabeçalho

O cabeçalho (`<nav>`/`<header>`) deve ter um plano de fundo **próprio**, distinto do fundo do restante da página — nunca reutilizar `bg-background` (que é a cor de fundo geral da página).

- **Cor**: `bg-card` (token de tema, equivalente a `--card` em `styles.css`). No modo claro isso resulta em branco puro (`--card: white`); no modo escuro, na superfície elevada do tema (`--card: oklch(0.18 0.02 280)`), que ainda assim se diferencia do `--background` da página.
- **Transparência/blur**: aplicar com leve transparência e desfoque (`bg-card/70 backdrop-blur-xl`) para manter o efeito "sticky" translúcido sem se confundir com o conteúdo ao rolar a página.
- **Separação do restante da página**: uma linha horizontal discreta (`border-b border-border/50`) marca o limite entre o cabeçalho e o corpo da página — é essa borda, e não uma mudança de tonalidade abrupta, que comunica a transição.
- **Nunca**: alterar a cor de fundo do `<body>`/restante da página para combinar com o cabeçalho — a distinção de planos é intencional e faz parte da identidade visual.

---

## 🌈 Cores Características de Cada Projeto

Todo o cabeçalho usa tokens de tema (`text-foreground`, `text-primary`, `bg-background`, `bg-border`, `text-muted-foreground`) em vez de cores Tailwind hardcoded (`gray-900`, `gray-300`, etc.). Isso garante que basta redefinir as CSS custom properties em `styles.css` (`--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, para os modos claro e escuro) para que o cabeçalho herde automaticamente a identidade visual de cada projeto, sem tocar no componente.

*Nota: Ao aplicar o cabeçalho a um novo projeto, basta garantir que `--primary` em `styles.css` aponte para a cor característica do projeto — o destaque do título (`text-primary`) e o brilho de hover do ícone acompanham essa variável automaticamente.*

---

## ⚠️ Requisito Crítico: Importação de Fontes no HTML

Para que a tipografia do cabeçalho funcione perfeitamente e fique idêntica em todas as páginas, **todas as páginas HTML** devem importar obrigatoriamente as fontes do Google Fonts (`Lora` e `Nunito Sans`) na tag `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Caso contrário, o navegador usará as fontes padrão do sistema (como Times New Roman ou Arial), quebrando a harmonia visual e a identidade única.

---

## 🔍 Caixa de Pesquisa (Search Input)

A caixa de pesquisa principal segue o mesmo princípio de identidade visual unificada do cabeçalho, com tokens de tema em vez de cores hardcoded. Deve ser implementada rigorosamente assim:

```tsx
<form
  onSubmit={handleSubmit}
  className="flex gap-1.5 sm:gap-2 rounded-2xl border border-border/70 bg-card/80 p-1.5 sm:p-2 shadow-[0_4px_24px_-12px_rgba(80,70,120,0.25)] backdrop-blur w-full"
>
  <input
    autoFocus
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Texto de placeholder específico do projeto…"
    className="flex-1 min-w-0 rounded-xl bg-transparent px-3 py-2 sm:px-4 sm:py-3 font-display text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
  />
  <button
    type="submit"
    aria-label="Pesquisar"
    title="Pesquisar"
    className="shrink-0 rounded-xl bg-primary px-5 py-2.5 sm:px-6 sm:py-3 text-primary-foreground transition hover:opacity-90 flex items-center justify-center"
  >
    <Search className="h-6 w-6" strokeWidth={2} />
  </button>
</form>
```

1. **Container (`form`)**:
   - Layout: `flex` com gap responsivo `gap-1.5 sm:gap-2`, ocupando toda a largura disponível (`w-full`).
   - Forma: cantos bem arredondados, `rounded-2xl`.
   - Borda: `border border-border/70` (token de tema).
   - Fundo: `bg-card/80` com `backdrop-blur` — mesma lógica do [🎨 Fundo do Cabeçalho](#-fundo-do-cabeçalho), nunca `bg-background`.
   - Sombra: `shadow-[0_4px_24px_-12px_rgba(80,70,120,0.25)]`, sutil e suspensa, para destacar a caixa do restante da página.
   - Espaçamento interno: `p-1.5 sm:p-2`.

2. **Campo de texto (`input`)**:
   - Família de fonte: `font-display` (Lora) — mesma fonte do título do cabeçalho, reforçando a identidade.
   - Tamanho: `text-base sm:text-lg`.
   - Fundo: `bg-transparent` (deixa o fundo do container `form` aparecer).
   - Cor do texto: `text-foreground`; placeholder em `placeholder:text-muted-foreground/50`.
   - Cantos: `rounded-xl` (levemente menor que o container externo, mantendo a hierarquia visual).
   - Sem contorno de foco do navegador: `focus:outline-none` (o destaque de foco fica a cargo da borda do `form`, se desejado).
   - Ocupa o espaço restante: `flex-1 min-w-0`.

3. **Botão de envio (ícone)**:
   - Forma: `rounded-xl`, `shrink-0` (não encolhe quando o texto do input cresce).
   - Cor do texto/ícone: `text-primary-foreground` (token de tema, garante contraste com o fundo do botão).
   - Transição: `transition hover:opacity-90`.
   - Ícone interno: `h-6 w-6`, `strokeWidth={2}`.
   - Acessibilidade: `aria-label` e `title` descritivos da ação (ex.: "Pesquisar").

4. **Exceções — características específicas de cada projeto** (não fazem parte do padrão fixo):
   - **Texto interno** (`placeholder` do input): cada projeto define seu próprio texto de exemplo (ex.: "Pesquise uma palavra…").
   - **Cor de fundo do ícone/botão** (`bg-primary`): embora a *classe* seja sempre `bg-primary` (token de tema, nunca uma cor hardcoded), o *valor* de `--primary` em `styles.css` é o que muda de projeto para projeto, assim como no destaque do título do cabeçalho.

   Todos os demais aspectos (forma, bordas, sombra, tipografia, espaçamento, tamanho do ícone) seguem o padrão fixo acima, da mesma forma que o cabeçalho.
