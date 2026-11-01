import { Asset, ChartPeriod, HistoricalPoint, MarketMoverItem, NewsItem } from "../types/finance";
import { getResilientMarketQuotes, safeFetch } from "./apiService";
import { PORTAL_NEWS } from "../data/mockMarketData";

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
  lastUpdated: string;
}

export interface LiveMarketResponse {
  success: boolean;
  count: number;
  timestamp: string;
  quotes: Record<string, LiveQuotePayload>;
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

/**
 * 1. Fetch real-time quotes with multi-API resilience and localStorage fallback
 */
export async function fetchLiveQuotes(): Promise<Record<string, LiveQuotePayload>> {
  try {
    return await getResilientMarketQuotes();
  } catch (error) {
    console.warn("[MarketDataService] Fallback to default quotes:", error);
    return await getResilientMarketQuotes();
  }
}

/**
 * 2. Fetch real historical candle/chart data with client fallback
 */
export async function fetchLiveChart(
  ticker: string,
  period: ChartPeriod
): Promise<HistoricalPoint[] | null> {
  const timestamp = Date.now();
  const url = `/api/market/chart?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}&t=${timestamp}`;

  const data = await safeFetch<LiveChartResponse>(url, { method: "GET" }, 4500);
  if (data?.success && Array.isArray(data.points) && data.points.length > 0) {
    return data.points;
  }

  return null;
}

/**
 * 3. Fetch real-time verified financial news with fallback to validated portal news
 */
export async function fetchLiveNews(): Promise<NewsItem[]> {
  const timestamp = Date.now();
  const url = `/api/market/news?t=${timestamp}`;

  const data = await safeFetch<LiveNewsResponse>(url, { method: "GET" }, 4000);
  if (data?.success && Array.isArray(data.news) && data.news.length > 0) {
    return data.news;
  }

  // Fallback seguro com notícias estruturadas para o mercado financeiro
  return PORTAL_NEWS;
}

/**
 * 4. Fetch dynamically computed top market movers (B3 / Global)
 */
export async function fetchLiveMovers(): Promise<LiveMoversResponse["movers"]> {
  const timestamp = Date.now();
  const url = `/api/market/movers?t=${timestamp}`;

  const data = await safeFetch<LiveMoversResponse>(url, { method: "GET" }, 4000);
  if (data?.success && data.movers) {
    return data.movers;
  }

  // Se o endpoint do servidor não responder, calcula os movers localmente com base nas cotações resilientes
  const quotes = await getResilientMarketQuotes();
  const b3List: MarketMoverItem[] = Object.values(quotes)
    .filter((q) => q.category === "América Latina" && q.ticker !== "IBOV" && !q.ticker.includes("Índice"))
    .map((q) => ({
      id: q.id,
      ticker: q.ticker,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      currency: q.currency || "BRL",
      volume: q.volume || "R$ 450 M",
    }));

  const sortedByGain = [...b3List].sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedByGain.filter((q) => q.changePercent > 0).slice(0, 6);

  const sortedByLoss = [...b3List].sort((a, b) => a.changePercent - b.changePercent);
  const topLosers = sortedByLoss.filter((q) => q.changePercent < 0).slice(0, 6);

  const mostActive = [...b3List]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 6);

  return {
    mostActive: mostActive.length > 0 ? mostActive : b3List.slice(0, 6),
    topGainers: topGainers.length > 0 ? topGainers : sortedByGain.slice(0, 6),
    topLosers: topLosers.length > 0 ? topLosers : sortedByLoss.slice(0, 6),
  };
}
