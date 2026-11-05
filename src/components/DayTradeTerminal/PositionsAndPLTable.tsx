import React, { useState } from "react";
import { DayTradePosition, DayTradeOrder, DayTradeAccountSummary } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  XCircle,
  Clock,
  History,
  Layers,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
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
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col shadow-lg overflow-hidden">
      {/* 1. Header Summary Banner with Live P&L Metrics */}
      <div className="p-4 border-b border-[#21262d] bg-[#0e1117]/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                isPositiveDay ? "bg-[#00c853]/20 text-[#00c853]" : "bg-[#ff5252]/20 text-[#ff5252]"
              }`}
            >
              {isPositiveDay ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] text-[#8b949e] font-semibold uppercase tracking-wider block">
                Resultado Líquido do Dia (P&L Total)
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl sm:text-2xl font-mono font-bold tracking-tight ${
                    isPositiveDay ? "text-[#00c853]" : "text-[#ff5252]"
                  }`}
                >
                  {isPositiveDay ? "+" : ""}
                  R$ {totalDayPL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-[#8b949e] font-mono">
                  ({isPositiveDay ? "+" : ""}{(totalDayPL / (account.initialBalance || 100000) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Quick Metrics Cluster */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs font-mono">
          <div className="p-2 rounded-xl bg-[#161b22] border border-[#21262d]">
            <span className="block text-[10px] text-[#8b949e] font-sans">Saldo Conta:</span>
            <span className="text-white font-bold">
              R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#161b22] border border-[#21262d]">
            <span className="block text-[10px] text-[#8b949e] font-sans">P&L Aberto (Não Realizado):</span>
            <span
              className={`font-bold ${
                account.unrealizedPL >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {account.unrealizedPL >= 0 ? "+" : ""}
              R$ {account.unrealizedPL.toFixed(2)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#161b22] border border-[#21262d]">
            <span className="block text-[10px] text-[#8b949e] font-sans">P&L Fechado (Realizado):</span>
            <span
              className={`font-bold ${
                account.realizedPLDay >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {account.realizedPLDay >= 0 ? "+" : ""}
              R$ {account.realizedPLDay.toFixed(2)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#161b22] border border-[#21262d]">
            <span className="block text-[10px] text-[#8b949e] font-sans">Taxa de Acerto:</span>
            <span className="text-[#58a6ff] font-bold">
              {account.winRate.toFixed(1)}% ({account.winningTrades}/{account.totalTrades})
            </span>
          </div>

          {positions.length > 0 && (
            <button
              type="button"
              onClick={handleFlattenAll}
              className="py-2 px-3 rounded-xl bg-[#d29922]/20 hover:bg-[#d29922]/30 text-[#f0883e] border border-[#d29922]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Encerrar todas as posições abertas imediatamente a mercado"
            >
              <XCircle className="w-4 h-4" />
              <span>Zerar Todas ({positions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Tabs: Posições Abertas vs Histórico de Ordens */}
      <div className="px-4 py-2 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("positions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "positions"
                ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Posições Abertas ({positions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Ordens ({orders.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-[#8b949e] hidden sm:inline">
          Sincronização ao vivo com book de ofertas e ticks de mercado
        </span>
      </div>

      {/* 3. Table Content */}
      <div className="overflow-x-auto min-h-[160px]">
        {activeTab === "positions" ? (
          positions.length === 0 ? (
            <div className="p-8 text-center text-[#8b949e] flex flex-col items-center justify-center">
              <Layers className="w-8 h-8 mb-2 text-[#30363d]" />
              <p className="text-sm font-semibold text-[#e6edf3]">Nenhuma posição aberta no momento</p>
              <p className="text-xs text-[#8b949e] mt-1">
                Utilize a boleta de negociação ou clique no book de ofertas para abrir uma nova operação.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ativo</th>
                  <th className="py-2.5 px-3">Lado</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Preço Entrada</th>
                  <th className="py-2.5 px-3 text-right">Preço Atual</th>
                  <th className="py-2.5 px-3 text-right">Variação %</th>
                  <th className="py-2.5 px-3 text-right">Stop Loss / Gain</th>
                  <th className="py-2.5 px-3 text-right">P&L Parcial (BRL)</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">P&L (USD)</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/60 font-mono">
                {positions.map((pos) => {
                  const isPosProfitable = pos.unrealizedPLBRL >= 0;
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => onSelectTicker && onSelectTicker(pos.ticker)}
                      className="hover:bg-[#21262d]/60 transition-colors cursor-pointer group"
                    >
                      {/* Ativo */}
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-white group-hover:text-[#58a6ff] transition-colors">
                          {pos.ticker}
                        </span>
                        <span className="block text-[10px] text-[#8b949e] font-sans truncate max-w-[120px]">
                          {pos.name}
                        </span>
                      </td>

                      {/* Lado */}
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === "BUY"
                              ? "bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40"
                              : "bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/40"
                          }`}
                        >
                          {pos.side === "BUY" ? "COMPRA" : "VENDA"}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-2.5 px-3 text-right text-white font-bold">
                        {pos.quantity}
                      </td>

                      {/* Preço de Entrada */}
                      <td className="py-2.5 px-3 text-right text-[#8b949e]">
                        {formatAssetDisplayPrice(pos.entryPrice, pos.currency)}
                      </td>

                      {/* Preço Atual */}
                      <td className="py-2.5 px-3 text-right text-white font-bold">
                        {formatAssetDisplayPrice(pos.currentPrice, pos.currency)}
                      </td>

                      {/* Variação % */}
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isPosProfitable ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isPosProfitable ? "+" : ""}
                        {pos.unrealizedPLPercent.toFixed(2)}%
                      </td>

                      {/* Stop Loss / Take Profit */}
                      <td className="py-2.5 px-3 text-right text-[11px] text-[#8b949e]">
                        <div>SL: {pos.stopLoss ? formatAssetDisplayPrice(pos.stopLoss, pos.currency) : "--"}</div>
                        <div>TP: {pos.takeProfit ? formatAssetDisplayPrice(pos.takeProfit, pos.currency) : "--"}</div>
                      </td>

                      {/* P&L Parcial (BRL) */}
                      <td
                        className={`py-2.5 px-3 text-right font-bold text-sm ${
                          isPosProfitable ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isPosProfitable ? "+" : ""}
                        R$ {pos.unrealizedPLBRL.toFixed(2)}
                      </td>

                      {/* P&L Parcial (USD) */}
                      <td
                        className={`py-2.5 px-3 text-right hidden sm:table-cell ${
                          isPosProfitable ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isPosProfitable ? "+" : ""}
                        US$ {pos.unrealizedPLUSD.toFixed(2)}
                      </td>

                      {/* Ação: Zerar Individual */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlattenOne(pos.id);
                          }}
                          className="px-2.5 py-1 rounded bg-[#ff5252]/15 hover:bg-[#ff5252]/30 text-[#ff5252] border border-[#ff5252]/40 text-xs font-bold transition-colors cursor-pointer"
                          title="Zerar esta posição imediatamente a mercado"
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
            <div className="p-8 text-center text-[#8b949e] flex flex-col items-center justify-center">
              <History className="w-8 h-8 mb-2 text-[#30363d]" />
              <p className="text-sm font-semibold text-[#e6edf3]">Nenhuma ordem registrada no pregão</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Horário</th>
                  <th className="py-2.5 px-3">Ativo</th>
                  <th className="py-2.5 px-3">Lado</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Preço Executado</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Resultado (P&L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/60 font-mono">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#21262d]/40 transition-colors">
                    <td className="py-2.5 px-3 text-[#8b949e]">{ord.timestamp}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{ord.ticker}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          ord.side === "BUY" ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {ord.side === "BUY" ? "COMPRA" : "VENDA"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#8b949e]">{ord.type}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{ord.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {ord.executedPrice?.toFixed(2) || "--"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#238636]/20 text-[#3fb950] font-sans font-bold">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {ord.pnl !== undefined ? (
                        <span className={ord.pnl >= 0 ? "text-[#00c853]" : "text-[#ff5252]"}>
                          {ord.pnl >= 0 ? "+" : ""}R$ {ord.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[#8b949e]">--</span>
                      )}
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
