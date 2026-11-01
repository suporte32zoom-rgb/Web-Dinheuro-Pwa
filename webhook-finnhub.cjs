const express = require('express');
const app = express();

// Middleware para interpretar JSON no corpo da requisição
app.use(express.json());

// Endpoint do Webhook
app.post('/api/webhook/finnhub', (req, res) => {
  const secretHeader = req.headers['x-finnhub-secret'];
  
  // O ideal é usar variável de ambiente, mas você pode usar o segredo diretamente se preferir
  const expectedSecret = process.env.FINNHUB_WEBHOOK_SECRET || 'dbfsnl9r01qiahublh4g';

  // 1. Validação de Segurança do Cabeçalho
  if (!secretHeader || secretHeader !== expectedSecret) {
    console.warn('Tentativa de webhook não autorizada recebida.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Confirmação imediata do recebimento (Status 200 OK)
  // Isso deve ser feito ANTES de qualquer lógica pesada para evitar timeouts na Finnhub.
  res.status(200).json({ received: true });

  // 3. Processamento posterior dos dados em segundo plano
  const eventData = req.body;
  processarEventoEmBackground(eventData);
});

/**
 * Função para processar os dados do evento recebido sem bloquear a resposta HTTP
 */
async function processarEventoEmBackground(data) {
  try {
    console.log('Processando evento da Finnhub:', data);
    // Insira aqui a sua lógica (ex: salvar no Supabase, atualizar cotações, etc.)
  } catch (error) {
    console.error('Erro ao processar dados do webhook:', error);
  }
}

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = { app, processarEventoEmBackground };
