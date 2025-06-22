import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';
import https from 'https';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'dynamic-proxy',
      configureServer(server: any) {
        server.middlewares.use('/api/proxy', async (req: any, res: any, next: any) => {
          const url = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('url');
          
          if (!url) {
            res.statusCode = 400;
            return res.end('URL parameter is required');
          }

          try {
            const fetch = (await import('node-fetch')).default;
            
            const agent = new https.Agent({
              rejectUnauthorized: false
            });
            
            const response = await fetch(url, {
              agent: url.startsWith('https:') ? agent : undefined
            });
            const data = await response.json();
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify(data));
          } catch (error) {
            console.error('Proxy error:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'Failed to fetch from proxy' }));
          }
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
}));
