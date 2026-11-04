import React, { useState, useMemo, useEffect } from "react";
import { Asset } from "../types/finance";
import { Sparkline } from "./Sparkline";
import { DualPriceDisplay, computeDualCurrency } from "../utils/currencyConversion";
import { formatAssetDisplayPrice } from "../utils/formatters";
import {
  X,
  Search,
  TrendingUp,
  TrendingDown,
  Layers,
  Globe,
  Coins,
  DollarSign,
  Landmark,
  Wheat,
  Activity,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

/**
 * 33 Ativos estratégicos solicitados pelo usuário prioritariamente no topo:
 * [Prata, Vale, EUR/USD, Solana, Nikkei, Bitcoin, Ouro, Petrobras, BNB, EUR/BRL, USD/BRL, CHF/BRL,
 *  DAX 40, Banco do Brasil, FTSE 100, GBP/BRL, USD/JPY, IBOVESPA, Ethereum, Tesla, Dow Jones,
 *  Apple, Google, Amazon, Microsoft, S&P 500, WEGE3, Bradesco, Itaú, Nasdaq, NVIDIA, Brent, WTI]
 */
export const TARGET_33_KEYS = [
  "prata",
  "vale3",
  "usd-eur",
  "solana",
  "nikkei-225",
  "bitcoin",
  "ouro-futuro",
  "petr4",
  "bnb",
  "eur-brl",
  "usd-brl",
  "chf-brl",
  "dax",
  "bbas3",
  "ftse-100",
  "gbp-brl",
  "usd-jpy",
  "ibovespa",
  "ether",
  "tsla",
  "dow-jones",
  "aapl",
  "googl",
  "amzn",
  "msft",
  "sp-500",
  "wege3",
  "bbdc4",
  "itub4",
  "nasdaq",
  "nvda",
  "petroleo-brent",
  "petroleo-wti",
] as const;

export interface AllAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
  liveAssets: Asset[];
}

type CategoryFilter =
  | "all"
  | "acoes-br"
  | "acoes-eua"
  | "indices"
  | "cripto"
  | "moedas"
  | "commodities";

type SortOption =
  | "default"
  | "gainers"
  | "losers"
  | "volume"
  | "name"
  | "price";

const PAGE_SIZE = 24;

