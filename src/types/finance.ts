export type RegionalTab =
  | "América Latina"
  | "Day Trade & Scalping"
  | "Fluxo & Tape Reading"
  | "Renda Fixa & Derivativos"
  | "EUA"
  | "Europa"
  | "Ásia"
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

export type EventImpact = "high" | "medium" | "low";
export type EconomicEventCategory =
  | "interest_rate"
  | "inflation"
  | "employment"
  | "gdp"
  | "central_bank"
  | "pmi";

export interface EconomicEvent {
  id: string;
  title: string;
  country: "BR" | "US" | "EU" | "GB" | "JP" | "CN";
  countryName: string;
  flag: string;
  category: EconomicEventCategory;
  categoryLabel: string;
  date: string; // ISO Date YYYY-MM-DD
  time: string; // HH:mm (horário de Brasília)
  datetime: string; // ISO full timestamp
  impact: EventImpact;
  forecast?: string;
  previous?: string;
  actual?: string;
  unit?: string;
  status: "scheduled" | "released" | "in_progress";
  description: string;
  consensus: string;
  importanceReason: string;
  affectedTickers?: string[];
}

// ==================== DAY TRADE & TAPE READING ====================

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "STOP";
export type TradingMode = "SIMULATED" | "REAL";

export interface DayTradePosition {
  id: string;
  ticker: string;
  name: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: string;
  unrealizedPL: number; // in asset currency
  unrealizedPLBRL: number;
  unrealizedPLUSD: number;
  unrealizedPLPercent: number;
  currency: string;
}

export interface DayTradeOrder {
  id: string;
  ticker: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: "FILLED" | "PENDING" | "CANCELLED" | "REJECTED";
  timestamp: string;
  executedPrice?: number;
  pnl?: number; // realized PnL in BRL
}

export interface DOMLevel {
  price: number;
  bidQty: number;
  bidOrders: number;
  askQty: number;
  askOrders: number;
  totalVolume: number;
  isLastPrice?: boolean;
}

export interface TimesAndTradesItem {
  id: string;
  time: string;
  price: number;
  quantity: number;
  aggressor: "BUY" | "SELL" | "DIRECT";
  buyerBroker: string;
  sellerBroker: string;
}

export interface BrokerRankingItem {
  broker: string;
  buyVolume: number;
  sellVolume: number;
  netBalance: number;
  averagePrice: number;
  sharePercent: number;
}

export interface DayTradeRiskSettings {
  dailyGainTarget: number; // Meta de Ganho Diária em R$
  dailyLossLimit: number; // Limite de Perda Diária em R$ (Trava)
  maxLossPerTrade: number; // Stop Máximo por Operação em R$
  maxQuantityPerOrder: number; // Lotes máximos
  autoLockOnLossLimit: boolean; // Bloquear envio de ordens ao atingir loss
  autoLockOnGainTarget: boolean; // Travar lucro ao atingir meta de gain
  cutoffTime: string; // "17:50"
  isLocked: boolean; // Flag de bloqueio ativo
  lockedReason?: string;
}

export interface DayTradeAccountSummary {
  mode: TradingMode;
  initialBalance: number;
  balance: number;
  equity: number;
  realizedPLDay: number;
  unrealizedPL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
}

