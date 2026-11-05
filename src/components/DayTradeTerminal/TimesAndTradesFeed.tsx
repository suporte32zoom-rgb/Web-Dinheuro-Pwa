import React, { useState, useMemo } from "react";
import { TimesAndTradesItem, BrokerRankingItem } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { Activity, Filter, Award, Clock } from "lucide-react";

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
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col shadow-lg overflow-hidden h-full">
      {/* Header: Title and Filters */}
      <div className="p-3 border-b border-[#21262d] bg-[#0e1117]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00c853]/15 text-[#00c853]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#e6edf3] tracking-tight">Times & Trades</h3>
            <p className="text-[10px] text-[#8b949e]">Fita de Negócios em Tempo Real • {ticker}</p>
          </div>
        </div>

        {/* Sub-Tabs: Trades vs Broker Ranking */}
        <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
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

      {/* Filter Bar for Big Players */}
      {activeTab === "trades" && (
        <div className="px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] flex items-center justify-between text-[10px]">
          <span className="text-[#8b949e] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#58a6ff]" />
            Lote Mínimo:
          </span>
          <div className="flex items-center gap-1">
            {[0, 10, 25, 50, 100].map((lot) => (
              <button
                key={lot}
                type="button"
                onClick={() => setMinLotFilter(lot)}
                className={`px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-[220px]">
        {activeTab === "trades" ? (
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[10px] font-semibold uppercase tracking-wider select-none sticky top-0 z-10">
                <th className="py-1.5 px-2">Horário</th>
                <th className="py-1.5 px-2 text-right">Preço</th>
                <th className="py-1.5 px-2 text-right">Qtd</th>
                <th className="py-1.5 px-2 text-center">Agressão</th>
                <th className="py-1.5 px-2 text-left hidden sm:table-cell">Comprador</th>
                <th className="py-1.5 px-2 text-left hidden sm:table-cell">Vendedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]/40 text-[11px]">
              {filteredTrades.map((t) => {
                const isBuy = t.aggressor === "BUY";
                const isSell = t.aggressor === "SELL";
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-[#21262d]/50 transition-colors ${
                      t.quantity >= 50 ? "bg-[#58a6ff]/5 font-semibold" : ""
                    }`}
                  >
                    <td className="py-1 px-2 text-[#8b949e]">{t.time}</td>
                    <td
                      className={`py-1 px-2 text-right font-bold ${
                        isBuy ? "text-[#00c853]" : isSell ? "text-[#ff5252]" : "text-[#e6edf3]"
                      }`}
                    >
                      {formatAssetDisplayPrice(t.price, currency)}
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-white">
                      {t.quantity}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          isBuy
                            ? "bg-[#00c853]/20 text-[#00c853]"
                            : isSell
                            ? "bg-[#ff5252]/20 text-[#ff5252]"
                            : "bg-[#30363d] text-[#8b949e]"
                        }`}
                      >
                        {isBuy ? "COMPRA" : isSell ? "VENDA" : "DIRETO"}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-[#8b949e] hidden sm:table-cell truncate max-w-[90px]">
                      {t.buyerBroker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                    <td className="py-1 px-2 text-[#8b949e] hidden sm:table-cell truncate max-w-[90px]">
                      {t.sellerBroker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Broker Ranking Tab */
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[10px] font-semibold uppercase tracking-wider sticky top-0 z-10">
                <th className="py-1.5 px-2">Corretora / Player</th>
                <th className="py-1.5 px-2 text-right">Compra</th>
                <th className="py-1.5 px-2 text-right">Venda</th>
                <th className="py-1.5 px-2 text-right">Saldo Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]/40 text-[11px]">
              {brokerRanking.map((b) => {
                const isBuyer = b.netBalance >= 0;
                return (
                  <tr key={b.broker} className="hover:bg-[#21262d]/50 transition-colors">
                    <td className="py-1.5 px-2 text-white font-sans font-semibold">
                      {b.broker.replace(" Investimentos", "").replace(" Corretora", "")}
                    </td>
                    <td className="py-1.5 px-2 text-right text-[#00c853]">{b.buyVolume}</td>
                    <td className="py-1.5 px-2 text-right text-[#ff5252]">{b.sellVolume}</td>
                    <td
                      className={`py-1.5 px-2 text-right font-bold ${
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

      {/* Footer summary */}
      <div className="p-2 border-t border-[#21262d] bg-[#0e1117] flex items-center justify-between text-[10px] text-[#8b949e]">
        <span>Feed ao vivo via WebSocket / DMA2</span>
        <span className="font-mono">{filteredTrades.length} negócios monitorados</span>
      </div>
    </div>
  );
};
