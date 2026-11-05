import React, { useMemo } from "react";
import { DOMLevel } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { Layers } from "lucide-react";

interface DepthOfMarketDOMProps {
  ticker: string;
  currency: string;
  currentPrice: number;
  domLevels: DOMLevel[];
  onSelectPriceLevel?: (price: number) => void;
  selectedPrice?: number;
}

export const DepthOfMarketDOM: React.FC<DepthOfMarketDOMProps> = ({
  ticker,
  currency,
  currentPrice,
  domLevels,
  onSelectPriceLevel,
  selectedPrice,
}) => {
  // Find maximum volume to calibrate the horizontal depth histogram bars
  const maxVolume = useMemo(() => {
    return Math.max(...domLevels.map((l) => Math.max(l.bidQty, l.askQty, 1)), 80);
  }, [domLevels]);

  // Aggregate total buy and sell pressure
  const { totalBidVolume, totalAskVolume, buyPressurePercent } = useMemo(() => {
    const totalBid = domLevels.reduce((sum, l) => sum + l.bidQty, 0);
    const totalAsk = domLevels.reduce((sum, l) => sum + l.askQty, 0);
    const sum = totalBid + totalAsk || 1;
    const buyPct = (totalBid / sum) * 100;
    return {
      totalBidVolume: totalBid,
      totalAskVolume: totalAsk,
      buyPressurePercent: Number(buyPct.toFixed(1)),
    };
  }, [domLevels]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-lg overflow-hidden h-full select-none">
      {/* 1. Header: Compact Title & Pressure Gauge */}
      <div className="px-2.5 py-2 border-b border-[#21262d] bg-[#0e1117]/80 shrink-0">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 rounded bg-[#58a6ff]/15 text-[#58a6ff] shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <h3 className="text-xs font-bold text-[#e6edf3] tracking-tight truncate">
                Book de Ofertas (DOM)
              </h3>
              <p className="text-[10px] text-[#8b949e] font-mono truncate">
                Profundidade • {ticker}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] shrink-0">
            Spread: R$ 0.05
          </span>
        </div>

        {/* Compact Pressure Gauge */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9.5px] font-mono">
            <span className="text-[#00c853] font-bold">Compra {buyPressurePercent}%</span>
            <span className="text-[#ff5252] font-bold">Venda {(100 - buyPressurePercent).toFixed(1)}%</span>
          </div>
          <div className="w-full h-1 bg-[#ff5252]/40 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#00c853] transition-all duration-300"
              style={{ width: `${buyPressurePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. High-Density DOM Table Ladder */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0">
        <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9.5px] font-semibold uppercase tracking-wider select-none">
              <th className="py-1 px-2 text-left w-1/3">Ord / Compra (Bid)</th>
              <th className="py-1 px-1.5 text-center w-1/3">Preço</th>
              <th className="py-1 px-2 text-right w-1/3">Venda (Ask) / Ord</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]/30 text-[10.5px]">
            {domLevels.map((lvl) => {
              const isLast = lvl.isLastPrice;
              const isSelected = selectedPrice !== undefined && Math.abs(selectedPrice - lvl.price) < 0.001;
              const bidBarPct = lvl.bidQty > 0 ? (lvl.bidQty / maxVolume) * 100 : 0;
              const askBarPct = lvl.askQty > 0 ? (lvl.askQty / maxVolume) * 100 : 0;

              return (
                <tr
                  key={lvl.price}
                  onClick={() => onSelectPriceLevel && onSelectPriceLevel(lvl.price)}
                  title={`Clique para carregar R$ ${lvl.price.toFixed(2)} na boleta`}
                  className={`relative group cursor-pointer transition-colors h-[22px] leading-tight ${
                    isSelected
                      ? "bg-[#58a6ff]/25 border-y border-[#58a6ff]"
                      : isLast
                      ? "bg-[#58a6ff]/15 border-y border-[#58a6ff]/60"
                      : "hover:bg-[#21262d]/80"
                  }`}
                >
                  {/* Bid (Compra) Column with Depth Histogram */}
                  <td className="py-0.5 px-2 relative text-left whitespace-nowrap overflow-hidden">
                    {lvl.bidQty > 0 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#00c853]/20 transition-all duration-150 pointer-events-none"
                        style={{ width: `${bidBarPct}%` }}
                      />
                    )}
                    {lvl.bidQty > 0 ? (
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[9px] text-[#8b949e]">{lvl.bidOrders}x</span>
                        <span className="font-bold text-[#00c853]">{lvl.bidQty}</span>
                      </div>
                    ) : (
                      <span className="text-[#30363d] block text-right">-</span>
                    )}
                  </td>

                  {/* Price Column */}
                  <td className="py-0.5 px-1.5 text-center font-bold whitespace-nowrap">
                    <span
                      className={`inline-block px-1 py-0.2 rounded text-[10.5px] transition-colors ${
                        isLast
                          ? "bg-[#58a6ff] text-white shadow-xs font-black"
                          : isSelected
                          ? "bg-[#58a6ff]/30 text-[#58a6ff] border border-[#58a6ff]/50"
                          : "text-[#e6edf3] group-hover:text-[#58a6ff]"
                      }`}
                    >
                      {formatAssetDisplayPrice(lvl.price, currency)}
                    </span>
                  </td>

                  {/* Ask (Venda) Column with Depth Histogram */}
                  <td className="py-0.5 px-2 relative text-right whitespace-nowrap overflow-hidden">
                    {lvl.askQty > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#ff5252]/20 transition-all duration-150 pointer-events-none"
                        style={{ width: `${askBarPct}%` }}
                      />
                    )}
                    {lvl.askQty > 0 ? (
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="font-bold text-[#ff5252]">{lvl.askQty}</span>
                        <span className="text-[9px] text-[#8b949e]">{lvl.askOrders}x</span>
                      </div>
                    ) : (
                      <span className="text-[#30363d] block text-left">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Compact Footer Totals */}
      <div className="px-2.5 py-1.5 border-t border-[#21262d] bg-[#0e1117] flex items-center justify-between text-[9.5px] text-[#8b949e] font-mono shrink-0">
        <div>
          <span>Vol Compra: </span>
          <strong className="text-[#00c853] font-bold">{totalBidVolume}</strong>
        </div>
        <div className="text-right">
          <span>Vol Venda: </span>
          <strong className="text-[#ff5252] font-bold">{totalAskVolume}</strong>
        </div>
      </div>
    </div>
  );
};
