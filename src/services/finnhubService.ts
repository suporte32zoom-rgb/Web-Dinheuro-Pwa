/**
 * DinhEuro Finanças - Serviço Finnhub API (Economia Global, Bolsas, Ações, Notícias e Termômetro)
 * Responsável pelo restante da economia global e ativos:
 * - Cotações em tempo real de ações e bolsas do mundo
 * - Principais índices globais e commodities
 * - Termômetro de ações e consenso de analistas
 * - Notícias financeiras em tempo real
 * - Análises e métricas corporativas
 */

const DEFAULT_FINNHUB_KEY = "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

export const FINNHUB_API_KEY =
  (typeof process !== "undefined" && process?.env?.FINNHUB_API_KEY) ||
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_FINNHUB_API_KEY) ||
  DEFAULT_FINNHUB_KEY;

export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface FinnhubQuoteResult {
  simbolo: string;
  precoAtual: number;           // Current price (c)
  variacao: number;             // Change (d)
  percentualVariacao: number;   // Percent change (dp)
  maximaDia: number;            // High price of the day (h)
  minimaDia: number;            // Low price of the day (l)
  abertura: number;             // Open price of the day (o)
  fechamentoAnterior: number;   // Previous close price (pc)
}

export interface FinnhubThermometerResult {
  symbol: string;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  score?: number; // 0 a 100
  sentimentText?: "Forte Compra" | "Compra" | "Neutro" | "Venda" | "Forte Venda";
}

export interface FinnhubCompanyProfileResult {
  symbol: string;
  companyName: string;
  country: string;
  currency: string;
  exchange: string;
  industry?: string;
  ipo?: string;
  marketCap?: number;
  logo?: string;
  weburl?: string;
}

export interface FinnhubNewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url: string;
  category: string;
  relatedTickers: string[];
  sentiment: "positive" | "negative" | "neutral";
  image?: string;
  summary?: string;
}

// Caches locais em memória para evitar chamadas redundantes
const quoteCache = new Map<string, { data: FinnhubQuoteResult; timestamp: number }>();
const thermometerCache = new Map<string, { data: FinnhubThermometerResult; timestamp: number }>();
const profileCache = new Map<string, { data: FinnhubCompanyProfileResult; timestamp: number }>();
let newsCache: { data: FinnhubNewsItem[]; timestamp: number } | null = null;

// Map de símbolos globais para equivalentes Finnhub
export const FINNHUB_SYMBOL_MAP: Record<string, string> = {
  "sp-500": "SPY",
  nasdaq: "QQQ",
  "dow-jones": "DIA",
  "russell-2000": "IWM",
  dax: "EWG",
  "ftse-100": "EWU",
  "cac-40": "FEZ",
  "ibex-35": "EWP",
  "euro-stoxx-50": "FEZ",
  "nikkei-225": "EWJ",
  "sse-composite": "MCHI",
  "hang-seng": "FXI",
  "bse-sensex": "INDA",
  "nifty-50": "INDY",
  kospi: "EWY",
  "petroleo-brent": "USO",
  "ouro-futuro": "GLD",
  "soja-futuro": "SOYB",
  "gas-natural": "UNG",
  "sp-500-futuros": "SPY",
  ibovespa: "EWZ",
};

/**
 * 1. Busca a cotação em tempo real de ações globais, índices e commodities via Finnhub
 */
