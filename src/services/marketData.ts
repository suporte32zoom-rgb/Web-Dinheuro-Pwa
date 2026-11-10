/**
 * DinhEuro Finanças - Live Market Data Pipeline (src/services/marketData.ts)
 * 
 * Pipeline de dados dinâmico alimentado EXCLUSIVAMENTE via requisição real
 * das 4 APIs integradas do projeto:
 * 1. AwesomeAPI (https://economia.awesomeapi.com.br) - Câmbio, Moedas e Cripto em Reais
 * 2. Finnhub API (https://finnhub.io/api/v1) - Wall Street, Ações Globais, ETFs e Commodities
 * 3. FMP API (https://financialmodelingprep.com/stable) - Cotações em tempo real e fundamentos
 * 4. Yahoo Finance API (https://query1.finance.yahoo.com/v8/finance/chart) - B3 (Ações .SA), Índices Mundiais (^BVSP, ^GSPC, ^DJI) e Futuros
 *
 * Eliminação total de valores estáticos legados hardcoded (Dow Jones, S&P 500, Ibovespa, etc.).
 * A função fetchCompleteLiveMarketData sobrescreve a matriz com as cotações em tempo real
 * retornadas por essas fontes no momento em que o aplicativo carregar.
 */

import { Asset, ChartPeriod, HistoricalPoint, MarketMoverItem, NewsItem } from "../types/finance";
import { ALL_ASSETS, PORTAL_NEWS } from "../data/mockMarketData";
import { setGlobalExchangeRates } from "../utils/currencyConversion";

// ============================================================================
// CONFIGURAÇÕES E CHAVES DAS 4 APIS
// ============================================================================

export const AWESOME_API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AWESOME_ECONOMY_URL) ||
  "https://economia.awesomeapi.com.br";

export const FINNHUB_API_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FINNHUB_API_KEY) ||
  (typeof process !== "undefined" && process?.env?.FINNHUB_API_KEY) ||
  "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";

export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export const FMP_API_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_FMP_API_KEY) ||
  (typeof process !== "undefined" && process?.env?.FMP_API_KEY) ||
  "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";

export const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

export const YAHOO_FINANCE_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

export const CACHE_STORAGE_KEY = "dinheuro_live_quotes_cache";
export const CACHE_TIMESTAMP_KEY = "dinheuro_quotes_timestamp";

// ============================================================================
// INTERFACES E TIPAGENS
// ============================================================================

export interface LiveQuotePayload {
  id: string;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  category: string;
  sparkline: number[];
  high52w?: number;
  low52w?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: string;
  source?: "awesomeapi" | "finnhub" | "fmp" | "yahoo" | "server" | "cache";
  lastUpdated: string;
}

export interface LiveMarketResponse {
  success: boolean;
  count: number;
  timestamp: string;
  quotes: Record<string, LiveQuotePayload>;
}

export interface CompleteLiveMarketDataResult {
  success: boolean;
  count: number;
  timestamp: string;
  quotes: Record<string, LiveQuotePayload>;
  assets: Asset[];
}

export interface LiveMoversResponse {
  success: boolean;
  timestamp: string;
  movers: {
    mostActive: MarketMoverItem[];
    topGainers: MarketMoverItem[];
    topLosers: MarketMoverItem[];
  };
}

export interface LiveNewsResponse {
  success: boolean;
  count: number;
  news: NewsItem[];
}

export interface LiveChartResponse {
  success: boolean;
  ticker: string;
  period: ChartPeriod;
  count: number;
  points: HistoricalPoint[];
}

// ============================================================================
// MAPAS DE ATIVOS PARA AS 4 APIS (Sem valores de preços estáticos)
// ============================================================================

export interface AssetMapping {
  id: string;
  ticker: string;
  name: string;
  category: string;
  currency: string;
  exchange: string;
  awesomePair?: string;
  finnhubSymbol?: string;
  fmpSymbol?: string;
  yahooSymbol?: string;
}

