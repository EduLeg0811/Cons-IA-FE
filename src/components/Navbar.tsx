import { Maximize2 } from 'lucide-react';
import { useContainerWidth } from '../lib/containerWidth';
import { useTheme } from '../lib/theme';

interface NavbarProps {
  title: string;
  subtitle: string;
}

export function Navbar({ title, subtitle }: NavbarProps) {
  const [theme, toggleTheme] = useTheme();
  const { toggleWidth, containerClass, label } = useContainerWidth();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-[70px] border-b border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
      <div className={`mx-auto flex h-full ${containerClass} items-center justify-between px-4 transition-all duration-300`}>
        <a
          href="internal.html"
          title="Back to Home"
          className="back-button flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <i className="fas fa-home" />
        </a>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title={`Largura da tela: ${label}`}
            aria-label={`Largura da tela: ${label}`}
            onClick={toggleWidth}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Toggle Theme"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
          </button>
        </div>
      </div>
    </nav>
  );
}
