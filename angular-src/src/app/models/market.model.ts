export interface AssetQuote {
  id: string;
  ticker: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  region: 'us' | 'europe' | 'asia' | 'latam' | 'currencies' | 'crypto' | 'futures';
  sparkline: number[];
  marketCap?: string;
  volume?: string;
  high52w?: number;
  low52w?: number;
  peRatio?: number;
  dividendYield?: number;
  beta?: number;
  description?: string;
}

export interface MarketAnalysisResponse {
  success: boolean;
  region?: string;
  topic?: string;
  analysis?: string;
  sources?: string[];
  keyDrivers?: string[];
  timestamp?: string;
}

export interface PortfolioItem {
  id: string;
  assetId: string;
  ticker: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  currency: string;
  purchaseDate?: string;
}
