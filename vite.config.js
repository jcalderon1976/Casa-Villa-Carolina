import { cpSync, createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const MEDIA = /\.(pdf|jpe?g|png|webp)$/i;
const TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function rootMedia() {
  const copyIntoDist = (root) => {
    const dist = resolve(root, 'dist');
    if (!existsSync(dist)) return;
    for (const name of readdirSync(root)) {
      if (!MEDIA.test(name)) continue;
      const from = join(root, name);
      if (!statSync(from).isFile()) continue;
      cpSync(from, join(dist, name));
    }
  };

  return {
    name: 'root-media',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use((req, res, next) => {
        let pathname = (req.url || '').split('?')[0];
        try {
          pathname = decodeURIComponent(pathname);
        } catch {
          return next();
        }
        if (!pathname.startsWith('/') || pathname.slice(1).includes('/') || pathname.includes('..')) return next();
        const name = pathname.slice(1);
        if (!MEDIA.test(name)) return next();
        const file = join(root, name);
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', TYPES[extname(name).toLowerCase()] || 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    writeBundle() {
      copyIntoDist(process.cwd());
    },
  };
}

export default defineConfig({
  plugins: [react(), rootMedia()],
  optimizeDeps: {
    include: ['exceljs'],
  },
});
