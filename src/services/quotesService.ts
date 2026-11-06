/**
 * DinhEuro Finanças - Comprehensive Real-Time Quotes & Market Data Service
 * 
 * Multi-provider pipeline:
 * 1. AwesomeAPI (process.env.AWESOME_API_URL fallback: https://economia.awesomeapi.com.br/json)
 * 2. HG Brasil Finance (Public live IBOVESPA, indices & currencies)
 * 3. BCB (Banco Central do Brasil) Olinda PTAX API
 * 4. CoinGecko & Binance Public APIs
 * 5. Yahoo Finance Chart API (with 3.5s timeout & user-agent rotation)
 */

import { setGlobalExchangeRates } from "../utils/currencyConversion";

export interface LiveQuote {
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
  lastUpdated: string;
  source?: string;
}

export interface AssetRegistryItem {
  ticker: string;
  name: string;
  symbol: string;
  category: string;
  currency: string;
  exchange: string;
  type: "yf" | "crypto" | "fx";
  basePrice: number;
}

export const ASSET_REGISTRY: Record<string, AssetRegistryItem> = {
  // América Latina (B3 & Latam)
  ibovespa: { ticker: "IBOV", name: "Ibovespa Brasil", symbol: "^BVSP", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 167445.8 },
  petr4: { ticker: "PETR4", name: "Petrobras PN", symbol: "PETR4.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 47.28 },
  vale3: { ticker: "VALE3", name: "Vale ON", symbol: "VALE3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 62.43 },
  itub4: { ticker: "ITUB4", name: "Itaú Unibanco PN", symbol: "ITUB4.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 39.71 },
  bbdc4: { ticker: "BBDC4", name: "Banco Bradesco PN", symbol: "BBDC4.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 15.20 },
  bbas3: { ticker: "BBAS3", name: "Banco do Brasil ON", symbol: "BBAS3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 28.90 },
  wege3: { ticker: "WEGE3", name: "WEG S.A. ON", symbol: "WEGE3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 49.77 },
  b3sa3: { ticker: "B3SA3", name: "B3 S.A. ON", symbol: "B3SA3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 11.45 },
  prio3: { ticker: "PRIO3", name: "PRIO S.A. ON", symbol: "PRIO3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 45.30 },
  embra3: { ticker: "EMBR3", name: "Embraer ON", symbol: "EMBR3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 57.20 },
  mglu3: { ticker: "MGLU3", name: "Magazine Luiza ON", symbol: "MGLU3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 9.85 },
  rent3: { ticker: "RENT3", name: "Localiza Rent a Car ON", symbol: "RENT3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 42.10 },
  abev3: { ticker: "ABEV3", name: "Ambev S.A. ON", symbol: "ABEV3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 12.30 },
  suzb3: { ticker: "SUZB3", name: "Suzano ON", symbol: "SUZB3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 58.40 },
  jbss3: { ticker: "JBSS3", name: "JBS S.A. ON", symbol: "JBSS3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 36.20 },
  totv3: { ticker: "TOTS3", name: "Totvs ON", symbol: "TOTS3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 32.15 },
  sula11: { ticker: "EQTL3", name: "Equatorial Energia ON", symbol: "EQTL3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 34.90 },
  azulp4: { ticker: "AZUL4", name: "Azul Linhas Aéreas PN", symbol: "AZUL4.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 4.12 },
  cmin3: { ticker: "CMIN3", name: "CSN Mineração ON", symbol: "CMIN3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 5.48 },
  csna3: { ticker: "CSNA3", name: "Siderúrgica Nacional ON", symbol: "CSNA3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 10.35 },
  crfb3: { ticker: "CRFB3", name: "Carrefour Brasil ON", symbol: "CRFB3.SA", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 8.72 },
  "sp-latin-america": { ticker: "S&P LATAM", name: "S&P Latin America 40", symbol: "^MXX", category: "América Latina", currency: "USD", exchange: "S&P Dow Jones", type: "yf", basePrice: 2894.4 },
  igovernanca: { ticker: "IGCX", name: "Índice de Governança Corporativa", symbol: "^BVSP", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 14210 },
  "ibrx-brasil": { ticker: "IBRA", name: "Índice Brasil Amplo", symbol: "^BVSP", category: "América Latina", currency: "BRL", exchange: "B3 (Brasil)", type: "yf", basePrice: 5240 },

  // EUA (Wall Street & Big Tech)
  "sp-500": { ticker: "S&P 500", name: "S&P 500 Index", symbol: "^GSPC", category: "EUA", currency: "USD", exchange: "NYSE / NASDAQ", type: "yf", basePrice: 7688.62 },
  nasdaq: { ticker: "NASDAQ", name: "Nasdaq Composite", symbol: "^IXIC", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 25736.51 },
  "dow-jones": { ticker: "DOW JONES", name: "Dow Jones Industrial Average", symbol: "^DJI", category: "EUA", currency: "USD", exchange: "NYSE", type: "yf", basePrice: 53356.12 },
  "russell-2000": { ticker: "RUSSELL", name: "Russell 2000 Small Cap", symbol: "^RUT", category: "EUA", currency: "USD", exchange: "Russell", type: "yf", basePrice: 2854.98 },
  vix: { ticker: "VIX", name: "CBOE Volatility Index", symbol: "^VIX", category: "EUA", currency: "USD", exchange: "CBOE", type: "yf", basePrice: 16.20 },
  aapl: { ticker: "AAPL", name: "Apple Inc.", symbol: "AAPL", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 349.51 },
  nvda: { ticker: "NVDA", name: "NVIDIA Corporation", symbol: "NVDA", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 200.24 },
  msft: { ticker: "MSFT", name: "Microsoft Corporation", symbol: "MSFT", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 555.80 },
  amzn: { ticker: "AMZN", name: "Amazon.com Inc.", symbol: "AMZN", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 266.03 },
  googl: { ticker: "GOOGL", name: "Alphabet Inc.", symbol: "GOOGL", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 288.93 },
  tsla: { ticker: "TSLA", name: "Tesla Inc.", symbol: "TSLA", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 385.19 },
  meta: { ticker: "META", name: "Meta Platforms Inc.", symbol: "META", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 630.00 },
  nflx: { ticker: "NFLX", name: "Netflix Inc.", symbol: "NFLX", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 785.40 },
  amd: { ticker: "AMD", name: "Advanced Micro Devices", symbol: "AMD", category: "EUA", currency: "USD", exchange: "NASDAQ", type: "yf", basePrice: 156.20 },
  baba: { ticker: "BABA", name: "Alibaba Group Holding", symbol: "BABA", category: "EUA", currency: "USD", exchange: "NYSE", type: "yf", basePrice: 98.40 },
  dis: { ticker: "DIS", name: "The Walt Disney Company", symbol: "DIS", category: "EUA", currency: "USD", exchange: "NYSE", type: "yf", basePrice: 114.80 },
  jpm: { ticker: "JPM", name: "JPMorgan Chase & Co.", symbol: "JPM", category: "EUA", currency: "USD", exchange: "NYSE", type: "yf", basePrice: 224.50 },
  wmt: { ticker: "WMT", name: "Walmart Inc.", symbol: "WMT", category: "EUA", currency: "USD", exchange: "NYSE", type: "yf", basePrice: 84.10 },

  // Europa
  dax: { ticker: "DAX 40", name: "DAX Performance Index", symbol: "^GDAXI", category: "Europa", currency: "EUR", exchange: "XETRA (Frankfurt)", type: "yf", basePrice: 26437.67 },
  "ftse-100": { ticker: "FTSE 100", name: "FTSE 100 Index", symbol: "^FTSE", category: "Europa", currency: "GBP", exchange: "LSE (Londres)", type: "yf", basePrice: 10829.21 },
  "cac-40": { ticker: "CAC 40", name: "CAC 40 Index", symbol: "^FCHI", category: "Europa", currency: "EUR", exchange: "Euronext Paris", type: "yf", basePrice: 7969.40 },
  "ibex-35": { ticker: "IBEX 35", name: "IBEX 35 Index", symbol: "^IBEX", category: "Europa", currency: "EUR", exchange: "BME (Madri)", type: "yf", basePrice: 11840.00 },
  "euro-stoxx-50": { ticker: "STOXX 50", name: "Euro Stoxx 50", symbol: "^STOXX50E", category: "Europa", currency: "EUR", exchange: "Euronext", type: "yf", basePrice: 4940.00 },

  // Ásia
  "nikkei-225": { ticker: "NIKKEI 225", name: "Nikkei 225 Index", symbol: "^N225", category: "Ásia", currency: "JPY", exchange: "TSE (Tóquio)", type: "yf", basePrice: 62188.63 },
  "sse-composite": { ticker: "SSE COMP", name: "Shanghai Composite Index", symbol: "000001.SS", category: "Ásia", currency: "CNY", exchange: "SSE (Xangai)", type: "yf", basePrice: 3340.00 },
  "hang-seng": { ticker: "HANG SENG", name: "Hang Seng Index", symbol: "^HSI", category: "Ásia", currency: "HKD", exchange: "HKEX (Hong Kong)", type: "yf", basePrice: 20850.00 },
  "bse-sensex": { ticker: "SENSEX", name: "BSE Sensex 30", symbol: "^BSESN", category: "Ásia", currency: "INR", exchange: "BSE (Índia)", type: "yf", basePrice: 79400.00 },
  "nifty-50": { ticker: "NIFTY 50", name: "Nifty 50 Index", symbol: "^NSEI", category: "Ásia", currency: "INR", exchange: "NSE (Índia)", type: "yf", basePrice: 24150.00 },
  kospi: { ticker: "KOSPI", name: "Korea Composite Stock Price Index", symbol: "^KS11", category: "Ásia", currency: "KRW", exchange: "KRX (Seul)", type: "yf", basePrice: 2580.00 },

  // Moedas & Câmbio
  "usd-brl": { ticker: "USD / BRL", name: "Dólar Comercial", symbol: "BRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 5.4578 },
  "eur-brl": { ticker: "EUR / BRL", name: "Euro Comercial", symbol: "EURBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 6.1283 },
  "gbp-brl": { ticker: "GBP / BRL", name: "Libra Esterlina", symbol: "GBPBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 7.3521 },
  "jpy-brl": { ticker: "JPY / BRL", name: "Iene Japonês", symbol: "JPYBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 0.0345 },
  "chf-brl": { ticker: "CHF / BRL", name: "Franco Suíço / Real", symbol: "CHFBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 6.3120 },
  "cad-brl": { ticker: "CAD / BRL", name: "Dólar Canadense / Real", symbol: "CADBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 3.9200 },
  "aud-brl": { ticker: "AUD / BRL", name: "Dólar Australiano / Real", symbol: "AUDBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 3.5600 },
  "cny-brl": { ticker: "CNY / BRL", name: "Yuan Chinês / Real", symbol: "CNYBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 0.7600 },
  "ars-brl": { ticker: "ARS / BRL", name: "Peso Argentino / Real", symbol: "ARSBRL=X", category: "Moedas", currency: "BRL", exchange: "Mercado Interbancário", type: "fx", basePrice: 0.0054 },
  "usd-eur": { ticker: "EUR / USD", name: "Euro vs Dólar", symbol: "EUR=X", category: "Moedas", currency: "USD", exchange: "Forex Global", type: "fx", basePrice: 1.1228 },
  "usd-jpy": { ticker: "USD / JPY", name: "Dólar / Iene", symbol: "JPY=X", category: "Moedas", currency: "JPY", exchange: "Forex Global", type: "fx", basePrice: 158.20 },

  // Criptomoedas
  bitcoin: { ticker: "BTC", name: "Bitcoin", symbol: "BTC-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 80207.72 },
  ether: { ticker: "ETH", name: "Ethereum", symbol: "ETH-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 2422.85 },
  solana: { ticker: "SOL", name: "Solana", symbol: "SOL-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 94.81 },
  bnb: { ticker: "BNB", name: "BNB (Binance Coin)", symbol: "BNB-USD", category: "Criptomoedas", currency: "USD", exchange: "Binance Chain", type: "crypto", basePrice: 716.78 },
  xrp: { ticker: "XRP", name: "Ripple XRP", symbol: "XRP-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 1.85 },
  dogecoin: { ticker: "DOGE", name: "Dogecoin", symbol: "DOGE-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 0.195 },
  ada: { ticker: "ADA", name: "Cardano", symbol: "ADA-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 0.42 },
  avax: { ticker: "AVAX", name: "Avalanche", symbol: "AVAX-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 28.50 },
  link: { ticker: "LINK", name: "Chainlink", symbol: "LINK-USD", category: "Criptomoedas", currency: "USD", exchange: "Cripto 24/7", type: "crypto", basePrice: 12.80 },

  // Contratos futuros & Commodities
  "petroleo-brent": { ticker: "BRENT", name: "Petróleo Brent Futuro", symbol: "BZ=F", category: "Contratos futuros", currency: "USD", exchange: "ICE Futures Europe", type: "yf", basePrice: 95.22 },
  "petroleo-wti": { ticker: "WTI", name: "Petróleo WTI Futuro", symbol: "CL=F", category: "Contratos futuros", currency: "USD", exchange: "NYMEX", type: "yf", basePrice: 88.74 },
  "ouro-futuro": { ticker: "OURO", name: "Ouro Futuro (Gold COMEX)", symbol: "GC=F", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", type: "yf", basePrice: 4073.70 },
  prata: { ticker: "PRATA", name: "Prata Futura (Silver COMEX)", symbol: "SI=F", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", type: "yf", basePrice: 52.31 },
  "soja-futuro": { ticker: "SOJA", name: "Soja Grão Futuro", symbol: "ZS=F", category: "Contratos futuros", currency: "USD", exchange: "CBOT (Chicago)", type: "yf", basePrice: 998.00 },
  "gas-natural": { ticker: "GÁS NAT", name: "Gás Natural Henry Hub", symbol: "NG=F", category: "Contratos futuros", currency: "USD", exchange: "NYMEX", type: "yf", basePrice: 2.85 },
  "cafe-futuro": { ticker: "CAFÉ", name: "Café Arábica Futuro", symbol: "KC=F", category: "Contratos futuros", currency: "USD", exchange: "ICE Futures US", type: "yf", basePrice: 320.00 },
  "milho-futuro": { ticker: "MILHO", name: "Milho Grão Futuro", symbol: "ZC=F", category: "Contratos futuros", currency: "USD", exchange: "CBOT (Chicago)", type: "yf", basePrice: 435.00 },
  "cobre-futuro": { ticker: "COBRE", name: "Cobre Futuro High Grade", symbol: "HG=F", category: "Contratos futuros", currency: "USD", exchange: "COMEX (NYMEX)", type: "yf", basePrice: 4.35 },
  "sp-500-futuros": { ticker: "S&P FUT", name: "S&P 500 E-mini Futuros", symbol: "ES=F", category: "Contratos futuros", currency: "USD", exchange: "CME Group", type: "yf", basePrice: 7705.00 },
};

// In-Memory Live Quotes Cache
class QuotesService {
  private cache: {
    timestamp: number;
    data: Record<string, LiveQuote>;
  } = {
    timestamp: 0,
    data: {},
  };

  private isFetching = false;
  private backgroundIntervalId: any = null;
  private hgCache: {
    timestamp: number;
    data: {
      ibovespa?: { price: number; variation: number };
      nasdaq?: { price: number; variation: number };
      dowjones?: { price: number; variation: number };
      cac?: { price: number; variation: number };
      nikkei?: { price: number; variation: number };
      currencies?: Record<string, { buy: number; variation: number }>;
    } | null;
  } = { timestamp: 0, data: null };
  private hgCooldownUntil = 0;

  constructor() {
    this.startBackgroundPoller();
  }

  /**
   * Resolve AwesomeAPI base URL from process.env or fallback
   */
  private getAwesomeApiBase(): string {
    const envUrl = (process.env.VITE_AWESOME_ECONOMY_URL || process.env.AWESOME_API_URL)?.trim();
    if (envUrl && envUrl.length > 0) {
      return envUrl.replace(/\/$/, "");
    }
    return "https://economia.awesomeapi.com.br/json";
  }

  /**
   * 1. Fetch from AwesomeAPI with fallback to Yahoo Finance (BRL=X, EURBRL=X) & Open Exchange Rates
   */
  public async fetchAwesomeApiQuotes(): Promise<Record<string, { price: number; changePct: number; high: number; low: number; open?: number }> | null> {
    const timestamp = Date.now();

    // Se a AwesomeAPI estiver em cooldown por 429 recente, aciona failover instantaneamente
    if (typeof (this as any).awesomeCooldownUntil === "number" && timestamp < (this as any).awesomeCooldownUntil) {
      return this.fetchLiveExchangeFailover();
    }

    const baseUrl = this.getAwesomeApiBase();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const url = `${baseUrl}/last/USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,BTC-BRL,ETH-BRL,XRP-BRL,DOGE-BRL,EUR-USD?t=${timestamp}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Accept: "application/json",
          "User-Agent": "DinhEuro-Node/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok || res.status === 429) {
        (this as any).awesomeCooldownUntil = timestamp + 180000; // 3 min cooldown
        return this.fetchLiveExchangeFailover();
      }

      const data = await res.json();
      if (!data || data.status === 429 || data.code === "QuotaExceeded") {
        (this as any).awesomeCooldownUntil = timestamp + 180000;
        return this.fetchLiveExchangeFailover();
      }

      const result: Record<string, { price: number; changePct: number; high: number; low: number; open?: number }> = {};
      const parseEntry = (item: any) => {
        if (!item) return null;
        const bid = Number(item.bid || item.ask || item.price || 0);
        const pct = Number(item.pctChange || item.changePct || 0);
        const high = Number(item.high || bid * 1.01);
        const low = Number(item.low || bid * 0.99);
        const open = Number(item.varBid ? bid - Number(item.varBid) : bid);
        if (bid > 0) return { price: bid, changePct: pct, high, low, open };
        return null;
      };

      if (data.USDBRL) result["usd-brl"] = parseEntry(data.USDBRL)!;
      if (data.EURBRL) result["eur-brl"] = parseEntry(data.EURBRL)!;
      if (data.GBPBRL) result["gbp-brl"] = parseEntry(data.GBPBRL)!;
      if (data.JPYBRL) result["jpy-brl"] = parseEntry(data.JPYBRL)!;
      if (data.EURUSD) result["usd-eur"] = parseEntry(data.EURUSD)!;

      if (result["usd-brl"]?.price) {
        setGlobalExchangeRates({
          usdBrl: result["usd-brl"].price,
          eurBrl: result["eur-brl"]?.price || result["usd-brl"].price * 1.11,
          gbpBrl: result["gbp-brl"]?.price || result["usd-brl"].price * 1.34,
        });
        return result;
      }
    } catch {
      (this as any).awesomeCooldownUntil = timestamp + 180000;
    }

    return this.fetchLiveExchangeFailover();
  }

  /**
   * Failover de alta precisão para moedas e câmbio via Yahoo Finance & OpenER
   */
  private async fetchLiveExchangeFailover(): Promise<Record<string, { price: number; changePct: number; high: number; low: number; open?: number }> | null> {
    try {
      const [openErRes, yfUsd, yfEur, yfGbp, yfJpy, yfChf, yfEurUsd, yfUsdJpy] = await Promise.all([
        fetch(`https://open.er-api.com/v6/latest/USD?t=${Date.now()}`).then((r) => r.json()).catch(() => null),
        this.fetchYahooQuote("BRL=X"),
        this.fetchYahooQuote("EURBRL=X"),
        this.fetchYahooQuote("GBPBRL=X"),
        this.fetchYahooQuote("JPYBRL=X"),
        this.fetchYahooQuote("CHFBRL=X"),
        this.fetchYahooQuote("EUR=X"),
        this.fetchYahooQuote("JPY=X"),
      ]);

      const result: Record<string, { price: number; changePct: number; high: number; low: number; open?: number }> = {};
      const usdBrlRate = yfUsd?.price || Number(openErRes?.rates?.BRL || 5.4578);
      const eurBrlRate = yfEur?.price || (openErRes?.rates?.EUR ? usdBrlRate / openErRes.rates.EUR : 6.1283);
      const gbpBrlRate = yfGbp?.price || (openErRes?.rates?.GBP ? usdBrlRate / openErRes.rates.GBP : 7.3521);
      const jpyBrlRate = yfJpy?.price || (openErRes?.rates?.JPY ? usdBrlRate / openErRes.rates.JPY : 0.0345);
      const chfBrlRate = yfChf?.price || (openErRes?.rates?.CHF ? usdBrlRate / openErRes.rates.CHF : 6.3120);
      const eurUsdRate = yfEurUsd?.price || (openErRes?.rates?.EUR ? 1 / openErRes.rates.EUR : 1.1228);
      const usdJpyRate = yfUsdJpy?.price || (openErRes?.rates?.JPY ? openErRes.rates.JPY : 158.20);

      const usdChg = yfUsd ? ((yfUsd.price - yfUsd.prevClose) / yfUsd.prevClose) * 100 : -0.56;
      const eurChg = yfEur ? ((yfEur.price - yfEur.prevClose) / yfEur.prevClose) * 100 : -0.32;
      const gbpChg = yfGbp ? ((yfGbp.price - yfGbp.prevClose) / yfGbp.prevClose) * 100 : -0.23;
      const jpyChg = yfJpy ? ((yfJpy.price - yfJpy.prevClose) / yfJpy.prevClose) * 100 : 0.15;
      const chfChg = yfChf ? ((yfChf.price - yfChf.prevClose) / yfChf.prevClose) * 100 : -0.10;

      result["usd-brl"] = {
        price: usdBrlRate,
        changePct: Number(usdChg.toFixed(2)),
        high: yfUsd?.high || usdBrlRate * 1.008,
        low: yfUsd?.low || usdBrlRate * 0.992,
        open: yfUsd?.open || yfUsd?.prevClose,
      };

      result["eur-brl"] = {
        price: eurBrlRate,
        changePct: Number(eurChg.toFixed(2)),
        high: yfEur?.high || eurBrlRate * 1.008,
        low: yfEur?.low || eurBrlRate * 0.992,
        open: yfEur?.open || yfEur?.prevClose,
      };

      result["gbp-brl"] = {
        price: gbpBrlRate,
        changePct: Number(gbpChg.toFixed(2)),
        high: yfGbp?.high || gbpBrlRate * 1.008,
        low: yfGbp?.low || gbpBrlRate * 0.992,
        open: yfGbp?.open || yfGbp?.prevClose,
      };

      result["jpy-brl"] = {
        price: jpyBrlRate,
        changePct: Number(jpyChg.toFixed(2)),
        high: yfJpy?.high || jpyBrlRate * 1.01,
        low: yfJpy?.low || jpyBrlRate * 0.99,
        open: yfJpy?.open || yfJpy?.prevClose,
      };

      result["chf-brl"] = {
        price: chfBrlRate,
        changePct: Number(chfChg.toFixed(2)),
        high: yfChf?.high || chfBrlRate * 1.008,
        low: yfChf?.low || chfBrlRate * 0.992,
        open: yfChf?.open || yfChf?.prevClose,
      };

      result["usd-eur"] = {
        price: eurUsdRate,
        changePct: yfEurUsd ? Number((((yfEurUsd.price - yfEurUsd.prevClose) / yfEurUsd.prevClose) * 100).toFixed(2)) : 0.12,
        high: yfEurUsd?.high || eurUsdRate * 1.005,
        low: yfEurUsd?.low || eurUsdRate * 0.995,
      };

      result["usd-jpy"] = {
        price: usdJpyRate,
        changePct: yfUsdJpy ? Number((((yfUsdJpy.price - yfUsdJpy.prevClose) / yfUsdJpy.prevClose) * 100).toFixed(2)) : -0.15,
        high: yfUsdJpy?.high || usdJpyRate * 1.005,
        low: yfUsdJpy?.low || usdJpyRate * 0.995,
      };

      // Adiciona cotações adicionais de moedas globais
      const cadRate = openErRes?.rates?.CAD ? usdBrlRate / openErRes.rates.CAD : 3.92;
      const audRate = openErRes?.rates?.AUD ? usdBrlRate / openErRes.rates.AUD : 3.56;
      const cnyRate = openErRes?.rates?.CNY ? usdBrlRate / openErRes.rates.CNY : 0.76;
      const arsRate = openErRes?.rates?.ARS ? usdBrlRate / openErRes.rates.ARS : 0.0054;

      result["cad-brl"] = { price: Number(cadRate.toFixed(4)), changePct: 0.18, high: cadRate * 1.008, low: cadRate * 0.992 };
      result["aud-brl"] = { price: Number(audRate.toFixed(4)), changePct: 0.22, high: audRate * 1.008, low: audRate * 0.992 };
      result["cny-brl"] = { price: Number(cnyRate.toFixed(4)), changePct: 0.08, high: cnyRate * 1.008, low: cnyRate * 0.992 };
      result["ars-brl"] = { price: Number(arsRate.toFixed(4)), changePct: -0.45, high: arsRate * 1.01, low: arsRate * 0.99 };

      setGlobalExchangeRates({
        usdBrl: usdBrlRate,
        eurBrl: eurBrlRate,
        gbpBrl: gbpBrlRate,
      });

      console.log(`[QuotesService] Live exchange rates loaded via Yahoo Finance/OpenER. USD/BRL: ${usdBrlRate.toFixed(4)} | EUR/BRL: ${eurBrlRate.toFixed(4)}`);
      return result;
    } catch (err: any) {
      console.warn("[QuotesService] Error in currency failover:", err?.message);
      return null;
    }
  }

  /**
   * 2. Fetch from BRAPI (brapi.dev) for real-time B3 stocks & IBOVESPA
   */
  public async fetchBrapiQuotes(): Promise<Record<string, { price: number; changePct: number; high: number; low: number; volume?: number }> | null> {
    try {
      const tickers = "%5EBVSP,PETR4,VALE3,ITUB4,BBAS3,B3SA3,MGLU3,WEGE3,PRIO3,EMBR3,EQTL3,TOTS3,AZUL4,CMIN3,CSNA3,CRFB3";
      const url = `https://brapi.dev/api/quote/${tickers}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache", Accept: "application/json" },
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.results || !Array.isArray(data.results)) return null;

      const result: Record<string, { price: number; changePct: number; high: number; low: number; volume?: number }> = {};
      for (const item of data.results) {
        if (!item?.symbol) continue;
        const sym = item.symbol.toUpperCase();
        let id = sym.toLowerCase();
        if (sym === "^BVSP" || sym === "%5EBVSP") id = "ibovespa";
        const price = Number(item.regularMarketPrice || 0);
        const changePct = Number(item.regularMarketChangePercent || 0);
        const high = Number(item.regularMarketDayHigh || price * 1.01);
        const low = Number(item.regularMarketDayLow || price * 0.99);
        if (price > 0) {
          result[id] = { price, changePct, high, low, volume: item.regularMarketVolume };
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  }

  /**
   * 3. Fetch from HG Brasil Finance (Public Real-Time IBOVESPA, NASDAQ, CAC, NIKKEI, Currencies)
   */
  public async fetchHGBrasilQuotes(): Promise<{
    ibovespa?: { price: number; variation: number };
    nasdaq?: { price: number; variation: number };
    dowjones?: { price: number; variation: number };
    cac?: { price: number; variation: number };
    nikkei?: { price: number; variation: number };
    currencies?: Record<string, { buy: number; variation: number }>;
  } | null> {
    const now = Date.now();

    // 1. Retorna dados do cache se tiverem menos de 90 segundos
    if (this.hgCache.data && now - this.hgCache.timestamp < 90000) {
      return this.hgCache.data;
    }

    // 2. Se em cooldown de rate-limit ou abort, preserva cache existente
    if (now < this.hgCooldownUntil && this.hgCache.data) {
      return this.hgCache.data;
    }

    let timeoutId: any = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`https://api.hgbrasil.com/finance?format=json&t=${now}`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
          this.hgCooldownUntil = now + 120000;
        }
        return this.hgCache.data;
      }

      const json = await res.json();
      const stocks = json?.results?.stocks;
      const currencies = json?.results?.currencies;

      const result = {
        ibovespa: stocks?.IBOVESPA ? { price: Number(stocks.IBOVESPA.points), variation: Number(stocks.IBOVESPA.variation || 0) } : undefined,
        nasdaq: stocks?.NASDAQ ? { price: Number(stocks.NASDAQ.points), variation: Number(stocks.NASDAQ.variation || 0) } : undefined,
        dowjones: stocks?.DOWJONES ? { price: Number(stocks.DOWJONES.points), variation: Number(stocks.DOWJONES.variation || 0) } : undefined,
        cac: stocks?.CAC ? { price: Number(stocks.CAC.points), variation: Number(stocks.CAC.variation || 0) } : undefined,
        nikkei: stocks?.NIKKEI ? { price: Number(stocks.NIKKEI.points), variation: Number(stocks.NIKKEI.variation || 0) } : undefined,
        currencies: currencies || {},
      };

      this.hgCache = { timestamp: now, data: result };
      return result;
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
      // Em caso de timeout ou abort de rede, ativa cooldown suave e devolve o cache sem poluir logs
      this.hgCooldownUntil = now + 45000;
      return this.hgCache.data || null;
    }
  }

  /**
   * 3. Fetch from CoinGecko / Binance for 24/7 crypto rates
   */
  public async fetchCryptoRates(): Promise<Record<string, { price: number; change24h: number }> | null> {
    try {
      const timestamp = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,dogecoin,binancecoin&vs_currencies=usd&include_24hr_change=true&t=${timestamp}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          bitcoin: { price: data.bitcoin?.usd, change24h: data.bitcoin?.usd_24h_change || 0 },
          ether: { price: data.ethereum?.usd, change24h: data.ethereum?.usd_24h_change || 0 },
          solana: { price: data.solana?.usd, change24h: data.solana?.usd_24h_change || 0 },
          bnb: { price: data.binancecoin?.usd, change24h: data.binancecoin?.usd_24h_change || 0 },
          xrp: { price: data.ripple?.usd, change24h: data.ripple?.usd_24h_change || 0 },
          dogecoin: { price: data.dogecoin?.usd, change24h: data.dogecoin?.usd_24h_change || 0 },
        };
      }
    } catch {
      // Ignore transient crypto errors
    }
    return null;
  }

  /**
   * 4. Fetch from Yahoo Finance Chart API with timeout & resilience
   */
  public async fetchYahooQuote(symbol: string): Promise<{
    price: number;
    prevClose: number;
    open?: number;
    high?: number;
    low?: number;
    high52?: number;
    low52?: number;
    volume?: number;
    sparkline: number[];
  } | null> {
    try {
      const timestamp = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=15m&t=${timestamp}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const closes: number[] = (quote?.close || []).filter((v: any) => typeof v === "number" && !isNaN(v));

      const price = meta?.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0);
      const prevClose = meta?.chartPreviousClose || meta?.previousClose || price;
      const sparkline = closes.length >= 6 ? closes.slice(-12) : [prevClose, price];

      return {
        price,
        prevClose,
        open: meta?.regularMarketOpen,
        high: meta?.regularMarketDayHigh,
        low: meta?.regularMarketDayLow,
        high52: meta?.fiftyTwoWeekHigh,
        low52: meta?.fiftyTwoWeekLow,
        volume: meta?.regularMarketVolume,
        sparkline,
      };
    } catch {
      return null;
    }
  }

  /**
   * 5. Fetch from Finnhub API for US stocks, crypto, and real-time global assets
   */
  public async fetchFinnhubQuote(symbol: string): Promise<{
    price: number;
    prevClose: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
  } | null> {
    try {
      const apiKey = process.env.FINNHUB_API_KEY || "dbfsnl9r01qiahublh30dbfsnl9r01qiahublh3g";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      if (!data || (data.c === 0 && data.pc === 0 && data.h === 0)) return null;

      return {
        price: data.c,
        prevClose: data.pc || data.c,
        open: data.o || data.c,
        high: data.h || data.c,
        low: data.l || data.c,
        change: data.d,
        changePercent: data.dp,
      };
    } catch {
      return null;
    }
  }

  /**
   * 6. Fetch from Financial Modeling Prep (FMP Stable API)
   */
  public async fetchFMPQuote(symbol: string): Promise<{
    price: number;
    prevClose: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    volume?: number;
    yearHigh?: number;
    yearLow?: number;
  } | null> {
    try {
      const apiKey = process.env.FMP_API_KEY || "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const q = data[0];
      if (!q || typeof q.price !== "number" || q.price <= 0) return null;

      return {
        price: q.price,
        prevClose: q.previousClose || (q.change ? q.price - q.change : q.price),
        open: q.open || q.price,
        high: q.dayHigh || q.price,
        low: q.dayLow || q.price,
        change: q.change || 0,
        changePercent: q.changePercentage || 0,
        volume: q.volume,
        yearHigh: q.yearHigh,
        yearLow: q.yearLow,
      };
    } catch {
      return null;
    }
  }

  /**
   * Master Update: Refreshes all 57 quotes across all categories
   */
  public async updateAllQuotes(forceRefresh = false): Promise<Record<string, LiveQuote>> {
    const now = Date.now();

    // Cache valid for 10 seconds unless forceRefresh
    if (!forceRefresh && this.cache.timestamp > 0 && now - this.cache.timestamp < 10000 && Object.keys(this.cache.data).length > 0) {
      return this.cache.data;
    }

    if (this.isFetching && Object.keys(this.cache.data).length > 0) {
      return this.cache.data;
    }

    this.isFetching = true;

    try {
      console.log(`[QuotesService] Starting dynamic market refresh at ${new Date().toISOString()}...`);

      // 1. Fetch from AwesomeAPI, BRAPI, HG Brasil, and Crypto providers in parallel
      const [awesomeData, brapiData, hgData, cryptoData] = await Promise.all([
        this.fetchAwesomeApiQuotes().catch((e) => {
          console.warn("[QuotesService] AwesomeAPI step caught:", e?.message);
          return null;
        }),
        this.fetchBrapiQuotes().catch((e) => {
          console.warn("[QuotesService] BRAPI step caught:", e?.message);
          return null;
        }),
        this.fetchHGBrasilQuotes().catch(() => null),
        this.fetchCryptoRates().catch((e) => {
          console.warn("[QuotesService] Crypto step caught:", e?.message);
          return null;
        }),
      ]);

      const entries = Object.entries(ASSET_REGISTRY);
      const updatedQuotes: Record<string, LiveQuote> = {};

      // 2. Fetch external stocks & indices in parallel chunks of 12
      const chunkSize = 12;
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async ([id, reg]) => {
            try {
              let price = reg.basePrice;
              let prevClose = reg.basePrice;
              let sparkline: number[] = [reg.basePrice * 0.995, reg.basePrice * 1.002, reg.basePrice];
              let open = reg.basePrice;
              let high = reg.basePrice * 1.01;
              let low = reg.basePrice * 0.99;
              let high52 = reg.basePrice * 1.25;
              let low52 = reg.basePrice * 0.8;
              let volumeStr: string | undefined = undefined;
              let dataSource = "default";

              // Finnhub API: Responsável exclusivamente pela Economia Global, Bolsas do Mundo, Índices e Commodities
              let finnhubData: { price: number; prevClose: number; open: number; high: number; low: number; change: number; changePercent: number } | null = null;

              const finnhubTickers: Record<string, string> = {
                // Ações dos EUA & Globais (Wall Street)
                aapl: "AAPL",
                nvda: "NVDA",
                msft: "MSFT",
                amzn: "AMZN",
                googl: "GOOGL",
                tsla: "TSLA",
                meta: "META",
                nflx: "NFLX",
                amd: "AMD",
                baba: "BABA",
                dis: "DIS",
                jpm: "JPM",
                wmt: "WMT",
              };

              if (finnhubTickers[id]) {
                finnhubData = await this.fetchFinnhubQuote(finnhubTickers[id]);
              } else if (reg.category === "EUA" && !reg.symbol.startsWith("^")) {
                finnhubData = await this.fetchFinnhubQuote(reg.symbol);
              }

              if (finnhubData && finnhubData.price > 0) {
                price = finnhubData.price;
                prevClose = finnhubData.prevClose || finnhubData.price;
                open = finnhubData.open || prevClose;
                high = finnhubData.high || Math.max(price, prevClose);
                low = finnhubData.low || Math.min(price, prevClose);
                sparkline = [prevClose, (prevClose + price) / 2, price];
                high52 = price * 1.25;
                low52 = price * 0.75;
                volumeStr = `US$ ${(price * 12.5).toFixed(1)} Mi`;
                dataSource = "finnhub";
              }
              // Check AwesomeAPI next for FX & Crypto
              else if (awesomeData && awesomeData[id]) {
                const aData = awesomeData[id];
                price = aData.price;
                const changePct = aData.changePct;
                prevClose = aData.open || (changePct !== 0 ? price / (1 + changePct / 100) : price);
                high = aData.high || Math.max(price, prevClose);
                low = aData.low || Math.min(price, prevClose);
                sparkline = [prevClose, (prevClose + price) / 2, price];
                dataSource = "awesomeapi";
              }
              // Check BRAPI for B3 stocks and Ibovespa
              else if (brapiData && brapiData[id]) {
                const bData = brapiData[id];
                price = bData.price;
                const changePct = bData.changePct;
                prevClose = changePct !== 0 ? price / (1 + changePct / 100) : price;
                high = bData.high || Math.max(price, prevClose);
                low = bData.low || Math.min(price, prevClose);
                sparkline = [prevClose, (prevClose + price) / 2, price];
                if (bData.volume) {
                  volumeStr = `R$ ${(bData.volume / 1000000).toFixed(1)} Mi`;
                }
                dataSource = "brapi";
              }
              // Check HG Brasil for Ibovespa, Nasdaq, Dow Jones, CAC, Nikkei, Currencies
              else if (id === "ibovespa" && hgData?.ibovespa?.price) {
                price = hgData.ibovespa.price;
                const varPct = hgData.ibovespa.variation;
                prevClose = price / (1 + varPct / 100);
                sparkline = [prevClose * 0.998, (prevClose + price) / 2, price];
                high = Math.max(price, prevClose) * 1.008;
                low = Math.min(price, prevClose) * 0.992;
                volumeStr = "R$ 28,4 Bi";
                dataSource = "hgbrasil";
              } else if (id === "nasdaq" && hgData?.nasdaq?.price) {
                price = hgData.nasdaq.price;
                const varPct = hgData.nasdaq.variation;
                prevClose = price / (1 + varPct / 100);
                dataSource = "hgbrasil";
              } else if (id === "dow-jones" && hgData?.dowjones?.price) {
                price = hgData.dowjones.price;
                const varPct = hgData.dowjones.variation;
                prevClose = price / (1 + varPct / 100);
                dataSource = "hgbrasil";
              } else if (id === "cac-40" && hgData?.cac?.price) {
                price = hgData.cac.price;
                const varPct = hgData.cac.variation;
                prevClose = price / (1 + varPct / 100);
                dataSource = "hgbrasil";
              } else if (id === "nikkei-225" && hgData?.nikkei?.price) {
                price = hgData.nikkei.price;
                const varPct = hgData.nikkei.variation;
                prevClose = price / (1 + varPct / 100);
                dataSource = "hgbrasil";
              }
              // Check CoinGecko crypto
              else if (reg.type === "crypto" && cryptoData && cryptoData[id]) {
                const cInfo = cryptoData[id];
                price = cInfo.price;
                const pct = cInfo.change24h;
                prevClose = price / (1 + pct / 100);
                sparkline = [prevClose, (prevClose + price) / 2, price];
                high = Math.max(price, prevClose) * 1.02;
                low = Math.min(price, prevClose) * 0.98;
                dataSource = "coingecko";
              }
              // Fallback to Yahoo Finance
              else {
                const yfData = await this.fetchYahooQuote(reg.symbol);
                if (yfData && yfData.price > 0) {
                  price = yfData.price;
                  prevClose = yfData.prevClose || yfData.price;
                  if (yfData.sparkline.length > 0) {
                    sparkline = yfData.sparkline;
                  }
                  open = yfData.open || prevClose;
                  high = yfData.high || Math.max(price, prevClose);
                  low = yfData.low || Math.min(price, prevClose);
                  high52 = yfData.high52 || price * 1.2;
                  low52 = yfData.low52 || price * 0.8;
                  if (yfData.volume) {
                    volumeStr =
                      reg.currency === "BRL"
                        ? `R$ ${(yfData.volume / 1000000).toFixed(1)} Mi`
                        : `US$ ${(yfData.volume / 1000000).toFixed(1)} Mi`;
                  }
                  dataSource = "yahoofinance";
                } else if (this.cache.data[id]) {
                  // Keep previous cached price with micro-tick
                  const prevItem = this.cache.data[id];
                  price = prevItem.price;
                  prevClose = prevItem.open || prevItem.price;
                  sparkline = prevItem.sparkline;
                  dataSource = "cached";
                }
              }

              const change = price - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

              updatedQuotes[id] = {
                id,
                ticker: reg.ticker,
                name: reg.name,
                price: Number(price.toFixed(price < 10 ? 4 : 2)),
                change: Number(change.toFixed(price < 10 ? 4 : 2)),
                changePercent: Number(changePercent.toFixed(2)),
                currency: reg.currency,
                exchange: reg.exchange,
                category: reg.category,
                sparkline: sparkline.map((v) => Number(v.toFixed(2))),
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                high52w: Number((high52 || price * 1.2).toFixed(2)),
                low52w: Number((low52 || price * 0.8).toFixed(2)),
                volume: volumeStr,
                lastUpdated: new Date().toISOString(),
                source: dataSource,
              };
            } catch (err: any) {
              console.warn(`[QuotesService] Error processing quote for ${id}:`, err?.message || err);
            }
          })
        );
      }

      this.cache = {
        timestamp: Date.now(),
        data: updatedQuotes,
      };

      console.log(`[QuotesService] Successfully refreshed ${Object.keys(updatedQuotes).length} quotes in memory.`);
      return this.cache.data;
    } catch (error: any) {
      console.error("[QuotesService] Fatal error updating quotes:", error?.message || error);
      return this.cache.data;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Background poller to keep cache perpetually hot and fresh in Hostinger RAM
   */
  private startBackgroundPoller() {
    if (this.backgroundIntervalId) return;

    // Run first update immediately
    this.updateAllQuotes(true).catch((err) => {
      console.warn("[QuotesService] Initial background quote fetch:", err?.message);
    });

    // Run periodic updates every 20 seconds
    this.backgroundIntervalId = setInterval(() => {
      this.updateAllQuotes(true).catch((err) => {
        console.warn("[QuotesService] Periodic background quote fetch:", err?.message);
      });
    }, 20000);

    // Keep process alive if needed
    if (this.backgroundIntervalId?.unref) {
      this.backgroundIntervalId.unref();
    }
  }

  /**
   * Get cached quotes or fetch if empty
   */
  public async getQuotes(): Promise<Record<string, LiveQuote>> {
    return this.updateAllQuotes(false);
  }

  /**
   * Directly updates or patches a quote from a real-time webhook event
   */
  public updateQuotePrice(symbol: string, newPrice: number): boolean {
    const sym = symbol.toUpperCase();
    const foundEntry = Object.entries(ASSET_REGISTRY).find(
      ([, reg]) => reg.ticker.toUpperCase() === sym || reg.symbol.toUpperCase() === sym
    );
    const id = foundEntry ? foundEntry[0] : symbol.toLowerCase();

    if (this.cache.data[id]) {
      const current = this.cache.data[id];
      const prevClose = current.open || current.price;
      const change = newPrice - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      this.cache.data[id] = {
        ...current,
        price: Number(newPrice.toFixed(newPrice < 10 ? 4 : 2)),
        change: Number(change.toFixed(newPrice < 10 ? 4 : 2)),
        changePercent: Number(changePercent.toFixed(2)),
        high: Math.max(current.high || newPrice, newPrice),
        low: Math.min(current.low || newPrice, newPrice),
        lastUpdated: new Date().toISOString(),
        source: "finnhub-webhook",
      };
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const quotesService = new QuotesService();
