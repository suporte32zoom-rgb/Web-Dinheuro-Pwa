import React, { useRef } from "react";
import { Asset, RegionalTab } from "../types/finance";
import { Sparkline } from "./Sparkline";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Cpu,
  Flame,
  Coins,
  Landmark,
  Gem,
  Factory,
  ShoppingBag,
  Zap,
  Wheat,
  DollarSign,
  Layers,
} from "lucide-react";
import {
  getAssetSector,
  getAssetTags,
  groupAssetsBySector,
  filterAssetsBySectorAndTag,
  SECTOR_DEFINITIONS,
} from "../utils/assetTaxonomy";
import { formatAssetDisplayPrice } from "../utils/formatters";

interface DynamicIndicesCarouselProps {
  assets: Asset[];
  activeTab: RegionalTab;
  onSelectAsset: (asset: Asset) => void;
  isLoading?: boolean;
  selectedSector?: string;
  activeTag?: string;
  groupBySector?: boolean;
  onSelectSector?: (sector: string) => void;
  onSelectTag?: (tag: string) => void;
}

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5" />,
  Tech: <Cpu className="w-3.5 h-3.5" />,
  Energy: <Flame className="w-3.5 h-3.5" />,
  Crypto: <Coins className="w-3.5 h-3.5" />,
  Finance: <Landmark className="w-3.5 h-3.5" />,
  Materials: <Gem className="w-3.5 h-3.5" />,
  Industry: <Factory className="w-3.5 h-3.5" />,
  Consumer: <ShoppingBag className="w-3.5 h-3.5" />,
  Utilities: <Zap className="w-3.5 h-3.5" />,
  Commodities: <Wheat className="w-3.5 h-3.5" />,
  Forex: <DollarSign className="w-3.5 h-3.5" />,
  Indices: <TrendingUp className="w-3.5 h-3.5" />,
};

