import React, { useState, useMemo } from "react";
import { Asset } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { BarChart2, Search, TrendingUp, TrendingDown } from "lucide-react";

type MarketCategory = "AÇÕES" | "FUTUROS" | "FOREX" | "CRIPTO" | "BDRs";

interface MarketRealTimeWatchlistProps {
  assets: Asset[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export const MarketRealTimeWatchlist: React.FC<MarketRealTimeWatchlistProps> = ({
  assets,
  selectedTicker,
  onSelectTicker,
}) => {
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("AÇÕES");
  const [searchQuery, setSearchQuery] = useState("");

  // Categorize available assets
  const categorizedAssets = useMemo(() => {
    return assets.filter((a) => {
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
                  onClick={() => onSelectTicker(a.ticker)}
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

                  {/* Price */}
                  <td className="py-0.5 px-1.5 text-right font-bold text-[#e6edf3] whitespace-nowrap">
                    {formatAssetDisplayPrice(a.price, a.currency)}
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
