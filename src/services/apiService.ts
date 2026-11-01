/**
 * DinhEuro.com - Centralized Resilient HTTP API Service
 * Cliente HTTP com controle de timeout de 5 segundos, tratamento seguro Try/Catch e
 * persistência com fallback automático para localStorage para evitar carregamento infinito.
 */

import { LiveQuotePayload } from "./marketDataService";
import { ALL_ASSETS } from "../data/mockMarketData";
import { obterCotacaoFinnhub, FinnhubQuoteResult } from "./finnhubService";
import { obterCotacaoFMP, FMPQuote } from "./fmpService";

export { obterCotacaoFinnhub, obterCotacaoFMP };
export type { FinnhubQuoteResult, FMPQuote };

export const DEFAULT_TIMEOUT_MS = 5000;
export const CACHE_KEY_QUOTES = "dinheuro_live_quotes_cache";
export const CACHE_KEY_TIMESTAMP = "dinheuro_quotes_timestamp";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  cacheKey?: string;
  useLocalStorageFallback?: boolean;
}

/**
 * Cliente HTTP centralizado com tratamento de timeout e AbortController
 */
export class ApiClient {
  private defaultTimeout: number;

  constructor(defaultTimeout: number = DEFAULT_TIMEOUT_MS) {
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Executa requisição HTTP segura com timeout e captura de erros
   */
  public async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T | null> {
    const timeout = options.timeoutMs ?? this.defaultTimeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          ...options.headers,
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        console.warn(`[ApiClient] HTTP ${response.status} ao acessar ${url}`);
        return this.handleFallback<T>(options);
      }

      const data = (await response.json()) as T;

      // Salva no localStorage se cacheKey foi fornecida
      if (options.cacheKey && data) {
        this.saveToStorage(options.cacheKey, data);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timer);
      if (error.name === "AbortError") {
        console.warn(`[ApiClient] Timeout de ${timeout}ms atingido para: ${url}`);
      } else {
        console.warn(`[ApiClient] Falha na requisição para ${url}:`, error?.message || error);
      }
      return this.handleFallback<T>(options);
    }
  }

  /**
   * Requisições GET convenientes
   */
  public async get<T>(url: string, options: RequestOptions = {}): Promise<T | null> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /**
   * Requisições POST convenientes
   */
  public async post<T>(url: string, body: any, options: RequestOptions = {}): Promise<T | null> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Recupera dados salvos em localStorage em caso de falha de rede
   */
  private handleFallback<T>(options: RequestOptions): T | null {
    if (options.useLocalStorageFallback && options.cacheKey) {
      return this.loadFromStorage<T>(options.cacheKey);
    }
    return null;
  }

  /**
   * Salva dados em localStorage com timestamp
   */
  public saveToStorage(key: string, data: any): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      }
    } catch (err) {
      console.warn(`[ApiClient] Não foi possível salvar no localStorage (${key}):`, err);
    }
  }

  /**
   * Lê dados do localStorage com tratamento de erro
   */
  public loadFromStorage<T>(key: string): T | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item) as T;
        }
      }
    } catch (err) {
      console.warn(`[ApiClient] Não foi possível ler do localStorage (${key}):`, err);
    }
    return null;
  }
}

// Instância Singleton do cliente
export const apiClient = new ApiClient(DEFAULT_TIMEOUT_MS);

/**
 * Função utilitária global compatível com safeFetch
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T | null> {
  return apiClient.request<T>(url, { ...options, timeoutMs });
}

/**
 * 1. AwesomeAPI: Cotações de Câmbio e Criptomoedas em Tempo Real (CORS público e sem chave)
 */
