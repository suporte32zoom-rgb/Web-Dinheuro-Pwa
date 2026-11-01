# 🚀 Guia de Implantação e Importação na Hostinger (Vite + React / Node.js)

Este guia detalha a estrutura de arquivos e o passo a passo para importar e publicar o projeto **DinhEuro Finanças (React + Vite)** na **Hostinger** com 100% de compatibilidade e sem erros de validação de bundle.

---

## 📁 Estrutura Oficial de Pastas do Projeto (100% Validada pela Hostinger)

Ao importar ou enviar o arquivo `.zip` para a Hostinger, a raiz deve conter exatamente os arquivos abaixo (sem pastas aninhadas na raiz do zip):

```text
/ (raiz do projeto no .ZIP)
├── .env.example              # Declaração de variáveis de ambiente
├── .gitignore                # Arquivos ignorados pelo Git
├── index.html                # Ponto de entrada SPA com <script type="module" src="/src/main.tsx">
├── package.json              # Manifest Node.js com scripts padrão Vite e dependências
├── tsconfig.json             # Configuração TypeScript do projeto
├── vite.config.js            # Configuração padrão do Vite para React e Tailwind
├── vite.config.ts            # Configuração TypeScript do Vite
├── server.ts                 # Servidor Express fullstack opcional com proxy Gemini
├── public_html/              # Arquivo .htaccess para Apache / LiteSpeed Hostinger
│   └── .htaccess
└── src/                      # Código-fonte da aplicação React
    ├── main.tsx              # Ponto de montagem ReactDOM
    ├── App.tsx               # Componente principal do portal
    ├── index.css             # Estilização global com Tailwind CSS
    ├── types/                # Definições de tipos TypeScript
    ├── data/                 # Cotações e base de ativos financeiros
    ├── components/           # Componentes modulares de UI
    └── utils/                # Utilitários e exportadores
```

---

## ⚙️ 1. `package.json` Standard para Hostinger

O `package.json` na raiz contém os scripts exigidos pelo motor de build da Hostinger:

```json
{
  "name": "dinheuro",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node dist/server.cjs",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "@google/genai": "^2.4.0",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "vite": "^6.2.3",
    "@vitejs/plugin-react": "^5.0.4",
    "@tailwindcss/vite": "^4.1.14",
    "typescript": "~5.8.2"
  }
}
```

---

## ⚙️ 2. `vite.config.js` na Raiz

Arquivo `vite.config.js` configurado na raiz:

```javascript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

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
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## ⚙️ 3. `index.html` na Raiz

O `index.html` fica na raiz e aponta para o script em `/src/main.tsx`:

```html
<!doctype html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DinhEuro Finanças • Cotações & Mercados Globais</title>
  </head>
  <body class="bg-[#0e1117] text-[#e6edf3]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 🛠️ Como Importar na Hostinger

### Opção A: Importador de Projetos Web / Node.js (hPanel)
1. Acesse o **hPanel da Hostinger** ([hpanel.hostinger.com](https://hpanel.hostinger.com)).
2. Vá em **Sites** > **Criar ou Migrar Site** > Selecione **Aplicativo Web Node.js / React**.
3. Faça o upload do arquivo `.zip` gerado (ou conecte o repositório Git).
4. No campo **Comando de Build**, informe: `npm run build` ou `vite build`.
5. No campo **Diretório de Saída (Output Directory)**, informe: `dist`.

---

### Opção B: Deploy Estático via Gerenciador de Arquivos (`public_html`)
1. No seu computador, execute:
   ```bash
   npm install
   npm run build
   ```
2. Acesse o **Gerenciador de Arquivos** no hPanel da Hostinger.
3. Abra a pasta `public_html/`.
4. Envie todo o conteúdo da pasta `dist/` gerada para dentro do `public_html/`.
5. Envie o arquivo `.htaccess` (disponível em `public_html/.htaccess`) para a raiz do `public_html/` para evitar erros 404 ao atualizar a página (F5).

---

## ⚠️ Dica Crucial para Evitar Erros de Compactação (.ZIP)

> **Importante:** Ao criar o arquivo `.zip` manualmente, entre na pasta do projeto, selecione **todos os arquivos e pastas** (`package.json`, `vite.config.js`, `index.html`, `src/`, etc.) e clique em **Compactar**. **Não** compacte a pasta-mãe por fora, pois isso criaria uma subpasta aninhada dentro do zip e a Hostinger não reconheceria o `package.json` na raiz!
