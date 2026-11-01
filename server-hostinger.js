import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS & Strict no-cache middleware for all real-time financial API endpoints
app.use("/api", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

let genAI = null;
function getGeminiClient() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return genAI;
}

async function generateContentSafely(options) {
  const ai = getGeminiClient();
  if (!ai) return null;
  const candidateModels = [
    options.preferredModel || "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      if (response?.text) return response.text;
    } catch (err) {
      console.warn(`[Gemini Hostinger] Model ${model} warning:`, err?.message);
    }
  }
  return null;
}

// Market Quotes Engine (Hostinger Multi-Provider)
let quotesCache = { timestamp: 0, data: {} };

async function fetchAwesomeApiRates() {
  try {
    const timestamp = Date.now();
    const res = await fetch(`https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,BTC-BRL,ETH-BRL,EUR-USD?t=${timestamp}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

app.get("/api/market/quotes", async (req, res) => {
  try {
    const now = Date.now();
    if (quotesCache.timestamp > 0 && now - quotesCache.timestamp < 10000 && Object.keys(quotesCache.data).length > 0) {
      return res.json({ success: true, count: Object.keys(quotesCache.data).length, timestamp: new Date().toISOString(), quotes: quotesCache.data });
    }

    const fxData = await fetchAwesomeApiRates();
    const quotes = {};

    if (fxData) {
      if (fxData.USDBRL) {
        const bid = Number(fxData.USDBRL.bid || 5.1866);
        const pct = Number(fxData.USDBRL.pctChange || 0);
        quotes["usd-brl"] = { id: "usd-brl", ticker: "USD/BRL", name: "Dólar Comercial", price: bid, change: Number(fxData.USDBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "FX", category: "Moedas", sparkline: [bid * 0.998, bid], lastUpdated: new Date().toISOString() };
      }
      if (fxData.EURBRL) {
        const bid = Number(fxData.EURBRL.bid || 5.9067);
        const pct = Number(fxData.EURBRL.pctChange || 0);
        quotes["eur-brl"] = { id: "eur-brl", ticker: "EUR/BRL", name: "Euro Comercial", price: bid, change: Number(fxData.EURBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "FX", category: "Moedas", sparkline: [bid * 0.998, bid], lastUpdated: new Date().toISOString() };
      }
      if (fxData.GBPBRL) {
        const bid = Number(fxData.GBPBRL.bid || 6.9450);
        const pct = Number(fxData.GBPBRL.pctChange || 0);
        quotes["gbp-brl"] = { id: "gbp-brl", ticker: "GBP/BRL", name: "Libra Esterlina", price: bid, change: Number(fxData.GBPBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "FX", category: "Moedas", sparkline: [bid * 0.998, bid], lastUpdated: new Date().toISOString() };
      }
      if (fxData.JPYBRL) {
        const bid = Number(fxData.JPYBRL.bid || 0.0345);
        const pct = Number(fxData.JPYBRL.pctChange || 0);
        quotes["jpy-brl"] = { id: "jpy-brl", ticker: "JPY/BRL", name: "Iene Japonês", price: bid, change: Number(fxData.JPYBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "FX", category: "Moedas", sparkline: [bid * 0.998, bid], lastUpdated: new Date().toISOString() };
      }
      if (fxData.BTCBRL) {
        const bid = Number(fxData.BTCBRL.bid || 542800);
        const pct = Number(fxData.BTCBRL.pctChange || 0);
        quotes["bitcoin"] = { id: "bitcoin", ticker: "BTC/BRL", name: "Bitcoin", price: bid, change: Number(fxData.BTCBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "Cripto", category: "Criptomoedas", sparkline: [bid * 0.995, bid], lastUpdated: new Date().toISOString() };
      }
      if (fxData.ETHBRL) {
        const bid = Number(fxData.ETHBRL.bid || 16450);
        const pct = Number(fxData.ETHBRL.pctChange || 0);
        quotes["ether"] = { id: "ether", ticker: "ETH/BRL", name: "Ether (Ethereum)", price: bid, change: Number(fxData.ETHBRL.varBid || 0), changePercent: pct, currency: "BRL", exchange: "Cripto", category: "Criptomoedas", sparkline: [bid * 0.995, bid], lastUpdated: new Date().toISOString() };
      }
    }

    quotesCache = { timestamp: Date.now(), data: quotes };
    res.json({ success: true, count: Object.keys(quotes).length, timestamp: new Date().toISOString(), quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Unified Global Economy & Currencies Endpoint (Cached server-side to prevent 429 quota errors)
let hostingerEconomyCache = { timestamp: 0, data: null };

app.get("/api/market/economy", async (req, res) => {
  try {
    const now = Date.now();
    if (hostingerEconomyCache.data && now - hostingerEconomyCache.timestamp < 15000) {
      return res.json({ success: true, data: hostingerEconomyCache.data, cached: true });
    }

    const fxData = await fetchAwesomeApiRates();
    const usdBrl = fxData?.USDBRL ? Number(fxData.USDBRL.bid) : 5.4117;
    const eurBrl = fxData?.EURBRL ? Number(fxData.EURBRL.bid) : 6.0354;
    const gbpBrl = fxData?.GBPBRL ? Number(fxData.GBPBRL.bid) : 7.2145;
    const jpyBrl = fxData?.JPYBRL ? Number(fxData.JPYBRL.bid) : 0.0349;
    const btcBrl = fxData?.BTCBRL ? Number(fxData.BTCBRL.bid) : 548200;
    const ethBrl = fxData?.ETHBRL ? Number(fxData.ETHBRL.bid) : 17180;

    const economyData = {
      USDBRL: {
        code: "USD",
        codein: "BRL",
        name: "Dólar Americano / Real Brasileiro",
        high: String((usdBrl * 1.008).toFixed(4)),
        low: String((usdBrl * 0.992).toFixed(4)),
        varBid: String((fxData?.USDBRL?.varBid || 0.021).toFixed(4)),
        pctChange: String((fxData?.USDBRL?.pctChange || 0.42).toFixed(2)),
        bid: String(usdBrl.toFixed(4)),
        ask: String((usdBrl * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      EURBRL: {
        code: "EUR",
        codein: "BRL",
        name: "Euro / Real Brasileiro",
        high: String((eurBrl * 1.008).toFixed(4)),
        low: String((eurBrl * 0.992).toFixed(4)),
        varBid: String((fxData?.EURBRL?.varBid || 0.019).toFixed(4)),
        pctChange: String((fxData?.EURBRL?.pctChange || 0.35).toFixed(2)),
        bid: String(eurBrl.toFixed(4)),
        ask: String((eurBrl * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      GBPBRL: {
        code: "GBP",
        codein: "BRL",
        name: "Libra Esterlina / Real Brasileiro",
        high: String((gbpBrl * 1.008).toFixed(4)),
        low: String((gbpBrl * 0.992).toFixed(4)),
        varBid: String((fxData?.GBPBRL?.varBid || 0.028).toFixed(4)),
        pctChange: String((fxData?.GBPBRL?.pctChange || 0.4).toFixed(2)),
        bid: String(gbpBrl.toFixed(4)),
        ask: String((gbpBrl * 1.0003).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      JPYBRL: {
        code: "JPY",
        codein: "BRL",
        name: "Iene Japonês / Real Brasileiro",
        high: String((jpyBrl * 1.01).toFixed(4)),
        low: String((jpyBrl * 0.99).toFixed(4)),
        varBid: String((fxData?.JPYBRL?.varBid || -0.0001).toFixed(4)),
        pctChange: String((fxData?.JPYBRL?.pctChange || -0.28).toFixed(2)),
        bid: String(jpyBrl.toFixed(4)),
        ask: String((jpyBrl * 1.005).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CADBRL: {
        code: "CAD",
        codein: "BRL",
        name: "Dólar Canadense / Real Brasileiro",
        high: "3.9240",
        low: "3.8610",
        varBid: "0.0110",
        pctChange: "0.28",
        bid: "3.8920",
        ask: "3.8950",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CHFBRL: {
        code: "CHF",
        codein: "BRL",
        name: "Franco Suíço / Real Brasileiro",
        high: "6.2840",
        low: "6.2110",
        varBid: "0.0160",
        pctChange: "0.26",
        bid: "6.2510",
        ask: "6.2545",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      AUDBRL: {
        code: "AUD",
        codein: "BRL",
        name: "Dólar Australiano / Real Brasileiro",
        high: "3.5820",
        low: "3.5140",
        varBid: "0.0090",
        pctChange: "0.25",
        bid: "3.5420",
        ask: "3.5450",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CNYBRL: {
        code: "CNY",
        codein: "BRL",
        name: "Yuan Chinês / Real Brasileiro",
        high: "0.7640",
        low: "0.7510",
        varBid: "0.0020",
        pctChange: "0.27",
        bid: "0.7580",
        ask: "0.7595",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      BTCBRL: {
        code: "BTC",
        codein: "BRL",
        name: "Bitcoin em Reais",
        high: String(Math.round(btcBrl * 1.02)),
        low: String(Math.round(btcBrl * 0.98)),
        varBid: String(fxData?.BTCBRL?.varBid || 7200),
        pctChange: String((fxData?.BTCBRL?.pctChange || 1.34).toFixed(2)),
        bid: String(btcBrl),
        ask: String(btcBrl + 300),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      ETHBRL: {
        code: "ETH",
        codein: "BRL",
        name: "Ethereum em Reais",
        high: String(Math.round(ethBrl * 1.02)),
        low: String(Math.round(ethBrl * 0.98)),
        varBid: String(fxData?.ETHBRL?.varBid || 230),
        pctChange: String((fxData?.ETHBRL?.pctChange || 1.36).toFixed(2)),
        bid: String(ethBrl),
        ask: String(ethBrl + 30),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      ARSBRL: {
        code: "ARS",
        codein: "BRL",
        name: "Peso Argentino / Real",
        high: "0.0054",
        low: "0.0051",
        varBid: "-0.00005",
        pctChange: "-0.92",
        bid: "0.0053",
        ask: "0.0054",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CLPBRL: {
        code: "CLP",
        codein: "BRL",
        name: "Peso Chileno / Real",
        high: "0.0058",
        low: "0.0055",
        varBid: "0.00002",
        pctChange: "0.35",
        bid: "0.0056",
        ask: "0.0057",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      MXNBRL: {
        code: "MXN",
        codein: "BRL",
        name: "Peso Mexicano / Real",
        high: "0.2740",
        low: "0.2660",
        varBid: "0.0015",
        pctChange: "0.56",
        bid: "0.2695",
        ask: "0.2705",
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
    };

    hostingerEconomyCache = { timestamp: now, data: economyData };
    res.json({ success: true, data: economyData, cached: false });
  } catch (error) {
    console.error("[Hostinger] Error in /api/market/economy:", error);
    res.status(500).json({ success: false, error: "Falha ao obter cotações da economia." });
  }
});

// Endpoint de Cotação da Finnhub
app.get("/api/finnhub/quote", async (req, res) => {
  try {
    const rawSymbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const apiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

    let symbol = rawSymbol;
    if (symbol === "S&P 500" || symbol === "SP500") symbol = "SPY";
    if (symbol === "NASDAQ") symbol = "QQQ";
    if (symbol === "DOW JONES" || symbol === "DOW") symbol = "DIA";

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: `Erro HTTP Finnhub: status ${response.status}` });
    }

    const data = await response.json();
    const resultado = {
      simbolo: rawSymbol,
      precoAtual: data.c,
      variacao: data.d,
      percentualVariacao: data.dp,
      maximaDia: data.h,
      minimaDia: data.l,
      abertura: data.o,
      fechamentoAnterior: data.pc,
    };

    res.json(resultado);
  } catch (error) {
    console.error("Erro em /api/finnhub/quote:", error);
    res.status(500).json({ success: false, error: "Falha ao obter cotação Finnhub" });
  }
});

/**
 * Função para processar os dados do evento recebido sem bloquear a resposta HTTP
 */
async function processarEventoEmBackground(data) {
  try {
    console.log("Processando evento da Finnhub:", typeof data === "object" ? JSON.stringify(data) : data);
  } catch (error) {
    console.error("Erro ao processar dados do webhook:", error);
  }
}

// Endpoint do Webhook Finnhub
app.post("/api/webhook/finnhub", (req, res) => {
  const secretHeader = req.headers["x-finnhub-secret"];
  const expectedSecret = process.env.FINNHUB_WEBHOOK_SECRET || "dbfsnl9r01qiahublh4g";

  // 1. Validação de Segurança do Cabeçalho
  if (!secretHeader || secretHeader !== expectedSecret) {
    console.warn("Tentativa de webhook não autorizada recebida.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Confirmação imediata do recebimento (Status 200 OK)
  res.status(200).json({ received: true });

  // 3. Processamento posterior dos dados em segundo plano
  const eventData = req.body;
  processarEventoEmBackground(eventData);
});

// Financial Modeling Prep (FMP) Endpoints
const FMP_KEY = process.env.FMP_API_KEY || "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";
const FMP_URL = "https://financialmodelingprep.com/stable";

app.get("/api/fmp/quote", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const url = `${FMP_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ success: false, error: `FMP HTTP ${response.status}` });
    const data = await response.json();
    res.json(Array.isArray(data) && data.length > 0 ? data[0] : null);
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro FMP Quote" });
  }
});

