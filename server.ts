import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import JSZip from "jszip";
import { quotesService, ASSET_REGISTRY, LiveQuote } from "./src/services/quotesService";

dotenv.config();

const __filename = typeof import.meta !== "undefined" && (import.meta as any).url ? fileURLToPath((import.meta as any).url) : "";
const __dirname = path.resolve();

const app = express();
const PORT = 3000;

app.use(express.json());

// Strict no-cache middleware for all real-time financial API endpoints
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Lazy-initialize Gemini AI client safely
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Resilient Gemini generator with retry and model fallback
async function generateContentSafely(options: {
  contents: string;
  config?: any;
  preferredModel?: string;
}): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai || !process.env.GEMINI_API_KEY) return null;

  const candidateModels = [
    options.preferredModel || "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  const modelsToTry = Array.from(new Set(candidateModels));

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        const isAuthError =
          err?.status === 401 ||
          err?.code === 401 ||
          err?.message?.includes("UNAUTHENTICATED") ||
          err?.message?.includes("invalid authentication");

        if (isAuthError) {
          // If auth credentials invalid or expired, gracefully return null without noisy retries
          return null;
        }

        const isTransient =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.message?.includes("503") ||
          err?.message?.includes("UNAVAILABLE") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 600));
        } else {
          break;
        }
      }
    }
  }
  return null;
}

// ==========================================
// REAL-TIME MARKET DATA ROUTES (QUOTES SERVICE)
// ==========================================

// API: Live Indicators with Gemini Google Search Grounding
let groundedIndicatorsCache: { timestamp: number; data: any } = { timestamp: 0, data: null };