export async function obterCotacaoFinnhub(symbol: string): Promise<FinnhubQuoteResult | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  const finnhubSym = FINNHUB_SYMBOL_MAP[symbol.toLowerCase()] || cleanSymbol;
  const now = Date.now();

  const cached = quoteCache.get(finnhubSym);
  if (cached && now - cached.timestamp < 30000) {
    return cached.data;
  }

  // No navegador, tenta primeiro a rota segura de proxy backend
  if (typeof window !== "undefined") {
    try {
      const proxyUrl = `/api/finnhub/quote?symbol=${encodeURIComponent(finnhubSym)}`;
      const proxyRes = await fetch(proxyUrl, {
        headers: { Accept: "application/json" },
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData && proxyData.precoAtual !== undefined) {
          quoteCache.set(finnhubSym, { data: proxyData as FinnhubQuoteResult, timestamp: now });
          return proxyData as FinnhubQuoteResult;
        }
      }
    } catch {
      // Continua para chamada direta com chave pública
    }
  }

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${FINNHUB_API_KEY}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();

    if (data.c === 0 && data.pc === 0 && data.h === 0) {
      return null;
    }

    const resultado: FinnhubQuoteResult = {
      simbolo: cleanSymbol,
      precoAtual: data.c,
      variacao: data.d,
      percentualVariacao: data.dp,
      maximaDia: data.h,
      minimaDia: data.l,
      abertura: data.o,
      fechamentoAnterior: data.pc,
    };

    quoteCache.set(finnhubSym, { data: resultado, timestamp: now });
    return resultado;
  } catch (error: any) {
    console.warn(`[Finnhub] Falha na cotação para ${cleanSymbol}:`, error?.message || error);
    return null;
  }
}

/**
 * 2. Termômetro de Ações: Recomendações e Tendência de Analistas de Wall Street via Finnhub
 */
export async function obterTermometroAcoes(symbol: string): Promise<FinnhubThermometerResult | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  const finnhubSym = FINNHUB_SYMBOL_MAP[symbol.toLowerCase()] || cleanSymbol;
  const now = Date.now();

  const cached = thermometerCache.get(finnhubSym);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (typeof window !== "undefined") {
    try {
      const proxyRes = await fetch(`/api/finnhub/recommendation?symbol=${encodeURIComponent(finnhubSym)}`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.strongBuy !== undefined) {
          thermometerCache.set(finnhubSym, { data, timestamp: now });
          return data;
        }
      }
    } catch {
      // fallback direto
    }
  }

  const url = `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(finnhubSym)}&token=${FINNHUB_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;

    const latest = list[0];
    const total = (latest.strongBuy || 0) + (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) + (latest.strongSell || 0);
    const positive = (latest.strongBuy || 0) * 2 + (latest.buy || 0);
    const negative = (latest.sell || 0) + (latest.strongSell || 0) * 2;
    const score = total > 0 ? Math.round(((positive) / (positive + negative + latest.hold * 0.5)) * 100) : 50;

    let sentimentText: FinnhubThermometerResult["sentimentText"] = "Neutro";
    if (score >= 75) sentimentText = "Forte Compra";
    else if (score >= 60) sentimentText = "Compra";
    else if (score <= 30) sentimentText = "Forte Venda";
    else if (score <= 45) sentimentText = "Venda";

    const result: FinnhubThermometerResult = {
      symbol: cleanSymbol,
      period: latest.period || new Date().toISOString().slice(0, 7),
      strongBuy: latest.strongBuy || 0,
      buy: latest.buy || 0,
      hold: latest.hold || 0,
      sell: latest.sell || 0,
      strongSell: latest.strongSell || 0,
      score,
      sentimentText,
    };

    thermometerCache.set(finnhubSym, { data: result, timestamp: now });
    return result;
  } catch (error: any) {
    console.warn(`[Finnhub] Falha no termômetro para ${cleanSymbol}:`, error?.message || error);
    return null;
  }
}

/**
 * 3. Notícias Financeiras Globais em Tempo Real via Finnhub API
 */
export async function obterNoticiasFinnhub(category: string = "general"): Promise<FinnhubNewsItem[]> {
  const now = Date.now();
  if (newsCache && now - newsCache.timestamp < 60000 && newsCache.data.length > 0) {
    return newsCache.data;
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/market/news?t=${now}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.news) && data.news.length > 0) {
          newsCache = { data: data.news, timestamp: now };
          return data.news;
        }
      }
    } catch {
      // fallback direto para api do Finnhub
    }
  }

  const url = `${FINNHUB_BASE_URL}/news?category=${encodeURIComponent(category)}&token=${FINNHUB_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];

    const mapped: FinnhubNewsItem[] = list.slice(0, 15).map((item: any, idx: number) => {
      const dt = item.datetime ? new Date(item.datetime * 1000) : new Date();
      const diffMin = Math.floor((now - dt.getTime()) / 60000);
      const timeStr = diffMin < 60 ? `Há ${Math.max(1, diffMin)} min` : `Há ${Math.floor(diffMin / 60)}h`;

      const title = item.headline || "Atualização de Mercado Global";
      const upper = title.toUpperCase();
      let sentiment: "positive" | "negative" | "neutral" = "neutral";
      if (upper.includes("HIGH") || upper.includes("SURGE") || upper.includes("GAIN") || upper.includes("RALLY") || upper.includes("BEAT")) {
        sentiment = "positive";
      } else if (upper.includes("DROP") || upper.includes("FALL") || upper.includes("SLUMP") || upper.includes("DOWN") || upper.includes("LOSS")) {
        sentiment = "negative";
      }

      return {
        id: `finnhub-${item.id || idx}`,
        title,
        source: item.source || "Finnhub Financial",
        timeAgo: timeStr,
        url: item.url || "https://dinheuro.com",
        category: "Bolsas & Economia Global",
        relatedTickers: item.related ? [item.related] : ["MERCADO"],
        sentiment,
        image: item.image,
        summary: item.summary,
      };
    });

    newsCache = { data: mapped, timestamp: now };
    return mapped;
  } catch (error: any) {
    console.warn("[Finnhub] Falha ao obter notícias financeiras:", error?.message || error);
    return [];
  }
}