export async function fetchAwesomeAPICurrencies(): Promise<Record<string, { price: number; changePct: number; high: number; low: number }> | null> {
  const url = `https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL,GBP-BRL,JPY-BRL,ETH-BRL?t=${Date.now()}`;
  const data = await safeFetch<any>(url, { method: "GET" }, 4500);

  if (!data || typeof data !== "object") return null;

  const result: Record<string, { price: number; changePct: number; high: number; low: number }> = {};

  const mapPair = (key: string, targetId: string) => {
    const item = data[key];
    if (item && item.bid) {
      const price = Number(item.bid);
      const changePct = Number(item.pctChange || 0);
      const high = Number(item.high || price * 1.01);
      const low = Number(item.low || price * 0.99);
      if (price > 0) {
        result[targetId] = { price, changePct, high, low };
      }
    }
  };

  mapPair("USDBRL", "usd-brl");
  mapPair("EURBRL", "eur-brl");
  mapPair("GBPBRL", "gbp-brl");
  mapPair("JPYBRL", "jpy-brl");
  mapPair("BTCBRL", "btc-brl");
  mapPair("ETHBRL", "eth-brl");

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 2. BRAPI: Cotações de Ações da B3 e Índice Ibovespa
 */
export async function fetchBrapiStocks(): Promise<Record<string, { price: number; changePct: number; high: number; low: number; volume?: string }> | null> {
  const tickers = "%5EBVSP,PETR4,VALE3,ITUB4,BBAS3,B3SA3,MGLU3,WEGE3,PRIO3,EMBR3,EQTL3";
  const url = `https://brapi.dev/api/quote/${tickers}`;

  const data = await safeFetch<any>(url, { method: "GET" }, 4500);

  if (!data || !Array.isArray(data.results)) return null;

  const result: Record<string, { price: number; changePct: number; high: number; low: number; volume?: string }> = {};

  for (const item of data.results) {
    if (!item || !item.symbol) continue;
    const symbol = item.symbol.toUpperCase();
    const price = Number(item.regularMarketPrice || 0);
    const changePct = Number(item.regularMarketChangePercent || 0);
    const high = Number(item.regularMarketDayHigh || price * 1.01);
    const low = Number(item.regularMarketDayLow || price * 0.99);

    if (price > 0) {
      let id = item.symbol.toLowerCase();
      if (symbol === "^BVSP" || symbol === "%5EBVSP") id = "ibovespa";

      result[id] = {
        price,
        changePct,
        high,
        low,
        volume: item.regularMarketVolume ? String(item.regularMarketVolume) : undefined,
      };
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 3. Recupera o último estado salvo em localStorage
 */
export function getStoredQuotes(): Record<string, LiveQuotePayload> | null {
  return apiClient.loadFromStorage<Record<string, LiveQuotePayload>>(CACHE_KEY_QUOTES);
}

/**
 * Salva as cotações em localStorage
 */
export function persistQuotes(quotes: Record<string, LiveQuotePayload>): void {
  apiClient.saveToStorage(CACHE_KEY_QUOTES, quotes);
}

/**
 * 4. Pipeline Mestre de Cotações Resilientes:
 * Consulta primeiro o servidor `/api/market/quotes`. Se falhar (ex: Hostinger estático),
 * consulta AwesomeAPI e BRAPI diretamente do navegador, mesclando com o estado local.
 */
export async function getResilientMarketQuotes(): Promise<Record<string, LiveQuotePayload>> {
  let quotes: Record<string, LiveQuotePayload> = {};

  // A. Tenta primeiro a API do backend local (/api/market/quotes)
  const serverData = await safeFetch<{ success: boolean; quotes: Record<string, LiveQuotePayload> }>(
    `/api/market/quotes?t=${Date.now()}`,
    { method: "GET" },
    6000
  );

  if (serverData?.success && serverData.quotes && Object.keys(serverData.quotes).length > 0) {
    quotes = serverData.quotes;
    persistQuotes(quotes);
    return quotes;
  }

  // B. Se o backend não responder (ex: Deploy estático Hostinger), faz fallback para AwesomeAPI e BRAPI direto no cliente
  const [awesomeQuotes, brapiQuotes] = await Promise.all([
    fetchAwesomeAPICurrencies(),
    fetchBrapiStocks(),
  ]);

  // Carrega base salva ou default
  const stored = getStoredQuotes();
  if (stored && Object.keys(stored).length > 0) {
    quotes = { ...stored };
  } else {
    // Inicializa a partir de ALL_ASSETS
    for (const a of ALL_ASSETS) {
      quotes[a.id] = {
        id: a.id,
        ticker: a.ticker,
        name: a.name,
        price: a.price,
        change: a.change,
        changePercent: a.changePercent,
        currency: a.currency,
        exchange: a.exchange,
        category: a.category,
        sparkline: a.sparkline,
        high52w: a.metrics.high52w,
        low52w: a.metrics.low52w,
        open: a.metrics.open,
        high: a.metrics.high,
        low: a.metrics.low,
        volume: a.metrics.volume,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Mescla dados do AwesomeAPI
  if (awesomeQuotes) {
    for (const [id, q] of Object.entries(awesomeQuotes)) {
      if (quotes[id]) {
        const change = q.price - (q.price / (1 + q.changePct / 100));
        quotes[id] = {
          ...quotes[id],
          price: q.price,
          change: Number(change.toFixed(4)),
          changePercent: q.changePct,
          high: q.high,
          low: q.low,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  }

  // Mescla dados do BRAPI
  if (brapiQuotes) {
    for (const [id, q] of Object.entries(brapiQuotes)) {
      if (quotes[id]) {
        const change = q.price - (q.price / (1 + q.changePct / 100));
        quotes[id] = {
          ...quotes[id],
          price: q.price,
          change: Number(change.toFixed(2)),
          changePercent: q.changePct,
          high: q.high,
          low: q.low,
          volume: q.volume || quotes[id].volume,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  }

  // 2. Finnhub API: Responsável por todo o restante da economia global e ativos
  // (Ações globais, principais índices, bolsas de valores do mundo e commodities em tempo real)
  const finnhubAssetMappings: Record<string, string> = {
    // Ações dos EUA & Globais
    aapl: "AAPL",
    nvda: "NVDA",
    msft: "MSFT",
    amzn: "AMZN",
    googl: "GOOGL",
    tsla: "TSLA",
    meta: "META",
    // Principais Índices Globais & Bolsas de Valores
    "sp-500": "SPY",
    nasdaq: "QQQ",
    "dow-jones": "DIA",
    "russell-2000": "IWM",
    dax: "EWG",
    "ftse-100": "EWU",
    "cac-40": "FEZ",
    "euro-stoxx-50": "FEZ",
    "nikkei-225": "EWJ",
    "sse-composite": "MCHI",
    "hang-seng": "FXI",
    kospi: "EWY",
    // Commodities Globais
    "ouro-futuro": "GLD",
    "petroleo-brent": "USO",
    "soja-futuro": "SOYB",
    "gas-natural": "UNG",
    "sp-500-futuros": "SPY",
  };

  await Promise.all(
    Object.entries(finnhubAssetMappings).map(async ([id, finnhubSymbol]) => {
      try {
        const finnhubQuote = await obterCotacaoFinnhub(finnhubSymbol);
        if (finnhubQuote && finnhubQuote.precoAtual > 0 && quotes[id]) {
          quotes[id] = {
            ...quotes[id],
            price: finnhubQuote.precoAtual,
            change: Number(finnhubQuote.variacao.toFixed(2)),
            changePercent: Number(finnhubQuote.percentualVariacao.toFixed(2)),
            open: finnhubQuote.abertura || finnhubQuote.precoAtual,
            high: finnhubQuote.maximaDia || finnhubQuote.precoAtual,
            low: finnhubQuote.minimaDia || finnhubQuote.precoAtual,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch {
        // Silenciosamente ignora falhas pontuais
      }
    })
  );

  persistQuotes(quotes);
  return quotes;
}
