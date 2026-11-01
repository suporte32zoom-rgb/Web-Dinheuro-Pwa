import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  fetchAllUnifiedCurrencies,
  subscribeToUnifiedCurrencies,
  economyItemToAsset,
  DEFAULT_UNIFIED_CURRENCIES,
} from "../services/unifiedCurrencyService";
import { AwesomeEconomyQuote, AwesomeEconomyResponse } from "../services/awesomeApi";
import { Asset } from "../types/finance";

interface GlobalEconomyWidgetProps {
  onSelectAsset?: (asset: Asset) => void;
  liveAssets?: Asset[];
}

export const GlobalEconomyWidget: React.FC<GlobalEconomyWidgetProps> = ({
  onSelectAsset,
  liveAssets = [],
}) => {
  const [data, setData] = useState<AwesomeEconomyResponse>(DEFAULT_UNIFIED_CURRENCIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "major" | "crypto" | "latam"
  >("major");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllUnifiedCurrencies();
      if (result && Object.keys(result).length > 0) {
        setData(result);
        setLastRefreshed(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    } catch (err: any) {
      console.warn("[GlobalEconomyWidget] Erro ao sincronizar cotações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carrega dados iniciais
    loadData();

    // Inscreve no barramento unificado de moedas
    const unsubscribe = subscribeToUnifiedCurrencies((quotes) => {
      setData(quotes);
      setLastRefreshed(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    });

    // Atualização periódica a cada 20s
    const interval = setInterval(loadData, 20000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const itemsList = useMemo(() => {
    if (!data) return [];
    const entries = (Object.entries(data) as [string, AwesomeEconomyQuote][]).map(([key, quote]) => ({
      key,
      ...quote,
      pctNum: Number(quote.pctChange || 0),
      bidNum: Number(quote.bid || 0),
      askNum: Number(quote.ask || 0),
      highNum: Number(quote.high || 0),
      lowNum: Number(quote.low || 0),
    }));

    return entries.filter((item) => {
      // Filtro de pesquisa
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filtros por categoria
      if (selectedFilter === "major") {
        return ["USD", "EUR", "GBP", "JPY", "CAD", "CHF", "AUD"].includes(item.code);
      }
      if (selectedFilter === "crypto") {
        return ["BTC", "ETH", "LTC", "XRP", "DOGE", "SOL"].includes(item.code);
      }
      if (selectedFilter === "latam") {
        return ["ARS", "CLP", "COP", "MXN", "UYU", "PEN"].includes(item.code);
      }
      return true;
    });
  }, [data, selectedFilter, searchQuery]);

  const handleCardClick = (item: AwesomeEconomyQuote) => {
    if (!onSelectAsset) return;
    const cleanCode = item.code.toLowerCase();
    const cleanCodein = item.codein.toLowerCase();
    const targetId = `${cleanCode}-${cleanCodein}`;

    // Procura ativo correspondente no catálogo liveAssets
    const existingAsset = liveAssets.find(
      (a) =>
        a.id.toLowerCase() === targetId ||
        a.id.toLowerCase().replace(/[-_]/g, "") === `${cleanCode}${cleanCodein}` ||
        a.ticker.toLowerCase() === `${cleanCode}/${cleanCodein}` ||
        (a.category === "Criptomoedas" && a.ticker.toLowerCase() === cleanCode)
    );

    const asset = economyItemToAsset(item, existingAsset);
    onSelectAsset(asset);
  };

  return (
    <div className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-xl mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#21262d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f6feb]/20 to-[#00c853]/20 border border-[#1f6feb]/30 flex items-center justify-center text-[#58a6ff]">
            <Globe className="w-5 h-5 text-[#58a6ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#e6edf3]">
                Economia Global & Cotações em Tempo Real
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00c853]/15 text-[#00c853] text-[10px] font-mono font-bold border border-[#00c853]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse"></span>
                Sincronizado Oficial
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Moedas globais, criptos, valores de compra/venda e detalhes interativos em tempo real
            </p>
          </div>
        </div>

        {/* Refresh & Last Updated */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-[#8b949e]">
              Atualizado: {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border border-[#30363d] text-xs font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            title="Atualizar dados da economia agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-3 border-b border-[#21262d]/60">
        <div className="flex items-center gap-1.5 overflow-x-auto nav-scroll-container touch-scroll-x pb-1 sm:pb-0 flex-nowrap">
          {[
            { id: "major", label: "Moedas Principais" },
            { id: "crypto", label: "Criptomoedas" },
            { id: "latam", label: "América Latina" },
            { id: "all", label: "Todas as Moedas" },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedFilter === tab.id
                  ? "bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                  : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por moeda ou par (ex: USD, EUR, BTC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>
      </div>

      {/* Grid of Economic Indicators */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0e1117] border border-[#30363d]/60 rounded-xl p-4 animate-pulse space-y-3"
            >
              <div className="h-4 bg-[#21262d] rounded w-2/3"></div>
              <div className="h-6 bg-[#21262d] rounded w-1/2"></div>
              <div className="h-3 bg-[#21262d] rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs text-[#ff5252] space-y-2">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-[#21262d] text-[#e6edf3] rounded-lg hover:bg-[#30363d] text-xs transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : itemsList.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8b949e]">
          Nenhum indicador econômico encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-4">
          {itemsList.slice(0, 16).map((item) => {
            const isUp = item.pctNum >= 0;
            const pairDisplay = `${item.code} / ${item.codein}`;
            const isUSD = item.codein === "USD";
            const isEUR = item.codein === "EUR";
            const prefix = item.codein === "BRL" ? "R$ " : isUSD ? "US$ " : isEUR ? "€ " : `${item.codein} `;
            const formatNum = (num: number) => {
              if (isUSD) {
                return num >= 1000
                  ? num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : num.toFixed(4);
              }
              return num >= 1000
                ? num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : num.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
            };

            return (
              <div
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
                className="bg-[#0e1117] hover:bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/60 hover:shadow-lg rounded-xl p-4 transition-all duration-150 flex flex-col justify-between group shadow-sm cursor-pointer select-none"
                title={`Clique para ver o gráfico e análise detalhada de ${pairDisplay}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#58a6ff] group-hover:text-white transition-colors flex items-center gap-1">
                      <span>{pairDisplay}</span>
                      <ChevronRight className="w-3 h-3 text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isUp
                          ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                          : "bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isUp ? "+" : ""}
                        {item.pctNum.toFixed(2)}%
                      </span>
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-[#e6edf3] truncate mb-2 group-hover:text-[#58a6ff] transition-colors" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Preço Principal (Compra) */}
                  <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#21262d]">
                    <span className="text-[11px] text-[#8b949e]">Compra:</span>
                    <span className="text-base font-extrabold font-mono text-white group-hover:text-[#58a6ff] transition-colors">
                      {prefix}{formatNum(item.bidNum)}
                    </span>
                  </div>
                </div>

                {/* Detalhes: Venda, Máxima, Mínima, Tendência */}
                <div className="space-y-1 text-[11px] font-mono text-[#8b949e]">
                  <div className="flex items-center justify-between">
                    <span>Venda:</span>
                    <span className="text-[#e6edf3]">
                      {prefix}{formatNum(item.askNum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Máx. / Mín. Dia:</span>
                    <span className="text-[#e6edf3]">
                      {prefix}{item.highNum >= 1000 ? item.highNum.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : formatNum(item.highNum)} / {prefix}{item.lowNum >= 1000 ? item.lowNum.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : formatNum(item.lowNum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#21262d]/50">
                    <span className="text-[10px]">Tendência:</span>
                    <span
                      className={`text-[10px] font-bold ${
                        isUp ? "text-[#00c853]" : "text-[#ff5252]"
                      }`}
                    >
                      {isUp ? "Alta Diária" : "Queda Diária"} ({item.varBid >= "0" ? "+" : ""}{Number(item.varBid).toFixed(4)})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#58a6ff] opacity-80 pt-1 group-hover:opacity-100 flex items-center justify-end gap-1">
                    <span>Ver análise completa</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
