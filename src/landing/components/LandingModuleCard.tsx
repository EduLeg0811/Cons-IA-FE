import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { logModuleClick, type LandingModule } from '../data/modules';

interface LandingModuleCardProps {
  item: LandingModule;
  accentVar: string;
  bgVar: string;
}

export function LandingModuleCard({ item, accentVar, bgVar }: LandingModuleCardProps) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      onClick={() => logModuleClick(item)}
      className="block h-full"
    >
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border p-5 transition-shadow hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
        style={{ backgroundColor: `var(${bgVar})` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: `var(${accentVar})` }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {item.external && (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold" style={{ color: `var(${accentVar})` }}>
            {item.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </motion.article>
    </a>
  );
}
