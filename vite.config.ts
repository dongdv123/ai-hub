import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
