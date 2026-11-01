export type RegionalTab =
  | "EUA"
  | "Europa"
  | "Ásia"
  | "América Latina"
  | "Moedas"
  | "Criptomoedas"
  | "Contratos futuros";

export type ChartPeriod = "1D" | "5D" | "1M" | "6M" | "YTD" | "1A" | "5A" | "MÁX";
export type ChartDisplayType = "area" | "line" | "candle";

export interface ChartAnnotation {
  time: string;
  label: string;
  type: "open" | "event" | "close" | "high" | "low";
  price: number;
}

export interface HistoricalPoint {
  time: string;
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  benchmarkPrice?: number;
}

export interface AssetMetrics {
  open: number;
  high: number;
  low: number;
  high52w: number;
  low52w: number;
  prevClose: number;
  volume: string;
  peRatio?: string;
  dividendYield?: string;
  marketCap?: string;
  beta?: string;
  avgVolume?: string;
}

export interface InstitutionalProfile {
  description: string;
  sector: string;
  industry?: string;
  headquarters: string;
  ceo?: string;
  employees?: string;
  founded?: string;
  websiteUrl: string;
  websiteLabel: string;
  exchange: string;
  currency: string;
}

export type AssetSector =
  | "Tech"
  | "Energy"
  | "Crypto"
  | "Finance"
  | "Materials"
  | "Industry"
  | "Consumer"
  | "Utilities"
  | "Commodities"
  | "Forex"
  | "Indices"
  | string;

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  category: RegionalTab;
  sector?: AssetSector;
  tags?: string[];
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  sparkline: number[];
  historical: Record<ChartPeriod, HistoricalPoint[]>;
  annotations?: Record<string, ChartAnnotation[]>;
  metrics: AssetMetrics;
  profile: InstitutionalProfile;
  relatedAssetIds: string[];
}

export interface MarketMoverItem {
  id: string;
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
  currency: string;
  volume: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url?: string;
  imageUrl?: string;
  category: string;
  relatedTickers?: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

export interface AIAccordionTopic {
  id: string;
  title: string;
  summary: string;
  detailedContext: string;
  impactTag: string;
  trend: "bullish" | "bearish" | "neutral";
  region: RegionalTab;
}

export interface PortfolioPosition {
  id: string;
  assetId: string;
  ticker: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  purchaseDate?: string;
  currentPrice?: number;
  currency?: string;
  averagePrice?: number;
  dateAdded?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  assetIds: string[];
}
