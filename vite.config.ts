import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2022',
    },
    define: {
      'process.env.FINNHUB_API_KEY': JSON.stringify(process.env.FINNHUB_API_KEY || 'dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g'),
      'process.env.FMP_API_KEY': JSON.stringify(process.env.FMP_API_KEY || 'GJaGtHdggEtpz6erXjYrSNchdFk8FJwm'),
      'process.env.VITE_AWESOME_ECONOMY_URL': JSON.stringify(process.env.VITE_AWESOME_ECONOMY_URL || 'https://economia.awesomeapi.com.br'),
      'process.env.FINNHUB_WEBHOOK_SECRET': JSON.stringify(process.env.FINNHUB_WEBHOOK_SECRET || 'dbfsnl9r01qiahublh4g'),
      'import.meta.env.VITE_AWESOME_ECONOMY_URL': JSON.stringify(process.env.VITE_AWESOME_ECONOMY_URL || 'https://economia.awesomeapi.com.br'),
      'import.meta.env.VITE_FINNHUB_API_KEY': JSON.stringify(process.env.FINNHUB_API_KEY || 'dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g'),
      'import.meta.env.VITE_FMP_API_KEY': JSON.stringify(process.env.FMP_API_KEY || 'GJaGtHdggEtpz6erXjYrSNchdFk8FJwm'),
    },
    esbuild: {
      target: 'es2022',
    },
    optimizeDeps: {
      target: 'es2022',
      esbuildOptions: {
        target: 'es2022',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
