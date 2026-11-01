import React, { useState, useMemo } from "react";
import {
  LayoutGrid,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Sparkles,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Flame,
  Zap,
} from "lucide-react";
import { Asset, AssetSector } from "../types/finance";
import {
  SECTOR_DEFINITIONS,
  getAssetSector,
  SectorDefinition,
} from "../utils/assetTaxonomy";
import { formatAssetDisplayPrice, formatPercent } from "../utils/formatters";

interface SectorMarketHeatmapProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
}

export type HeatmapViewMode = "treemap" | "grid";
export type HeatmapMarketFilter = "all" | "b3" | "us" | "crypto" | "indices";
export type HeatmapPerfFilter = "all" | "gainers" | "losers" | "volatile";

/**
 * Retorna as cores de fundo, texto e borda de acordo com o percentual de variação
 * Utiliza 9 níveis gradativos (4 tons de verde, neutro e 4 tons de vermelho)
 */
export function getHeatmapTileStyle(changePercent: number): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  intensityLabel: string;
} {
  const p = isNaN(changePercent) ? 0 : changePercent;

  // FORTES ALTAS
  if (p >= 3.0) {
    return {
      backgroundColor: "#00c853", // Emerald vivo
      textColor: "#ffffff",
      borderColor: "#00e676",
      glowColor: "rgba(0, 200, 83, 0.4)",
      intensityLabel: "Alta Expressiva (≥ +3%)",
    };
  }
  if (p >= 1.5) {
    return {
      backgroundColor: "#16a34a", // Verde médio vívido
      textColor: "#ffffff",
      borderColor: "#22c55e",
      glowColor: "rgba(34, 197, 94, 0.3)",
      intensityLabel: "Alta Moderada (+1.5% a +3%)",
    };
  }
  if (p >= 0.5) {
    return {
      backgroundColor: "#15803d", // Verde sólido
      textColor: "#e6edf3",
      borderColor: "#16a34a",
      glowColor: "rgba(22, 163, 74, 0.2)",
      intensityLabel: "Alta Leve (+0.5% a +1.5%)",
    };
  }
  if (p > 0.05) {
    return {
      backgroundColor: "#065f46", // Verde escuro elegante
      textColor: "#c9d1d9",
      borderColor: "#047857",
      glowColor: "transparent",
      intensityLabel: "Estável Positivo (0% a +0.5%)",
    };
  }

  // NEUTRO
  if (p >= -0.05 && p <= 0.05) {
    return {
      backgroundColor: "#21262d", // Neutro escuro
      textColor: "#8b949e",
      borderColor: "#30363d",
      glowColor: "transparent",
      intensityLabel: "Neutro (0.0%)",
    };
  }

  // QUEDAS
  if (p > -0.5) {
    return {
      backgroundColor: "#7f1d1d", // Vinho/Carmim escuro
      textColor: "#c9d1d9",
      borderColor: "#991b1b",
      glowColor: "transparent",
      intensityLabel: "Estável Negativo (0% a -0.5%)",
    };
  }
  if (p > -1.5) {
    return {
      backgroundColor: "#991b1b", // Vermelho médio
      textColor: "#ffffff",
      borderColor: "#b91c1c",
      glowColor: "rgba(153, 27, 27, 0.2)",
      intensityLabel: "Queda Leve (-0.5% a -1.5%)",
    };
  }
  if (p > -3.0) {
    return {
      backgroundColor: "#dc2626", // Vermelho vívido
      textColor: "#ffffff",
      borderColor: "#ef4444",
      glowColor: "rgba(220, 38, 38, 0.3)",
      intensityLabel: "Queda Moderada (-1.5% a -3%)",
    };
  }

  // FORTE QUEDA
  return {
    backgroundColor: "#b91c1c", // Vermelho profundo
    textColor: "#ffffff",
    borderColor: "#ff5252",
    glowColor: "rgba(255, 82, 82, 0.4)",
    intensityLabel: "Queda Expressiva (≤ -3%)",
  };
}

/**
 * Define o peso/tamanho visual relativo do ativo dentro do heatmap
 */
function getAssetWeightClass(asset: Asset, viewMode: HeatmapViewMode): string {
  if (viewMode === "grid") {
    return "col-span-1 row-span-1 min-h-[96px]";
  }

  const ticker = asset.ticker.toUpperCase();
  const megaCaps = ["AAPL", "NVDA", "MSFT", "PETR4", "VALE3", "ITUB4", "BTC", "ETH", "IBOV", "S&P 500"];
  const largeCaps = ["AMZN", "GOOGL", "META", "TSLA", "BBAS3", "WEGE3", "B3SA3", "PRIO3", "SOL", "NASDAQ"];

  if (megaCaps.includes(ticker)) {
    return "col-span-2 sm:col-span-2 row-span-2 min-h-[140px]";
  }
  if (largeCaps.includes(ticker)) {
    return "col-span-1 sm:col-span-2 row-span-1 min-h-[105px]";
  }

  return "col-span-1 row-span-1 min-h-[92px]";
}

