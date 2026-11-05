import React, { useState } from "react";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  Percent,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileSpreadsheet,
} from "lucide-react";

interface FixedIncomeAndDerivativesViewProps {
  onSelectDerivative?: (ticker: string) => void;
}

export const FixedIncomeAndDerivativesView: React.FC<FixedIncomeAndDerivativesViewProps> = ({
  onSelectDerivative,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<"di" | "tesouro" | "futuros" | "opcoes">("di");

  // DI Futures Curve Data
  const diContracts = [
    { ticker: "DI1F26", maturity: "Jan 2026", rate: 14.85, changeBps: 2.5, volume: "185.000 contratos" },
    { ticker: "DI1F27", maturity: "Jan 2027", rate: 14.42, changeBps: -4.0, volume: "320.000 contratos" },
    { ticker: "DI1F28", maturity: "Jan 2028", rate: 14.15, changeBps: -6.5, volume: "240.000 contratos" },
    { ticker: "DI1F29", maturity: "Jan 2029", rate: 13.92, changeBps: -8.0, volume: "410.000 contratos" },
    { ticker: "DI1F31", maturity: "Jan 2031", rate: 13.78, changeBps: -5.0, volume: "195.000 contratos" },
    { ticker: "DI1F33", maturity: "Jan 2033", rate: 13.84, changeBps: 1.5, volume: "110.000 contratos" },
  ];

  // Tesouro Direto Government Bonds
  const tesouroBonds = [
    { name: "Tesouro Selic 2029", indexer: "Selic + 0,15%", pu: 15420.50, minInvest: 154.20, maturity: "01/03/2029", type: "Pós-fixado" },
    { name: "Tesouro IPCA+ 2029", indexer: "IPCA + 6,85%", pu: 3410.80, minInvest: 34.10, maturity: "15/08/2029", type: "Inflação" },
    { name: "Tesouro IPCA+ 2035", indexer: "IPCA + 6,92%", pu: 2185.40, minInvest: 32.78, maturity: "15/05/2035", type: "Inflação" },
    { name: "Tesouro IPCA+ 2045", indexer: "IPCA + 6,98%", pu: 1240.10, minInvest: 37.20, maturity: "15/05/2045", type: "Inflação" },
    { name: "Tesouro Prefixado 2027", indexer: "12,85% a.a.", pu: 785.40, minInvest: 39.27, maturity: "01/01/2027", type: "Prefixado" },
    { name: "Tesouro Prefixado 2031", indexer: "13,15% a.a.", pu: 512.30, minInvest: 35.86, maturity: "01/01/2031", type: "Prefixado" },
  ];

  // Futures Contracts (Agro & Financial)
  const futuresContracts = [
    { ticker: "WIN$ (Mini Índice)", name: "Mini Contrato Futuro de Ibovespa", points: "167.548 pts", margin: "R$ 100,00", tick: "5 pts (R$ 1,00)" },
    { ticker: "WDO$ (Mini Dólar)", name: "Mini Contrato de Dólar Comercial", points: "5.459,60 pts", margin: "R$ 150,00", tick: "0,5 pt (R$ 5,00)" },
    { ticker: "CCM (Milho Futuro)", name: "Contrato Futuro de Milho em Grão B3", points: "R$ 72,40 / saca", margin: "R$ 1.200,00", tick: "R$ 0,01" },
    { ticker: "BGI (Boi Gordo)", name: "Contrato Futuro de Boi Gordo B3", points: "R$ 315,50 / arroba", margin: "R$ 1.800,00", tick: "R$ 0,05" },
    { ticker: "ES=F (S&P 500 Futuro)", name: "E-mini S&P 500 CME Group", points: "7.705,00 pts", margin: "US$ 1.250,00", tick: "0,25 pt" },
    { ticker: "CL=F (Petróleo WTI)", name: "Petróleo Leve Futuro NYMEX", points: "US$ 88,74 / barril", margin: "US$ 1.800,00", tick: "US$ 0,01" },
  ];

  // Liquid Stock Options (Calls & Puts)
  const liquidOptions = [
    { ticker: "PETRK470", underlying: "PETR4", type: "CALL", strike: 47.00, price: 1.45, change: 8.2, iv: "32,4%", delta: "0.58" },
    { ticker: "PETRW470", underlying: "PETR4", type: "PUT", strike: 47.00, price: 1.10, change: -11.5, iv: "31,8%", delta: "-0.42" },
    { ticker: "VALEK620", underlying: "VALE3", type: "CALL", strike: 62.00, price: 1.82, change: 4.5, iv: "28,6%", delta: "0.52" },
    { ticker: "VALEW620", underlying: "VALE3", type: "PUT", strike: 62.00, price: 1.35, change: -6.2, iv: "29,1%", delta: "-0.48" },
    { ticker: "ITUBK390", underlying: "ITUB4", type: "CALL", strike: 39.00, price: 1.15, change: 2.1, iv: "22,5%", delta: "0.61" },
    { ticker: "BBDCK150", underlying: "BBDC4", type: "CALL", strike: 15.00, price: 0.65, change: 6.8, iv: "26,4%", delta: "0.55" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#e3b341]/20 to-[#1f6feb]/20 border border-[#e3b341]/40 text-[#e3b341]">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Renda Fixa, Curva de Juros & Derivativos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30">
                B3 & Tesouro Direto
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Monitoramento dos vértices de DI Futuro, precificação de títulos públicos, contratos futuros e volatilidade de opções.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Selector */}
        <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-1 gap-1 w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubTab("di")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubTab === "di"
                ? "bg-[#21262d] text-[#e3b341] border border-[#e3b341]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Curva DI1 Futuro
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab("tesouro")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubTab === "tesouro"
                ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Tesouro Direto
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab("futuros")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubTab === "futuros"
                ? "bg-[#21262d] text-[#00c853] border border-[#00c853]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Contratos Futuros
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab("opcoes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubTab === "opcoes"
                ? "bg-[#21262d] text-[#bc8cff] border border-[#bc8cff]/40 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            Opções Líquidas
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DI FUTURES CURVE */}
      {selectedSubTab === "di" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-bold text-white">Vértices da Curva de Juros DI1 (B3)</h3>
              <p className="text-xs text-[#8b949e]">Taxas negociadas para hedge de inflação e títulos prefixados</p>
            </div>
            <span className="text-xs font-mono text-[#00c853] bg-[#00c853]/10 px-2 py-0.5 rounded border border-[#00c853]/30">
              Taxa Selic Meta: 14,25% a.a.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {diContracts.map((c) => {
              const isUp = c.changeBps >= 0;
              return (
                <div
                  key={c.ticker}
                  className="p-3.5 rounded-xl bg-[#0e1117] border border-[#21262d] hover:border-[#e3b341]/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-white">{c.ticker}</span>
                      <span className="block text-[11px] text-[#8b949e]">Vencimento: {c.maturity}</span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isUp ? "bg-[#ff5252]/15 text-[#ff5252]" : "bg-[#00c853]/15 text-[#00c853]"
                      }`}
                    >
                      {isUp ? "+" : ""}{c.changeBps} bps
                    </span>
                  </div>

                  <div className="my-2">
                    <span className="text-xl font-mono font-bold text-[#e3b341]">
                      {c.rate.toFixed(2)}% <span className="text-xs text-[#8b949e]">a.a.</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#21262d] text-[10px] text-[#8b949e] flex justify-between">
                    <span>Volume:</span>
                    <span className="font-mono">{c.volume}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TESOURO DIRETO */}
      {selectedSubTab === "tesouro" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-bold text-white">Títulos do Tesouro Nacional (Tesouro Direto)</h3>
              <p className="text-xs text-[#8b949e]">Preço unitário, rentabilidade anual e aplicação mínima</p>
            </div>
            <span className="text-xs text-[#8b949e]">Garantia 100% do Tesouro Nacional</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Rentabilidade Anual</th>
                  <th className="py-2.5 px-3 text-right">Preço Unitário (PU)</th>
                  <th className="py-2.5 px-3 text-right">Aplicação Mínima</th>
                  <th className="py-2.5 px-3 text-right">Vencimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/60 font-mono">
                {tesouroBonds.map((b) => (
                  <tr key={b.name} className="hover:bg-[#21262d]/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{b.name}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#21262d] text-[#8b949e]">
                        {b.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#00c853] font-bold">{b.indexer}</td>
                    <td className="py-2.5 px-3 text-right text-white">
                      R$ {b.pu.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#58a6ff]">
                      R$ {b.minInvest.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#8b949e]">{b.maturity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FUTURES CONTRACTS */}
      {selectedSubTab === "futuros" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-bold text-white">Contratos Futuros de Commodities & Índices</h3>
              <p className="text-xs text-[#8b949e]">Alavancagem, margem de garantia e especificações de tick</p>
            </div>
            <span className="text-xs text-[#00c853] bg-[#00c853]/15 px-2 py-0.5 rounded border border-[#00c853]/30">
              Negociação Intraday Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {futuresContracts.map((f) => (
              <div
                key={f.ticker}
                className="p-4 rounded-xl bg-[#0e1117] border border-[#21262d] hover:border-[#00c853]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sm text-white">{f.ticker}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                      Futuro
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e]">{f.name}</p>
                </div>

                <div className="my-3 p-2 rounded-lg bg-[#161b22] border border-[#21262d] flex items-center justify-between">
                  <span className="text-xs text-[#8b949e]">Cotação / Pontos:</span>
                  <span className="text-sm font-mono font-bold text-white">{f.points}</span>
                </div>

                <div className="text-[11px] text-[#8b949e] space-y-1">
                  <div className="flex justify-between">
                    <span>Margem Day Trade:</span>
                    <span className="font-mono font-bold text-[#e3b341]">{f.margin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variação Mínima (Tick):</span>
                    <span className="font-mono">{f.tick}</span>
                  </div>
                </div>

                {onSelectDerivative && (
                  <button
                    type="button"
                    onClick={() => onSelectDerivative(f.ticker.split(" ")[0])}
                    className="mt-3 w-full py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Operar no Terminal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LIQUID OPTIONS */}
      {selectedSubTab === "opcoes" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-bold text-white">Mercado de Opções de Ações (Calls & Puts)</h3>
              <p className="text-xs text-[#8b949e]">Séries mais líquidas de Petrobras, Vale e bancos na B3</p>
            </div>
            <span className="text-xs text-[#8b949e]">Vencimento Mensal Terceira Sexta-Feira</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#0e1117] text-[#8b949e] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Código Opção</th>
                  <th className="py-2.5 px-3">Ativo Objeto</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Strike (R$)</th>
                  <th className="py-2.5 px-3 text-right">Prêmio Atual</th>
                  <th className="py-2.5 px-3 text-right">Variação %</th>
                  <th className="py-2.5 px-3 text-right">Volatilidade (IV)</th>
                  <th className="py-2.5 px-3 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]/60 font-mono">
                {liquidOptions.map((opt) => (
                  <tr key={opt.ticker} className="hover:bg-[#21262d]/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-white">{opt.ticker}</td>
                    <td className="py-2.5 px-3 font-sans text-[#8b949e]">{opt.underlying}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          opt.type === "CALL"
                            ? "bg-[#00c853]/20 text-[#00c853]"
                            : "bg-[#ff5252]/20 text-[#ff5252]"
                        }`}
                      >
                        {opt.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">
                      R$ {opt.strike.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#e6edf3]">
                      R$ {opt.price.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        opt.change >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                      }`}
                    >
                      {opt.change >= 0 ? "+" : ""}{opt.change.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#bc8cff]">{opt.iv}</td>
                    <td className="py-2.5 px-3 text-right text-[#8b949e]">{opt.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