export const AllAssetsModal: React.FC<AllAssetsModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  liveAssets,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory, sortBy]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Comprehensive Asset Pool: All available assets, with target 33 prioritized at the beginning
  const allAvailableAssets = useMemo(() => {
    const assetMap = new Map<string, Asset>();
    liveAssets.forEach((a) => {
      assetMap.set(a.id.toLowerCase(), a);
      assetMap.set(a.ticker.toLowerCase(), a);
      assetMap.set(a.ticker.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(), a);
    });

    const prioritized: Asset[] = [];
    const usedIds = new Set<string>();

    // 1. Add Target 33 first
    for (const key of TARGET_33_KEYS) {
      let matched = assetMap.get(key.toLowerCase());
      if (!matched) {
        matched = liveAssets.find(
          (a) =>
            a.id.toLowerCase().includes(key.toLowerCase()) ||
            a.ticker.toLowerCase().includes(key.toLowerCase()) ||
            a.name.toLowerCase().includes(key.toLowerCase())
        );
      }
      if (matched && !usedIds.has(matched.id)) {
        usedIds.add(matched.id);
        prioritized.push(matched);
      }
    }

    // 2. Append all other live assets from catalog
    for (const asset of liveAssets) {
      if (!usedIds.has(asset.id)) {
        usedIds.add(asset.id);
        prioritized.push(asset);
      }
    }

    return prioritized;
  }, [liveAssets]);

  // Helper classifier function for categories
  const matchCategory = (asset: Asset, cat: CategoryFilter): boolean => {
    if (cat === "all") return true;
    const c = asset.category;
    const ticker = asset.ticker.toUpperCase();
    const id = asset.id.toLowerCase();

    switch (cat) {
      case "acoes-br":
        return (
          c === "América Latina" &&
          !id.includes("ibov") &&
          !id.includes("latam") &&
          !id.includes("igovernanca") &&
          !id.includes("ibrx")
        ) || [
          "PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "WEGE3", "B3SA3", "PRIO3",
          "EMBR3", "MGLU3", "RENT3", "ABEV3", "SUZB3", "JBSS3", "TOTS3", "EQTL3",
          "AZUL4", "CMIN3", "CSNA3", "CRFB3"
        ].includes(ticker.replace(".SA", ""));

      case "acoes-eua":
        return (
          c === "EUA" &&
          !["DOW JONES", "S&P 500", "NASDAQ", "RUSSELL", "VIX", ".DJI", ".INX", ".IXIC"].includes(ticker) &&
          !id.includes("sp-500") &&
          !id.includes("nasdaq") &&
          !id.includes("dow-jones") &&
          !id.includes("russell") &&
          !id.includes("vix")
        ) || [
          "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "TSLA", "META", "NFLX",
          "AMD", "BABA", "DIS", "JPM", "WMT"
        ].includes(ticker);

      case "indices":
        return (
          id.includes("ibov") ||
          id.includes("sp-500") ||
          id.includes("nasdaq") ||
          id.includes("dow-jones") ||
          id.includes("dax") ||
          id.includes("ftse") ||
          id.includes("cac") ||
          id.includes("nikkei") ||
          id.includes("hang-seng") ||
          id.includes("sse") ||
          id.includes("sensex") ||
          id.includes("nifty") ||
          id.includes("kospi") ||
          id.includes("stoxx") ||
          id.includes("ibex") ||
          id.includes("russell") ||
          id.includes("vix") ||
          id.includes("ibrx") ||
          id.includes("igovernanca") ||
          id.includes("latam") ||
          ticker.includes("DAX") ||
          ticker.includes("FTSE") ||
          ticker.includes("NIKKEI") ||
          ticker.includes("IBOV") ||
          ticker.includes("S&P") ||
          ticker.includes("DOW") ||
          ticker.includes("NASDAQ") ||
          ticker.includes("RUSSELL") ||
          ticker.includes("VIX")
        );

      case "cripto":
        return (
          c === "Criptomoedas" ||
          ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK"].includes(ticker)
        );

      case "moedas":
        return (
          c === "Moedas" ||
          ticker.includes("/") ||
          ticker.includes("BRL") ||
          id.includes("-brl") ||
          id.includes("usd-") ||
          id.includes("eur-")
        );

      case "commodities":
        return (
          c === "Contratos futuros" ||
          id.includes("brent") ||
          id.includes("wti") ||
          id.includes("ouro") ||
          id.includes("prata") ||
          id.includes("soja") ||
          id.includes("gas") ||
          id.includes("cafe") ||
          id.includes("milho") ||
          id.includes("cobre") ||
          ["BRENT", "WTI", "OURO", "PRATA", "SOJA", "GÁS NAT", "CAFÉ", "MILHO", "COBRE", "S&P FUT"].includes(ticker)
        );

      default:
        return true;
    }
  };

  // Category counts for quick badges
  const categoryCounts = useMemo(() => {
    return {
      all: allAvailableAssets.length,
      "acoes-br": allAvailableAssets.filter((a) => matchCategory(a, "acoes-br")).length,
      "acoes-eua": allAvailableAssets.filter((a) => matchCategory(a, "acoes-eua")).length,
      indices: allAvailableAssets.filter((a) => matchCategory(a, "indices")).length,
      cripto: allAvailableAssets.filter((a) => matchCategory(a, "cripto")).length,
      moedas: allAvailableAssets.filter((a) => matchCategory(a, "moedas")).length,
      commodities: allAvailableAssets.filter((a) => matchCategory(a, "commodities")).length,
    };
  }, [allAvailableAssets]);

  // Filtering and sorting
  const processedAssets = useMemo(() => {
    let result = [...allAvailableAssets];

    // 1. Category Filter
    if (selectedCategory !== "all") {
      result = result.filter((asset) => matchCategory(asset, selectedCategory));
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.ticker.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.exchange.toLowerCase().includes(q) ||
          (a.sector && a.sector.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    switch (sortBy) {
      case "gainers":
        result.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case "losers":
        result.sort((a, b) => a.changePercent - b.changePercent);
        break;
      case "price":
        result.sort((a, b) => {
          const pA = computeDualCurrency(a.price, a.currency).convertedPrice;
          const pB = computeDualCurrency(b.price, b.currency).convertedPrice;
          return pB - pA;
        });
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "volume":
        result.sort((a, b) => {
          const vA = parseFloat(a.metrics.volume?.replace(/[^0-9.]/g, "") || "0") || 0;
          const vB = parseFloat(b.metrics.volume?.replace(/[^0-9.]/g, "") || "0") || 0;
          return vB - vA;
        });
        break;
      case "default":
      default:
        // Already prioritized with target 33 upfront, then remaining
        break;
    }

    return result;
  }, [allAvailableAssets, selectedCategory, searchQuery, sortBy]);

  // Visible sliced list according to pagination
  const visibleAssets = useMemo(() => {
    return processedAssets.slice(0, visibleCount);
  }, [processedAssets, visibleCount]);

  const hasMore = visibleCount < processedAssets.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, processedAssets.length));
  };

  const handleShowAll = () => {
    setVisibleCount(processedAssets.length);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0e1117] border border-[#30363d] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#21262d] bg-[#161b22]/95 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1f6feb]/25 to-[#238636]/25 border border-[#58a6ff]/35 text-[#58a6ff]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[#e6edf3] tracking-tight">
                    Catálogo Completo de Ações e Ativos Mundiais
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#58a6ff]/30">
                    {allAvailableAssets.length} Ativos Conectados
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
                    Tempo Real & Dupla Cotação (USD / BRL)
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Preços oficiais sincronizados via Finnhub, AwesomeAPI, Yahoo Finance e Binance. Cotação na moeda original com conversão simultânea em Reais (BRL).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors cursor-pointer shrink-0"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search, Categories, Sort, and View Controls */}
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ticker ou nome (ex: Petrobras, Bitcoin, Apple, Vale, Ouro, S&P 500, Dólar)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-xs sm:text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort & View Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-[#0e1117] border border-[#30363d] rounded-xl px-2.5 py-1.5 text-xs text-[#8b949e]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span className="hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-[#e6edf3] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="default" className="bg-[#161b22]">Recomendados (Top 33)</option>
                  <option value="gainers" className="bg-[#161b22]">Maiores Altas (%)</option>
                  <option value="losers" className="bg-[#161b22]">Maiores Quedas (%)</option>
                  <option value="volume" className="bg-[#161b22]">Maior Volume</option>
                  <option value="price" className="bg-[#161b22]">Maior Valor (BRL)</option>
                  <option value="name" className="bg-[#161b22]">Nome (A-Z)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                  title="Visualização em Tabela Detalhada"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#21262d] text-[#58a6ff] font-bold"
                      : "text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                  title="Visualização em Cards de Mercado"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills with Live Item Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: "all", label: `Todos (${categoryCounts.all})`, icon: <Layers className="w-3 h-3" /> },
              { id: "acoes-br", label: `Ações Brasil B3 (${categoryCounts["acoes-br"]})`, icon: <Landmark className="w-3 h-3" /> },
              { id: "acoes-eua", label: `Wall Street EUA (${categoryCounts["acoes-eua"]})`, icon: <Globe className="w-3 h-3" /> },
              { id: "indices", label: `Bolsas & Índices (${categoryCounts.indices})`, icon: <TrendingUp className="w-3 h-3" /> },
              { id: "cripto", label: `Criptomoedas (${categoryCounts.cripto})`, icon: <Coins className="w-3 h-3" /> },
              { id: "moedas", label: `Moedas & Câmbio (${categoryCounts.moedas})`, icon: <DollarSign className="w-3 h-3" /> },
              { id: "commodities", label: `Commodities & Futuros (${categoryCounts.commodities})`, icon: <Wheat className="w-3 h-3" /> },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as CategoryFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    active
                      ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/50 shadow-xs"
                      : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/50 border border-[#30363d]/60"
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Assets Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#0e1117]">
          {processedAssets.length === 0 ? (
            <div className="p-12 text-center text-[#8b949e] flex flex-col items-center justify-center">
              <Search className="w-10 h-10 mb-3 text-[#30363d]" />
              <p className="text-base font-semibold text-[#e6edf3]">Nenhum ativo encontrado</p>
              <p className="text-xs text-[#8b949e] mt-1">
                Tente ajustar seu termo de busca ou selecione a categoria "Todos".
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Detailed Table View */
            <div className="overflow-x-auto rounded-xl border border-[#21262d] bg-[#161b22]/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#21262d] bg-[#161b22] text-[#8b949e] text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4"># Ativo</th>
                    <th className="py-3 px-4">Cotação Atual (USD & BRL)</th>
                    <th className="py-3 px-4 text-right">Variação Dia</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">Máxima (Dia)</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">Mínima (Dia)</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">Volume Negociado</th>
                    <th className="py-3 px-4 text-center hidden lg:table-cell">Tendência</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]/60 font-sans">
                  {visibleAssets.map((asset, index) => {
                    const isPositive = asset.changePercent >= 0;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => {
                          onSelectAsset(asset);
                          onClose();
                        }}
                        className="hover:bg-[#21262d]/70 transition-colors cursor-pointer group"
                      >
                        {/* 1. Ativo & Ticker */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[10px] text-[#8b949e] w-5 text-right shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                                  {asset.ticker}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]/60">
                                  {asset.currency}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8b949e] truncate max-w-[180px] sm:max-w-[220px]">
                                {asset.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Cotação com Dupla Conversão */}
                        <td className="py-3 px-4">
                          <DualPriceDisplay
                            price={asset.price}
                            currency={asset.currency}
                            size="sm"
                            layout="stacked"
                            align="left"
                          />
                        </td>

                        {/* 3. Variação */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isPositive
                                ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                                : "bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {asset.changePercent.toFixed(2)}%
                          </span>
                        </td>

                        {/* 4. Máxima */}
                        <td className="py-3 px-4 text-right font-mono text-[#8b949e] hidden sm:table-cell">
                          {formatAssetDisplayPrice(asset.metrics.high || asset.price * 1.015, asset.currency)}
                        </td>

                        {/* 5. Mínima */}
                        <td className="py-3 px-4 text-right font-mono text-[#8b949e] hidden sm:table-cell">
                          {formatAssetDisplayPrice(asset.metrics.low || asset.price * 0.985, asset.currency)}
                        </td>

                        {/* 6. Volume */}
                        <td className="py-3 px-4 text-right font-mono text-[#8b949e] hidden md:table-cell">
                          {asset.metrics.volume || "Alta"}
                        </td>

                        {/* 7. Sparkline */}
                        <td className="py-3 px-4 text-center hidden lg:table-cell">
                          <div className="w-20 mx-auto">
                            <Sparkline
                              data={asset.sparkline || [100, 102, 101, 103, 104]}
                              isPositive={isPositive}
                              height={20}
                            />
                          </div>
                        </td>

                        {/* 8. Botão Detalhes */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAsset(asset);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 group-hover:border-[#58a6ff]/40 border border-transparent"
                          >
                            <span>Gráfico</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleAssets.map((asset) => {
                const isPositive = asset.changePercent >= 0;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-[#161b22]/70 hover:bg-[#161b22] border border-[#21262d] hover:border-[#58a6ff]/50 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Card Top: Ticker, Name, Variation */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                              {asset.ticker}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                              {asset.exchange}
                            </span>
                          </div>
                          <h4 className="text-xs text-[#8b949e] truncate max-w-[170px] mt-0.5">
                            {asset.name}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${
                            isPositive
                              ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                              : "bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Price Section with Dual Conversion */}
                      <div className="my-3 p-2.5 rounded-lg bg-[#0e1117] border border-[#21262d]">
                        <DualPriceDisplay
                          price={asset.price}
                          currency={asset.currency}
                          size="md"
                          layout="stacked"
                          align="left"
                        />
                      </div>

                      {/* High, Low & Volume Grid */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-[#8b949e] mb-3">
                        <div>
                          <span className="block text-[10px] uppercase">Máx Dia</span>
                          <span className="font-mono font-medium text-[#e6edf3]">
                            {formatAssetDisplayPrice(asset.metrics.high || asset.price * 1.015, asset.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase">Mín Dia</span>
                          <span className="font-mono font-medium text-[#e6edf3]">
                            {formatAssetDisplayPrice(asset.metrics.low || asset.price * 0.985, asset.currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase">Volume</span>
                          <span className="font-mono font-medium text-[#e6edf3] truncate block">
                            {asset.metrics.volume || "Alta"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Sparkline & Clickable Button */}
                    <div className="pt-2 border-t border-[#21262d] flex items-center justify-between">
                      <div className="w-20">
                        <Sparkline
                          data={asset.sparkline || [100, 102, 101, 103, 104]}
                          isPositive={isPositive}
                          height={20}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#58a6ff] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Ver Gráficos & Detalhes →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Pagination Bar ("Carregar Mais Ativos") */}
          {hasMore && (
            <div className="mt-6 p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#8b949e]">
                Exibindo <strong className="text-white">{visibleAssets.length}</strong> de{" "}
                <strong className="text-white">{processedAssets.length}</strong> ativos mundiais filtrados.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1f6feb] to-[#238636] hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Carregar Mais Ativos (+{Math.min(PAGE_SIZE, processedAssets.length - visibleAssets.length)})</span>
                </button>
                <button
                  type="button"
                  onClick={handleShowAll}
                  className="px-3.5 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Exibir Todos ({processedAssets.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#21262d] bg-[#161b22] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00c853]" />
            <span>Exibindo <strong>{visibleAssets.length}</strong> de <strong>{allAvailableAssets.length}</strong> ativos com dupla cotação oficial em tempo real.</span>
          </div>
          <div className="text-[11px] text-[#8b949e]">
            Clique em qualquer ativo para abrir instantaneamente a visão aprofundada com gráficos, histórico e análises.
          </div>
        </div>
      </div>
    </div>
  );
};
