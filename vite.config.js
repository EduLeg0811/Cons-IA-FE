import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = __dirname;
const htmlEntries = fs
  .readdirSync(rootDir)
  .filter((file) => file.endsWith('.html'))
  .reduce((entries, file) => {
    entries[file.replace(/\.html$/i, '')] = path.resolve(rootDir, file);
    return entries;
  }, {});

// Main-Server (FastAPI) — todas as rotas ficam sob /api, exceto o visualizador /logs/view.
const devApiTarget = process.env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000';
const backendRoutes = [
  '/api',
  '/logs',
];

function syncStaticFiles() {
  return {
    name: 'sync-static-files',
    closeBundle() {
      const outDir = path.resolve(rootDir, 'dist');

      const htmlFiles = fs
        .readdirSync(outDir)
        .filter((file) => file.endsWith('.html'));

      for (const file of htmlFiles) {
        const target = path.resolve(outDir, file);
        const html = fs.readFileSync(target, 'utf8');
        const normalized = html.replace(/\/assets\/icon-[^"']+\.png/gi, '/icon.png');
        if (normalized !== html) {
          fs.writeFileSync(target, normalized, 'utf8');
        }
      }
    },
  };
}

export default defineConfig({
  publicDir: 'public',
  server: {
    proxy: backendRoutes.reduce((proxy, route) => {
      proxy[route] = {
        target: devApiTarget,
        changeOrigin: true,
      };
      return proxy;
    }, {}),
  },
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
  plugins: [react(), syncStaticFiles()],
});
