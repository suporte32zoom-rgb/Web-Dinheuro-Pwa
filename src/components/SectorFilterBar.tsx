import React, { useRef } from "react";
import {
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
  TrendingUp,
  Layers,
  LayoutGrid,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { Asset, AssetSector } from "../types/finance";
import {
  SECTOR_DEFINITIONS,
  getAssetSector,
  SectorDefinition,
} from "../utils/assetTaxonomy";

interface SectorFilterBarProps {
  assets: Asset[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  groupBySector: boolean;
  onToggleGroupBySector: (grouped: boolean) => void;
  activeTag: string;
  onSelectTag: (tag: string) => void;
}

const SECTOR_ICON_MAP: Record<string, React.ReactNode> = {
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

// Tags populares traduzidas para filtro rápido
const POPULAR_TAGS = [
  "Inteligência Artificial",
  "Mega Capitalização",
  "Global",
  "Dividendos",
  "B3",
  "Semicondutores",
  "Nuvem",
  "Petróleo",
  "Mineração",
  "Bitcoin",
  "Câmbio",
  "Benchmarks",
];

export const SectorFilterBar: React.FC<SectorFilterBarProps> = ({
  assets,
  selectedSector,
  onSelectSector,
  groupBySector,
  onToggleGroupBySector,
  activeTag,
  onSelectTag,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute counts and average performance per sector dynamically
  const sectorStats = React.useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    const perfSums: Record<string, number> = { all: 0 };

    for (const a of assets) {
      const sec = getAssetSector(a);
      counts[sec] = (counts[sec] || 0) + 1;
      perfSums[sec] = (perfSums[sec] || 0) + a.changePercent;
      perfSums.all += a.changePercent;
    }

    const averages: Record<string, number> = {};
    for (const [k, count] of Object.entries(counts)) {
      averages[k] = count > 0 ? perfSums[k] / count : 0;
    }

    return { counts, averages };
  }, [assets]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  const sectorsList = Object.values(SECTOR_DEFINITIONS);

  return (
    <div className="w-full bg-[#161b22]/90 border-y border-[#30363d]/80 backdrop-blur-md py-3 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
        {/* Top Controls Row: Label, View Mode Toggle, and Scroll Arrows */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20">
              <ListFilter className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
              Setores & Tags Customizadas
            </span>
            <span className="text-[11px] text-[#8b949e] hidden sm:inline">
              ({assets.length} ativos agrupáveis)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Group By Sector Toggle */}
            <button
              id="btn-toggle-group-by-sector"
              onClick={() => onToggleGroupBySector(!groupBySector)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                groupBySector
                  ? "bg-[#1f6feb] text-white border-[#58a6ff] shadow-sm shadow-[#1f6feb]/30"
                  : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] border-[#30363d] hover:bg-[#21262d]"
              }`}
              title="Organizar a visualização agrupando ativos por seus respectivos setores"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{groupBySector ? "Agrupado por Setor" : "Agrupar por Setor"}</span>
            </button>

            {/* Scroll Navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => handleScroll("left")}
                aria-label="Rolar setores à esquerda"
                className="p-1 rounded-md bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                aria-label="Rolar setores à direita"
                className="p-1 rounded-md bg-[#0e1117] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sectors Pills Carousel */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none nav-scroll-container flex-nowrap"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {sectorsList.map((sec) => {
            const isSelected = selectedSector === sec.id;
            const count = sectorStats.counts[sec.id] || 0;
            const avg = sectorStats.averages[sec.id] || 0;
            const isAvgPos = avg >= 0;

            return (
              <button
                type="button"
                key={sec.id}
                id={`sector-pill-${sec.id.toLowerCase()}`}
                onClick={() => {
                  onSelectSector(sec.id);
                  if (activeTag) onSelectTag("");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer border shrink-0 ${
                  isSelected
                    ? "bg-[#21262d] text-white border-[#58a6ff] shadow-sm shadow-[#58a6ff]/20"
                    : "bg-[#0e1117]/80 text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]/60 border-[#30363d]"
                }`}
                style={{
                  borderColor: isSelected ? sec.color : undefined,
                }}
              >
                <span
                  className="shrink-0"
                  style={{ color: isSelected ? sec.color : "#8b949e" }}
                >
                  {SECTOR_ICON_MAP[sec.id] || <Layers className="w-3.5 h-3.5" />}
                </span>
                <span className="font-semibold">{sec.name}</span>

                {/* Badge with count */}
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                    isSelected
                      ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                      : "bg-[#21262d] text-[#8b949e]"
                  }`}
                >
                  {count}
                </span>

                {/* Average performance tag */}
                {count > 0 && sec.id !== "all" && (
                  <span
                    className={`text-[10px] font-mono font-semibold shrink-0 ${
                      isAvgPos ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    {isAvgPos ? "+" : ""}
                    {avg.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Popular Tags Filter Sub-Row */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 text-[11px] scrollbar-none nav-scroll-container flex-nowrap"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex items-center gap-1 text-[#8b949e] shrink-0 font-medium mr-1">
            <TagIcon className="w-3 h-3 text-[#58a6ff]" />
            <span>Tags populares:</span>
          </div>

          {activeTag && (
            <button
              type="button"
              onClick={() => onSelectTag("")}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30 hover:bg-[#ff5252]/25 transition-colors cursor-pointer shrink-0 font-semibold"
            >
              <span>Limpar #{activeTag}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {POPULAR_TAGS.map((t) => {
            const isTagActive = activeTag.toLowerCase() === t.toLowerCase();
            return (
              <button
                type="button"
                key={t}
                onClick={() => onSelectTag(isTagActive ? "" : t)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer shrink-0 font-mono text-[11px] border ${
                  isTagActive
                    ? "bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff] font-bold"
                    : "bg-[#0e1117] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] border-[#30363d]/70"
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
