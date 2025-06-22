import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import https from 'https';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dynamic-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req, res, next) => {
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

            // Handle non-JSON responses gracefully
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } else {
              const text = await response.text();
              res.setHeader('Content-Type', 'text/plain');
              res.end(text);
            }
          } catch (error) {
            console.error('Proxy error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch from proxy' }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
