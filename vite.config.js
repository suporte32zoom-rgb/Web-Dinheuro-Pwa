import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Configuração padrão Vite + React para Hostinger e Deploy em Produção
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
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
});