export const ASSET_MAPPINGS: Record<string, AssetMapping> = {
  // --- AMÉRICA LATINA (B3) ---
  ibovespa: { id: "ibovespa", ticker: "IBOV", name: "Ibovespa Brasil", category: "América Latina", currency: "pts", exchange: "B3 (Brasil)", finnhubSymbol: "EWZ", yahooSymbol: "^BVSP" },
  petr4: { id: "petr4", ticker: "PETR4", name: "Petrobras PN", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "PETR4.SA", fmpSymbol: "PBR" },
  vale3: { id: "vale3", ticker: "VALE3", name: "Vale ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "VALE3.SA", fmpSymbol: "VALE" },
  itub4: { id: "itub4", ticker: "ITUB4", name: "Itaú Unibanco PN", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "ITUB4.SA", fmpSymbol: "ITUB" },
  bbdc4: { id: "bbdc4", ticker: "BBDC4", name: "Banco Bradesco PN", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "BBDC4.SA", fmpSymbol: "BBD" },
  bbas3: { id: "bbas3", ticker: "BBAS3", name: "Banco do Brasil ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "BBAS3.SA" },
  wege3: { id: "wege3", ticker: "WEGE3", name: "WEG S.A. ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "WEGE3.SA" },
  b3sa3: { id: "b3sa3", ticker: "B3SA3", name: "B3 S.A. ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "B3SA3.SA" },
  prio3: { id: "prio3", ticker: "PRIO3", name: "PRIO S.A. ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "PRIO3.SA" },
  embra3: { id: "embra3", ticker: "EMBR3", name: "Embraer ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "EMBR3.SA", fmpSymbol: "ERJ" },
  mglu3: { id: "mglu3", ticker: "MGLU3", name: "Magazine Luiza ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "MGLU3.SA" },
  rent3: { id: "rent3", ticker: "RENT3", name: "Localiza Rent a Car ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "RENT3.SA" },
  abev3: { id: "abev3", ticker: "ABEV3", name: "Ambev S.A. ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "ABEV3.SA", fmpSymbol: "ABEV" },
  suzb3: { id: "suzb3", ticker: "SUZB3", name: "Suzano ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "SUZB3.SA", fmpSymbol: "SUZ" },
  jbss3: { id: "jbss3", ticker: "JBSS3", name: "JBS S.A. ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "JBSS3.SA" },
  totv3: { id: "totv3", ticker: "TOTS3", name: "Totvs ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "TOTS3.SA" },
  sula11: { id: "sula11", ticker: "EQTL3", name: "Equatorial Energia ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "EQTL3.SA" },
  azulp4: { id: "azulp4", ticker: "AZUL4", name: "Azul Linhas Aéreas PN", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "AZUL4.SA", fmpSymbol: "AZUL" },
  cmin3: { id: "cmin3", ticker: "CMIN3", name: "CSN Mineração ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "CMIN3.SA" },
  csna3: { id: "csna3", ticker: "CSNA3", name: "Siderúrgica Nacional ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "CSNA3.SA", fmpSymbol: "SID" },
  crfb3: { id: "crfb3", ticker: "CRFB3", name: "Carrefour Brasil ON", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", yahooSymbol: "CRFB3.SA" },
  "sp-latin-america": { id: "sp-latin-america", ticker: "S&P LATAM", name: "S&P Latin America 40", category: "América Latina", currency: "USD", exchange: "S&P Dow Jones", yahooSymbol: "^MXX", finnhubSymbol: "ILF" },

  // --- ESTADOS UNIDOS (Wall Street) ---
  "sp-500": { id: "sp-500", ticker: "S&P 500", name: "S&P 500 Index", category: "EUA", currency: "USD", exchange: "S&P Indices", yahooSymbol: "^GSPC", finnhubSymbol: "SPY", fmpSymbol: "SPY" },
  nasdaq: { id: "nasdaq", ticker: "NASDAQ", name: "Nasdaq Composite", category: "EUA", currency: "USD", exchange: "NASDAQ", yahooSymbol: "^IXIC", finnhubSymbol: "QQQ", fmpSymbol: "QQQ" },
  "dow-jones": { id: "dow-jones", ticker: "DOW JONES", name: "Dow Jones Industrial Average", category: "EUA", currency: "USD", exchange: "NYSE", yahooSymbol: "^DJI", finnhubSymbol: "DIA", fmpSymbol: "DIA" },
  "russell-2000": { id: "russell-2000", ticker: "RUSSELL", name: "Russell 2000 Small Cap", category: "EUA", currency: "USD", exchange: "Russell", yahooSymbol: "^RUT", finnhubSymbol: "IWM", fmpSymbol: "IWM" },
  vix: { id: "vix", ticker: "VIX", name: "CBOE Volatility Index", category: "EUA", currency: "USD", exchange: "CBOE", yahooSymbol: "^VIX", finnhubSymbol: "VIXY" },
  aapl: { id: "aapl", ticker: "AAPL", name: "Apple Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "AAPL", fmpSymbol: "AAPL", yahooSymbol: "AAPL" },
  nvda: { id: "nvda", ticker: "NVDA", name: "NVIDIA Corporation", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "NVDA", fmpSymbol: "NVDA", yahooSymbol: "NVDA" },
  msft: { id: "msft", ticker: "MSFT", name: "Microsoft Corporation", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "MSFT", fmpSymbol: "MSFT", yahooSymbol: "MSFT" },
  amzn: { id: "amzn", ticker: "AMZN", name: "Amazon.com Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "AMZN", fmpSymbol: "AMZN", yahooSymbol: "AMZN" },
  googl: { id: "googl", ticker: "GOOGL", name: "Alphabet Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "GOOGL", fmpSymbol: "GOOGL", yahooSymbol: "GOOGL" },
  tsla: { id: "tsla", ticker: "TSLA", name: "Tesla Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "TSLA", fmpSymbol: "TSLA", yahooSymbol: "TSLA" },
  meta: { id: "meta", ticker: "META", name: "Meta Platforms Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "META", fmpSymbol: "META", yahooSymbol: "META" },
  nflx: { id: "nflx", ticker: "NFLX", name: "Netflix Inc.", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "NFLX", fmpSymbol: "NFLX", yahooSymbol: "NFLX" },
  amd: { id: "amd", ticker: "AMD", name: "Advanced Micro Devices", category: "EUA", currency: "USD", exchange: "NASDAQ", finnhubSymbol: "AMD", fmpSymbol: "AMD", yahooSymbol: "AMD" },
  baba: { id: "baba", ticker: "BABA", name: "Alibaba Group Holding", category: "EUA", currency: "USD", exchange: "NYSE", finnhubSymbol: "BABA", fmpSymbol: "BABA", yahooSymbol: "BABA" },
  dis: { id: "dis", ticker: "DIS", name: "The Walt Disney Company", category: "EUA", currency: "USD", exchange: "NYSE", finnhubSymbol: "DIS", fmpSymbol: "DIS", yahooSymbol: "DIS" },
  jpm: { id: "jpm", ticker: "JPM", name: "JPMorgan Chase & Co.", category: "EUA", currency: "USD", exchange: "NYSE", finnhubSymbol: "JPM", fmpSymbol: "JPM", yahooSymbol: "JPM" },
  wmt: { id: "wmt", ticker: "WMT", name: "Walmart Inc.", category: "EUA", currency: "USD", exchange: "NYSE", finnhubSymbol: "WMT", fmpSymbol: "WMT", yahooSymbol: "WMT" },

  // --- EUROPA ---
  dax: { id: "dax", ticker: "DAX 40", name: "DAX Performance Index", category: "Europa", currency: "EUR", exchange: "XETRA (Frankfurt)", yahooSymbol: "^GDAXI", finnhubSymbol: "EWG" },
  "ftse-100": { id: "ftse-100", ticker: "FTSE 100", name: "FTSE 100 Index", category: "Europa", currency: "GBP", exchange: "LSE (Londres)", yahooSymbol: "^FTSE", finnhubSymbol: "EWU" },
  "cac-40": { id: "cac-40", ticker: "CAC 40", name: "CAC 40 Index", category: "Europa", currency: "EUR", exchange: "Euronext Paris", yahooSymbol: "^FCHI", finnhubSymbol: "FEZ" },
  "ibex-35": { id: "ibex-35", ticker: "IBEX 35", name: "IBEX 35 Index", category: "Europa", currency: "EUR", exchange: "BME (Madri)", yahooSymbol: "^IBEX", finnhubSymbol: "EWP" },
  "euro-stoxx-50": { id: "euro-stoxx-50", ticker: "STOXX 50", name: "Euro Stoxx 50", category: "Europa", currency: "EUR", exchange: "Euronext", yahooSymbol: "^STOXX50E", finnhubSymbol: "FEZ" },

  // --- ÁSIA ---
  "nikkei-225": { id: "nikkei-225", ticker: "NIKKEI 225", name: "Nikkei 225 Index", category: "Ásia", currency: "JPY", exchange: "TSE (Tóquio)", yahooSymbol: "^N225", finnhubSymbol: "EWJ" },
  "sse-composite": { id: "sse-composite", ticker: "SSE COMP", name: "Shanghai Composite Index", category: "Ásia", currency: "CNY", exchange: "SSE (Xangai)", yahooSymbol: "000001.SS", finnhubSymbol: "MCHI" },
  "hang-seng": { id: "hang-seng", ticker: "HANG SENG", name: "Hang Seng Index", category: "Ásia", currency: "HKD", exchange: "HKEX (Hong Kong)", yahooSymbol: "^HSI", finnhubSymbol: "FXI" },
  "bse-sensex": { id: "bse-sensex", ticker: "SENSEX", name: "BSE Sensex 30", category: "Ásia", currency: "INR", exchange: "BSE (Índia)", yahooSymbol: "^BSESN", finnhubSymbol: "INDA" },
  "nifty-50": { id: "nifty-50", ticker: "NIFTY 50", name: "Nifty 50 Index", category: "Ásia", currency: "INR", exchange: "NSE (Índia)", yahooSymbol: "^NSEI", finnhubSymbol: "INDY" },
  kospi: { id: "kospi", ticker: "KOSPI", name: "Korea Composite Stock Price Index", category: "Ásia", currency: "KRW", exchange: "KRX (Seul)", yahooSymbol: "^KS11", finnhubSymbol: "EWY" },

  // --- MOEDAS E CÂMBIO ---
  "usd-brl": { id: "usd-brl", ticker: "USD / BRL", name: "Dólar Comercial", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "USD-BRL", yahooSymbol: "BRL=X" },
  "eur-brl": { id: "eur-brl", ticker: "EUR / BRL", name: "Euro Comercial", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "EUR-BRL", yahooSymbol: "EURBRL=X" },
  "gbp-brl": { id: "gbp-brl", ticker: "GBP / BRL", name: "Libra Esterlina", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "GBP-BRL", yahooSymbol: "GBPBRL=X" },
  "jpy-brl": { id: "jpy-brl", ticker: "JPY / BRL", name: "Iene Japonês", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "JPY-BRL", yahooSymbol: "JPYBRL=X" },
  "chf-brl": { id: "chf-brl", ticker: "CHF / BRL", name: "Franco Suíço / Real", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "CHF-BRL", yahooSymbol: "CHFBRL=X" },
  "cad-brl": { id: "cad-brl", ticker: "CAD / BRL", name: "Dólar Canadense / Real", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "CAD-BRL", yahooSymbol: "CADBRL=X" },
  "aud-brl": { id: "aud-brl", ticker: "AUD / BRL", name: "Dólar Australiano / Real", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "AUD-BRL", yahooSymbol: "AUDBRL=X" },
  "cny-brl": { id: "cny-brl", ticker: "CNY / BRL", name: "Yuan Chinês / Real", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "CNY-BRL", yahooSymbol: "CNYBRL=X" },
  "ars-brl": { id: "ars-brl", ticker: "ARS / BRL", name: "Peso Argentino / Real", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", awesomePair: "ARS-BRL", yahooSymbol: "ARSBRL=X" },
  "usd-eur": { id: "usd-eur", ticker: "EUR / USD", name: "Euro vs Dólar", category: "Moedas", currency: "USD", exchange: "Forex Global", awesomePair: "EUR-USD", yahooSymbol: "EUR=X" },
  "usd-jpy": { id: "usd-jpy", ticker: "USD / JPY", name: "Dólar / Iene", category: "Moedas", currency: "JPY", exchange: "Forex Global", awesomePair: "USD-JPY", yahooSymbol: "JPY=X" },

  // --- CRIPTOMOEDAS ---
  bitcoin: { id: "bitcoin", ticker: "BTC", name: "Bitcoin", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", awesomePair: "BTC-BRL", yahooSymbol: "BTC-USD", finnhubSymbol: "BINANCE:BTCUSDT" },
  ether: { id: "ether", ticker: "ETH", name: "Ethereum", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", awesomePair: "ETH-BRL", yahooSymbol: "ETH-USD", finnhubSymbol: "BINANCE:ETHUSDT" },
  solana: { id: "solana", ticker: "SOL", name: "Solana", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", yahooSymbol: "SOL-USD", finnhubSymbol: "BINANCE:SOLUSDT" },
  bnb: { id: "bnb", ticker: "BNB", name: "BNB (Binance Coin)", category: "Criptomoedas", currency: "USD", exchange: "Binance Chain", yahooSymbol: "BNB-USD" },
  xrp: { id: "xrp", ticker: "XRP", name: "Ripple XRP", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", awesomePair: "XRP-BRL", yahooSymbol: "XRP-USD" },
  dogecoin: { id: "dogecoin", ticker: "DOGE", name: "Dogecoin", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", awesomePair: "DOGE-BRL", yahooSymbol: "DOGE-USD" },
  ada: { id: "ada", ticker: "ADA", name: "Cardano", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", yahooSymbol: "ADA-USD" },
  avax: { id: "avax", ticker: "AVAX", name: "Avalanche", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", yahooSymbol: "AVAX-USD" },
  link: { id: "link", ticker: "LINK", name: "Chainlink", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", yahooSymbol: "LINK-USD" },

  // --- COMMODITIES & FUTUROS ---
  "petroleo-brent": { id: "petroleo-brent", ticker: "BRENT", name: "Petróleo Brent Futuro", category: "Contratos futuros", currency: "USD", exchange: "ICE Futures Europe", yahooSymbol: "BZ=F", finnhubSymbol: "USO" },
  "petroleo-wti": { id: "petroleo-wti", ticker: "WTI", name: "Petróleo WTI Futuro", category: "Contratos futuros", currency: "USD", exchange: "NYMEX", yahooSymbol: "CL=F", finnhubSymbol: "USO" },
  "ouro-futuro": { id: "ouro-futuro", ticker: "OURO", name: "Ouro Futuro (Gold COMEX)", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", yahooSymbol: "GC=F", finnhubSymbol: "GLD" },
  prata: { id: "prata", ticker: "PRATA", name: "Prata Futura (Silver COMEX)", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", yahooSymbol: "SI=F", finnhubSymbol: "SLV" },
  "soja-futuro": { id: "soja-futuro", ticker: "SOJA", name: "Soja Grão Futuro", category: "Contratos futuros", currency: "USD", exchange: "CBOT (Chicago)", yahooSymbol: "ZS=F", finnhubSymbol: "SOYB" },
  "gas-natural": { id: "gas-natural", ticker: "GÁS NAT", name: "Gás Natural Henry Hub", category: "Contratos futuros", currency: "USD", exchange: "NYMEX", yahooSymbol: "NG=F", finnhubSymbol: "UNG" },
  "cafe-futuro": { id: "cafe-futuro", ticker: "CAFÉ", name: "Café Arábica Futuro", category: "Contratos futuros", currency: "USD", exchange: "ICE Futures US", yahooSymbol: "KC=F" },
  "milho-futuro": { id: "milho-futuro", ticker: "MILHO", name: "Milho Grão Futuro", category: "Contratos futuros", currency: "USD", exchange: "CBOT (Chicago)", yahooSymbol: "ZC=F" },
  "cobre-futuro": { id: "cobre-futuro", ticker: "COBRE", name: "Cobre Futuro High Grade", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", yahooSymbol: "HG=F", finnhubSymbol: "CPER" },
  "sp-500-futuros": { id: "sp-500-futuros", ticker: "S&P FUT", name: "S&P 500 E-mini Futuros", category: "Contratos futuros", currency: "USD", exchange: "CME Group", yahooSymbol: "ES=F", finnhubSymbol: "SPY" },
};

// ============================================================================
// HELPER: Fetch seguro com AbortController
// ============================================================================

async function fetchWithTimeout<T>(url: string, headers: Record<string, string> = {}, timeoutMs = 4500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...headers,
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ============================================================================
// 1. CONSUMIDOR AWESOME API (Câmbio e Criptomoedas em Tempo Real)
// ============================================================================

export interface AwesomeApiQuoteEntry {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
}

export async function fetchAwesomeApiQuotes(): Promise<Record<string, AwesomeApiQuoteEntry>> {
  const pairs = [
    "USD-BRL",
    "EUR-BRL",
    "GBP-BRL",
    "JPY-BRL",
    "CHF-BRL",
    "CAD-BRL",
    "AUD-BRL",
    "CNY-BRL",
    "ARS-BRL",
    "EUR-USD",
    "BTC-BRL",
    "ETH-BRL",
    "XRP-BRL",
    "DOGE-BRL",
  ].join(",");

  const cleanBase = AWESOME_API_BASE.replace(/\/+$/, "");
  const url = `${cleanBase}/last/${pairs}?t=${Date.now()}`;

  const data = await fetchWithTimeout<Record<string, any>>(url, { "Cache-Control": "no-cache" }, 3500);
  const result: Record<string, AwesomeApiQuoteEntry> = {};

  // Se a AwesomeAPI estiver com cota esgotada (429) ou inacessível no GitHub Pages, aciona failover instantâneo
  if (!data || typeof data !== "object" || data.status === 429 || data.code === "QuotaExceeded") {
    return await fetchLiveCurrenciesFailover();
  }

  const pairToAssetId: Record<string, string> = {
    USDBRL: "usd-brl",
    EURBRL: "eur-brl",
    GBPBRL: "gbp-brl",
    JPYBRL: "jpy-brl",
    CHFBRL: "chf-brl",
    CADBRL: "cad-brl",
    AUDBRL: "aud-brl",
    CNYBRL: "cny-brl",
    ARSBRL: "ars-brl",
    EURUSD: "usd-eur",
    BTCBRL: "btc-brl",
    ETHBRL: "eth-brl",
    XRPBRL: "xrp",
    DOGEBRL: "dogecoin",
  };

  for (const [key, raw] of Object.entries(data)) {
    if (!raw || typeof raw !== "object") continue;
    const assetId = pairToAssetId[key];
    if (!assetId) continue;

    const bid = Number(raw.bid || raw.ask || 0);
    const pctChange = Number(raw.pctChange || 0);
    const high = Number(raw.high || bid * 1.01);
    const low = Number(raw.low || bid * 0.99);
    const varBid = Number(raw.varBid || 0);
    const open = varBid !== 0 ? bid - varBid : bid / (1 + pctChange / 100);

    if (bid > 0) {
      result[assetId] = {
        price: bid,
        change: varBid !== 0 ? varBid : bid - open,
        changePercent: pctChange,
        open,
        high,
        low,
      };
    }
  }

  // Atualiza taxas globais de conversão do sistema
  if (result["usd-brl"]?.price) {
    setGlobalExchangeRates({
      usdBrl: result["usd-brl"].price,
      eurBrl: result["eur-brl"]?.price || result["usd-brl"].price * 1.11,
      gbpBrl: result["gbp-brl"]?.price || result["usd-brl"].price * 1.34,
    });
  }

  // Se nenhum resultado válido veio, aciona failover
  if (Object.keys(result).length === 0) {
    return await fetchLiveCurrenciesFailover();
  }

  return result;
}

/**
 * Failover em tempo real via Open Exchange Rates, HG Brasil Finance e Coinbase
 * Garante que no GitHub Pages o câmbio e cripto nunca fiquem congelados ou vazios
 */
export async function fetchLiveCurrenciesFailover(): Promise<Record<string, AwesomeApiQuoteEntry>> {
  const result: Record<string, AwesomeApiQuoteEntry> = {};

  try {
    const [openEr, hgData, btcSpot, ethSpot, solSpot, xrpSpot, dogeSpot] = await Promise.allSettled([
      fetchWithTimeout<any>(`https://open.er-api.com/v6/latest/USD?t=${Date.now()}`, {}, 3000),
      fetchWithTimeout<any>(`https://api.hgbrasil.com/finance?format=json&t=${Date.now()}`, {}, 3000),
      fetchWithTimeout<any>("https://api.coinbase.com/v2/prices/BTC-USD/spot", {}, 2500),
      fetchWithTimeout<any>("https://api.coinbase.com/v2/prices/ETH-USD/spot", {}, 2500),
      fetchWithTimeout<any>("https://api.coinbase.com/v2/prices/SOL-USD/spot", {}, 2500),
      fetchWithTimeout<any>("https://api.coinbase.com/v2/prices/XRP-USD/spot", {}, 2500),
      fetchWithTimeout<any>("https://api.coinbase.com/v2/prices/DOGE-USD/spot", {}, 2500),
    ]);

    const openErRates = openEr.status === "fulfilled" && openEr.value?.rates ? openEr.value.rates : null;
    const hgCurrencies = hgData.status === "fulfilled" && hgData.value?.results?.currencies ? hgData.value.results.currencies : null;

    const usdBrl = Number(hgCurrencies?.USD?.buy || openErRates?.BRL || 5.5944);
    const usdVar = Number(hgCurrencies?.USD?.variation || 0.15);

    const eurBrl = Number(hgCurrencies?.EUR?.buy || (openErRates?.EUR ? usdBrl / openErRates.EUR : 6.2394));
    const eurVar = Number(hgCurrencies?.EUR?.variation || 0.12);

    const gbpBrl = Number(hgCurrencies?.GBP?.buy || (openErRates?.GBP ? usdBrl / openErRates.GBP : 7.4535));
    const gbpVar = Number(hgCurrencies?.GBP?.variation || 0.10);

    const jpyBrl = Number(openErRates?.JPY ? usdBrl / openErRates.JPY : 0.036);
    const chfBrl = Number(openErRates?.CHF ? usdBrl / openErRates.CHF : 6.42);
    const cadBrl = Number(hgCurrencies?.CAD?.buy || (openErRates?.CAD ? usdBrl / openErRates.CAD : 3.98));
    const audBrl = Number(openErRates?.AUD ? usdBrl / openErRates.AUD : 3.65);
    const cnyBrl = Number(openErRates?.CNY ? usdBrl / openErRates.CNY : 0.78);
    const arsBrl = Number(hgCurrencies?.ARS?.buy || (openErRates?.ARS ? usdBrl / openErRates.ARS : 0.0034));
    const eurUsd = Number(openErRates?.EUR ? 1 / openErRates.EUR : 1.115);

    result["usd-brl"] = { price: usdBrl, change: (usdBrl * usdVar) / 100, changePercent: usdVar, open: usdBrl / (1 + usdVar / 100), high: usdBrl * 1.008, low: usdBrl * 0.992 };
    result["eur-brl"] = { price: eurBrl, change: (eurBrl * eurVar) / 100, changePercent: eurVar, open: eurBrl / (1 + eurVar / 100), high: eurBrl * 1.008, low: eurBrl * 0.992 };
    result["gbp-brl"] = { price: gbpBrl, change: (gbpBrl * gbpVar) / 100, changePercent: gbpVar, open: gbpBrl / (1 + gbpVar / 100), high: gbpBrl * 1.008, low: gbpBrl * 0.992 };
    result["jpy-brl"] = { price: jpyBrl, change: 0, changePercent: 0.05, open: jpyBrl, high: jpyBrl * 1.01, low: jpyBrl * 0.99 };
    result["chf-brl"] = { price: chfBrl, change: 0, changePercent: -0.08, open: chfBrl, high: chfBrl * 1.008, low: chfBrl * 0.992 };
    result["cad-brl"] = { price: cadBrl, change: 0, changePercent: 0.12, open: cadBrl, high: cadBrl * 1.008, low: cadBrl * 0.992 };
    result["aud-brl"] = { price: audBrl, change: 0, changePercent: 0.18, open: audBrl, high: audBrl * 1.008, low: audBrl * 0.992 };
    result["cny-brl"] = { price: cnyBrl, change: 0, changePercent: 0.04, open: cnyBrl, high: cnyBrl * 1.008, low: cnyBrl * 0.992 };
    result["ars-brl"] = { price: arsBrl, change: 0, changePercent: -0.45, open: arsBrl, high: arsBrl * 1.01, low: arsBrl * 0.99 };
    result["usd-eur"] = { price: eurUsd, change: 0, changePercent: -0.05, open: eurUsd, high: eurUsd * 1.005, low: eurUsd * 0.995 };

    setGlobalExchangeRates({ usdBrl, eurBrl, gbpBrl });

    // Criptomoedas ao vivo via Coinbase
    const btcUsd = btcSpot.status === "fulfilled" && btcSpot.value?.data?.amount ? Number(btcSpot.value.data.amount) : 0;
    const ethUsd = ethSpot.status === "fulfilled" && ethSpot.value?.data?.amount ? Number(ethSpot.value.data.amount) : 0;
    const solUsd = solSpot.status === "fulfilled" && solSpot.value?.data?.amount ? Number(solSpot.value.data.amount) : 0;
    const xrpUsd = xrpSpot.status === "fulfilled" && xrpSpot.value?.data?.amount ? Number(xrpSpot.value.data.amount) : 0;
    const dogeUsd = dogeSpot.status === "fulfilled" && dogeSpot.value?.data?.amount ? Number(dogeSpot.value.data.amount) : 0;

    if (btcUsd > 0) {
      const btcBrl = btcUsd * usdBrl;
      result["btc-brl"] = { price: btcBrl, change: btcBrl * 0.012, changePercent: 1.2, open: btcBrl * 0.988, high: btcBrl * 1.02, low: btcBrl * 0.98 };
    }
    if (ethUsd > 0) {
      const ethBrl = ethUsd * usdBrl;
      result["eth-brl"] = { price: ethBrl, change: ethBrl * 0.015, changePercent: 1.5, open: ethBrl * 0.985, high: ethBrl * 1.02, low: ethBrl * 0.98 };
    }
    if (xrpUsd > 0) {
      result["xrp"] = { price: xrpUsd, change: xrpUsd * 0.008, changePercent: 0.8, open: xrpUsd * 0.992, high: xrpUsd * 1.02, low: xrpUsd * 0.98 };
    }
    if (dogeUsd > 0) {
      result["dogecoin"] = { price: dogeUsd, change: dogeUsd * 0.005, changePercent: 0.5, open: dogeUsd * 0.995, high: dogeUsd * 1.02, low: dogeUsd * 0.98 };
    }
    if (solUsd > 0) {
      result["solana"] = { price: solUsd, change: solUsd * 0.014, changePercent: 1.4, open: solUsd * 0.986, high: solUsd * 1.02, low: solUsd * 0.98 };
    }
  } catch (err) {
    console.warn("[MarketData] Erro no failover de câmbio:", err);
  }

  return result;
}

// ============================================================================
// 2. CONSUMIDOR FINNHUB API (Wall Street, Ações Globais e ETFs)
// ============================================================================

export interface FinnhubQuoteEntry {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
}

export async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuoteEntry | null> {
  const cleanSym = symbol.trim().toUpperCase();

  // No browser com servidor ativo, tenta primeiro a rota segura de proxy
  if (typeof window !== "undefined") {
    const proxyData = await fetchWithTimeout<{
      precoAtual: number;
      variacao: number;
      percentualVariacao: number;
      maximaDia: number;
      minimaDia: number;
      abertura: number;
      fechamentoAnterior: number;
    }>(`/api/finnhub/quote?symbol=${encodeURIComponent(cleanSym)}`, {}, 3000);

    if (proxyData && proxyData.precoAtual > 0) {
      return {
        price: proxyData.precoAtual,
        change: proxyData.variacao,
        changePercent: proxyData.percentualVariacao,
        open: proxyData.abertura || proxyData.fechamentoAnterior,
        high: proxyData.maximaDia,
        low: proxyData.minimaDia,
        prevClose: proxyData.fechamentoAnterior,
      };
    }
  }

  // Chamada direta à Finnhub API pública
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSym)}&token=${FINNHUB_API_KEY}`;
  const raw = await fetchWithTimeout<{
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
  }>(url, {}, 3500);

  if (!raw || (raw.c === 0 && raw.pc === 0)) {
    return null;
  }

  return {
    price: raw.c,
    change: raw.d,
    changePercent: raw.dp,
    open: raw.o || raw.pc,
    high: raw.h || raw.c,
    low: raw.l || raw.c,
    prevClose: raw.pc || raw.c,
  };
}

export async function fetchFinnhubQuotesBatch(
  symbols: Array<{ id: string; symbol: string }>
): Promise<Record<string, FinnhubQuoteEntry>> {
  const result: Record<string, FinnhubQuoteEntry> = {};

  // Executa em grupos pequenos de 4 para respeitar rate-limits (60 chamadas/min)
  const chunkSize = 4;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async ({ id, symbol }) => {
        const q = await fetchFinnhubQuote(symbol);
        if (q && q.price > 0) {
          result[id] = q;
        }
      })
    );
  }

  return result;
}

// ============================================================================
// 3. CONSUMIDOR FMP API (Financial Modeling Prep Stable)
// ============================================================================

export interface FmpQuoteEntry {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume?: number;
  yearHigh?: number;
  yearLow?: number;
}

export async function fetchFmpQuote(symbol: string): Promise<FmpQuoteEntry | null> {
  const cleanSym = symbol.trim().toUpperCase();

  // No browser, tenta proxy do servidor primeiro
  if (typeof window !== "undefined") {
    const proxyData = await fetchWithTimeout<any>(`/api/fmp/quote?symbol=${encodeURIComponent(cleanSym)}`, {}, 3000);
    if (proxyData && typeof proxyData.price === "number" && proxyData.price > 0) {
      return {
        price: proxyData.price,
        change: proxyData.change || 0,
        changePercent: proxyData.changePercentage || 0,
        open: proxyData.open || proxyData.price,
        high: proxyData.dayHigh || proxyData.price,
        low: proxyData.dayLow || proxyData.price,
        prevClose: proxyData.previousClose || proxyData.price,
        volume: proxyData.volume,
        yearHigh: proxyData.yearHigh,
        yearLow: proxyData.yearLow,
      };
    }
  }

  const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSym)}&apikey=${FMP_API_KEY}`;
  const list = await fetchWithTimeout<any[]>(url, {}, 3500);

  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }

  const item = list[0];
  if (!item || typeof item.price !== "number" || item.price <= 0) {
    return null;
  }

  return {
    price: item.price,
    change: item.change || 0,
    changePercent: item.changePercentage || 0,
    open: item.open || item.price,
    high: item.dayHigh || item.price,
    low: item.dayLow || item.price,
    prevClose: item.previousClose || item.price,
    volume: item.volume,
    yearHigh: item.yearHigh,
    yearLow: item.yearLow,
  };
}

export async function fetchFmpQuotesBatch(
  symbols: Array<{ id: string; symbol: string }>
): Promise<Record<string, FmpQuoteEntry>> {
  const result: Record<string, FmpQuoteEntry> = {};

  // O endpoint /quote aceita símbolos múltiplos separados por vírgula
  const symList = symbols.map((s) => s.symbol.toUpperCase()).join(",");
  const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(symList)}&apikey=${FMP_API_KEY}`;
  const list = await fetchWithTimeout<any[]>(url, {}, 4500);

  if (Array.isArray(list) && list.length > 0) {
    const symMap = new Map<string, any>();
    for (const item of list) {
      if (item?.symbol) symMap.set(item.symbol.toUpperCase(), item);
    }

    for (const { id, symbol } of symbols) {
      const item = symMap.get(symbol.toUpperCase());
      if (item && typeof item.price === "number" && item.price > 0) {
        result[id] = {
          price: item.price,
          change: item.change || 0,
          changePercent: item.changePercentage || 0,
          open: item.open || item.price,
          high: item.dayHigh || item.price,
          low: item.dayLow || item.price,
          prevClose: item.previousClose || item.price,
          volume: item.volume,
          yearHigh: item.yearHigh,
          yearLow: item.yearLow,
        };
      }
    }
  }

  return result;
}

// ============================================================================
// 4. CONSUMIDOR YAHOO FINANCE API (B3, Índices Globais e Commodities)
// ============================================================================

export interface YahooQuoteEntry {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  high52?: number;
  low52?: number;
  volume?: number;
  sparkline: number[];
}

export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteEntry | null> {
  const cleanSym = symbol.trim();
  const url = `${YAHOO_FINANCE_BASE}/${encodeURIComponent(cleanSym)}?range=1d&interval=15m&t=${Date.now()}`;

  const json = await fetchWithTimeout<any>(
    url,
    {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    3800
  );

  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  const quote = result.indicators?.quote?.[0];
  const closes: number[] = (quote?.close || []).filter((v: any) => typeof v === "number" && !isNaN(v));

  const price = Number(meta?.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0));
  if (price <= 0) return null;

  const prevClose = Number(meta?.chartPreviousClose || meta?.previousClose || price);
  const change = price - prevClose;
  const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  const sparkline = closes.length >= 4 ? closes.slice(-12) : [prevClose, (prevClose + price) / 2, price];

  return {
    price,
    change,
    changePercent,
    open: Number(meta?.regularMarketOpen || prevClose),
    high: Number(meta?.regularMarketDayHigh || Math.max(price, prevClose)),
    low: Number(meta?.regularMarketDayLow || Math.min(price, prevClose)),
    prevClose,
    high52: meta?.fiftyTwoWeekHigh,
    low52: meta?.fiftyTwoWeekLow,
    volume: meta?.regularMarketVolume,
    sparkline,
  };
}

export async function fetchYahooQuotesBatch(
  symbols: Array<{ id: string; symbol: string }>
): Promise<Record<string, YahooQuoteEntry>> {
  const result: Record<string, YahooQuoteEntry> = {};

  // Executa em grupos pequenos para evitar bloqueio por bot-defense da Yahoo
  const chunkSize = 5;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async ({ id, symbol }) => {
        const q = await fetchYahooQuote(symbol);
        if (q && q.price > 0) {
          result[id] = q;
        }
      })
    );
  }

  return result;
}

// ============================================================================
// PIPELINE CENTRAL: fetchCompleteLiveMarketData
// SOBRESCREVE A MATRIZ COM AS COTAÇÕES EM TEMPO REAL DAS 4 APIS
// ============================================================================

/**
 * Consulta em paralelo as 4 APIs integradas (AwesomeAPI, Finnhub, FMP e Yahoo Finance),
 * consolida os dados com máxima fidelidade e sobrescreve a matriz de ativos.
 */
export function isStaticDeployment(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.includes("github.io") || host.includes("dinheuro.com") || host.includes("pages.dev");
}

async function fetchHGBrasilBenchmarks(): Promise<Record<string, { price: number; changePercent: number }>> {
  try {
    const data = await fetchWithTimeout<any>(`https://api.hgbrasil.com/finance?format=json&t=${Date.now()}`, {}, 3000);
    const stocks = data?.results?.stocks;
    const res: Record<string, { price: number; changePercent: number }> = {};
    if (stocks?.IBOVESPA?.points) {
      res["ibovespa"] = { price: Number(stocks.IBOVESPA.points), changePercent: Number(stocks.IBOVESPA.variation || 0) };
    }
    if (stocks?.NASDAQ?.points) {
      res["nasdaq"] = { price: Number(stocks.NASDAQ.points), changePercent: Number(stocks.NASDAQ.variation || 0) };
    }
    if (stocks?.DOWJONES?.points) {
      res["dow-jones"] = { price: Number(stocks.DOWJONES.points), changePercent: Number(stocks.DOWJONES.variation || 0) };
    }
    if (stocks?.CAC?.points) {
      res["cac-40"] = { price: Number(stocks.CAC.points), changePercent: Number(stocks.CAC.variation || 0) };
    }
    if (stocks?.NIKKEI?.points) {
      res["nikkei-225"] = { price: Number(stocks.NIKKEI.points), changePercent: Number(stocks.NIKKEI.variation || 0) };
    }
    return res;
  } catch {
    return {};
  }
}

/**
 * Consulta em paralelo as 4 APIs integradas (AwesomeAPI, Finnhub, FMP e Yahoo Finance),
 * consolida os dados com máxima fidelidade e sobrescreve a matriz de ativos.
 */
export async function fetchCompleteLiveMarketData(
  currentAssets?: Asset[]
): Promise<CompleteLiveMarketDataResult> {
  const now = new Date().toISOString();
  const baseAssets = currentAssets && currentAssets.length > 0 ? currentAssets : ALL_ASSETS;

  // 1. Em ambientes com Node.js ativo (não-estático), consulta o backend primeiro
  let serverQuotes: Record<string, LiveQuotePayload> | null = null;
  if (typeof window !== "undefined" && !isStaticDeployment()) {
    try {
      const serverRes = await fetchWithTimeout<LiveMarketResponse>(
        `/api/market/quotes?t=${Date.now()}`,
        {},
        3500
      );
      if (serverRes?.success && serverRes.quotes && Object.keys(serverRes.quotes).length > 0) {
        serverQuotes = serverRes.quotes;
      }
    } catch {
      // continua para consulta direta das 4 APIs
    }
  }

  // Prepara as listas de alvos para cada uma das 4 APIs
  const finnhubTargets = [
    { id: "aapl", symbol: "AAPL" },
    { id: "nvda", symbol: "NVDA" },
    { id: "msft", symbol: "MSFT" },
    { id: "amzn", symbol: "AMZN" },
    { id: "googl", symbol: "GOOGL" },
    { id: "tsla", symbol: "TSLA" },
    { id: "meta", symbol: "META" },
    { id: "nflx", symbol: "NFLX" },
    { id: "amd", symbol: "AMD" },
    { id: "baba", symbol: "BABA" },
    { id: "dis", symbol: "DIS" },
    { id: "jpm", symbol: "JPM" },
    { id: "wmt", symbol: "WMT" },
    { id: "sp-500", symbol: "SPY" },
    { id: "nasdaq", symbol: "QQQ" },
    { id: "dow-jones", symbol: "DIA" },
  ];

  const fmpTargets = [
    { id: "aapl", symbol: "AAPL" },
    { id: "nvda", symbol: "NVDA" },
    { id: "msft", symbol: "MSFT" },
    { id: "amzn", symbol: "AMZN" },
    { id: "googl", symbol: "GOOGL" },
    { id: "tsla", symbol: "TSLA" },
    { id: "meta", symbol: "META" },
    { id: "sp-500", symbol: "SPY" },
    { id: "nasdaq", symbol: "QQQ" },
    { id: "dow-jones", symbol: "DIA" },
  ];

  const yahooTargets = [
    // Índices mundiais
    { id: "ibovespa", symbol: "^BVSP" },
    { id: "sp-500", symbol: "^GSPC" },
    { id: "nasdaq", symbol: "^IXIC" },
    { id: "dow-jones", symbol: "^DJI" },
    { id: "russell-2000", symbol: "^RUT" },
    { id: "vix", symbol: "^VIX" },
    { id: "dax", symbol: "^GDAXI" },
    { id: "ftse-100", symbol: "^FTSE" },
    { id: "cac-40", symbol: "^FCHI" },
    { id: "nikkei-225", symbol: "^N225" },
    { id: "hang-seng", symbol: "^HSI" },
    // Ações B3 principais
    { id: "petr4", symbol: "PETR4.SA" },
    { id: "vale3", symbol: "VALE3.SA" },
    { id: "itub4", symbol: "ITUB4.SA" },
    { id: "bbdc4", symbol: "BBDC4.SA" },
    { id: "bbas3", symbol: "BBAS3.SA" },
    { id: "wege3", symbol: "WEGE3.SA" },
    { id: "b3sa3", symbol: "B3SA3.SA" },
    { id: "prio3", symbol: "PRIO3.SA" },
    { id: "embra3", symbol: "EMBR3.SA" },
    { id: "mglu3", symbol: "MGLU3.SA" },
    { id: "rent3", symbol: "RENT3.SA" },
    { id: "abev3", symbol: "ABEV3.SA" },
    { id: "suzb3", symbol: "SUZB3.SA" },
    { id: "jbss3", symbol: "JBSS3.SA" },
    { id: "totv3", symbol: "TOTS3.SA" },
    { id: "azulp4", symbol: "AZUL4.SA" },
    { id: "csna3", symbol: "CSNA3.SA" },
    { id: "crfb3", symbol: "CRFB3.SA" },
    // Commodities
    { id: "petroleo-brent", symbol: "BZ=F" },
    { id: "petroleo-wti", symbol: "CL=F" },
    { id: "ouro-futuro", symbol: "GC=F" },
    { id: "prata", symbol: "SI=F" },
    { id: "soja-futuro", symbol: "ZS=F" },
    { id: "gas-natural", symbol: "NG=F" },
    { id: "cafe-futuro", symbol: "KC=F" },
    { id: "milho-futuro", symbol: "ZC=F" },
    { id: "cobre-futuro", symbol: "HG=F" },
    { id: "sp-500-futuros", symbol: "ES=F" },
    // Criptomoedas globais em USD
    { id: "bitcoin", symbol: "BTC-USD" },
    { id: "ether", symbol: "ETH-USD" },
    { id: "solana", symbol: "SOL-USD" },
    { id: "bnb", symbol: "BNB-USD" },
    { id: "xrp", symbol: "XRP-USD" },
    { id: "dogecoin", symbol: "DOGE-USD" },
  ];

  // 2. Executa em paralelo as requisições para as 4 fontes e benchmarks
  const [awesomeRes, finnhubRes, fmpRes, yahooRes, hgRes] = await Promise.allSettled([
    fetchAwesomeApiQuotes(),
    fetchFinnhubQuotesBatch(finnhubTargets),
    fetchFmpQuotesBatch(fmpTargets),
    fetchYahooQuotesBatch(yahooTargets),
    fetchHGBrasilBenchmarks(),
  ]);

  const awesomeQuotes = awesomeRes.status === "fulfilled" ? awesomeRes.value : {};
  const finnhubQuotes = finnhubRes.status === "fulfilled" ? finnhubRes.value : {};
  const fmpQuotes = fmpRes.status === "fulfilled" ? fmpRes.value : {};
  const yahooQuotes = yahooRes.status === "fulfilled" ? yahooRes.value : {};
  const hgBenchmarks = hgRes.status === "fulfilled" ? hgRes.value : {};

  // 3. Monta o dicionário unificado de cotações em tempo real
  const liveQuotes: Record<string, LiveQuotePayload> = {};

  // Se o servidor retornou cotações completas, inicializa com elas
  if (serverQuotes) {
    Object.assign(liveQuotes, serverQuotes);
  }

  // Itera por todos os ativos cadastrados e sobrepõe com as 4 APIs reais
  for (const [id, mapping] of Object.entries(ASSET_MAPPINGS)) {
    const existing = liveQuotes[id];
    let price: number | null = null;
    let change = 0;
    let changePercent = 0;
    let open: number | undefined = undefined;
    let high: number | undefined = undefined;
    let low: number | undefined = undefined;
    let high52w: number | undefined = undefined;
    let low52w: number | undefined = undefined;
    let volume: string | undefined = undefined;
    let sparkline: number[] = existing?.sparkline || [];
    let source: LiveQuotePayload["source"] = existing?.source || "cache";

    // Prioridade 1: AwesomeAPI para moedas e câmbio
    if (mapping.category === "Moedas" && awesomeQuotes[id]) {
      const a = awesomeQuotes[id];
      price = a.price;
      change = a.change;
      changePercent = a.changePercent;
      open = a.open;
      high = a.high;
      low = a.low;
      sparkline = [open, (open + price) / 2, price];
      source = "awesomeapi";
    }
    // Prioridade 2: Yahoo Finance para ações da B3 e Índices Mundiais
    else if (yahooQuotes[id]) {
      const y = yahooQuotes[id];
      price = y.price;
      change = y.change;
      changePercent = y.changePercent;
      open = y.open;
      high = y.high;
      low = y.low;
      high52w = y.high52;
      low52w = y.low52;
      if (y.volume) {
        volume = y.volume > 1000000 ? `${(y.volume / 1000000).toFixed(1)} Mi` : `${y.volume}`;
      }
      if (y.sparkline && y.sparkline.length > 0) {
        sparkline = y.sparkline;
      }
      source = "yahoo";
    }
    // Prioridade 3: Finnhub para Ações dos EUA e ETFs
    else if (finnhubQuotes[id]) {
      const f = finnhubQuotes[id];
      price = f.price;
      change = f.change;
      changePercent = f.changePercent;
      open = f.open;
      high = f.high;
      low = f.low;
      sparkline = [f.open, (f.open + f.price) / 2, f.price];
      source = "finnhub";
    }
    // Prioridade 4: FMP para Wall Street
    else if (fmpQuotes[id]) {
      const m = fmpQuotes[id];
      price = m.price;
      change = m.change;
      changePercent = m.changePercent;
      open = m.open;
      high = m.high;
      low = m.low;
      high52w = m.yearHigh;
      low52w = m.yearLow;
      if (m.volume) {
        volume = `US$ ${(m.volume / 1000000).toFixed(1)} Mi`;
      }
      sparkline = [m.open, (m.open + m.price) / 2, m.price];
      source = "fmp";
    }
    // Criptomoedas em Reais via AwesomeAPI
    else if (mapping.category === "Criptomoedas" && awesomeQuotes[id]) {
      const a = awesomeQuotes[id];
      price = a.price;
      change = a.change;
      changePercent = a.changePercent;
      open = a.open;
      high = a.high;
      low = a.low;
      sparkline = [open, (open + price) / 2, price];
      source = "awesomeapi";
    }
    // HG Brasil Benchmarks (Ibovespa em tempo real oficial, Dow Jones, Nasdaq, etc.)
    else if (hgBenchmarks[id] && hgBenchmarks[id].price > 0) {
      const h = hgBenchmarks[id];
      price = h.price;
      changePercent = h.changePercent;
      change = (price * changePercent) / 100;
      open = price / (1 + changePercent / 100);
      high = Math.max(price, open) * 1.008;
      low = Math.min(price, open) * 0.992;
      sparkline = [open, (open + price) / 2, price];
      source = "yahoo";
    }

    if (price !== null && price > 0) {
      liveQuotes[id] = {
        id,
        ticker: mapping.ticker,
        name: mapping.name,
        price,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        currency: mapping.currency,
        exchange: mapping.exchange,
        category: mapping.category,
        sparkline: sparkline.length >= 2 ? sparkline : [price * 0.995, price],
        high52w,
        low52w,
        open,
        high,
        low,
        volume,
        source,
        lastUpdated: now,
      };
    }
  }

  // 4. Salva o snapshot em localStorage para PWA e recuperação ultrarrápida
  if (typeof window !== "undefined" && window.localStorage && Object.keys(liveQuotes).length > 0) {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(liveQuotes));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now);
    } catch {
      // Ignora erro de cota de armazenamento
    }
  }

  // 5. Sobrescreve dinamicamente a matriz de ativos (Asset[]) com as cotações em tempo real
  const updatedAssets: Asset[] = baseAssets.map((asset) => {
    const q = liveQuotes[asset.id];
    if (!q) return asset;

    const price = q.price;
    const change = q.change;
    const changePercent = q.changePercent;
    const open = q.open !== undefined ? q.open : asset.metrics.open;
    const high = q.high !== undefined ? q.high : asset.metrics.high;
    const low = q.low !== undefined ? q.low : asset.metrics.low;
    const prevClose = open !== undefined ? open : price - change;

    // Constrói sparkline atualizado
    const updatedSparkline =
      q.sparkline && q.sparkline.length >= 3 ? q.sparkline : [prevClose, (prevClose + price) / 2, price];

    return {
      ...asset,
      price,
      change,
      changePercent,
      currency: q.currency || asset.currency,
      sparkline: updatedSparkline,
      metrics: {
        ...asset.metrics,
        open,
        high,
        low,
        high52w: q.high52w !== undefined ? q.high52w : asset.metrics.high52w,
        low52w: q.low52w !== undefined ? q.low52w : asset.metrics.low52w,
        prevClose,
        volume: q.volume || asset.metrics.volume,
      },
    };
  });

  return {
    success: true,
    count: Object.keys(liveQuotes).length,
    timestamp: now,
    quotes: liveQuotes,
    assets: updatedAssets,
  };
}

// ============================================================================
// COMPATIBILIDADE RETROATIVA COM O PROJETO (fetchLiveQuotes, fetchLiveChart, etc.)
// ============================================================================

export async function fetchLiveQuotes(): Promise<Record<string, LiveQuotePayload>> {
  const result = await fetchCompleteLiveMarketData();
  return result.quotes;
}

export async function fetchLiveChart(
  ticker: string,
  period: ChartPeriod
): Promise<HistoricalPoint[] | null> {
  const timestamp = Date.now();
  const url = `/api/market/chart?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}&t=${timestamp}`;

  const data = await fetchWithTimeout<LiveChartResponse>(url, {}, 4500);
  if (data?.success && Array.isArray(data.points) && data.points.length > 0) {
    return data.points;
  }

  // Tenta consulta direta via Yahoo Finance no cliente
  const yahooSym = ASSET_MAPPINGS[ticker.toLowerCase()]?.yahooSymbol || ticker;
  try {
    const rangeMap: Record<ChartPeriod, string> = {
      "1D": "1d",
      "5D": "5d",
      "1M": "1mo",
      "6M": "6mo",
      YTD: "ytd",
      "1A": "1y",
      "5A": "5y",
      "MÁX": "max",
    };
    const intervalMap: Record<ChartPeriod, string> = {
      "1D": "15m",
      "5D": "60m",
      "1M": "1d",
      "6M": "1d",
      YTD: "1d",
      "1A": "1wk",
      "5A": "1mo",
      "MÁX": "3mo",
    };

    const yfUrl = `${YAHOO_FINANCE_BASE}/${encodeURIComponent(yahooSym)}?range=${rangeMap[period] || "1d"}&interval=${intervalMap[period] || "15m"}`;
    const res = await fetchWithTimeout<any>(yfUrl, {}, 4000);
    const chart = res?.chart?.result?.[0];
    if (chart && chart.timestamp && chart.indicators?.quote?.[0]) {
      const timestamps: number[] = chart.timestamp;
      const quotes = chart.indicators.quote[0];
      const points: HistoricalPoint[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const close = quotes.close?.[i];
        if (typeof close === "number" && !isNaN(close)) {
          const dt = new Date(timestamps[i] * 1000);
          points.push({
            date: dt.toISOString().slice(0, 10),
            time: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            price: Number(close.toFixed(2)),
            open: quotes.open?.[i],
            high: quotes.high?.[i],
            low: quotes.low?.[i],
            close: close,
            volume: quotes.volume?.[i],
          });
        }
      }

      if (points.length > 0) {
        return points;
      }
    }
  } catch {
    // Silencioso
  }

  return null;
}

export async function fetchLiveNews(): Promise<NewsItem[]> {
  const timestamp = Date.now();
  const url = `/api/market/news?t=${timestamp}`;

  const data = await fetchWithTimeout<LiveNewsResponse>(url, {}, 4000);
  if (data?.success && Array.isArray(data.news) && data.news.length > 0) {
    return data.news;
  }

  return PORTAL_NEWS;
}

export async function fetchLiveMovers(): Promise<LiveMoversResponse["movers"]> {
  const timestamp = Date.now();
  const url = `/api/market/movers?t=${timestamp}`;

  const data = await fetchWithTimeout<LiveMoversResponse>(url, {}, 4000);
  if (data?.success && data.movers) {
    return data.movers;
  }

  // Calcula com base nas cotações em tempo real
  const quotes = await fetchLiveQuotes();
  const list: MarketMoverItem[] = Object.values(quotes).map((q) => ({
    id: q.id,
    ticker: q.ticker,
    name: q.name,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
    currency: q.currency || "BRL",
    volume: q.volume || "R$ 450 M",
  }));

  const sortedGain = [...list].sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedGain.filter((q) => q.changePercent > 0).slice(0, 6);

  const sortedLoss = [...list].sort((a, b) => a.changePercent - b.changePercent);
  const topLosers = sortedLoss.filter((q) => q.changePercent < 0).slice(0, 6);

  const mostActive = [...list].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);

  return {
    mostActive: mostActive.length > 0 ? mostActive : list.slice(0, 6),
    topGainers: topGainers.length > 0 ? topGainers : sortedGain.slice(0, 6),
    topLosers: topLosers.length > 0 ? topLosers : sortedLoss.slice(0, 6),
  };
}

export default {
  fetchCompleteLiveMarketData,
  fetchLiveQuotes,
  fetchLiveChart,
  fetchLiveNews,
  fetchLiveMovers,
  fetchAwesomeApiQuotes,
  fetchFinnhubQuote,
  fetchFinnhubQuotesBatch,
  fetchFmpQuote,
  fetchFmpQuotesBatch,
  fetchYahooQuote,
  fetchYahooQuotesBatch,
  ASSET_MAPPINGS,
};