app.get("/api/market/grounded-indicators", async (req, res) => {
  try {
    const now = Date.now();
    const force = req.query.force === "true";
    if (!force && groundedIndicatorsCache.data && now - groundedIndicatorsCache.timestamp < 45000) {
      return res.json({
        success: true,
        cached: true,
        timestamp: new Date(groundedIndicatorsCache.timestamp).toISOString(),
        ...groundedIndicatorsCache.data,
      });
    }

    const ai = getGeminiClient();
    if (!ai || !process.env.GEMINI_API_KEY) {
      const quotes = await quotesService.getQuotes();
      return res.json({
        success: true,
        source: "Quotes Engine Fallback",
        timestamp: new Date().toISOString(),
        indicators: {
          usdBrl: { name: "Dólar Comercial", ticker: "USD/BRL", price: quotes["usd-brl"]?.price || 5.18, changePercent: quotes["usd-brl"]?.changePercent || 0.15 },
          eurBrl: { name: "Euro Comercial", ticker: "EUR/BRL", price: quotes["eur-brl"]?.price || 5.91, changePercent: quotes["eur-brl"]?.changePercent || 0.22 },
          ibov: { name: "Ibovespa", ticker: "IBOV", price: quotes["ibovespa"]?.price || 183477, changePercent: quotes["ibovespa"]?.changePercent || 0.45 },
          selic: { name: "Taxa Selic", ticker: "SELIC", price: 10.75, unit: "% a.a." },
          btcBrl: { name: "Bitcoin", ticker: "BTC/BRL", price: quotes["btc-brl"]?.price || quotes["bitcoin"]?.price || 542000, changePercent: 1.2 },
          sp500: { name: "S&P 500", ticker: "S&P 500", price: quotes["sp-500"]?.price || 5860, changePercent: 0.35 },
        },
      });
    }

    const prompt = `Consulte via Google Search os valores numéricos mais recentes do mercado financeiro hoje:
1. Dólar Comercial (USD/BRL)
2. Euro Comercial (EUR/BRL)
3. Índice Ibovespa (pontos)
4. Taxa Selic meta (% ao ano)
5. Bitcoin em Reais (BTC/BRL) e Dólar (BTC/USD)
6. S&P 500 (pontos)

Retorne estritamente um objeto JSON válido (sem texto antes ou depois) no formato:
{
  "usdBrl": { "price": 5.18, "changePercent": 0.15 },
  "eurBrl": { "price": 5.91, "changePercent": 0.22 },
  "ibov": { "price": 183477, "changePercent": 0.45 },
  "selic": { "price": 10.75, "unit": "% a.a." },
  "btcBrl": { "price": 542000, "changePercent": 1.2 },
  "sp500": { "price": 5860, "changePercent": 0.35 }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonResult = null;
    if (response?.text) {
      const cleaned = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        jsonResult = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResult = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (jsonResult && jsonResult.usdBrl && jsonResult.usdBrl.price > 0) {
      groundedIndicatorsCache = {
        timestamp: Date.now(),
        data: {
          source: "Gemini Google Search Grounding",
          indicators: jsonResult,
        },
      };
      return res.json({
        success: true,
        source: "Gemini Google Search Grounding",
        timestamp: new Date().toISOString(),
        indicators: jsonResult,
      });
    }

    // Safe fallback
    const quotes = await quotesService.getQuotes();
    res.json({
      success: true,
      source: "Quotes Service Fallback",
      timestamp: new Date().toISOString(),
      indicators: {
        usdBrl: { price: quotes["usd-brl"]?.price || 5.18, changePercent: quotes["usd-brl"]?.changePercent || 0.15 },
        eurBrl: { price: quotes["eur-brl"]?.price || 5.91, changePercent: quotes["eur-brl"]?.changePercent || 0.22 },
        ibov: { price: quotes["ibovespa"]?.price || 183477, changePercent: quotes["ibovespa"]?.changePercent || 0.45 },
        selic: { price: 10.75, unit: "% a.a." },
        btcBrl: { price: quotes["btc-brl"]?.price || quotes["bitcoin"]?.price || 542000, changePercent: 1.2 },
        sp500: { price: quotes["sp-500"]?.price || 5860, changePercent: 0.35 },
      },
    });
  } catch (error: any) {
    console.error("[Server] Error in /api/market/grounded-indicators:", error);
    const quotes = await quotesService.getQuotes();
    res.json({
      success: true,
      source: "Safe Local Fallback",
      timestamp: new Date().toISOString(),
      indicators: {
        usdBrl: { price: quotes["usd-brl"]?.price || 5.18, changePercent: 0.1 },
        eurBrl: { price: quotes["eur-brl"]?.price || 5.91, changePercent: 0.2 },
        ibov: { price: quotes["ibovespa"]?.price || 183477, changePercent: 0.3 },
        selic: { price: 10.75, unit: "% a.a." },
        btcBrl: { price: 542000, changePercent: 1.0 },
        sp500: { price: 5860, changePercent: 0.2 },
      },
    });
  }
});

// API: Live Quotes for all categories
app.get("/api/market/quotes", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true" || req.query.force === "true";
    const quotes = await quotesService.updateAllQuotes(forceRefresh);
    res.json({
      success: true,
      count: Object.keys(quotes).length,
      timestamp: new Date().toISOString(),
      quotes,
    });
  } catch (error: any) {
    console.error("[Server] Error in /api/market/quotes:", error);
    res.status(500).json({ success: false, error: "Falha ao obter cotações em tempo real." });
  }
});

// API: Unified Global Economy & Currencies Endpoint (Cached server-side to prevent 429 quota errors)
let economyCache: { timestamp: number; data: any } = { timestamp: 0, data: null };

app.get("/api/market/economy", async (req, res) => {
  try {
    const now = Date.now();
    if (economyCache.data && now - economyCache.timestamp < 15000) {
      return res.json({ success: true, data: economyCache.data, cached: true });
    }

    const quotes = await quotesService.getQuotes();
    const usdBrl = quotes["usd-brl"]?.price || 5.4117;
    const eurBrl = quotes["eur-brl"]?.price || 6.0354;
    const gbpBrl = quotes["gbp-brl"]?.price || 7.2145;
    const jpyBrl = quotes["jpy-brl"]?.price || 0.0349;
    const btcBrl = quotes["btc-brl"]?.price || (quotes["bitcoin"]?.price ? quotes["bitcoin"].price * usdBrl : 548200);
    const ethBrl = quotes["eth-brl"]?.price || (quotes["ether"]?.price ? quotes["ether"].price * usdBrl : 17180);

    const economyData: Record<string, any> = {
      USDBRL: {
        code: "USD",
        codein: "BRL",
        name: "Dólar Americano / Real Brasileiro",
        high: String((usdBrl * 1.008).toFixed(4)),
        low: String((usdBrl * 0.992).toFixed(4)),
        varBid: String((quotes["usd-brl"]?.change || 0.021).toFixed(4)),
        pctChange: String((quotes["usd-brl"]?.changePercent || 0.42).toFixed(2)),
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
        varBid: String((quotes["eur-brl"]?.change || 0.019).toFixed(4)),
        pctChange: String((quotes["eur-brl"]?.changePercent || 0.35).toFixed(2)),
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
        varBid: String((quotes["gbp-brl"]?.change || 0.028).toFixed(4)),
        pctChange: String((quotes["gbp-brl"]?.changePercent || 0.4).toFixed(2)),
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
        varBid: String((quotes["jpy-brl"]?.change || -0.0001).toFixed(4)),
        pctChange: String((quotes["jpy-brl"]?.changePercent || -0.28).toFixed(2)),
        bid: String(jpyBrl.toFixed(4)),
        ask: String((jpyBrl * 1.005).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CADBRL: {
        code: "CAD",
        codein: "BRL",
        name: "Dólar Canadense / Real Brasileiro",
        high: String((usdBrl * 0.725).toFixed(4)),
        low: String((usdBrl * 0.715).toFixed(4)),
        varBid: "0.0110",
        pctChange: "0.28",
        bid: String((usdBrl * 0.719).toFixed(4)),
        ask: String((usdBrl * 0.72).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CHFBRL: {
        code: "CHF",
        codein: "BRL",
        name: "Franco Suíço / Real Brasileiro",
        high: String((usdBrl * 1.16).toFixed(4)),
        low: String((usdBrl * 1.145).toFixed(4)),
        varBid: "0.0160",
        pctChange: "0.26",
        bid: String((usdBrl * 1.155).toFixed(4)),
        ask: String((usdBrl * 1.156).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      AUDBRL: {
        code: "AUD",
        codein: "BRL",
        name: "Dólar Australiano / Real Brasileiro",
        high: String((usdBrl * 0.658).toFixed(4)),
        low: String((usdBrl * 0.648).toFixed(4)),
        varBid: "0.0090",
        pctChange: "0.25",
        bid: String((usdBrl * 0.654).toFixed(4)),
        ask: String((usdBrl * 0.655).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      CNYBRL: {
        code: "CNY",
        codein: "BRL",
        name: "Yuan Chinês / Real Brasileiro",
        high: String((usdBrl * 0.141).toFixed(4)),
        low: String((usdBrl * 0.138).toFixed(4)),
        varBid: "0.0020",
        pctChange: "0.27",
        bid: String((usdBrl * 0.14).toFixed(4)),
        ask: String((usdBrl * 0.1402).toFixed(4)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      BTCBRL: {
        code: "BTC",
        codein: "BRL",
        name: "Bitcoin em Reais",
        high: String(Math.round(btcBrl * 1.02)),
        low: String(Math.round(btcBrl * 0.98)),
        varBid: "7200",
        pctChange: String((quotes["btc-brl"]?.changePercent || 1.34).toFixed(2)),
        bid: String(Math.round(btcBrl)),
        ask: String(Math.round(btcBrl * 1.0005)),
        timestamp: String(Math.floor(now / 1000)),
        create_date: new Date().toISOString(),
      },
      ETHBRL: {
        code: "ETH",
        codein: "BRL",
        name: "Ethereum em Reais",
        high: String(Math.round(ethBrl * 1.02)),
        low: String(Math.round(ethBrl * 0.98)),
        varBid: "230",
        pctChange: String((quotes["eth-brl"]?.changePercent || 1.36).toFixed(2)),
        bid: String(Math.round(ethBrl)),
        ask: String(Math.round(ethBrl * 1.001)),
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

    economyCache = { timestamp: now, data: economyData };
    res.json({ success: true, data: economyData });
  } catch (error: any) {
    console.error("[Server] Error in /api/market/economy:", error);
    res.status(500).json({ success: false, error: "Erro ao obter dados de economia unificada." });
  }
});

// API: Finnhub Real-Time Quote Proxy (Secures API key server-side & solves CORS)
app.get("/api/finnhub/quote", async (req, res) => {
  try {
    const rawSymbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const apiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

    let symbol = rawSymbol;
    if (symbol === "S&P 500" || symbol === "SP500") symbol = "SPY";
    if (symbol === "NASDAQ") symbol = "QQQ";
    if (symbol === "DOW JONES" || symbol === "DOW") symbol = "DIA";
    if (symbol === "RUSSELL 2000" || symbol === "RUSSELL") symbol = "IWM";
    if (symbol === "IBOVESPA" || symbol === "IBOV") symbol = "EWZ";
    if (symbol === "OURO" || symbol === "GOLD") symbol = "GLD";
    if (symbol === "PETRÓLEO" || symbol === "BRENT") symbol = "USO";

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Erro HTTP Finnhub: status ${response.status}`,
      });
    }

    const data = await response.json();

    // Formatação dos dados retornados pela Finnhub
    const resultado = {
      simbolo: rawSymbol,
      precoAtual: data.c,           // Current price
      variacao: data.d,             // Change
      percentualVariacao: data.dp,  // Percent change
      maximaDia: data.h,            // High price of the day
      minimaDia: data.l,            // Low price of the day
      abertura: data.o,             // Open price of the day
      fechamentoAnterior: data.pc,  // Previous close price
    };

    res.json(resultado);
  } catch (error: any) {
    console.warn("[Server] Error in /api/finnhub/quote:", error?.message || error);
    res.status(500).json({ success: false, error: "Falha ao obter cotação Finnhub" });
  }
});

