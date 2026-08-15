import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LandingFooter } from './components/LandingFooter';
import { LandingModuleCard } from './components/LandingModuleCard';
import { LandingNavbar } from './components/LandingNavbar';
import { landingCategories } from './data/modules';

export function CategoryPage() {
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const category = landingCategories.find((item) => item.key === categoryKey);
  const reduceMotion = useReducedMotion();

  if (!category) return <Navigate to="/" replace />;

  return (
    <div className="landing-shell flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <LandingNavbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao início
          </Link>
        </motion.div>

        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(${category.accentVar})` }} />
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{category.title}</h1>
          </div>
          <p className="pl-[22px] text-sm text-muted-foreground">{category.subtitle}</p>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.items.filter((item) => !item.hidden).map((item, index) => (
            <motion.div
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.15 + index * 0.08, duration: 0.45 }}
            >
              <LandingModuleCard item={item} accentVar={category.accentVar} bgVar={category.bgVar} />
            </motion.div>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