export const DynamicIndicesCarousel: React.FC<DynamicIndicesCarouselProps> = ({
  assets,
  activeTab,
  onSelectAsset,
  isLoading = false,
  selectedSector = "all",
  activeTag = "",
  groupBySector = false,
  onSelectSector,
  onSelectTag,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial filter by regional category tab
  const categoryAssets = assets.filter((a) => a.category === activeTab);

  // If a specific sector is selected or tag is active, use the category pool,
  // or if category has 0 items for that sector, check global assets to be helpful
  const basePool = categoryAssets.length > 0 ? categoryAssets : assets;

  // 2. Filter by sector and tag
  const filteredAssets = filterAssetsBySectorAndTag(basePool, selectedSector, activeTag);

  // 3. Group by sector if grouping mode is active
  const groupedBySector = React.useMemo(() => {
    if (!groupBySector) return null;
    return groupAssetsBySector(filteredAssets);
  }, [groupBySector, filteredAssets]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return formatAssetDisplayPrice(price, currency);
  };

  // Helper to render a single asset card
  const renderAssetCard = (asset: Asset) => {
    const isPositive = asset.changePercent >= 0;
    const sector = getAssetSector(asset);
    const tags = getAssetTags(asset).slice(0, 2);
    const secDef = SECTOR_DEFINITIONS[sector] || SECTOR_DEFINITIONS.Indices;

    return (
      <div
        key={asset.id}
        id={`card-${asset.ticker.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        onClick={() => onSelectAsset(asset)}
        className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-[#161b22] hover:bg-[#21262d] border border-[#30363d]/80 hover:border-[#58a6ff]/70 rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-black/20 group/card relative overflow-hidden"
      >
        {/* Subtle sector color indicator top border accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover/card:opacity-100 transition-opacity"
          style={{ backgroundColor: secDef?.color || "#58a6ff" }}
        />

        {/* Top Info */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#e6edf3] group-hover/card:text-[#58a6ff] transition-colors truncate">
              {asset.ticker}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {/* Sector badge */}
              <span
                onClick={(e) => {
                  if (onSelectSector) {
                    e.stopPropagation();
                    onSelectSector(sector);
                  }
                }}
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors hover:brightness-125"
                style={{
                  backgroundColor: secDef?.bgColor || "rgba(88, 166, 255, 0.12)",
                  color: secDef?.color || "#58a6ff",
                  border: `1px solid ${secDef?.borderColor || "rgba(88, 166, 255, 0.3)"}`,
                }}
                title={`Setor: ${sector}`}
              >
                {sector}
              </span>

              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0e1117] text-[#8b949e] border border-[#30363d] font-medium">
                {asset.exchange.split("/")[0].trim()}
              </span>
            </div>
          </div>
          <h3 className="text-xs text-[#8b949e] truncate mt-0.5 font-medium" title={asset.name}>
            {asset.name}
          </h3>
        </div>

        {/* Mid: Price & Sparkline */}
        <div className="flex items-end justify-between gap-2 my-2.5">
          <div>
            <div className="text-base sm:text-lg font-bold text-[#e6edf3] font-mono tracking-tight">
              {formatPrice(asset.price, asset.currency)}
            </div>
          </div>
          <div className="shrink-0">
            <Sparkline
              data={asset.sparkline}
              isPositive={isPositive}
              width={90}
              height={32}
            />
          </div>
        </div>

        {/* Bottom: Change Badge and Tags */}
        <div className="pt-2 border-t border-[#30363d]/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div
              className={`flex items-center gap-1 font-semibold text-xs ${
                isPositive ? "text-[#00c853]" : "text-[#ff5252]"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {asset.changePercent.toFixed(2)}%
              </span>
              <span className="text-[11px] text-[#8b949e] font-normal font-mono ml-0.5">
                ({isPositive ? "+" : ""}
                {asset.change > 100 ? asset.change.toFixed(1) : asset.change.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Quick Tags Chips */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden pt-0.5">
              {tags.map((t) => (
                <span
                  key={t}
                  onClick={(e) => {
                    if (onSelectTag) {
                      e.stopPropagation();
                      onSelectTag(t);
                    }
                  }}
                  className="text-[9px] px-1.5 py-0.2 rounded bg-[#0e1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] border border-[#30363d]/60 font-mono transition-colors truncate"
                  title={`Filtrar pela tag #${t}`}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="market-assets-section" className="w-full py-4 relative group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header with Category & Sector Context */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold tracking-wide text-[#e6edf3] uppercase">
              Principais Índices & Ativos • {activeTab}
            </h2>
            {selectedSector !== "all" && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#58a6ff]/40">
                Setor: {selectedSector}
              </span>
            )}
            {activeTag && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/40">
                #{activeTag}
              </span>
            )}
            <span className="text-xs text-[#8b949e]">
              ({isLoading ? "Atualizando..." : `${filteredAssets.length} exibidos`})
            </span>
          </div>

          {/* Scroll Controls when not grouped */}
          {!groupBySector && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll("left")}
                aria-label="Rolar para a esquerda"
                className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                aria-label="Rolar para a direita"
                className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredAssets.length === 0 && !isLoading && (
          <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-2xl">
            <p className="text-sm text-[#8b949e]">
              Nenhum ativo encontrado para o setor <strong className="text-white">"{selectedSector}"</strong>
              {activeTag ? ` com a tag #${activeTag}` : ""} na categoria {activeTab}.
            </p>
            <button
              onClick={() => {
                if (onSelectSector) onSelectSector("all");
                if (onSelectTag) onSelectTag("");
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#58a6ff] cursor-pointer"
            >
              Exibir Todos os Setores
            </button>
          </div>
        )}

        {/* VIEW MODE 1: GROUPED BY SECTOR */}
        {groupBySector && groupedBySector && Object.keys(groupedBySector).length > 0 ? (
          <div className="space-y-6">
            {(Object.entries(groupedBySector) as [string, Asset[]][]).map(([secName, secAssets]) => {
              const secDef = SECTOR_DEFINITIONS[secName] || SECTOR_DEFINITIONS.Indices;
              const avgPerf =
                secAssets.reduce((sum, a) => sum + a.changePercent, 0) / (secAssets.length || 1);
              const isAvgPos = avgPerf >= 0;

              return (
                <div
                  key={secName}
                  className="bg-[#12161f] border border-[#30363d]/70 rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  {/* Sector Header Banner */}
                  <div className="flex items-center justify-between border-b border-[#30363d]/50 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{
                          backgroundColor: secDef.bgColor,
                          color: secDef.color,
                        }}
                      >
                        {SECTOR_ICONS[secName] || <Layers className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-wide">
                            {secDef.label}
                          </h3>
                          <span
                            className="px-2 py-0.2 rounded-full text-[10px] font-bold font-mono"
                            style={{
                              backgroundColor: secDef.bgColor,
                              color: secDef.color,
                              border: `1px solid ${secDef.borderColor}`,
                            }}
                          >
                            {secAssets.length} {secAssets.length === 1 ? "ativo" : "ativos"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8b949e]">
                          {secDef.description}
                        </p>
                      </div>
                    </div>

                    {/* Sector Performance Pill */}
                    <div className="text-right">
                      <span className="text-[10px] text-[#8b949e] block">Média Setorial</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isAvgPos ? "text-[#00c853]" : "text-[#ff5252]"
                        }`}
                      >
                        {isAvgPos ? "+" : ""}
                        {avgPerf.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Scroll of Assets for this specific Sector */}
                  <div
                    className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory nav-scroll-container touch-scroll-x flex-nowrap"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {secAssets.map((asset) => renderAssetCard(asset))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW MODE 2: FLAT HORIZONTAL CAROUSEL */
          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory nav-scroll-container touch-scroll-x flex-nowrap"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {isLoading && filteredAssets.length === 0
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-[#161b22] border border-[#30363d]/60 rounded-xl p-3.5 flex flex-col justify-between animate-pulse"
                  >
                    <div className="h-4 w-16 bg-[#21262d] rounded"></div>
                    <div className="my-4 h-6 w-24 bg-[#21262d] rounded"></div>
                    <div className="h-3 w-20 bg-[#21262d] rounded"></div>
                  </div>
                ))
              : filteredAssets.map((asset) => renderAssetCard(asset))}
          </div>
        )}
      </div>
    </div>
  );
};
