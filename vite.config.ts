import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Serves the /api/* routes during `vite dev` with the same code as the
// Vercel functions, so OneStock credentials stay server-side.
const onestockApi = (env: Record<string, string>): Plugin => ({
  name: 'onestock-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();
      const url = new URL(req.url, 'http://localhost');
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const { handleApi } = await server.ssrLoadModule('/server/onestock.ts');
      const { status, json } = await handleApi(
        {
          method: req.method || 'GET',
          path: url.pathname,
          query: Object.fromEntries(url.searchParams),
          body: raw ? JSON.parse(raw) : undefined,
        },
        { ...process.env, ...env },
      );
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(json));
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), onestockApi(env)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
