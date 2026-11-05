import React, { useMemo } from "react";
import { DOMLevel } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { Layers, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface DepthOfMarketDOMProps {
  ticker: string;
  currency: string;
  currentPrice: number;
  domLevels: DOMLevel[];
  onSelectPriceLevel?: (price: number) => void;
}

export const DepthOfMarketDOM: React.FC<DepthOfMarketDOMProps> = ({
  ticker,
  currency,
  currentPrice,
  domLevels,
  onSelectPriceLevel,
}) => {
  // Find maximum volume to calibrate the horizontal depth bars
  const maxVolume = useMemo(() => {
    return Math.max(...domLevels.map((l) => Math.max(l.bidQty, l.askQty, 1)), 100);
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
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col shadow-lg overflow-hidden h-full">
      {/* Header: Title and Pressure Bar */}
      <div className="p-3 border-b border-[#21262d] bg-[#0e1117]/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#58a6ff]/15 text-[#58a6ff]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#e6edf3] tracking-tight">
                Livro de Ofertas (DOM)
              </h3>
              <p className="text-[10px] text-[#8b949e]">Microestrutura & Profundidade • {ticker}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
            Spread: R$ 0.05
          </span>
        </div>

        {/* Pressure Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#00c853] font-bold">Compra {buyPressurePercent}%</span>
            <span className="text-[#ff5252] font-bold">Venda {(100 - buyPressurePercent).toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#ff5252]/40 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#00c853] transition-all duration-300"
              style={{ width: `${buyPressurePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* DOM Table Ladder */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[10px] font-semibold uppercase tracking-wider select-none">
              <th className="py-2 px-2 text-left w-1/3">Ord / Compra (Bid)</th>
              <th className="py-2 px-2 text-center w-1/3">Preço</th>
              <th className="py-2 px-2 text-right w-1/3">Venda (Ask) / Ord</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]/40">
            {domLevels.map((lvl) => {
              const isLast = lvl.isLastPrice;
              const bidBarPct = lvl.bidQty > 0 ? (lvl.bidQty / maxVolume) * 100 : 0;
              const askBarPct = lvl.askQty > 0 ? (lvl.askQty / maxVolume) * 100 : 0;

              return (
                <tr
                  key={lvl.price}
                  onClick={() => onSelectPriceLevel && onSelectPriceLevel(lvl.price)}
                  className={`relative group cursor-pointer transition-colors ${
                    isLast
                      ? "bg-[#58a6ff]/15 border-y-2 border-[#58a6ff]"
                      : "hover:bg-[#21262d]/70"
                  }`}
                >
                  {/* Bid (Compra) Column with Depth Histogram */}
                  <td className="py-1 px-2 relative text-left">
                    {lvl.bidQty > 0 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#00c853]/15 transition-all duration-200 pointer-events-none"
                        style={{ width: `${bidBarPct}%` }}
                      />
                    )}
                    {lvl.bidQty > 0 ? (
                      <div className="relative z-10 flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-[#8b949e]">{lvl.bidOrders}x</span>
                        <span className="font-bold text-[#00c853]">{lvl.bidQty}</span>
                      </div>
                    ) : (
                      <span className="text-[#30363d] text-[11px] block text-right">-</span>
                    )}
                  </td>

                  {/* Price Column */}
                  <td className="py-1 px-2 text-center font-bold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs transition-colors ${
                        isLast
                          ? "bg-[#58a6ff] text-white shadow-xs"
                          : "text-[#e6edf3] group-hover:text-[#58a6ff]"
                      }`}
                    >
                      {formatAssetDisplayPrice(lvl.price, currency)}
                    </span>
                  </td>

                  {/* Ask (Venda) Column with Depth Histogram */}
                  <td className="py-1 px-2 relative text-right">
                    {lvl.askQty > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#ff5252]/15 transition-all duration-200 pointer-events-none"
                        style={{ width: `${askBarPct}%` }}
                      />
                    )}
                    {lvl.askQty > 0 ? (
                      <div className="relative z-10 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#ff5252]">{lvl.askQty}</span>
                        <span className="text-[10px] text-[#8b949e]">{lvl.askOrders}x</span>
                      </div>
                    ) : (
                      <span className="text-[#30363d] text-[11px] block text-left">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info: Totals */}
      <div className="p-2 border-t border-[#21262d] bg-[#0e1117] flex items-center justify-between text-[10px] text-[#8b949e] font-mono">
        <div>
          <span>Vol Compra: </span>
          <strong className="text-[#00c853]">{totalBidVolume}</strong>
        </div>
        <div>
          <span>Vol Venda: </span>
          <strong className="text-[#ff5252]">{totalAskVolume}</strong>
        </div>
      </div>
    </div>
  );
};