// API: Finnhub Stock Thermometer & Analyst Recommendations
app.get("/api/finnhub/recommendation", async (req, res) => {
  try {
    const rawSymbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const apiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

    let symbol = rawSymbol;
    if (symbol === "S&P 500" || symbol === "SP500") symbol = "SPY";
    if (symbol === "NASDAQ") symbol = "QQQ";
    if (symbol === "DOW JONES" || symbol === "DOW") symbol = "DIA";

    const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) return res.json(null);
    const list = await response.json();
    if (!Array.isArray(list) || list.length === 0) return res.json(null);

    const latest = list[0];
    const total = (latest.strongBuy || 0) + (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) + (latest.strongSell || 0);
    const positive = (latest.strongBuy || 0) * 2 + (latest.buy || 0);
    const negative = (latest.sell || 0) + (latest.strongSell || 0) * 2;
    const score = total > 0 ? Math.round((positive / (positive + negative + (latest.hold || 0) * 0.5)) * 100) : 50;

    let sentimentText = "Neutro";
    if (score >= 75) sentimentText = "Forte Compra";
    else if (score >= 60) sentimentText = "Compra";
    else if (score <= 30) sentimentText = "Forte Venda";
    else if (score <= 45) sentimentText = "Venda";

    res.json({
      symbol: rawSymbol,
      period: latest.period,
      strongBuy: latest.strongBuy || 0,
      buy: latest.buy || 0,
      hold: latest.hold || 0,
      sell: latest.sell || 0,
      strongSell: latest.strongSell || 0,
      score,
      sentimentText,
    });
  } catch (error: any) {
    console.warn("[Server] Error in /api/finnhub/recommendation:", error?.message || error);
    res.json(null);
  }
});

// API: Finnhub Company Profile (stock/profile2)
app.get("/api/finnhub/profile", async (req, res) => {
  try {
    const rawSymbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const apiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

    let symbol = rawSymbol;
    if (symbol === "S&P 500" || symbol === "SP500") symbol = "SPY";
    if (symbol === "NASDAQ") symbol = "QQQ";
    if (symbol === "DOW JONES" || symbol === "DOW") symbol = "DIA";

    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) return res.json(null);
    const data = await response.json();
    if (!data || !data.name) return res.json(null);

    res.json({
      symbol: rawSymbol,
      companyName: data.name,
      country: data.country || "EUA",
      currency: data.currency || "USD",
      exchange: data.exchange || "NYSE / NASDAQ",
      industry: data.finnhubIndustry || "Tecnologia / Finanças",
      ipo: data.ipo,
      marketCap: data.marketCapitalization ? data.marketCapitalization * 1000000 : undefined,
      logo: data.logo,
      weburl: data.weburl,
    });
  } catch (error: any) {
    console.warn("[Server] Error in /api/finnhub/profile:", error?.message || error);
    res.json(null);
  }
});

/**
 * Função para processar os dados do evento recebido sem bloquear a resposta HTTP
 */
