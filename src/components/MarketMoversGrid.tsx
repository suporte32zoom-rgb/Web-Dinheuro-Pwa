import React from "react";
import { TOP_MOVERS_DATA } from "../data/mockMarketData";
import { MarketMoverItem } from "../types/finance";
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatAssetDisplayPrice } from "../utils/formatters";

interface MarketMoversGridProps {
  onSelectTicker: (ticker: string) => void;
  liveMovers?: {
    mostActive: MarketMoverItem[];
    topGainers: MarketMoverItem[];
    topLosers: MarketMoverItem[];
  } | null;
  onViewAllStocks?: () => void;
}

export const MarketMoversGrid: React.FC<MarketMoversGridProps> = ({
  onSelectTicker,
  liveMovers,
  onViewAllStocks,
}) => {
  const isLoading = !liveMovers;
  const activeItems = liveMovers?.mostActive || [];
  const gainersItems = liveMovers?.topGainers || [];
  const losersItems = liveMovers?.topLosers || [];

  const renderColumn = (
    title: string,
    subtitle: string,
    items: MarketMoverItem[],
    icon: React.ReactNode,
    type: "active" | "gainers" | "losers"
  ) => {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between shadow-md shadow-black/20">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d] mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  type === "gainers"
                    ? "bg-[#00c853]/15 text-[#00c853]"
                    : type === "losers"
                    ? "bg-[#ff5252]/15 text-[#ff5252]"
                    : "bg-[#58a6ff]/15 text-[#58a6ff]"
                }`}
              >
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#e6edf3] tracking-tight">{title}</h3>
                <p className="text-[11px] text-[#8b949e]">{subtitle}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded border border-[#00c853]/30 font-semibold">
              B3 AO VIVO
            </span>
          </div>

          {/* List of items or Skeleton Loading */}
          <div className="divide-y divide-[#21262d]/70">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 px-2 flex items-center justify-between animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-14 bg-[#21262d] rounded" />
                    <div className="h-2.5 w-24 bg-[#21262d] rounded" />
                  </div>
                  <div className="space-y-1.5 text-right flex flex-col items-end">
                    <div className="h-3.5 w-16 bg-[#21262d] rounded" />
                    <div className="h-2.5 w-12 bg-[#21262d] rounded" />
                  </div>
                </div>
              ))
            ) : (
              items.map((item) => {
              const isPositive = item.changePercent >= 0;
              return (
                <div
                  key={item.id || item.ticker}
                  onClick={() => onSelectTicker(item.ticker)}
                  className="py-2.5 px-2 rounded-xl hover:bg-[#21262d]/80 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                        {item.ticker}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] truncate max-w-[140px]" title={item.name}>
                      {item.name}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-[#e6edf3]">
                      {formatAssetDisplayPrice(item.price, item.currency || "BRL")}
                    </div>
                    <div
                      className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                        isPositive ? "text-[#00c853]" : "text-[#ff5252]"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 shrink-0" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-2 border-t border-[#21262d] text-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onViewAllStocks) {
                onViewAllStocks();
              } else {
                onSelectTicker("IBOV");
              }
            }}
            className="text-[11px] text-[#58a6ff] hover:underline font-medium cursor-pointer"
          >
            Ver todas as ações do mercado &rarr;
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full py-4" id="market-movers-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#e6edf3] tracking-tight">
              Termômetro de Ações em Tempo Real (B3)
            </h2>
            <p className="text-xs text-[#8b949e]">
              Destaques de volume financeiro, oscilações máximas e mínimas do pregão ao vivo
            </p>
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderColumn(
            "Mais ativas",
            "Maior volume negociado",
            activeItems,
            <Activity className="w-4 h-4" />,
            "active"
          )}
          {renderColumn(
            "Maiores altas do dia",
            "Líderes de valorização",
            gainersItems,
            <TrendingUp className="w-4 h-4" />,
            "gainers"
          )}
          {renderColumn(
            "Maiores quedas do dia",
            "Maiores desvalorizações",
            losersItems,
            <TrendingDown className="w-4 h-4" />,
            "losers"
          )}
        </div>
      </div>
    </section>
  );
};
