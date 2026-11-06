import React, { useState, useMemo } from "react";
import { Asset } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { computeDualCurrency } from "../../utils/currencyConversion";
import { BarChart2, Search, TrendingUp, TrendingDown } from "lucide-react";

type MarketCategory = "AÇÕES" | "FUTUROS" | "FOREX" | "CRIPTO" | "BDRs";

interface MarketRealTimeWatchlistProps {
  assets?: Asset[];
  selectedTicker?: string;
  onSelectTicker?: (ticker: string) => void;
  onSelectAsset?: (ticker: string) => void;
}

const DEFAULT_WATCHLIST_ASSETS: Asset[] = [
  { id: "petr4", ticker: "PETR4", name: "Petrobras PN", category: "América Latina", currency: "BRL", price: 47.12, change: 0.35, changePercent: 0.75, exchange: "B3", sparkline: [46.8, 47.0, 47.12], historical: {} as any },
  { id: "vale3", ticker: "VALE3", name: "Vale ON", category: "América Latina", currency: "BRL", price: 62.35, change: -0.42, changePercent: -0.67, exchange: "B3", sparkline: [62.9, 62.5, 62.35], historical: {} as any },
  { id: "itub4", ticker: "ITUB4", name: "Itaú Unibanco PN", category: "América Latina", currency: "BRL", price: 39.71, change: 0.18, changePercent: 0.46, exchange: "B3", sparkline: [39.4, 39.6, 39.71], historical: {} as any },
  { id: "bbas3", ticker: "BBAS3", name: "Banco do Brasil ON", category: "América Latina", currency: "BRL", price: 29.84, change: 0.22, changePercent: 0.74, exchange: "B3", sparkline: [29.5, 29.7, 29.84], historical: {} as any },
  { id: "wege3", ticker: "WEGE3", name: "WEG ON", category: "América Latina", currency: "BRL", price: 54.90, change: 0.65, changePercent: 1.20, exchange: "B3", sparkline: [54.1, 54.5, 54.9], historical: {} as any },
  { id: "win", ticker: "WIN$", name: "Mini Índice Futuro B3", category: "América Latina", currency: "BRL", price: 167548.0, change: 890, changePercent: 0.53, exchange: "B3", sparkline: [166800, 167200, 167548], historical: {} as any },
  { id: "wdo", ticker: "WDO$", name: "Mini Dólar Futuro B3", category: "América Latina", currency: "BRL", price: 5459.6, change: -12.5, changePercent: -0.23, exchange: "B3", sparkline: [5475, 5466, 5459.6], historical: {} as any },
  { id: "sp500", ticker: "S&P 500", name: "S&P 500 Futuro", category: "EUA", currency: "USD", price: 5860.5, change: 18.2, changePercent: 0.31, exchange: "CME", sparkline: [5840, 5850, 5860.5], historical: {} as any },
  { id: "usdbrl", ticker: "USD/BRL", name: "Dólar Comercial", category: "Moedas", currency: "BRL", price: 5.4397, change: -0.012, changePercent: -0.22, exchange: "FX", sparkline: [5.45, 5.44, 5.4397], historical: {} as any },
  { id: "eurbrl", ticker: "EUR/BRL", name: "Euro Comercial", category: "Moedas", currency: "BRL", price: 6.0679, change: 0.008, changePercent: 0.13, exchange: "FX", sparkline: [6.05, 6.06, 6.0679], historical: {} as any },
  { id: "btc", ticker: "BTC", name: "Bitcoin Spot", category: "Criptomoedas", currency: "USD", price: 80112.0, change: 1420, changePercent: 1.81, exchange: "Binance", sparkline: [78800, 79500, 80112], historical: {} as any },
  { id: "eth", ticker: "ETH", name: "Ethereum Spot", category: "Criptomoedas", currency: "USD", price: 2145.3, change: 35.1, changePercent: 1.66, exchange: "Binance", sparkline: [2100, 2120, 2145.3], historical: {} as any },
  { id: "nvda", ticker: "NVDA", name: "NVIDIA Corp", category: "EUA", currency: "USD", price: 200.13, change: 2.8, changePercent: 1.42, exchange: "NASDAQ", sparkline: [197, 199, 200.13], historical: {} as any },
  { id: "aapl", ticker: "AAPL", name: "Apple Inc", category: "EUA", currency: "USD", price: 228.45, change: 0.95, changePercent: 0.42, exchange: "NASDAQ", sparkline: [227, 227.8, 228.45], historical: {} as any },
] as unknown as Asset[];