export const SectorMarketHeatmap: React.FC<SectorMarketHeatmapProps> = ({
  assets,
  onSelectAsset,
}) => {
  const [viewMode, setViewMode] = useState<HeatmapViewMode>("treemap");
  const [marketFilter, setMarketFilter] = useState<HeatmapMarketFilter>("all");
  const [perfFilter, setPerfFilter] = useState<HeatmapPerfFilter>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);

  // 1. Filtragem dos ativos
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Filtro de mercado
      if (marketFilter === "b3") {
        if (asset.category !== "América Latina") return false;
      } else if (marketFilter === "us") {
        if (asset.category !== "EUA") return false;
      } else if (marketFilter === "crypto") {
        if (asset.category !== "Criptomoedas") return false;
      } else if (marketFilter === "indices") {
        const sector = getAssetSector(asset);
        if (sector !== "Indices" && !asset.name.toLowerCase().includes("índice")) return false;
      }

      // Filtro de setor
      if (selectedSector !== "all") {
        const sector = getAssetSector(asset);
        if (sector !== selectedSector) return false;
      }

      // Filtro de performance
      if (perfFilter === "gainers" && asset.changePercent <= 0) return false;
      if (perfFilter === "losers" && asset.changePercent >= 0) return false;
      if (perfFilter === "volatile" && Math.abs(asset.changePercent) < 1.5) return false;

      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTicker = asset.ticker.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        if (!matchTicker && !matchName) return false;
      }

      return true;
    });
  }, [assets, marketFilter, selectedSector, perfFilter, searchQuery]);

  // 2. Agrupamento por setor com métricas calculadas
  const sectorGroups = useMemo(() => {
    const map: Record<string, { sector: SectorDefinition; assets: Asset[]; avgChange: number; gainers: number; losers: number }> = {};

    filteredAssets.forEach((asset) => {
      const secKey = getAssetSector(asset);
      const def = SECTOR_DEFINITIONS[secKey] || {
        id: secKey,
        name: secKey,
        label: secKey,
        color: "#58a6ff",
        bgColor: "rgba(88, 166, 255, 0.12)",
        borderColor: "rgba(88, 166, 255, 0.3)",
        iconName: "Layers",
        description: "Setor de mercado",
      };

      if (!map[secKey]) {
        map[secKey] = {
          sector: def,
          assets: [],
          avgChange: 0,
          gainers: 0,
          losers: 0,
        };
      }
      map[secKey].assets.push(asset);
      if (asset.changePercent > 0) map[secKey].gainers++;
      if (asset.changePercent < 0) map[secKey].losers++;
    });

    // Calcula média ponderada de cada setor e ordena por relevância
    const list = Object.values(map).map((group) => {
      const sum = group.assets.reduce((acc, a) => acc + (a.changePercent || 0), 0);
      group.avgChange = group.assets.length > 0 ? sum / group.assets.length : 0;
      // Ordena ativos dentro do setor: maiores ganhos primeiro ou por peso
      group.assets.sort((a, b) => b.changePercent - a.changePercent);
      return group;
    });

    // Ordena os setores por volume de ativos e variação
    return list.sort((a, b) => b.assets.length - a.assets.length);
  }, [filteredAssets]);

  // Estatísticas do mercado completo para o Top Bar
  const marketStats = useMemo(() => {
    if (assets.length === 0) return { advancing: 0, declining: 0, neutral: 0, topSector: null, worstSector: null };

    let advancing = 0;
    let declining = 0;
    let neutral = 0;

    assets.forEach((a) => {
      if (a.changePercent > 0.05) advancing++;
      else if (a.changePercent < -0.05) declining++;
      else neutral++;
    });

    // Encontra melhor e pior setor
    const sortedSectors = [...sectorGroups].sort((a, b) => b.avgChange - a.avgChange);
    const topSector = sortedSectors[0] || null;
    const worstSector = sortedSectors[sortedSectors.length - 1] || null;

    return { advancing, declining, neutral, topSector, worstSector };
  }, [assets, sectorGroups]);

  return (
    <section
      aria-label="Mapa de Calor Setorial do Mercado"
      className={`w-full transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#0e1117] p-4 sm:p-6 overflow-y-auto"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-6"
      }`}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow atmosférico */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#1f6feb]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#00c853]/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. HEADER DO HEATMAP */}
        <div className="p-4 sm:p-6 border-b border-[#30363d] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161b22]/95 backdrop-blur-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00c853]/20 via-[#1f6feb]/20 to-[#ff5252]/20 border border-[#30363d] flex items-center justify-center text-[#58a6ff] shrink-0 shadow-sm">
              <LayoutGrid className="w-5 h-5 text-[#58a6ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#e6edf3] tracking-tight">
                  Mapa de Calor Setorial do Mercado
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
                  HEATMAP DINÂMICO
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#00c853]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
                  {filteredAssets.length} Ativos
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Desempenho relativo agrupado por setores econômicos com gradiente em tempo real de alta e baixa
              </p>
            </div>
          </div>

          {/* Controles de Topo: Alternar Treemap/Grid, Tela Cheia & Estatísticas */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
            {/* Visualizador de Proporção (Treemap Ponderado vs Grade Uniforme) */}
            <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("treemap")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "treemap"
                    ? "bg-[#21262d] text-white shadow-sm border border-[#58a6ff]/40"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
                title="Visualização Ponderada (Mega-caps ocupam maior proporção)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Ponderado</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-[#21262d] text-white shadow-sm border border-[#58a6ff]/40"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
                title="Grade Uniforme (Tiles de tamanho idêntico)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Uniforme</span>
              </button>
            </div>

            {/* Botão de Tela Cheia */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-[#0e1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer"
              title={isFullscreen ? "Sair da tela cheia" : "Expandir em tela cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#58a6ff]" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 2. BARRA DE RESUMO DO MERCADO & PULSO GERAL */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0e1117]/80 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Proporção de Altas vs Baixas */}
          <div className="flex items-center gap-3">
            <span className="text-[#8b949e] font-medium">Balanço do Mercado:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="inline-flex items-center gap-1 text-[#00c853] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                {marketStats.advancing} Altas
              </span>
              <span className="text-[#30363d]">|</span>
              <span className="inline-flex items-center gap-1 text-[#ff5252] font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                {marketStats.declining} Baixas
              </span>
              <span className="text-[#30363d]">|</span>
              <span className="text-[#8b949e]">
                {marketStats.neutral} Estáveis
              </span>
            </div>
          </div>

          {/* Setores Destaque */}
          {marketStats.topSector && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#8b949e]">Líder:</span>
              <span className="font-bold text-[#e6edf3]">{marketStats.topSector.sector.name}</span>
              <span className="text-[#00c853] font-bold">
                +{marketStats.topSector.avgChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* 3. FILTROS RÁPIDOS & BUSCA */}
        <div className="p-4 sm:px-6 border-b border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filtros de Mercado */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-nowrap">
            {[
              { id: "all", label: "Mercado Global" },
              { id: "b3", label: "🇧🇷 Ações B3" },
              { id: "us", label: "🇺🇸 Wall Street" },
              { id: "crypto", label: "🪙 Cripto" },
              { id: "indices", label: "📈 Benchmarks" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMarketFilter(tab.id as HeatmapMarketFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  marketFilter === tab.id
                    ? "bg-[#1f6feb] text-white shadow-sm shadow-[#1f6feb]/30"
                    : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtro de Desempenho & Busca de Ticker */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtro de Performance */}
            <div className="flex items-center bg-[#0e1117] border border-[#30363d] rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPerfFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  perfFilter === "all" ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPerfFilter("gainers")}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[#00c853] ${
                  perfFilter === "gainers" ? "bg-[#21262d] font-bold" : "opacity-75 hover:opacity-100"
                }`}
              >
                Altas
              </button>
              <button
                type="button"
                onClick={() => setPerfFilter("losers")}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[#ff5252] ${
                  perfFilter === "losers" ? "bg-[#21262d] font-bold" : "opacity-75 hover:opacity-100"
                }`}
              >
                Baixas
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar ativo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e1117] border border-[#30363d] focus:border-[#58a6ff] text-xs text-[#e6edf3] pl-8 pr-3 py-1.5 rounded-xl outline-none placeholder-[#8b949e]/60 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 4. ÁREA PRINCIPAL DO MAPA DE CALOR SETORIAL */}
        <div className="p-4 sm:p-6 space-y-6">
          {sectorGroups.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-[#30363d] rounded-2xl bg-[#0e1117]/50">
              <LayoutGrid className="w-10 h-10 text-[#8b949e]/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#e6edf3]">
                Nenhum ativo corresponde aos filtros selecionados
              </p>
              <p className="text-xs text-[#8b949e] mt-1">
                Tente redefinir o mercado para "Mercado Global" ou limpar o campo de busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMarketFilter("all");
                  setPerfFilter("all");
                  setSelectedSector("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#58a6ff] border border-[#30363d] transition-colors cursor-pointer"
              >
                Restaurar Filtros Padrão
              </button>
            </div>
          ) : (
            sectorGroups.map((group) => {
              const isAvgPositive = group.avgChange >= 0;

              return (
                <div
                  key={group.sector.id}
                  className="rounded-2xl border border-[#30363d] bg-[#0e1117]/80 overflow-hidden shadow-sm"
                >
                  {/* Cabeçalho do Setor */}
                  <div className="px-4 py-3 bg-[#161b22]/90 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.sector.color }}
                      />
                      <h3 className="text-xs sm:text-sm font-bold text-[#e6edf3]">
                        {group.sector.label}
                      </h3>
                      <span className="text-[11px] font-mono text-[#8b949e] px-1.5 py-0.2 rounded bg-[#0e1117] border border-[#30363d]">
                        {group.assets.length} {group.assets.length === 1 ? "ativo" : "ativos"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      {/* Placar de altas vs baixas do setor */}
                      <span className="text-[11px] text-[#8b949e] hidden sm:inline">
                        <strong className="text-[#00c853]">+{group.gainers}</strong> /{" "}
                        <strong className="text-[#ff5252]">-{group.losers}</strong>
                      </span>

                      {/* Média do Setor */}
                      <div
                        className={`px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1 ${
                          isAvgPositive
                            ? "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30"
                            : "bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30"
                        }`}
                      >
                        {isAvgPositive ? "+" : ""}
                        {group.avgChange.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Grid de Tiles do Setor */}
                  <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 auto-rows-fr">
                    {group.assets.map((asset) => {
                      const style = getHeatmapTileStyle(asset.changePercent);
                      const isPositive = asset.changePercent >= 0;
                      const weightClass = getAssetWeightClass(asset, viewMode);

                      return (
                        <div
                          key={asset.id}
                          onClick={() => onSelectAsset(asset)}
                          onMouseEnter={() => setHoveredAsset(asset)}
                          onMouseLeave={() => setHoveredAsset(null)}
                          className={`relative rounded-xl p-3 flex flex-col justify-between transition-all duration-150 cursor-pointer border group hover:scale-[1.02] hover:z-10 shadow-sm ${weightClass}`}
                          style={{
                            backgroundColor: style.backgroundColor,
                            borderColor: style.borderColor,
                            boxShadow: `0 2px 8px ${style.glowColor}`,
                          }}
                        >
                          {/* Topo do Tile: Ticker & Variação */}
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className="font-mono text-sm sm:text-base font-extrabold tracking-tight drop-shadow-xs"
                              style={{ color: style.textColor }}
                            >
                              {asset.ticker}
                            </span>
                            <span
                              className="text-xs sm:text-sm font-mono font-bold tracking-tight shrink-0 drop-shadow-xs"
                              style={{ color: style.textColor }}
                            >
                              {isPositive ? "+" : ""}
                              {asset.changePercent.toFixed(2)}%
                            </span>
                          </div>

                          {/* Nome resumido da empresa */}
                          <p
                            className="text-[11px] font-medium truncate mt-0.5 opacity-90 drop-shadow-xs"
                            style={{ color: style.textColor }}
                          >
                            {asset.name}
                          </p>

                          {/* Base do Tile: Preço e Ícone de Direção */}
                          <div className="flex items-end justify-between gap-1 mt-2 pt-1 border-t border-white/10">
                            <span
                              className="font-mono text-xs font-semibold drop-shadow-xs truncate"
                              style={{ color: style.textColor }}
                            >
                              {formatAssetDisplayPrice(asset.price, asset.currency)}
                            </span>
                            <ArrowUpRight
                              className={`w-3.5 h-3.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
                                !isPositive ? "rotate-90" : ""
                              }`}
                              style={{ color: style.textColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. LEGENDA DE CORES OFICIAL DE MERCADO (9 TONS) */}
        <div className="p-4 sm:px-6 bg-[#0e1117] border-t border-[#30363d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8b949e]">
            <Info className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="font-medium">Escala de Variação (%):</span>
          </div>

          {/* Barra Gradativa com Rótulos */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center font-mono text-[10px] text-white">
            <span className="text-[#ff5252] font-bold mr-1">≤ -3%</span>
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#b91c1c" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#dc2626" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#991b1b" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#7f1d1d" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 text-[#8b949e] border border-[#30363d]"
              style={{ backgroundColor: "#21262d" }}
            >
              0
            </span>
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#065f46" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#15803d" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#16a34a" }}
            />
            <span
              className="w-6 h-4 rounded text-center leading-4 font-bold"
              style={{ backgroundColor: "#00c853" }}
            />
            <span className="text-[#00c853] font-bold ml-1">≥ +3%</span>
          </div>

          <div className="text-[11px] text-[#8b949e] font-mono">
            Atualizado ao vivo com base em dados de mercado
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectorMarketHeatmap;