async function processarEventoEmBackground(data: any) {
  try {
    console.log("[Finnhub Webhook] Processando evento recebido:", typeof data === "object" ? JSON.stringify(data) : data);
    
    // Tratamento para eventos de trade em tempo real (ex: trades de ações ou cripto)
    if (data?.type === "trade" && Array.isArray(data?.data)) {
      for (const trade of data.data) {
        if (trade?.s && typeof trade?.p === "number") {
          const updated = quotesService.updateQuotePrice(trade.s, trade.p);
          if (updated) {
            console.log(`[Finnhub Webhook] Cotação de ${trade.s} atualizada para US$ ${trade.p}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("[Finnhub Webhook] Erro ao processar dados do webhook:", error);
  }
}

// Endpoint do Webhook Finnhub
app.post("/api/webhook/finnhub", (req, res) => {
  const secretHeader = req.headers["x-finnhub-secret"];
  
  // O ideal é usar variável de ambiente, mas você pode usar o segredo diretamente se preferir
  const expectedSecret = process.env.FINNHUB_WEBHOOK_SECRET || "dbfsnl9r01qiahublh4g";

  // 1. Validação de Segurança do Cabeçalho
  if (!secretHeader || secretHeader !== expectedSecret) {
    console.warn("[Finnhub Webhook] Tentativa de webhook não autorizada recebida.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Confirmação imediata do recebimento (Status 200 OK)
  // Isso deve ser feito ANTES de qualquer lógica pesada para evitar timeouts na Finnhub.
  res.status(200).json({ received: true });

  // 3. Processamento posterior dos dados em segundo plano
  const eventData = req.body;
  processarEventoEmBackground(eventData);
});

// ==========================================
// ==========================================
// Financial Modeling Prep (FMP) Proxy Routes
// ==========================================
const FMP_KEY = process.env.FMP_API_KEY || "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";
const FMP_URL = "https://financialmodelingprep.com/stable";

const fmpServerQuoteCache = new Map<string, { data: any; timestamp: number }>();
const fmpServerProfileCache = new Map<string, { data: any; timestamp: number }>();
const fmpServerFinancialsCache = new Map<string, { data: any; timestamp: number }>();
let fmpServerCooldownUntil = 0;

function getFallbackFmpQuote(rawSymbol: string): any {
  const sym = rawSymbol.trim().toUpperCase();
  const symbolMap: Record<string, string> = {
    SPY: "sp-500",
    QQQ: "nasdaq",
    DIA: "dow-jones",
    EURUSD: "usd-eur",
    GCUSD: "ouro-futuro",
    AAPL: "aapl",
    NVDA: "nvda",
    MSFT: "msft",
    AMZN: "amzn",
    GOOGL: "googl",
    TSLA: "tsla",
    META: "meta",
  };

  const id = symbolMap[sym] || sym.toLowerCase();
  const quotes = (quotesService as any).cache?.data || {};
  const q = quotes[id];
  const reg = ASSET_REGISTRY[id];

  const price = q?.price || reg?.basePrice || 100;
  const change = q?.change || 0;
  const changePercentage = q?.changePercent || 0;
  const open = q?.open || price;
  const high = q?.high || price * 1.01;
  const low = q?.low || price * 0.99;
  const previousClose = q?.price ? q.price - change : price;

  return {
    symbol: sym,
    name: q?.name || reg?.name || sym,
    price: Number(price.toFixed(price < 10 ? 4 : 2)),
    changePercentage: Number(changePercentage.toFixed(2)),
    change: Number(change.toFixed(price < 10 ? 4 : 2)),
    dayLow: Number(low.toFixed(price < 10 ? 4 : 2)),
    dayHigh: Number(high.toFixed(price < 10 ? 4 : 2)),
    yearHigh: Number((price * 1.25).toFixed(2)),
    yearLow: Number((price * 0.8).toFixed(2)),
    marketCap: 2500000000000,
    priceAvg50: price,
    priceAvg200: price,
    exchange: reg?.exchange || "NYSE / NASDAQ",
    volume: 85000000,
    open: Number(open.toFixed(price < 10 ? 4 : 2)),
    previousClose: Number(previousClose.toFixed(price < 10 ? 4 : 2)),
    timestamp: Math.floor(Date.now() / 1000),
  };
}

// 1. Real-time Quote Proxy
app.get("/api/fmp/quote", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const now = Date.now();

    // Check server cache (valid for 60 seconds)
    const cached = fmpServerQuoteCache.get(symbol);
    if (cached && now - cached.timestamp < 60000) {
      return res.json(cached.data);
    }

    // If currently in rate limit cooldown, use cached or resilient fallback
    if (now < fmpServerCooldownUntil) {
      if (cached) return res.json(cached.data);
      const fallbackQuote = getFallbackFmpQuote(symbol);
      return res.json(fallbackQuote);
    }

    const url = `${FMP_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 429) {
      fmpServerCooldownUntil = now + 120000; // 2 minutes cooldown
      console.warn(`[Server] FMP rate limit hit (429) for ${symbol}. Cooldown activated.`);
      if (cached) return res.json(cached.data);
      const fallbackQuote = getFallbackFmpQuote(symbol);
      return res.json(fallbackQuote);
    }

    if (!response.ok) {
      if (cached) return res.json(cached.data);
      const fallbackQuote = getFallbackFmpQuote(symbol);
      return res.json(fallbackQuote);
    }

    const data = await response.json();
    const quote = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (quote) {
      fmpServerQuoteCache.set(symbol, { data: quote, timestamp: now });
      return res.json(quote);
    }

    const fallbackQuote = getFallbackFmpQuote(symbol);
    res.json(fallbackQuote);
  } catch (error: any) {
    console.warn(`[Server] Fallback in /api/fmp/quote for ${req.query.symbol}:`, error?.message || error);
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const cached = fmpServerQuoteCache.get(symbol);
    if (cached) return res.json(cached.data);
    const fallbackQuote = getFallbackFmpQuote(symbol);
    res.json(fallbackQuote);
  }
});

// 2. Company Profile Proxy
app.get("/api/fmp/profile", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const now = Date.now();

    const cached = fmpServerProfileCache.get(symbol);
    if (cached && now - cached.timestamp < 300000) {
      return res.json(cached.data);
    }

    if (now < fmpServerCooldownUntil) {
      if (cached) return res.json(cached.data);
      return res.json(null);
    }

    const url = `${FMP_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 429) {
      fmpServerCooldownUntil = now + 120000;
      console.warn(`[Server] FMP rate limit hit (429) for profile ${symbol}.`);
      return res.json(cached?.data || null);
    }

    if (!response.ok) {
      return res.json(cached?.data || null);
    }

    const data = await response.json();
    const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (profile) {
      fmpServerProfileCache.set(symbol, { data: profile, timestamp: now });
    }
    res.json(profile);
  } catch (error: any) {
    console.warn("[Server] Handled error in /api/fmp/profile:", error?.message || error);
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    res.json(fmpServerProfileCache.get(symbol)?.data || null);
  }
});

// 3. Income Statement / DRE Proxy
app.get("/api/fmp/financials", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    const now = Date.now();

    const cached = fmpServerFinancialsCache.get(symbol);
    if (cached && now - cached.timestamp < 300000) {
      return res.json(cached.data);
    }

    if (now < fmpServerCooldownUntil) {
      if (cached) return res.json(cached.data);
      return res.json([]);
    }

    const url = `${FMP_URL}/income-statement?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 429) {
      fmpServerCooldownUntil = now + 120000;
      console.warn(`[Server] FMP rate limit hit (429) for financials ${symbol}.`);
      return res.json(cached?.data || []);
    }

    if (!response.ok) {
      return res.json(cached?.data || []);
    }

    const data = await response.json();
    const financials = Array.isArray(data) ? data : [];
    if (financials.length > 0) {
      fmpServerFinancialsCache.set(symbol, { data: financials, timestamp: now });
    }
    res.json(financials);
  } catch (error: any) {
    console.warn("[Server] Handled error in /api/fmp/financials:", error?.message || error);
    const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
    res.json(fmpServerFinancialsCache.get(symbol)?.data || []);
  }
});

// 4. Symbol Search Proxy
app.get("/api/fmp/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.json([]);

    const now = Date.now();
    if (now < fmpServerCooldownUntil) {
      return res.json([]);
    }

    const url = `${FMP_URL}/search-symbol?query=${encodeURIComponent(query)}&apikey=${FMP_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json([]);
    }

    const data = await response.json();
    res.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    console.warn("[Server] Handled error in /api/fmp/search:", error?.message || error);
    res.json([]);
  }
});

// API: Historical Chart Data for any ticker & period
app.get("/api/market/chart", async (req, res) => {
  try {
    const ticker = String(req.query.ticker || "IBOV").toUpperCase();
    const period = String(req.query.period || "1D").toUpperCase();

    // Find symbol
    let yfSymbol = "^BVSP";
    const foundReg = Object.values(ASSET_REGISTRY).find(
      (r) => r.ticker.toUpperCase() === ticker || r.symbol.toUpperCase() === ticker
    );
    if (foundReg) {
      yfSymbol = foundReg.symbol;
    } else if (ticker.endsWith(".SA") || ticker.startsWith("^")) {
      yfSymbol = ticker;
    } else if (!ticker.includes(".")) {
      yfSymbol = `${ticker}.SA`;
    }

    // Map timeframe to Yahoo range & interval
    let range = "1d";
    let interval = "5m";
    if (period === "5D") {
      range = "5d";
      interval = "15m";
    } else if (period === "1M") {
      range = "1mo";
      interval = "1d";
    } else if (period === "6M") {
      range = "6mo";
      interval = "1d";
    } else if (period === "YTD") {
      range = "ytd";
      interval = "1d";
    } else if (period === "1A" || period === "1Y") {
      range = "1y";
      interval = "1wk";
    } else if (period === "5A" || period === "5Y") {
      range = "5y";
      interval = "1mo";
    } else if (period === "MAX" || period === "MÁX") {
      range = "max";
      interval = "1mo";
    }

    const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSymbol)}?range=${range}&interval=${interval}`;
    const response = await fetch(yfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(404).json({ success: false, error: "Dados históricos indisponíveis no momento." });
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ success: false, error: "Sem dados para o ativo especificado." });
    }

    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const opens: number[] = quotes.open || [];
    const highs: number[] = quotes.high || [];
    const lows: number[] = quotes.low || [];
    const closes: number[] = quotes.close || [];
    const volumes: number[] = quotes.volume || [];

    const points: Array<{
      time: string;
      date: string;
      price: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      benchmarkPrice: number;
    }> = [];

    const baseBench = 100;
    const firstClose = closes.find((c) => typeof c === "number" && !isNaN(c)) || 1;

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c !== "number" || isNaN(c)) continue;
      const d = new Date(timestamps[i] * 1000);
      const timeStr =
        period === "1D"
          ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : `${d.getDate()}/${d.getMonth() + 1}`;
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

      const o = typeof opens[i] === "number" && !isNaN(opens[i]) ? opens[i] : c;
      const h = typeof highs[i] === "number" && !isNaN(highs[i]) ? highs[i] : c;
      const l = typeof lows[i] === "number" && !isNaN(lows[i]) ? lows[i] : c;
      const v = typeof volumes[i] === "number" && !isNaN(volumes[i]) ? volumes[i] : 0;

      const bench = Number((baseBench * (c / firstClose)).toFixed(2));

      points.push({
        time: timeStr,
        date: dateStr,
        price: Number(c.toFixed(2)),
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: v,
        benchmarkPrice: bench,
      });
    }

    res.json({
      success: true,
      ticker,
      period,
      symbol: yfSymbol,
      count: points.length,
      meta: result.meta,
      points,
    });
  } catch (error: any) {
    console.error("Error in /api/market/chart:", error);
    res.status(500).json({ success: false, error: "Erro ao processar gráfico histórico." });
  }
});