export const MarketRealTimeWatchlist: React.FC<MarketRealTimeWatchlistProps> = ({
  assets = [],
  selectedTicker = "",
  onSelectTicker,
  onSelectAsset,
}) => {
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("AÇÕES");
  const [searchQuery, setSearchQuery] = useState("");

  const effectiveAssets = useMemo(() => {
    return assets && assets.length > 0 ? assets : DEFAULT_WATCHLIST_ASSETS;
  }, [assets]);

  // Categorize available assets
  const categorizedAssets = useMemo(() => {
    return (effectiveAssets || []).filter((a) => {
      const ticker = a.ticker.toUpperCase();
      const cat = (a.category || "").toUpperCase();

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      }

      if (activeCategory === "FUTUROS") {
        return (
          ticker.includes("WIN") ||
          ticker.includes("WDO") ||
          ticker.includes("IBOV") ||
          ticker.includes("SP500") ||
          ticker.includes("S&P") ||
          ticker.includes("FUT") ||
          cat.includes("FUTURO")
        );
      }
      if (activeCategory === "FOREX") {
        return (
          cat === "MOEDAS" ||
          ticker.includes("/BRL") ||
          ticker.includes("/USD") ||
          ticker.includes("USD") ||
          ticker.includes("EUR")
        );
      }
      if (activeCategory === "CRIPTO") {
        return (
          cat === "CRIPTOMOEDAS" ||
          ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"].includes(ticker)
        );
      }
      if (activeCategory === "BDRs") {
        return (
          cat === "EUA" ||
          ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "TSLA", "META"].includes(ticker)
        );
      }
      // Default: Ações (B3)
      return (
        cat === "AMÉRICA LATINA" ||
        ["PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "WEGE3", "B3SA3", "PRIO3", "EMBR3"].includes(ticker)
      );
    });
  }, [assets, activeCategory, searchQuery]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-lg overflow-hidden h-full select-none text-xs">
      {/* 1. Header with Title & Search */}
      <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-[#58a6ff]/15 text-[#58a6ff] shrink-0">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-xs text-[#e6edf3] tracking-tight">
              Mercado em Tempo Real
            </h3>
          </div>
          <span className="text-[10px] text-[#00c853] font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
            {categorizedAssets.length} ativos
          </span>
        </div>

        {/* Category Tabs: Ações | Futuros | Forex | Cripto | BDRs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none bg-[#0e1117] p-0.5 rounded-lg border border-[#21262d]">
          {(["AÇÕES", "FUTUROS", "FOREX", "CRIPTO", "BDRs"] as MarketCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
              className={`flex-1 py-0.5 px-1.5 text-center text-[10px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Compact Watchlist Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0">
        <table className="w-full text-left border-collapse font-mono tabular-nums">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9px] font-semibold uppercase tracking-wider select-none">
              <th className="py-1 px-2">Ativo</th>
              <th className="py-1 px-1.5 text-right">Último</th>
              <th className="py-1 px-2 text-right">Var %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]/30 text-[10.5px]">
            {categorizedAssets.slice(0, 30).map((a) => {
              const isSelected = selectedTicker.toUpperCase() === a.ticker.toUpperCase();
              const isPositive = a.changePercent >= 0;

              return (
                <tr
                  key={a.id}
                  onClick={() => {
                    if (onSelectTicker) onSelectTicker(a.ticker);
                    if (onSelectAsset) onSelectAsset(a.ticker);
                  }}
                  title={`Carregar ${a.ticker} no terminal`}
                  className={`hover:bg-[#21262d]/80 cursor-pointer transition-colors h-[23px] leading-tight ${
                    isSelected
                      ? "bg-[#58a6ff]/20 font-bold border-l-2 border-[#58a6ff]"
                      : ""
                  }`}
                >
                  {/* Ticker & Name */}
                  <td className="py-0.5 px-2 whitespace-nowrap overflow-hidden">
                    <span className="font-bold text-white text-[11px] block leading-tight">
                      {a.ticker}
                    </span>
                  </td>

                  {/* Price & Real-Time Dual Conversion */}
                  <td className="py-0.5 px-1.5 text-right whitespace-nowrap">
                    <span className="font-bold text-[#e6edf3] text-[10.5px] block leading-tight">
                      {formatAssetDisplayPrice(a.price, a.currency)}
                    </span>
                    <span className="text-[9px] text-[#8b949e] font-mono block leading-tight">
                      {computeDualCurrency(a.price, a.currency).convertedFormatted}
                    </span>
                  </td>

                  {/* Change % */}
                  <td className="py-0.5 px-2 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center font-bold ${
                        isPositive ? "text-[#00c853]" : "text-[#ff5252]"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {a.changePercent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