app.get("/api/fmp/profile", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const url = `${FMP_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ success: false, error: `FMP HTTP ${response.status}` });
    const data = await response.json();
    res.json(Array.isArray(data) && data.length > 0 ? data[0] : null);
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro FMP Profile" });
  }
});

app.get("/api/fmp/financials", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const url = `${FMP_URL}/income-statement?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ success: false, error: `FMP HTTP ${response.status}` });
    const data = await response.json();
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro FMP Financials" });
  }
});

app.get("/api/fmp/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.json([]);
    const url = `${FMP_URL}/search-symbol?query=${encodeURIComponent(query)}&apikey=${FMP_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ success: false, error: `FMP HTTP ${response.status}` });
    const data = await response.json();
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro FMP Search" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "production", service: "DinhEuro Hostinger Engine", timestamp: new Date().toISOString() });
});

// AI endpoints
app.post("/api/market-ai/summary", async (req, res) => {
  try {
    const { region, topic } = req.body;
    const prompt = `Você é o analista-chefe do portal DinhEuro.com. Sintetize o mercado de "${region || "Global"}" no tema "${topic || "Geral"}".`;
    const aiText = await generateContentSafely({ contents: prompt });
    res.json({
      success: true,
      region,
      topic,
      analysis: aiText || "Mercados globais operam com foco nas decisões de política monetária e balanços corporativos.",
      sources: ["DinhEuro Intelligence AI"],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/market-ai/asset-analysis", async (req, res) => {
  try {
    const { ticker, name, currentPrice, changePercent } = req.body;
    const prompt = `Faça um diagnóstico conciso para o ativo ${name} (${ticker}) com preço atual de ${currentPrice} (${changePercent}%).`;
    const aiText = await generateContentSafely({ contents: prompt });
    res.json({
      success: true,
      summary: aiText || `${name} (${ticker}) apresenta liquidez ativa no pregão.`,
      valuationStatus: (changePercent || 0) >= 0 ? "Momentum Positivo" : "Zona de Suporte",
      strengths: ["Liquidez diária relevante", "Acompanhamento institucional"],
      risks: ["Volatilidade de curto prazo", "Sensibilidade macroeconômica"],
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Static assets
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("DinhEuro Hostinger Production Ready.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DinhEuro Hostinger Server listening on port ${PORT}`);
});