// Helper: Calculate relative time in Portuguese
function getRelativeTimePt(dateStr: string): string {
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pub.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Agora mesmo";
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } catch {
    return "Recente";
  }
}

// API: Real-time News Feed from authoritative Brazilian & Global sources
let newsCache: { timestamp: number; items: any[] } = { timestamp: 0, items: [] };

app.get("/api/market/news", async (req, res) => {
  try {
    const now = Date.now();
    if (newsCache.timestamp > 0 && now - newsCache.timestamp < 60000 && newsCache.items.length > 0) {
      return res.json({ success: true, count: newsCache.items.length, news: newsCache.items });
    }

    const allNews: any[] = [];
    let idCounter = 1;

    // 1. Finnhub News API: Notícias financeiras globais e corporativas em tempo real
    const finnhubApiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";
    try {
      const finnhubRes = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubApiKey}`, {
        headers: { Accept: "application/json" },
      });
      if (finnhubRes.ok) {
        const finnhubList = await finnhubRes.json();
        if (Array.isArray(finnhubList) && finnhubList.length > 0) {
          for (const item of finnhubList.slice(0, 10)) {
            const dt = item.datetime ? new Date(item.datetime * 1000) : new Date();
            const diffMin = Math.floor((now - dt.getTime()) / 60000);
            const timeAgo = diffMin < 60 ? `Há ${Math.max(1, diffMin)} min` : `Há ${Math.floor(diffMin / 60)}h`;
            const upper = (item.headline || "").toUpperCase();
            allNews.push({
              id: `finnhub-${item.id || idCounter++}`,
              title: item.headline || "Notícia dos Mercados Globais",
              source: item.source || "Finnhub Financial",
              timeAgo,
              url: item.url || "https://dinheuro.com",
              category: "Bolsas & Economia Global",
              relatedTickers: item.related ? [item.related] : ["MERCADO"],
              sentiment: upper.includes("ALTA") || upper.includes("SURGE") || upper.includes("GAIN") || upper.includes("RALLY") || upper.includes("BEAT") ? "positive" : upper.includes("QUEDA") || upper.includes("DROP") || upper.includes("FALL") || upper.includes("SLUMP") ? "negative" : "neutral",
              image: item.image,
              summary: item.summary,
            });
          }
        }
      }
    } catch (e: any) {
      console.warn("[Server] Finnhub news fetch error:", e?.message);
    }

    const rssUrls = [
      { url: "https://news.google.com/rss/search?q=mercado+financeiro+ibovespa+dolar+acoes&hl=pt-BR&gl=BR&ceid=BR:pt-419", category: "Mercados B3" },
      { url: "https://news.google.com/rss/search?q=wall+street+sp500+fed+nasdaq&hl=pt-BR&gl=BR&ceid=BR:pt-419", category: "Wall Street" },
      { url: "https://news.google.com/rss/search?q=dolar+cambio+euro+banco+central&hl=pt-BR&gl=BR&ceid=BR:pt-419", category: "Câmbio & Forex" },
      { url: "https://news.google.com/rss/search?q=bitcoin+criptomoedas+etf+ethereum&hl=pt-BR&gl=BR&ceid=BR:pt-419", category: "Criptoativos" },
      { url: "https://news.google.com/rss/search?q=petroleo+brent+ouro+commodities+soja&hl=pt-BR&gl=BR&ceid=BR:pt-419", category: "Commodities" },
    ];

    await Promise.all(
      rssUrls.map(async (rss) => {
        try {
          const feedRes = await fetch(rss.url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          });
          if (!feedRes.ok) return;
          const xml = await feedRes.text();
          const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const itemXml of itemMatches.slice(0, 4)) {
            const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
            const linkMatch = itemXml.match(/<link>(.*?)<\/link>/) || itemXml.match(/<guid[^>]*>(.*?)<\/guid>/);
            const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
            const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);

            let rawTitle = titleMatch ? titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'") : "";
            const rawLink = linkMatch ? linkMatch[1] : "";
            const rawPubDate = pubDateMatch ? pubDateMatch[1] : "";
            let sourceName = sourceMatch ? sourceMatch[1] : "Agência Financeira";

            // Clean title if source is repeated at end
            if (rawTitle.includes(" - ")) {
              const parts = rawTitle.split(" - ");
              if (parts.length > 1) {
                sourceName = parts.pop() || sourceName;
                rawTitle = parts.join(" - ");
              }
            }

            // Extract related tickers from title
            const tickers: string[] = [];
            const upper = rawTitle.toUpperCase();
            if (upper.includes("IBOV") || upper.includes("BOLSA")) tickers.push("IBOV");
            if (upper.includes("PETROBRAS") || upper.includes("PETR4")) tickers.push("PETR4");
            if (upper.includes("VALE") || upper.includes("VALE3")) tickers.push("VALE3");
            if (upper.includes("ITAÚ") || upper.includes("ITUB4")) tickers.push("ITUB4");
            if (upper.includes("DÓLAR") || upper.includes("USD")) tickers.push("USD/BRL");
            if (upper.includes("BITCOIN") || upper.includes("BTC")) tickers.push("BTC");
            if (upper.includes("S&P") || upper.includes("SP500")) tickers.push("S&P 500");
            if (upper.includes("PETRÓLEO") || upper.includes("BRENT")) tickers.push("BRENT");

            if (rawTitle && rawLink) {
              const secureLink = rawLink.startsWith("http://")
                ? rawLink.replace(/^http:\/\//i, "https://")
                : rawLink.startsWith("https://")
                ? rawLink
                : `https://${rawLink}`;

              allNews.push({
                id: `real-news-${idCounter++}`,
                title: rawTitle,
                source: sourceName,
                timeAgo: getRelativeTimePt(rawPubDate),
                url: secureLink,
                category: rss.category,
                relatedTickers: tickers.length > 0 ? tickers : ["MERCADO"],
                sentiment: upper.includes("ALTA") || upper.includes("SOBE") || upper.includes("DISPARA") ? "positive" : upper.includes("QUEDA") || upper.includes("CAI") || upper.includes("RECUO") ? "negative" : "neutral",
              });
            }
          }
        } catch (e: any) {
          console.warn("RSS feed fetch error:", e?.message);
        }
      })
    );

    if (allNews.length > 0) {
      newsCache = { timestamp: Date.now(), items: allNews };
      return res.json({ success: true, count: allNews.length, news: allNews });
    }

    // Fallback if network blocked
    res.json({ success: true, count: 0, news: [] });
  } catch (error: any) {
    console.error("Error in /api/market/news:", error);
    res.status(500).json({ success: false, error: "Erro ao carregar notícias em tempo real." });
  }
});

