import React from "react";
import { Asset } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RealTimeTickerRibbonProps {
  assets: Asset[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export const RealTimeTickerRibbon: React.FC<RealTimeTickerRibbonProps> = ({
  assets,
  selectedTicker,
  onSelectTicker,
}) => {
  // Key global tickers to highlight in the top continuous ribbon
  const ribbonTickers = [
    { ticker: "IBOV", name: "Ibovespa", defaultPrice: 167540, currency: "BRL" },
    { ticker: "USD/BRL", name: "Dólar Comercial", defaultPrice: 5.4397, currency: "BRL" },
    { ticker: "EUR/BRL", name: "Euro Comercial", defaultPrice: 6.0679, currency: "BRL" },
    { ticker: "S&P 500", name: "S&P 500 Futuro", defaultPrice: 5860.5, currency: "USD" },
    { ticker: "BTC", name: "Bitcoin Spot", defaultPrice: 80112, currency: "USD" },
    { ticker: "WIN$", name: "Mini Índice B3", defaultPrice: 167548, currency: "BRL" },
    { ticker: "WDO$", name: "Mini Dólar B3", defaultPrice: 5459.6, currency: "BRL" },
    { ticker: "PETR4", name: "Petrobras PN", defaultPrice: 47.12, currency: "BRL" },
    { ticker: "VALE3", name: "Vale ON", defaultPrice: 62.35, currency: "BRL" },
    { ticker: "ITUB4", name: "Itaú Unibanco", defaultPrice: 39.71, currency: "BRL" },
    { ticker: "NVDA", name: "NVIDIA Corp", defaultPrice: 200.13, currency: "USD" },
  ];

  return (
    <div className="w-full bg-[#0a0d14] border-b border-[#21262d] py-1 px-2 overflow-x-auto scrollbar-none flex items-center gap-2 select-none shrink-0 z-10">
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[10px] font-bold text-[#58a6ff] shrink-0 tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
        MERCADOS AO VIVO
      </div>

      <div className="flex items-center gap-2 flex-nowrap">
        {ribbonTickers.map((item) => {
          const cleanTicker = item.ticker.replace("$", "").toUpperCase();
          const match = assets.find(
            (a) =>
              a.ticker.toUpperCase() === cleanTicker ||
              a.id.toLowerCase() === item.ticker.toLowerCase() ||
              a.ticker.toUpperCase().includes(cleanTicker)
          );

          const price = match?.price || item.defaultPrice;
          const changePercent = match?.changePercent ?? 0.45;
          const isPositive = changePercent >= 0;
          const isSelected = selectedTicker.toUpperCase() === item.ticker.toUpperCase();

          // Generate a smooth mini sparkline polyline
          const sparkline = match?.sparkline && match.sparkline.length > 2
            ? match.sparkline
            : [price * 0.995, price * 0.998, price * 1.002, price * 1.001, price];

          const minS = Math.min(...sparkline);
          const maxS = Math.max(...sparkline) || 1;
          const points = sparkline
            .map((val, idx) => {
              const x = (idx / (sparkline.length - 1)) * 36;
              const y = 14 - ((val - minS) / (maxS - minS || 1)) * 12;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");

          return (
            <button
              key={item.ticker}
              type="button"
              onClick={() => onSelectTicker(item.ticker)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                isSelected
                  ? "bg-[#1f242c] border-[#58a6ff] text-white shadow-xs"
                  : "bg-[#12161f]/80 border-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] hover:border-[#30363d]"
              }`}
            >
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-bold text-[11px] text-white">{item.ticker}</span>
                  <span
                    className={`text-[9.5px] font-mono font-bold flex items-center ${
                      isPositive ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 inline mr-0.5" />
                    )}
                    {isPositive ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#c9d1d9]">
                  {formatAssetDisplayPrice(price, item.currency)}
                </span>
              </div>

              {/* Mini Sparkline SVG */}
              <div className="w-9 h-3.5 hidden sm:block opacity-80 shrink-0">
                <svg viewBox="0 0 36 14" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={isPositive ? "#00c853" : "#ff5252"}
                    strokeWidth={1.2}
                    points={points}
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
