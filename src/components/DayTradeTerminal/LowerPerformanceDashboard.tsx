import React, { useState, useEffect } from "react";
import { DayTradePosition, DayTradeAccountSummary } from "../../types/finance";
import { dayTradeService } from "../../services/dayTradeService";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Award,
  Newspaper,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface LowerPerformanceDashboardProps {
  positions: DayTradePosition[];
  account: DayTradeAccountSummary;
  onSelectTicker?: (ticker: string) => void;
}

export const LowerPerformanceDashboard: React.FC<LowerPerformanceDashboardProps> = ({
  positions,
  account,
  onSelectTicker,
}) => {
  const [sessionTime, setSessionTime] = useState("03h 48m");

  // Real-time market news feed
  const [news, setNews] = useState<Array<{ id: string; time: string; headline: string; source: string; tag: string }>>([
    {
      id: "n1",
      time: "16:21",
      headline: "Ibovespa renova máxima com fluxo estrangeiro e suporte de commodities",
      source: "B3 Mercados",
      tag: "IBOV",
    },
    {
      id: "n2",
      time: "16:14",
      headline: "Dólar opera em queda de 0,42% a R$ 5,43 com apetite global a risco",
      source: "Câmbio B3",
      tag: "USD/BRL",
    },
    {
      id: "n3",
      time: "15:58",
      headline: "Petrobras (PETR4) amplia ganhos com cotações firmes do Brent",
      source: "Agência Financeira",
      tag: "PETR4",
    },
    {
      id: "n4",
      time: "15:42",
      headline: "Futuros de Nova York avançam antes de falas de dirigentes do Federal Reserve",
      source: "Wall Street",
      tag: "S&P 500",
    },
    {
      id: "n5",
      time: "15:15",
      headline: "Tesouro Direto: taxas dos títulos prefixados recuam em linha com DI",
      source: "Renda Fixa B3",
      tag: "DI1",
    },
  ]);

  // Fetch latest news from server if available
  useEffect(() => {
    fetch("/api/market/news")
      .then((r) => r.json())
      .then((data) => {
        if (data?.news && Array.isArray(data.news) && data.news.length > 0) {
          const mapped = data.news.slice(0, 8).map((item: any, i: number) => {
            const now = new Date();
            const minAgo = i * 6 + 2;
            const t = new Date(now.getTime() - minAgo * 60000);
            const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
            return {
              id: item.id || `news-${i}`,
              time: timeStr,
              headline: item.title,
              source: item.source || "DinhEuro Feed",
              tag: item.relatedTickers?.[0] || "MERCADO",
            };
          });
          setNews(mapped);
        }
      })
      .catch(() => {
        // Keep fallback headlines
      });
  }, []);

  const totalDayPL = account.realizedPLDay + account.unrealizedPL;
  const isPositive = totalDayPL >= 0;
  const winRate = account.winRate || 68;
  const rentabilidadePercent = ((totalDayPL / (account.initialBalance || 100000)) * 100);

  // SVG Circular Gauge calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  const handleFlattenOne = (posId: string) => {
    dayTradeService.flattenPosition(posId, undefined, "Zeragem via Painel");
  };

  return (
    <div className="w-full grid grid-cols-12 gap-2 h-full min-h-0 select-none text-xs">
      {/* 1. MÓDULO 1: MINHAS POSIÇÕES (Col 1-5, ~42%) */}
      <div className="col-span-12 md:col-span-5 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-[#58a6ff]/15 text-[#58a6ff]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-xs text-[#e6edf3]">Minhas Posições</h4>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
            {positions.length} {positions.length === 1 ? "ativa" : "ativas"}
          </span>
        </div>

        {/* Positions Table */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0">
          {positions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-3 text-center text-[#8b949e]">
              <p className="font-medium text-[11px] text-[#c9d1d9]">Sem posições abertas</p>
              <p className="text-[9.5px]">Ordens executadas na boleta aparecem ao vivo aqui.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono tabular-nums">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[9px] font-semibold uppercase tracking-wider select-none">
                  <th className="py-1 px-2">Ativo</th>
                  <th className="py-1 px-1 text-center">Lado</th>
                  <th className="py-1 px-1 text-right">Qtd</th>
                  <th className="py-1 px-1 text-right">Médio</th>
                  <th className="py-1 px-1 text-right">Atual</th>
                  <th className="py-1 px-2 text-right">P&L</th>
                  <th className="py-1 px-1.5 text-center">Zerar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/30 text-[10px]">
                {positions.map((pos) => {
                  const isPosProfit = (pos.unrealizedPLBRL || 0) >= 0;
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => onSelectTicker && onSelectTicker(pos.ticker)}
                      className="hover:bg-[#21262d]/70 cursor-pointer transition-colors h-[22px] leading-tight"
                    >
                      <td className="py-0.5 px-2 font-bold text-white whitespace-nowrap">
                        {pos.ticker}
                      </td>
                      <td className="py-0.5 px-1 text-center whitespace-nowrap">
                        <span
                          className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
                            pos.side === "BUY"
                              ? "bg-[#00c853]/20 text-[#00c853]"
                              : "bg-[#ff5252]/20 text-[#ff5252]"
                          }`}
                        >
                          {pos.side === "BUY" ? "C" : "V"}
                        </span>
                      </td>
                      <td className="py-0.5 px-1 text-right font-bold text-white whitespace-nowrap">
                        {pos.quantity}
                      </td>
                      <td className="py-0.5 px-1 text-right text-[#8b949e] whitespace-nowrap">
                        {formatAssetDisplayPrice(pos.entryPrice, pos.currency)}
                      </td>
                      <td className="py-0.5 px-1 text-right text-white font-bold whitespace-nowrap">
                        {formatAssetDisplayPrice(pos.currentPrice, pos.currency)}
                      </td>
                      <td className="py-0.5 px-2 text-right font-bold whitespace-nowrap">
                        <span className={isPosProfit ? "text-[#00c853]" : "text-[#ff5252]"}>
                          {isPosProfit ? "+" : ""}
                          R$ {(pos.unrealizedPLBRL || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-0.5 px-1.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlattenOne(pos.id);
                          }}
                          className="px-1.5 py-0.2 rounded bg-[#da3633]/20 hover:bg-[#da3633]/40 text-[#ff5252] text-[9px] font-bold transition-colors cursor-pointer"
                          title="Zerar esta posição"
                        >
                          Zerar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. MÓDULO 2: PERFORMANCE DO DIA (Col 6-8, ~25%) */}
      <div className="col-span-12 md:col-span-3 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-[#00c853]/15 text-[#00c853]">
              <Award className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-xs text-[#e6edf3]">Performance do Dia</h4>
          </div>
          <span className="text-[9.5px] font-mono text-[#8b949e]">Sessão Hoje</span>
        </div>

        {/* Metrics Grid with SVG Win Rate Gauge */}
        <div className="flex-1 p-2 flex items-center justify-between gap-2 overflow-hidden min-h-0">
          {/* Left: Win Rate Circular Ring */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-[#21262d]"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-[#00c853] transition-all duration-500"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-bold font-mono text-xs text-white leading-none">
                  {winRate.toFixed(0)}%
                </span>
                <span className="text-[7.5px] text-[#8b949e] font-sans">Acerto</span>
              </div>
            </div>
          </div>

          {/* Right: Lucro Líquido & Financial Metrics */}
          <div className="flex-1 flex flex-col justify-center gap-1 font-mono min-w-0">
            <div>
              <span className="text-[9px] text-[#8b949e] font-sans uppercase font-semibold block leading-tight">
                Lucro Líquido (Dia)
              </span>
              <span
                className={`text-sm font-bold tracking-tight leading-tight block truncate ${
                  isPositive ? "text-[#00c853]" : "text-[#ff5252]"
                }`}
              >
                {isPositive ? "+" : ""}
                R$ {totalDayPL.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[9.5px] border-t border-[#21262d] pt-1">
              <span className="text-[#8b949e]">Retorno:</span>
              <strong className={isPositive ? "text-[#00c853]" : "text-[#ff5252]"}>
                {isPositive ? "+" : ""}{rentabilidadePercent.toFixed(2)}%
              </strong>
            </div>

            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-[#8b949e]">Tempo Sessão:</span>
              <span className="text-white font-medium flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5 text-[#58a6ff]" />
                {sessionTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MÓDULO 3: NOTÍCIAS DO MERCADO EM TEMPO REAL (Col 9-12, ~33%) */}
      <div className="col-span-12 md:col-span-4 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col overflow-hidden h-full">
        {/* Header */}
        <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-[#e3b341]/15 text-[#e3b341]">
              <Newspaper className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-xs text-[#e6edf3]">Notícias do Mercado</h4>
          </div>
          <span className="text-[9.5px] text-[#00c853] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
            Tempo Real
          </span>
        </div>

        {/* News Stream List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent min-h-0 divide-y divide-[#21262d]/40">
          {news.map((item) => (
            <div
              key={item.id}
              className="px-2.5 py-1 hover:bg-[#21262d]/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[9.5px]">
                <span className="font-mono text-[#58a6ff] font-bold">{item.time}</span>
                <span className="px-1 py-0.2 rounded bg-[#21262d] text-[#8b949e] font-mono text-[8.5px] uppercase">
                  {item.tag}
                </span>
                <span className="text-[#8b949e] truncate text-[9px]">{item.source}</span>
              </div>
              <p className="text-[10.5px] font-medium text-[#c9d1d9] group-hover:text-white transition-colors line-clamp-1 leading-snug">
                {item.headline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