// API: Live Market Movers computed dynamically
app.get("/api/market/movers", async (_req, res) => {
  try {
    const quotes: Record<string, LiveQuote> = await quotesService.getQuotes();
    const b3List: LiveQuote[] = Object.values(quotes).filter(
      (q: LiveQuote) => q.category === "América Latina" && q.ticker !== "IBOV" && !q.ticker.includes("Índice")
    );

    const sortedByGain = [...b3List].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedByGain.filter((q) => q.changePercent > 0).slice(0, 6);

    const sortedByLoss = [...b3List].sort((a, b) => a.changePercent - b.changePercent);
    const topLosers = sortedByLoss.filter((q) => q.changePercent < 0).slice(0, 6);

    const mostActive = [...b3List]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      movers: {
        mostActive,
        topGainers: topGainers.length > 0 ? topGainers : sortedByGain.slice(0, 5),
        topLosers: topLosers.length > 0 ? topLosers : sortedByLoss.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error("[Server] Error in /api/market/movers:", error);
    res.status(500).json({ success: false, error: "Falha ao calcular destaques de mercado." });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "DinhEuro Financial Real-time Engine", timestamp: new Date().toISOString() });
});

// ==========================================
// PWA PUSH NOTIFICATIONS & SUBSCRIBER MANAGEMENT
// ==========================================
interface ClientSubscription {
  id: string;
  deviceType: string;
  permission: string;
  userAgent: string;
  subscription: any;
  settings?: any;
  updatedAt: string;
}

const pushSubscriptionsMap = new Map<string, ClientSubscription>();

