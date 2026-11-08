import React, { useState, useMemo } from "react";
import { TimesAndTradesItem, BrokerRankingItem } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { Activity, Filter } from "lucide-react";

interface TimesAndTradesFeedProps {
  ticker: string;
  currency: string;
  trades: TimesAndTradesItem[];
  brokerRanking: BrokerRankingItem[];
}

export const TimesAndTradesFeed: React.FC<TimesAndTradesFeedProps> = ({
  ticker,
  currency,
  trades,
  brokerRanking,
}) => {
  const [minLotFilter, setMinLotFilter] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"trades" | "brokers">("trades");

  const filteredTrades = useMemo(() => {
    if (minLotFilter <= 0) return trades;
    return trades.filter((t) => t.quantity >= minLotFilter);
  }, [trades, minLotFilter]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-lg overflow-hidden h-full select-none">
      {/* 1. Header: Title, Ticker & Sub-tabs */}
      <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded bg-[#00c853]/15 text-[#00c853] shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-[#e6edf3] tracking-tight truncate">
              Times & Trades
            </h3>
            <p className="text-[9.5px] text-[#8b949e] font-mono truncate">Fita • {ticker}</p>
          </div>
        </div>

        {/* Sub-Tabs: Negócios vs Ranking de Players */}
        <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-md p-0.5 gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("trades")}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === "trades"
                ? "bg-[#21262d] text-[#58a6ff]"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Negócios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("brokers")}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === "brokers"
                ? "bg-[#21262d] text-[#58a6ff]"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Players
          </button>
        </div>
      </div>

      {/* 2. Compact Filter Strip for Big Players */}
      {activeTab === "trades" && (
        <div className="px-2.5 py-1 border-b border-[#21262d] bg-[#12161d] flex items-center justify-between text-[9.5px] shrink-0">
          <span className="text-[#8b949e] flex items-center gap-1 font-sans">
            <Filter className="w-2.5 h-2.5 text-[#58a6ff]" />
            Lote:
          </span>
          <div className="flex items-center gap-0.5">
            {[0, 10, 25, 50, 100].map((lot) => (
              <button
                key={lot}
                type="button"
                onClick={() => setMinLotFilter(lot)}
                className={`px-1.5 py-0.2 rounded font-mono transition-colors cursor-pointer ${
                  minLotFilter === lot
                    ? "bg-[#58a6ff]/20 text-[#58a6ff] font-bold border border-[#58a6ff]/40"
                    : "text-[#8b949e] hover:text-white"
                }`}
              >
                {lot === 0 ? "Todos" : `≥${lot}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. High-Density Streaming Content Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0">
        {activeTab === "trades" ? (
          <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9px] font-semibold uppercase tracking-wider select-none">
                <th className="py-1 px-1.5">Hora</th>
                <th className="py-1 px-1 text-right">Preço</th>
                <th className="py-1 px-1 text-right">Qtd</th>
                <th className="py-1 px-1 text-center">Agr.</th>
                <th className="py-1 px-1 text-left hidden sm:table-cell">Comprador</th>
                <th className="py-1 px-1 text-left hidden sm:table-cell">Vendedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]/30 text-[10.5px]">
              {filteredTrades.map((t) => {
                const isBuy = t.aggressor === "BUY";
                const isSell = t.aggressor === "SELL";
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-[#21262d]/60 transition-colors h-[21px] leading-tight ${
                      t.quantity >= 50 ? "bg-[#58a6ff]/10 font-bold" : ""
                    }`}
                  >
                    <td className="py-0.5 px-1.5 text-[#8b949e] text-[9.5px] whitespace-nowrap">
                      {t.time}
                    </td>
                    <td
                      className={`py-0.5 px-1 text-right font-bold whitespace-nowrap ${
                        isBuy ? "text-[#00c853]" : isSell ? "text-[#ff5252]" : "text-[#e6edf3]"
                      }`}
                    >
                      {formatAssetDisplayPrice(t.price, currency)}
                    </td>
                    <td className="py-0.5 px-1 text-right font-bold text-white whitespace-nowrap">
                      {t.quantity}
                    </td>
                    <td className="py-0.5 px-1 text-center whitespace-nowrap">
                      <span
                        className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                          isBuy
                            ? "bg-[#00c853]/20 text-[#00c853]"
                            : isSell
                            ? "bg-[#ff5252]/20 text-[#ff5252]"
                            : "bg-[#30363d] text-[#8b949e]"
                        }`}
                      >
                        {isBuy ? "C" : isSell ? "V" : "D"}
                      </span>
                    </td>
                    <td className="py-0.5 px-1 text-[#8b949e] text-[9.5px] hidden sm:table-cell truncate max-w-[70px]">
                      {t.buyerBroker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                    <td className="py-0.5 px-1 text-[#8b949e] text-[9.5px] hidden sm:table-cell truncate max-w-[70px]">
                      {t.sellerBroker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Broker Ranking Tab */
          <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9px] font-semibold uppercase tracking-wider select-none">
                <th className="py-1 px-1.5">Player</th>
                <th className="py-1 px-1 text-right">Compra</th>
                <th className="py-1 px-1 text-right">Venda</th>
                <th className="py-1 px-1.5 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]/30 text-[10.5px]">
              {brokerRanking.map((b) => {
                const isBuyer = b.netBalance >= 0;
                return (
                  <tr key={b.broker} className="hover:bg-[#21262d]/60 transition-colors h-[21px] leading-tight">
                    <td className="py-0.5 px-1.5 text-white font-sans font-medium text-[10px] truncate max-w-[90px]">
                      {b.broker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                    <td className="py-0.5 px-1 text-right text-[#00c853]">{b.buyVolume}</td>
                    <td className="py-0.5 px-1 text-right text-[#ff5252]">{b.sellVolume}</td>
                    <td
                      className={`py-0.5 px-1.5 text-right font-bold ${
                        isBuyer ? "text-[#00c853]" : "text-[#ff5252]"
                      }`}
                    >
                      {isBuyer ? "+" : ""}
                      {b.netBalance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Compact Footer */}
      <div className="px-2.5 py-1 border-t border-[#21262d] bg-[#0e1117] flex items-center justify-between text-[9px] text-[#8b949e] font-mono shrink-0">
        <span>Feed Direto B3</span>
        <span>{filteredTrades.length} trades</span>
      </div>
    </div>
  );
};
