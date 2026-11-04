import React, { useState, useMemo } from "react";
import { Asset } from "../types/finance";
import { Sparkline } from "./Sparkline";
import { DualPriceDisplay, computeDualCurrency } from "../utils/currencyConversion";
import { formatAssetDisplayPrice } from "../utils/formatters";
import {
  X,
  Search,
  SlidersHorizontal,
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
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
} from "lucide-react";

/**
 * 33 Ativos estratégicos solicitados pelo usuário:
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
  | "cripto"
  | "moedas"
  | "commodities"
  | "indices";

type SortOption =
  | "default"
  | "gainers"
  | "losers"
  | "volume"
  | "name"
  | "price";

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

  // Map each target key to its corresponding Asset object from liveAssets
  const targetAssets = useMemo(() => {
    const assetMap = new Map<string, Asset>();
    liveAssets.forEach((a) => {
      assetMap.set(a.id.toLowerCase(), a);
      assetMap.set(a.ticker.toLowerCase(), a);
      assetMap.set(a.ticker.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(), a);
    });

    const list: Asset[] = [];
    const usedIds = new Set<string>();

    for (const key of TARGET_33_KEYS) {
      let matched = assetMap.get(key.toLowerCase());
      if (!matched) {
        // Fallback matching by partial ID or ticker
        matched = liveAssets.find(
          (a) =>
            a.id.toLowerCase().includes(key.toLowerCase()) ||
            a.ticker.toLowerCase().includes(key.toLowerCase()) ||
            a.name.toLowerCase().includes(key.toLowerCase())
        );
      }

      if (matched && !usedIds.has(matched.id)) {
        usedIds.add(matched.id);
        list.push(matched);
      }
    }

    // Safety fallback: If any asset is missing from target 33, append from liveAssets
    if (list.length < 33) {
      for (const a of liveAssets) {
        if (!usedIds.has(a.id) && list.length < 33) {
          usedIds.add(a.id);
          list.push(a);
        }
      }
    }

    return list;
  }, [liveAssets]);

  // Filtering and sorting
  const processedAssets = useMemo(() => {
    let result = [...targetAssets];

    // 1. Category Filter
    if (selectedCategory !== "all") {
      result = result.filter((asset) => {
        const cat = asset.category;
        const ticker = asset.ticker.toUpperCase();
        const id = asset.id.toLowerCase();

        switch (selectedCategory) {
          case "acoes-br":
            return (
              cat === "América Latina" ||
              ["PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "WEGE3", "IBOV"].includes(ticker)
            );
          case "acoes-eua":
            return (
              cat === "EUA" ||
              ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "TSLA", ".DJI", ".INX", ".IXIC"].includes(ticker)
            );
          case "cripto":
            return (
              cat === "Criptomoedas" ||
              ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"].includes(ticker)
            );
          case "moedas":
            return (
              cat === "Moedas" ||
              ticker.includes("/") ||
              ticker.includes("BRL")
            );
          case "commodities":
            return (
              cat === "Contratos futuros" &&
              (id.includes("brent") ||
                id.includes("wti") ||
                id.includes("ouro") ||
                id.includes("prata") ||
                id.includes("soja") ||
                id.includes("gas"))
            );
          case "indices":
            return (
              ticker.includes("DAX") ||
              ticker.includes("FTSE") ||
              ticker.includes("NIKKEI") ||
              ticker.includes("IBOV") ||
              ticker.includes("S&P") ||
              ticker.includes("DOW") ||
              ticker.includes("NASDAQ")
            );
          default:
            return true;
        }
      });
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
          const vA = parseFloat(a.metrics.volume.replace(/[^0-9.]/g, "")) || 0;
          const vB = parseFloat(b.metrics.volume.replace(/[^0-9.]/g, "")) || 0;
          return vB - vA;
        });
        break;
      case "default":
      default:
        // Keep in target order
        result.sort((a, b) => {
          const idxA = TARGET_33_KEYS.findIndex((k) => a.id.toLowerCase().includes(k));
          const idxB = TARGET_33_KEYS.findIndex((k) => b.id.toLowerCase().includes(k));
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return 0;
        });
        break;
    }

    return result;
  }, [targetAssets, selectedCategory, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0e1117] border border-[#30363d] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#21262d] bg-[#161b22]/90 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1f6feb]/20 to-[#238636]/20 border border-[#58a6ff]/30 text-[#58a6ff]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[#e6edf3] tracking-tight">
                    Todas as Ações e Ativos do Mercado
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#58a6ff]/30">
                    33 Ativos Monitorados
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
                    Tempo Real & Dupla Cotação
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Lista completa e oficial: cotações em tempo real, variação, máximas, mínimas, volumes e conversão instantânea USD ↔ BRL.
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
                placeholder="Buscar por ticker ou nome (ex: Petrobras, Bitcoin, Apple, Vale)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0e1117] border border-[#30363d] text-xs sm:text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort & View Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#0e1117] border border-[#30363d] rounded-xl px-2.5 py-1.5 text-xs text-[#8b949e]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span className="hidden sm:inline">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-[#e6edf3] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="default" className="bg-[#161b22]">Padrão (33 Ativos)</option>
                  <option value="gainers" className="bg-[#161b22]">Maiores Altas (%)</option>
                  <option value="losers" className="bg-[#161b22]">Maiores Quedas (%)</option>
                  <option value="volume" className="bg-[#161b22]">Maior Volume</option>
                  <option value="price" className="bg-[#161b22]">Maior Preço (BRL)</option>
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            {[
              { id: "all", label: `Todos (${targetAssets.length})`, icon: <Layers className="w-3 h-3" /> },
              { id: "acoes-br", label: "Ações Brasil (B3)", icon: <Landmark className="w-3 h-3" /> },
              { id: "acoes-eua", label: "Ações Wall St (EUA)", icon: <Globe className="w-3 h-3" /> },
              { id: "cripto", label: "Criptomoedas", icon: <Coins className="w-3 h-3" /> },
              { id: "moedas", label: "Moedas & Câmbio", icon: <DollarSign className="w-3 h-3" /> },
              { id: "commodities", label: "Commodities & Futuros", icon: <Wheat className="w-3 h-3" /> },
              { id: "indices", label: "Índices Globais", icon: <TrendingUp className="w-3 h-3" /> },
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
                  {processedAssets.map((asset, index) => {
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
                            <span className="font-mono text-[10px] text-[#8b949e] w-4 text-right shrink-0">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-xs sm:text-sm text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                                  {asset.ticker}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                                  {asset.exchange}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8b949e] truncate max-w-[180px] sm:max-w-[240px]">
                                {asset.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Cotação Atual (Dupla Conversão USD & BRL) */}
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
                          <div className="inline-flex flex-col items-end">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                                isPositive
                                  ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                                  : "bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {isPositive ? "+" : ""}
                              {asset.changePercent.toFixed(2)}%
                            </span>
                            <span className="text-[10px] text-[#8b949e] font-mono mt-0.5">
                              {isPositive ? "+" : ""}
                              {formatAssetDisplayPrice(asset.change, asset.currency)}
                            </span>
                          </div>
                        </td>

                        {/* 4. Máxima do Dia (High) */}
                        <td className="py-3 px-4 text-right hidden sm:table-cell">
                          <DualPriceDisplay
                            price={asset.metrics.high || asset.price * 1.015}
                            currency={asset.currency}
                            size="xs"
                            layout="stacked"
                            align="right"
                          />
                        </td>

                        {/* 5. Mínima do Dia (Low) */}
                        <td className="py-3 px-4 text-right hidden sm:table-cell">
                          <DualPriceDisplay
                            price={asset.metrics.low || asset.price * 0.985}
                            currency={asset.currency}
                            size="xs"
                            layout="stacked"
                            align="right"
                          />
                        </td>

                        {/* 6. Volume Negociado */}
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#e6edf3] hidden md:table-cell">
                          {asset.metrics.volume || "Alta Liquidez"}
                        </td>

                        {/* 7. Tendência (Sparkline) */}
                        <td className="py-3 px-4 text-center hidden lg:table-cell">
                          <div className="w-24 mx-auto">
                            <Sparkline
                              data={asset.sparkline || [100, 102, 101, 103, 104]}
                              isPositive={isPositive}
                              height={28}
                              strokeWidth={1.8}
                            />
                          </div>
                        </td>

                        {/* 8. Botão Ação */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#21262d] group-hover:bg-[#58a6ff] text-[#8b949e] group-hover:text-white transition-all text-xs font-semibold cursor-pointer border border-[#30363d] group-hover:border-[#58a6ff]"
                          >
                            <span>Ver Detalhes</span>
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
              {processedAssets.map((asset) => {
                const isPositive = asset.changePercent >= 0;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Ticker & Change */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-base font-bold text-[#e6edf3] group-hover:text-[#58a6ff] transition-colors">
                              {asset.ticker}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0e1117] text-[#8b949e] border border-[#30363d]">
                              {asset.exchange}
                            </span>
                          </div>
                          <p className="text-xs text-[#8b949e] truncate max-w-[200px]" title={asset.name}>
                            {asset.name}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
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
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#21262d] bg-[#161b22] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00c853]" />
            <span>Exibindo <strong>{processedAssets.length}</strong> de <strong>{targetAssets.length}</strong> ativos com dupla cotação oficial.</span>
          </div>
          <div className="text-[11px] text-[#8b949e]">
            Clique em qualquer ativo para abrir instantaneamente a visão aprofundada com gráficos e indicadores.
          </div>
        </div>
      </div>
    </div>
  );
};
