# 🚀 Guia Definitivo de Build & Deploy do DinhEuro na Hostinger

Este documento explica detalhadamente a solução para o problema de sincronização entre o **GitHub** e a **Hostinger**, e fornece o fluxo passo a passo para compilar e publicar o aplicativo **DinhEuro (Vite + React)** garantindo que todas as alterações apareçam imediatamente em produção.

---

## 🔍 Por que as atualizações não refletiam na Hostinger anteriormente?

1. **`dist/` estava no `.gitignore`**:
   - Quando você executava `git add .` e subia para o GitHub, a pasta `dist/` gerada pelo build era ignorada pelo Git.
   - O repositório no GitHub ficava sem a pasta `dist/` atualizada. Quando a Hostinger puxava via Git Deployment, ela recebia apenas o código-fonte (que o servidor Apache/LiteSpeed não executa nativamente) ou uma versão desatualizada da pasta compilada.
   - **Solução aplicada:** O arquivo `.gitignore` foi configurado para permitir o versionamento da pasta `dist/`. Agora, ao rodar `npm run build` e dar `git push`, todo o bundle de produção compilado vai direto para o GitHub e para a Hostinger!

2. **Caminhos absolutos vs. relativos (`base: './'`)**:
   - O Vite por padrão gera caminhos absolutos (`/assets/...`). Se o app estivesse configurado em subpasta, domínio temporário ou com regras de rewrite da Hostinger, o navegador tentava carregar os scripts na raiz do servidor e retornava erro 404 (tela branca ou cache antigo).
   - **Solução aplicada:** Tanto `vite.config.ts` quanto `vite.config.js` foram configurados com `base: './'`, garantindo que todos os assets (scripts JS, CSS, fontes e ícones) sejam carregados relativamente em qualquer pasta.

3. **Cache de Borda da Hostinger (LiteSpeed Cache)**:
   - Os servidores LiteSpeed da Hostinger fazem cache estático agressivo de páginas HTML. Mesmo após subir os novos arquivos, visitantes continuavam recebendo o HTML antigo.
   - **Solução aplicada:** Adicionamos cabeçalhos no `.htaccess` (`X-LiteSpeed-Cache-Control: no-cache` e `Cache-Control: no-cache, no-store, must-revalidate`) e incrementamos a versão do Service Worker PWA (`sw.js`) para forçar o navegador e o LiteSpeed a sempre entregarem a versão mais recente.

4. **Remoção de resíduos do Angular**:
   - Arquivos legados como `angular.json` no diretório raiz causavam conflito em detectores automáticos de deploy da Hostinger. Foram totalmente removidos.

---

## 📦 Estrutura Oficial de Saída (`dist/`)

Após executar o comando de build, a pasta `dist/` contém o aplicativo completo pronto para rodar em qualquer hospedagem Hostinger:

```text
dist/
├── index.html               # Ponto de entrada com os scripts e links compilados
├── .htaccess                # Configuração Apache / LiteSpeed (HTTPS, rotas SPA e anti-cache)
├── assets/                  # Bundles JavaScript e estilos Tailwind minificados com hashes
├── sw.js                    # Service Worker PWA v16 com Network-First
├── manifest.json            # Manifesto PWA do DinhEuro
├── favicon.png / .svg       # Ícones e identidade visual da marca
├── icon-192.png / 512.png   # Ícones de alta resolução PWA
└── apple-touch-icon.png     # Ícone para iOS Safari
```

---

## 🛠️ Passo a Passo para Compilar, Commitar e Publicar

### Passo 1: Gerar a compilação de produção
No terminal do seu projeto, execute:
```bash
npm run build
```
*(Se você quiser apenas o build estático puro sem o bundle do backend Node.js, pode usar `npm run build:static` ou `npm run build:hostinger`).*

### Passo 2: Subir para o GitHub (incluindo a pasta `dist/`)
Execute os seguintes comandos Git:
```bash
# 1. Adicione todas as alterações e a pasta dist gerada
git add .

# 2. Crie o commit com uma mensagem descritiva
git commit -m "build: atualizacao da versao de producao DinhEuro para Hostinger"

# 3. Envie para o branch principal do seu repositório no GitHub
git push origin main
```

---

## 🌐 Opções de Deploy na Hostinger

### Opção A: Deploy Automático via Git no hPanel da Hostinger
Se o seu site na Hostinger está conectado ao repositório GitHub através do menu **Git** do hPanel:
1. Acesse o **hPanel da Hostinger** ([hpanel.hostinger.com](https://hpanel.hostinger.com)).
2. Vá em **Avançado** > **Git**.
3. Se já estiver configurado com o branch `main`, clique em **Implementar (Deploy)** para puxar o commit mais recente.
4. Caso aponte o diretório raiz do site para a pasta `dist` no painel, o site carregará diretamente os arquivos compilados.

---

### Opção B: Deploy Estático via Gerenciador de Arquivos (Recomendada para Hospedagem Compartilhada)
1. No seu computador, após rodar `npm run build`:
2. Acesse a pasta `dist/` gerada no projeto.
3. Selecione **todos os arquivos e pastas** dentro de `dist/` (`index.html`, `.htaccess`, `assets/`, `manifest.json`, `sw.js`, etc.).
4. Compacte esses arquivos em um arquivo `.zip` (ex: `dinheuro-deploy.zip`).
5. No hPanel da Hostinger, vá em **Sites** > Seu Domínio > **Gerenciador de Arquivos**.
6. Abra a pasta `public_html/`.
7. Faça o upload do `.zip` e clique com o botão direito para **Extrair** diretamente dentro de `public_html/`.
8. Certifique-se de que o `index.html` e o `.htaccess` estejam na raiz de `public_html/`.

---

## 🧹 Como Limpar o Cache da Hostinger se a tela antiga persistir

Se o navegador ainda exibir a versão antiga devido a cache de DNS ou CDN:
1. No hPanel da Hostinger, vá em **Avançado** > **LiteSpeed**.
2. Clique no botão **Limpar Todos os Caches (Flush All)**.
3. No seu navegador:
   - Abra a página do DinhEuro (`dinheuro.com`).
   - Pressione **Ctrl + F5** (ou **Cmd + Shift + R** no Mac) para forçar a recarga sem cache.
   - Ou abra em uma aba anônima para conferir instantaneamente.

---

## ✅ Checklist de Validação do Deploy
- [x] Base path configurado como relativo (`./`) em `vite.config.ts` e `vite.config.js`.
- [x] Pasta `dist/` permitida no `.gitignore` para versionamento no GitHub.
- [x] Arquivo `.htaccess` incluído automaticamente na compilação (`dist/.htaccess`).
- [x] Service Worker atualizado para v16 com estratégia Network-First em navegação.
- [x] Headers anti-cache e LiteSpeed aplicados a `index.html` e `sw.js`.
- [x] Dupla conversão USD/BRL, cotações em tempo real e gráficos 100% integrados no build final.
