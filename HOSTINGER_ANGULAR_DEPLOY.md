# 🚀 Guia Oficial de Implantação do DinhEuro na Hostinger (com Angular)

Este documento contém o passo a passo completo para compilar e publicar o portal financeiro **DinhEuro** na sua hospedagem **Hostinger** (hPanel / Cloud / VPS / Hospedagem Compartilhada).

---

## 📋 Opções de Implantação na Hostinger

| Modalidade | Recomendação Hostinger | Como Funciona |
| :--- | :--- | :--- |
| **Opção 1: Angular SPA Estático** *(Mais fácil e rápida)* | Hospedagem Single, Premium, Business ou Cloud | O Angular é compilado localmente com `ng build` e os arquivos da pasta `dist/dinheuro/browser` são enviados para a pasta `public_html` via Gerenciador de Arquivos ou FTP com o `.htaccess`. |
| **Opção 2: Fullstack Node.js + Gemini** *(Recomendada para IA ativa)* | Hostinger Cloud, VPS ou Hostinger Node.js Selector | O backend Express (`server-hostinger.js`) roda na porta do servidor e serve o frontend Angular compilado com a API do Gemini integrada. |

---

## 🛠️ Passo a Passo - Opção 1: Deploy SPA Estático na Hostinger

### 1. Compilação do Projeto Angular
No seu terminal local, execute:
```bash
# Instalar as dependências
npm install

# Compilar para produção
npm run build
```
Os arquivos otimizados serão gerados dentro de `dist/dinheuro/browser/` (ou `dist/public_html/`).

### 2. Configuração do `.htaccess` (Essencial para rotas funcionarem)
Certifique-se de que o arquivo `.htaccess` está na raiz do seu `public_html`. Ele garante que links diretos e atualizações de página (`F5`) no Angular não retornem erro 404:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  RewriteRule ^ index.html [L]
</IfModule>
```

### 3. Envio dos Arquivos pelo hPanel da Hostinger
1. Acesse seu painel **Hostinger (hPanel)**: [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Vá em **Sites** > Selecione o domínio (ex: `dinheuro.com`) > **Gerenciador de Arquivos (File Manager)**.
3. Abra a pasta `public_html/`.
4. Compacte os arquivos da pasta `dist/dinheuro/browser/` em um arquivo `.zip` e faça o upload.
5. Clique com o botão direito e selecione **Extrair**.
6. Verifique se o arquivo `index.html` e `.htaccess` estão na raiz do `public_html`.
7. Acesse seu domínio `https://dinheuro.com` no navegador!

---

## 🤖 Passo a Passo - Opção 2: Deploy Fullstack com IA Gemini no Hostinger VPS / Cloud

Se você utiliza **Hostinger VPS** ou o recurso **Node.js** no hPanel:

1. No terminal do servidor VPS (Ubuntu/Debian):
```bash
# Atualizar pacotes e instalar Node.js 20+
sudo apt update && sudo apt install -y nodejs npm git

# Clonar o repositório
git clone https://github.com/seu-usuario/dinheuro-angular.git /var/www/dinheuro
cd /var/www/dinheuro

# Instalar dependências e compilar
npm install
npm run build

# Configurar chave do Gemini no .env
echo "GEMINI_API_KEY=sua_chave_gemini_aqui" > .env

# Instalar PM2 para manter o servidor sempre rodando
sudo npm install -g pm2
pm2 start server-hostinger.js --name "dinheuro-app"
pm2 startup
pm2 save
```

2. Configurar o Nginx como Proxy Reverso (Porta 80/443 para 3000):
```nginx
server {
    server_name dinheuro.com www.dinheuro.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Ativar o SSL gratuito Let's Encrypt:
```bash
sudo certbot --nginx -d dinheuro.com -d www.dinheuro.com
```

---

## 🔒 Checklist de Produção na Hostinger
- [x] SSL Ativo (HTTPS forçado no `.htaccess`)
- [x] Compressão GZIP / Brotli habilitada no Apache/LiteSpeed
- [x] Favicon e Meta tags de PWA configurados
- [x] Chave de API do Google Gemini protegida no backend (`.env`)
- [x] Roteamento SPA configurado sem erro 404