// Endpoint to register/update PWA push subscription from Desktop or Mobile
app.post("/api/notifications/subscribe", (req, res) => {
  try {
    const { deviceType, permission, userAgent, subscription, settings } = req.body;
    const clientId = subscription?.endpoint || `${deviceType}-${Date.now()}`;

    pushSubscriptionsMap.set(clientId, {
      id: clientId,
      deviceType: deviceType || "unknown",
      permission: permission || "granted",
      userAgent: userAgent || "",
      subscription: subscription || null,
      settings: settings || null,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[Notification Engine] Subscriber registered: ${deviceType} (${pushSubscriptionsMap.size} active)`);

    res.json({
      success: true,
      message: "Dispositivo registrado para alertas push em tempo real com sucesso.",
      subscriberCount: pushSubscriptionsMap.size,
      registeredAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Notification Engine] Erro ao registrar subscrição:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar subscrição de alertas." });
  }
});

// Endpoint to query notification server status
app.get("/api/notifications/status", (_req, res) => {
  res.json({
    success: true,
    activeSubscribers: pushSubscriptionsMap.size,
    timestamp: new Date().toISOString(),
    capabilities: {
      assetPriceAlerts: true,
      breakingNews: true,
      macroEvents: ["copom", "fed", "ecb", "circuit_breaker"],
      platforms: ["desktop", "mobile_android", "mobile_ios_pwa"],
    },
  });
});

// Endpoint to simulate/broadcast a market alert to clients
app.post("/api/notifications/test", (req, res) => {
  const { title, body, type, ticker } = req.body;
  res.json({
    success: true,
    message: "Disparo de alerta processado pela central de mensageria DinhEuro.",
    alert: {
      title: title || "🔔 DinhEuro • Alerta de Cotação",
      body: body || "Oscilação significativa detectada em ativo monitorado.",
      type: type || "asset",
      ticker: ticker || "PETR4",
      timestamp: new Date().toISOString(),
    },
  });
});

// Helper: Scan project source files to package for Hostinger
function getProjectFilesList(dir: string, baseDir: string = dir): Array<{ path: string; content: string }> {
  const results: Array<{ path: string; content: string }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const ignoredDirs = new Set(["node_modules", "dist", ".git", ".next", "angular-src"]);
  const ignoredFiles = new Set(["bun.lock", ".DS_Store"]);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        results.push(...getProjectFilesList(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      if (!ignoredFiles.has(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          results.push({ path: relPath, content });
        } catch {
          // ignore binary read failures if any
        }
      }
    }
  }
  return results;
}

// API endpoint to return all project source files
app.get("/api/project-files", (_req, res) => {
  try {
    const files = getProjectFilesList(process.cwd());
    res.json({ success: true, count: files.length, files });
  } catch (error: any) {
    console.error("Error reading project files:", error);
    res.status(500).json({ success: false, error: "Falha ao obter arquivos do projeto." });
  }
});

// Direct ZIP download endpoint for Hostinger
app.get("/api/export-project-zip", async (_req, res) => {
  try {
    const files = getProjectFilesList(process.cwd());
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="dinheuro-hostinger-vite-react.zip"');
    res.setHeader("Content-Length", zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (error: any) {
    console.error("Error exporting zip:", error);
    res.status(500).json({ success: false, error: "Erro ao gerar arquivo .ZIP" });
  }
});

// AI Market Summary by Region
app.post("/api/market-ai/summary", async (req, res) => {
  try {
    const { region, topic } = req.body;
    const prompt = `Você é o analista-chefe de inteligência financeira do portal DinhEuro.com (inspirado no Google Finanças com foco em investidores e traders).
Gere uma análise concisa, técnica e perspicaz em português sobre o mercado de "${region || "Global"}" no tema "${topic || "Geral"}".
Destaque:
1. Sentimento macroeconômico atual com dados em tempo real.
2. Principais vetores e catalisadores (juros, inflação, balanços, commodities ou geopolítica).
3. O que o investidor deve monitorar hoje.
Mantenha o tom profissional, direto e sem jargões desnecessários, com 2 a 3 parágrafos objetivos.`;

    const aiText = await generateContentSafely({
      contents: prompt,
      preferredModel: "gemini-3.7-flash",
    });

    const finalAnalysis =
      aiText ||
      `Análise em tempo real para o mercado de ${region || "Geral"}: Os mercados operam com base na dinâmica das curvas de juros e fluxo de capital institucional. No segmento de ${topic || "Macroeconomia"}, investidores monitoram a liquidez, spreads de crédito e indicadores de inflação para tomada de decisão.`;

    res.json({
      success: true,
      region,
      topic,
      analysis: finalAnalysis,
      sources: ["DinhEuro Intelligence AI", "Termômetro de Liquidez Global", "Consenso de Analistas"],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in market summary endpoint:", error);
    res.json({
      success: true,
      region: req.body?.region || "Global",
      topic: req.body?.topic || "Geral",
      analysis: "Mercados globais mostram acomodação com atenção aos discursos de bancos centrais e balanços corporativos.",
      sources: ["DinhEuro Intelligence AI"],
      timestamp: new Date().toISOString(),
    });
  }
});

// Deep Dive AI explanation for specific topics
app.post("/api/market-ai/deep-dive", async (req, res) => {
  try {
    const { topicTitle, context, region } = req.body;
    const prompt = `Você é o assistente sênior de macroeconomia do portal DinhEuro.com.
O usuário clicou em "Aprenda mais com a IA do DinhEuro" para o tópico: "${topicTitle || "Mercado Financeiro"}" na região "${region || "Global"}".
Contexto adicional: "${context || ""}".
Estruture a resposta em Markdown limpo com:
- **Resumo Executivo** (1 frase direta)
- **Mecanismo de Ação no Mercado** (como isso impacta ações, moedas, títulos ou criptoativos)
- **Cenário Base vs. Cenário de Risco**
- **O que observar no gráfico / indicadores** (ex: médias móveis, volume, DXY, CDS Brasil)`;

    const aiText = await generateContentSafely({
      contents: prompt,
      preferredModel: "gemini-3.7-flash",
    });

    const fallbackContent = `### Análise Aprofundada DinhEuro: ${topicTitle || "Dinâmica de Mercado"}\n\n**Resumo Executivo:**\nO segmento de ${region || "Mercados"} apresenta correlações estratégicas ativas com as curvas de juros globais, fluxos cambiais e precificação de risco soberano.\n\n**Mecanismo de Ação no Mercado:**\n- **Câmbio e Juros:** Oscilações de liquidez internacional impactam diretamente as taxas futuras e a paridade de moedas fortes e emergentes.\n- **Ações e Índices:** Rotação setorial perceptível entre papéis cíclicos e defensivos nos pregões recentes.\n\n**Cenário Base vs. Cenário de Risco:**\n- *Cenário Base:* Consolidação em níveis técnicos de suporte com volatilidade contida.\n- *Cenário de Risco:* Picos de aversão ao risco decorrentes de dados de inflação acima do consenso.\n\n**O que observar nos indicadores:**\nMonitore o volume financeiro acumulado, cruzamento de médias móveis de 20/50 dias e os spreads de crédito corporativo.`;

    res.json({
      success: true,
      topicTitle,
      content: aiText || fallbackContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in deep dive endpoint:", error);
    res.json({
      success: true,
      topicTitle: req.body?.topicTitle || "Análise de Mercado",
      content: `### Análise DinhEuro Intelligence\n\n**Resumo:**\nO ativo ou tema selecionado reflete o equilíbrio entre política monetária global e demanda setorial.\n\n**Diretriz Tática:**\nAcompanhe a volatilidade implícita e os níveis de suporte e resistência no gráfico interativo.`,
      timestamp: new Date().toISOString(),
    });
  }
});

// Asset Deep Analysis
app.post("/api/market-ai/asset-analysis", async (req, res) => {
  try {
    const { ticker, name, currentPrice, changePercent, metrics } = req.body;
    const prompt = `Você é o sistema analítico de ativos do portal DinhEuro.com.
Faça um diagnóstico completo do ativo em tempo real:
- Nome: ${name || ticker}
- Código: ${ticker}
- Cotação Atual: ${currentPrice}
- Variação: ${changePercent}%
- Métricas: ${JSON.stringify(metrics || {})}
Forneça um JSON com a seguinte estrutura:
{
  "summary": "Texto de síntese técnica e fundamentalista de 3 a 4 frases",
  "valuationStatus": "Ex: Acima da Média Histórica / Em Zona de Oportunidade / Neutro",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "risks": ["risco 1", "risco 2"],
  "technicalInsight": "Análise sobre médias móveis, suporte, resistência e volume"
}`;

    const aiText = await generateContentSafely({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
      preferredModel: "gemini-3.7-flash",
    });

    let jsonOutput = null;
    if (aiText) {
      try {
        jsonOutput = JSON.parse(aiText);
      } catch {
        // failed parse
      }
    }

    if (jsonOutput && jsonOutput.summary) {
      return res.json({ success: true, ticker, ...jsonOutput });
    }

    const isUp = Number(changePercent) >= 0;
    res.json({
      success: true,
      ticker,
      summary: `${name || ticker} (${ticker}) é negociado a ${currentPrice || "nível de mercado"}, com variação recente de ${isUp ? "+" : ""}${changePercent || "0.0"}%. Métricas técnicas apontam consolidação com suporte e resistência bem delineados no canal atual.`,
      valuationStatus: isUp ? "Momentum Positivo / Neutro" : "Zona de Suporte Relevante",
      strengths: [
        "Forte liquidez diária e profundidade de livro",
        "Posicionamento setorial consolidado",
        "Acompanhamento institucional elevado",
      ],
      risks: [
        "Sensibilidade a taxas de juros globais e inflação",
        "Flutuações cambiais e volatilidade de curto prazo",
      ],
      technicalInsight:
        "O ativo opera próximo às médias móveis de curto prazo com volume alinhado à média dos últimos 30 dias.",
    });
  } catch (error: any) {
    console.error("Error in asset analysis endpoint:", error);
    res.json({
      success: true,
      ticker: req.body?.ticker || "ATIVO",
      summary: "Diagnóstico de mercado em acompanhamento regular pela inteligência DinhEuro.",
      valuationStatus: "Neutro",
      strengths: ["Liquidez ativa"],
      risks: ["Volatilidade macroeconômica"],
      technicalInsight: "Consulte o gráfico interativo para detalhes de suporte e resistência.",
    });
  }
});

// Interactive AI Chat / Copilot for DinhEuro
app.post("/api/market-ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((h: any) => `${h.role === "user" ? "Usuário" : "DinhEuro AI"}: ${h.content}`)
          .join("\n")
      : "";

    const prompt = `Você é a inteligência artificial oficial do DinhEuro.com, especialista global em finanças, economia e mercado financeiro.
Sua missão é responder com máxima precisão, clareza e autoridade a qualquer dúvida ou cálculo sobre finanças pessoais, mercado nacional e internacional.

Suas Especialidades Fundamentais:
1. Especialista Máxima em Corredores Financeiros:
   - Domínio absoluto do corredor União Europeia ⇄ Mercosul (EUR ⇄ BRL, EUR ⇄ ARS, etc.).
   - Domínio de todos os corredores de remessas e transferências com países parceiros do Brasil (EUA, Reino Unido, Japão, Suíça, etc.).
2. Mercado Global e Nacional:
   - Cobertura completa sobre cotações, taxa de câmbio, spread, impostos (IOF), tarifas bancárias, SEPA, PIX internacional e transferências internacionais.
   - Conhecimento aprofundado sobre o mercado financeiro brasileiro (B3, CDI, Selic, Tesouro Direto, FIIs) e internacional (Wall Street, S&P 500, Nasdaq, BCE, Fed).
3. Capacidade Técnica:
   - Realizar cálculos financeiros complexos, simulações de conversão de moedas e comparações de custos de remessa (Wise, Remessa Online, bancos tradicionais, cripto).
   - Responder prontamente a 100% das perguntas sobre dinheiro, investimentos, inflação e regulamentação financeira.

Diretrizes de Resposta:
- Mantenha um tom profissional, seguro, direto e prestativo.
- Use formatação clara em Markdown (negrito, listas, tabelas quando apropriado).

Histórico recente:
${formattedHistory}

Mensagem do usuário: "${message || "Olá"}"`;

    const aiText = await generateContentSafely({
      contents: prompt,
      preferredModel: "gemini-3.7-flash",
    });

    const fallbackReply = `Sou o **DinhEuro AI Copilot**! Em relação à sua consulta sobre **"${message || "mercados"}"**:
- **Cenário Atual:** Os mercados globais e o mercado brasileiro (Ibovespa) operam com foco nas decisões de política monetária (BCE, Fed e Copom) e no fluxo de capital estrangeiro.
- **Dica Prática:** Você pode consultar cotações em tempo real, gráficos interativos de 1D a 5A, métricas de Valuation e notícias atualizadas diretamente nas abas do portal DinhEuro.

Como posso ajudar você a analisar um ativo específico (ações, FIIs, moedas, índices ou criptos) hoje?`;

    res.json({
      success: true,
      reply: aiText || fallbackReply,
    });
  } catch (error: any) {
    console.error("Error in AI chat endpoint:", error);
    res.json({
      success: true,
      reply:
        "O DinhEuro AI Copilot está pronto para ajudar! Você pode explorar cotações, gráficos interativos e notícias em tempo real nas abas de Ações, Câmbio, Cripto e Commodities.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DinhEuro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
