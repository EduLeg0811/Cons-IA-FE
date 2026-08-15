import { Mail } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card/30 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
        <p className="text-xs text-muted-foreground">©2026 Cons-IA.org</p>
        <a
          href="mailto:legadologia@gmail.com"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Contato</span>
        </a>
      </div>
    </footer>
  );
}
