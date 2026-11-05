import React, { useState } from "react";
import { DayTradePosition, DayTradeOrder, DayTradeAccountSummary } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  XCircle,
  Layers,
  History,
} from "lucide-react";

interface PositionsAndPLTableProps {
  positions: DayTradePosition[];
  orders: DayTradeOrder[];
  account: DayTradeAccountSummary;
  onSelectTicker?: (ticker: string) => void;
}

export const PositionsAndPLTable: React.FC<PositionsAndPLTableProps> = ({
  positions,
  orders,
  account,
  onSelectTicker,
}) => {
  const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");

  const totalDayPL = account.realizedPLDay + account.unrealizedPL;
  const isPositiveDay = totalDayPL >= 0;

  const handleFlattenOne = (posId: string) => {
    dayTradeService.flattenPosition(posId, undefined, "Zeragem via Tabela");
  };

  const handleFlattenAll = () => {
    dayTradeService.flattenAllPositions();
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-lg overflow-hidden h-full select-none">
      {/* 1. Header: Compact Summary Metrics & Sub-Tabs */}
      <div className="px-3 py-1.5 border-b border-[#21262d] bg-[#0e1117]/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Sub-tabs: Posições vs Ordens */}
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("positions")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "positions"
                  ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Posições ({positions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                  : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              <History className="w-3 h-3" />
              <span>Ordens ({orders.length})</span>
            </button>
          </div>

          {/* Day P&L High-Impact Indicator */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[10px] text-[#8b949e] uppercase font-sans font-semibold">P&L Dia:</span>
            <span
              className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${
                isPositiveDay ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {isPositiveDay ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositiveDay ? "+" : ""}
              R$ {totalDayPL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Account Quick Metrics & Panic Button */}
        <div className="flex items-center gap-2 text-[10.5px] font-mono">
          <span className="text-[#8b949e] hidden md:inline">
            Saldo: <strong className="text-white">R$ {(account.balance / 1000).toFixed(1)}k</strong>
          </span>
          <span className="text-[#8b949e] hidden lg:inline">
            Aberto: <strong className={account.unrealizedPL >= 0 ? "text-[#00c853]" : "text-[#ff5252]"}>
              R$ {account.unrealizedPL >= 0 ? "+" : ""}{account.unrealizedPL.toFixed(1)}
            </strong>
          </span>
          <span className="text-[#8b949e] hidden xl:inline">
            Taxa: <strong className="text-[#58a6ff]">{account.winRate.toFixed(0)}%</strong>
          </span>

          {positions.length > 0 && (
            <button
              type="button"
              onClick={handleFlattenAll}
              className="py-1 px-2 rounded-md bg-[#d29922]/20 hover:bg-[#d29922]/30 text-[#f0883e] border border-[#d29922]/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Zerar todas as posições abertas"
            >
              <XCircle className="w-3 h-3" />
              <span>Zerar Todas ({positions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Content Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0">
        {activeTab === "positions" ? (
          positions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8b949e]">
              <Layers className="w-6 h-6 text-[#30363d] mb-1" />
              <p className="text-xs font-semibold text-[#e6edf3]">Nenhuma posição aberta no momento</p>
              <p className="text-[10px]">Envie uma ordem de Compra ou Venda na boleta para abrir operação.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9.5px] font-semibold uppercase tracking-wider select-none">
                  <th className="py-1.5 px-2">Ativo</th>
                  <th className="py-1.5 px-1.5 text-center">Lado</th>
                  <th className="py-1.5 px-1.5 text-right">Qtd</th>
                  <th className="py-1.5 px-2 text-right">Preço Ent.</th>
                  <th className="py-1.5 px-2 text-right">Preço Atual</th>
                  <th className="py-1.5 px-2 text-right">P&L Parcial</th>
                  <th className="py-1.5 px-2 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/40 text-[11px]">
                {positions.map((pos) => {
                  const isProfit = (pos.unrealizedPLBRL || 0) >= 0;
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => onSelectTicker && onSelectTicker(pos.ticker)}
                      className="hover:bg-[#21262d]/60 transition-colors cursor-pointer h-[26px] leading-tight"
                    >
                      {/* Ticker */}
                      <td className="py-1 px-2 font-bold text-white whitespace-nowrap">
                        {pos.ticker}
                      </td>

                      {/* Side */}
                      <td className="py-1 px-1.5 text-center whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            pos.side === "BUY"
                              ? "bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40"
                              : "bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/40"
                          }`}
                        >
                          {pos.side === "BUY" ? "COMPRA" : "VENDA"}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-1 px-1.5 text-right font-bold text-white whitespace-nowrap">
                        {pos.quantity}x
                      </td>

                      {/* Entry Price */}
                      <td className="py-1 px-2 text-right text-[#8b949e] whitespace-nowrap">
                        {formatAssetDisplayPrice(pos.entryPrice, pos.currency)}
                      </td>

                      {/* Current Price */}
                      <td className="py-1 px-2 text-right text-white font-bold whitespace-nowrap">
                        {formatAssetDisplayPrice(pos.currentPrice, pos.currency)}
                      </td>

                      {/* Unrealized P&L in BRL and USD */}
                      <td className="py-1 px-2 text-right whitespace-nowrap">
                        <div className={`font-bold ${isProfit ? "text-[#00c853]" : "text-[#ff5252]"}`}>
                          {isProfit ? "+" : ""}
                          R$ {(pos.unrealizedPLBRL || 0).toFixed(2)}
                          <span className="text-[9.5px] opacity-80 ml-1">
                            ({isProfit ? "+" : ""}{(pos.unrealizedPLPercent || 0).toFixed(2)}%)
                          </span>
                        </div>
                      </td>

                      {/* Quick Close Button */}
                      <td className="py-1 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlattenOne(pos.id);
                          }}
                          className="px-2 py-0.5 rounded bg-[#da3633]/20 hover:bg-[#da3633]/40 text-[#ff5252] border border-[#da3633]/40 text-[10px] font-bold transition-colors cursor-pointer"
                          title="Zerar posição deste ativo"
                        >
                          Zerar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* Orders History Tab */
          orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8b949e]">
              <History className="w-6 h-6 text-[#30363d] mb-1" />
              <p className="text-xs font-semibold text-[#e6edf3]">Nenhuma ordem executada hoje</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9.5px] font-semibold uppercase tracking-wider select-none">
                  <th className="py-1.5 px-2">Horário</th>
                  <th className="py-1.5 px-2">Ativo</th>
                  <th className="py-1.5 px-1.5 text-center">Lado</th>
                  <th className="py-1.5 px-1.5 text-right">Qtd</th>
                  <th className="py-1.5 px-2 text-right">Preço</th>
                  <th className="py-1.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/40 text-[10.5px]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#21262d]/60 transition-colors h-[24px]">
                    <td className="py-1 px-2 text-[#8b949e] text-[9.5px] whitespace-nowrap">
                      {ord.timestamp.split("T")[1]?.slice(0, 8) || ord.timestamp}
                    </td>
                    <td className="py-1 px-2 font-bold text-white whitespace-nowrap">{ord.ticker}</td>
                    <td className="py-1 px-1.5 text-center whitespace-nowrap">
                      <span
                        className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                          ord.side === "BUY"
                            ? "bg-[#00c853]/20 text-[#00c853]"
                            : "bg-[#ff5252]/20 text-[#ff5252]"
                        }`}
                      >
                        {ord.side === "BUY" ? "COMPRA" : "VENDA"}
                      </span>
                    </td>
                    <td className="py-1 px-1.5 text-right font-bold text-white whitespace-nowrap">{ord.quantity}x</td>
                    <td className="py-1 px-2 text-right text-white whitespace-nowrap">
                      {formatAssetDisplayPrice(ord.price, ord.currency)}
                    </td>
                    <td className="py-1 px-2 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] text-[9px] font-bold">
                        EXECUTADA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
};
