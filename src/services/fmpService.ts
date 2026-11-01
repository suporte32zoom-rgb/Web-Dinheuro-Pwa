/**
 * DinhEuro Finanças - Serviço Financial Modeling Prep (FMP)
 * Suporte a cotações em tempo real, perfil corporativo, DRE (demonstrações financeiras) e busca.
 * Inclui cache em memória, circuit breaker para HTTP 429 e failover silencioso.
 */

const DEFAULT_FMP_KEY = "GJaGtHdggEtpz6erXjYrSNchdFk8FJwm";

export const FMP_API_KEY =
  (typeof process !== "undefined" && process?.env?.FMP_API_KEY) ||
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_FMP_API_KEY) ||
  DEFAULT_FMP_KEY;

export const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50?: number;
  priceAvg200?: number;
  exchange: string;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface FMPCompanyProfile {
  symbol: string;
  price: number;
  marketCap: number;
  beta?: number;
  lastDividend?: number;
  range?: string;
  change?: number;
  changePercentage?: number;
  volume?: number;
  averageVolume?: number;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeFullName?: string;
  industry?: string;
  website?: string;
  description?: string;
  ceo?: string;
  sector?: string;
  country?: string;
  fullTimeEmployees?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  image?: string;
  ipoDate?: string;
  isActivelyTrading?: boolean;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fiscalYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingExpenses?: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted?: number;
}

export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency?: string;
  stockExchange?: string;
  exchangeShortName?: string;
}

// In-memory cache to prevent 429 quota exhaustion
const tsClientQuoteCache = new Map<string, { data: FMPQuote; timestamp: number }>();
const tsClientProfileCache = new Map<string, { data: FMPCompanyProfile; timestamp: number }>();
const tsClientFinancialsCache = new Map<string, { data: FMPIncomeStatement[]; timestamp: number }>();
let tsClientCooldownUntil = 0;

/**
 * 1. Busca cotação em tempo real via FMP com proxy backend, cache e proteção 429
 */
export async function obterCotacaoFMP(symbol: string): Promise<FMPQuote | null> {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  const cached = tsClientQuoteCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 60000) {
    return cached.data;
  }

  if (now < tsClientCooldownUntil) {
    return cached?.data || null;
  }

  // No browser, usa proxy local para evitar CORS, ocultar credenciais e usar cache do servidor
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/quote?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.price === "number") {
          tsClientQuoteCache.set(cleanSymbol, { data: data as FMPQuote, timestamp: now });
          return data as FMPQuote;
        }
      } else if (res.status === 429) {
        tsClientCooldownUntil = now + 120000;
        return cached?.data || null;
      }
    } catch {
      // continua para fallback silencioso
    }
  }

  const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      tsClientCooldownUntil = now + 120000;
      console.warn(`[FMP] Rate limit de cotação ativado para ${cleanSymbol}. Usando dados resilientes.`);
      return cached?.data || null;
    }

    if (!res.ok) return cached?.data || null;

    const data = await res.json();
    const quote = Array.isArray(data) && data.length > 0 ? (data[0] as FMPQuote) : null;
    if (quote) {
      tsClientQuoteCache.set(cleanSymbol, { data: quote, timestamp: now });
    }
    return quote;
  } catch (error: any) {
    console.warn(`[FMP] Conexão alternativa acionada para ${cleanSymbol}`);
    return cached?.data || null;
  }
}

/**
 * 2. Busca perfil institucional da empresa via FMP com cache e tolerância a falhas
 */
export async function obterPerfilFMP(symbol: string): Promise<FMPCompanyProfile | null> {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  const cached = tsClientProfileCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (now < tsClientCooldownUntil) {
    return cached?.data || null;
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/profile?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.companyName) {
          tsClientProfileCache.set(cleanSymbol, { data: data as FMPCompanyProfile, timestamp: now });
          return data as FMPCompanyProfile;
        }
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FMP_BASE_URL}/profile?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      tsClientCooldownUntil = now + 120000;
      return cached?.data || null;
    }

    if (!res.ok) return cached?.data || null;

    const data = await res.json();
    const profile = Array.isArray(data) && data.length > 0 ? (data[0] as FMPCompanyProfile) : null;
    if (profile) {
      tsClientProfileCache.set(cleanSymbol, { data: profile, timestamp: now });
    }
    return profile;
  } catch {
    return cached?.data || null;
  }
}

/**
 * 3. Busca demonstração de resultados (DRE / Income Statement) via FMP
 */
export async function obterDemonstracaoResultadosFMP(
  symbol: string
): Promise<FMPIncomeStatement[] | null> {
  if (!symbol) return null;
  const cleanSymbol = symbol.trim().toUpperCase();
  const now = Date.now();

  const cached = tsClientFinancialsCache.get(cleanSymbol);
  if (cached && now - cached.timestamp < 300000) {
    return cached.data;
  }

  if (now < tsClientCooldownUntil) {
    return cached?.data || null;
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/financials?symbol=${encodeURIComponent(cleanSymbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          tsClientFinancialsCache.set(cleanSymbol, { data: data as FMPIncomeStatement[], timestamp: now });
          return data as FMPIncomeStatement[];
        }
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FMP_BASE_URL}/income-statement?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 429) {
      tsClientCooldownUntil = now + 120000;
      return cached?.data || null;
    }

    if (!res.ok) return cached?.data || null;

    const data = await res.json();
    const financials = Array.isArray(data) ? (data as FMPIncomeStatement[]) : null;
    if (financials) {
      tsClientFinancialsCache.set(cleanSymbol, { data: financials, timestamp: now });
    }
    return financials;
  } catch {
    return cached?.data || null;
  }
}

/**
 * 4. Pesquisa de símbolos / empresas via FMP
 */
export async function buscarAtivosFMP(query: string): Promise<FMPSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/fmp/search?query=${encodeURIComponent(cleanQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data as FMPSearchResult[];
      }
    } catch {
      // continua para fallback
    }
  }

  const url = `${FMP_BASE_URL}/search-symbol?query=${encodeURIComponent(cleanQuery)}&apikey=${FMP_API_KEY}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? (data as FMPSearchResult[]) : [];
  } catch {
    return [];
  }
}
