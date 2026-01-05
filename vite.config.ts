import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const envHandler = () => ({
  name: 'env-handler',
  configureServer(server) {
    server.middlewares.use('/api/save-env', (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { geminiApiKey, runwareApiKey } = JSON.parse(body);
            const envPath = path.resolve(process.cwd(), '.env.local');
            
            if (!fs.existsSync(envPath)) {
                fs.writeFileSync(envPath, '');
            }

            let envContent = fs.readFileSync(envPath, 'utf-8');

            const updateEnvVar = (key, value) => {
              const regex = new RegExp(`^${key}=.*`, 'm');
              if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
              } else {
                envContent = envContent.trim() + `\n${key}=${value}\n`;
              }
            };

            if (geminiApiKey !== undefined) updateEnvVar('VITE_GEMINI_API_KEY', geminiApiKey);
            if (runwareApiKey !== undefined) updateEnvVar('VITE_RUNWARE_API_KEY', runwareApiKey);

            fs.writeFileSync(envPath, envContent.trim() + '\n');
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            console.error('Error saving env:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to save env' }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/vidtory-api': {
            target: 'https://oldapi84.vidtory.net',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/vidtory-api/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.error('Proxy error:', err);
              });
              proxy.on('proxyReq', (proxyReq, _req, _res) => {
                proxyReq.setHeader('Origin', 'https://oldapi84.vidtory.net');
                proxyReq.setHeader('Referer', 'https://oldapi84.vidtory.net/');
              });
            },
          }
        }
      },
      plugins: [react(), envHandler()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_RUNWARE_API_KEY': JSON.stringify(env.VITE_RUNWARE_API_KEY),
        'process.env.VITE_RUNWARE_MODEL': JSON.stringify(env.VITE_RUNWARE_MODEL),
        'process.env.VITE_RUNWARE_TASK_TYPE': JSON.stringify(env.VITE_RUNWARE_TASK_TYPE),
        'process.env.VITE_RUNWARE_ENDPOINT': JSON.stringify(env.VITE_RUNWARE_ENDPOINT),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