/**
 * 4. Perfil Institucional da Empresa via Finnhub API (stock/profile2)
 */
export async function obterPerfilEmpresaFinnhub(symbol: string): Promise<FinnhubCompanyProfileResult | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  const finnhubSym = FINNHUB_SYMBOL_MAP[symbol.toLowerCase()] || cleanSymbol;
  const now = Date.now();

  const cached = profileCache.get(finnhubSym);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (typeof window !== "undefined") {
    try {
      const proxyRes = await fetch(`/api/finnhub/profile?symbol=${encodeURIComponent(finnhubSym)}`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.companyName) {
          profileCache.set(finnhubSym, { data, timestamp: now });
          return data;
        }
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(finnhubSym)}&token=${FINNHUB_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.name) return null;

    const result: FinnhubCompanyProfileResult = {
      symbol: cleanSymbol,
      companyName: data.name,
      country: data.country || "EUA",
      currency: data.currency || "USD",
      exchange: data.exchange || "NYSE / NASDAQ",
      industry: data.finnhubIndustry || "Tecnologia / Finanças",
      ipo: data.ipo,
      marketCap: data.marketCapitalization ? data.marketCapitalization * 1000000 : undefined,
      logo: data.logo,
      weburl: data.weburl,
    };

    profileCache.set(finnhubSym, { data: result, timestamp: now });
    return result;
  } catch {
    return null;
  }
}

/**
 * 5. Busca cotações de múltiplos ativos em paralelo com Finnhub
 */
export async function obterMultiplasCotacoesFinnhub(
  symbols: string[]
): Promise<Record<string, FinnhubQuoteResult>> {
  const results: Record<string, FinnhubQuoteResult> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      const q = await obterCotacaoFinnhub(sym);
      if (q) {
        results[sym.toUpperCase()] = q;
      }
    })
  );
  return results;
}

export default {
  obterCotacaoFinnhub,
  obterTermometroAcoes,
  obterNoticiasFinnhub,
  obterPerfilEmpresaFinnhub,
  obterMultiplasCotacoesFinnhub,
  FINNHUB_SYMBOL_MAP,
};
