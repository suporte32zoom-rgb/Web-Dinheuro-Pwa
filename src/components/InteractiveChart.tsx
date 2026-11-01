import React, { useState, useMemo, useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  ChartPeriod,
  ChartDisplayType,
  HistoricalPoint,
  ChartAnnotation,
  Asset,
} from "../types/finance";
import { ALL_ASSETS } from "../data/mockMarketData";
import { fetchLiveChart } from "../services/marketDataService";
import { formatAssetDisplayPrice } from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  BarChart2,
  Calendar,
  Loader2,
  GitCompare,
  X,
  Check,
  Search,
  ArrowRightLeft,
  Percent,
  Sparkles,
} from "lucide-react";

interface InteractiveChartProps {
  historicalData: Record<ChartPeriod, HistoricalPoint[]>;
  annotations?: Record<string, ChartAnnotation[]>;
  currency: string;
  isPositiveOverall: boolean;
  assetTicker: string;
  assetName?: string;
  allAssets?: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  historicalData,
  annotations = {},
  currency,
  isPositiveOverall,
  assetTicker,
  assetName,
  allAssets = [],
  onSelectAsset,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>("1D");
  const [displayType, setDisplayType] = useState<ChartDisplayType>("area");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showSMA, setShowSMA] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [livePointsMap, setLivePointsMap] = useState<Partial<Record<ChartPeriod, HistoricalPoint[]>>>({});
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Dual Ticker Comparison State
  const [compareAsset, setCompareAsset] = useState<Asset | null>(null);
  const [comparePointsMap, setComparePointsMap] = useState<Record<string, HistoricalPoint[]>>({});
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [isCompareMenuOpen, setIsCompareMenuOpen] = useState(false);
  const [compareSearch, setCompareSearch] = useState("");
  const [isPercentMode, setIsPercentMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const compareMenuRef = useRef<HTMLDivElement>(null);

  const periods: ChartPeriod[] = ["1D", "5D", "1M", "6M", "YTD", "1A", "5A", "MÁX"];

  // Close compare menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (compareMenuRef.current && !compareMenuRef.current.contains(e.target as Node)) {
        setIsCompareMenuOpen(false);
      }
    };
    if (isCompareMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCompareMenuOpen]);

  // Fetch real-time chart points for primary asset
  useEffect(() => {
    let isCancelled = false;
    async function loadChartData() {
      if (livePointsMap[period] && livePointsMap[period]!.length > 0) return;
      setIsLoadingChart(true);
      const data = await fetchLiveChart(assetTicker, period);
      if (!isCancelled && data && data.length > 0) {
        setLivePointsMap((prev) => ({ ...prev, [period]: data }));
      }
      if (!isCancelled) setIsLoadingChart(false);
    }
    loadChartData();
    return () => {
      isCancelled = true;
    };
  }, [assetTicker, period]);

  // Fetch real-time chart points for comparison asset
  useEffect(() => {
    if (!compareAsset) return;
    let isCancelled = false;
    const cacheKey = `${compareAsset.ticker}_${period}`;

    async function loadCompareData() {
      if (comparePointsMap[cacheKey] && comparePointsMap[cacheKey].length > 0) return;
      setIsLoadingCompare(true);
      const data = await fetchLiveChart(compareAsset!.ticker, period);
      if (!isCancelled) {
        if (data && data.length > 0) {
          setComparePointsMap((prev) => ({ ...prev, [cacheKey]: data }));
        } else if (compareAsset!.historical?.[period]) {
          setComparePointsMap((prev) => ({
            ...prev,
            [cacheKey]: compareAsset!.historical[period],
          }));
        }
        setIsLoadingCompare(false);
      }
    }
    loadCompareData();
    return () => {
      isCancelled = true;
    };
  }, [compareAsset, period]);

  // Switch to percent mode automatically when compare asset is selected
  const handleSelectCompare = (asset: Asset) => {
    if (asset.ticker === assetTicker) return;
    setCompareAsset(asset);
    setIsPercentMode(true);
    setIsCompareMenuOpen(false);
    setCompareSearch("");
  };

  const handleClearCompare = () => {
    setCompareAsset(null);
    setIsPercentMode(false);
  };

  // Primary Points
  const points: HistoricalPoint[] = useMemo(() => {
    if (livePointsMap[period] && livePointsMap[period]!.length > 0) {
      return livePointsMap[period]!;
    }
    return historicalData[period] || [];
  }, [livePointsMap, historicalData, period]);

  // Compare Points
  const rawComparePoints: HistoricalPoint[] = useMemo(() => {
    if (!compareAsset) return [];
    const cacheKey = `${compareAsset.ticker}_${period}`;
    if (comparePointsMap[cacheKey] && comparePointsMap[cacheKey].length > 0) {
      return comparePointsMap[cacheKey];
    }
    return compareAsset.historical?.[period] || [];
  }, [compareAsset, period, comparePointsMap]);

  // Normalized time series mapping for primary and compare points
  const normalizedSeries = useMemo(() => {
    if (!points.length) {
      return {
        primaryPoints: [],
        primaryPcts: [],
        comparePointsAligned: [],
        comparePctsAligned: [],
        primaryStart: 0,
        primaryEnd: 0,
        compareStart: 0,
        compareEnd: 0,
      };
    }

    const pStart = points[0].price || 1;
    const pEnd = points[points.length - 1].price || pStart;
    const primaryPcts = points.map((p) =>
      Number((((p.price - pStart) / pStart) * 100).toFixed(2))
    );

    let comparePointsAligned: HistoricalPoint[] = [];
    let comparePctsAligned: number[] = [];
    let cStart = 0;
    let cEnd = 0;

    if (compareAsset && rawComparePoints.length > 0) {
      cStart = rawComparePoints[0].price || 1;
      cEnd = rawComparePoints[rawComparePoints.length - 1].price || cStart;
      const mLen = rawComparePoints.length;
      const nLen = points.length;

      // Align comparison points to primary points indices
      for (let i = 0; i < nLen; i++) {
        const j = Math.min(
          mLen - 1,
          Math.max(0, Math.round((i * (mLen - 1)) / Math.max(1, nLen - 1)))
        );
        const cp = rawComparePoints[j];
        comparePointsAligned.push(cp);
        const pct = Number((((cp.price - cStart) / cStart) * 100).toFixed(2));
        comparePctsAligned.push(pct);
      }
    }

    return {
      primaryPoints: points,
      primaryPcts,
      comparePointsAligned,
      comparePctsAligned,
      primaryStart: pStart,
      primaryEnd: pEnd,
      compareStart: cStart,
      compareEnd: cEnd,
    };
  }, [points, rawComparePoints, compareAsset]);

  const activeAnnotations = useMemo(() => {
    return annotations[period] || [];
  }, [annotations, period]);

  // Range metrics for single ticker vs comparative percentage
  const {
    minPrice,
    maxPrice,
    startPrice,
    endPrice,
    isPeriodPositive,
    minPct,
    maxPct,
  } = useMemo(() => {
    if (!points.length) {
      return {
        minPrice: 0,
        maxPrice: 100,
        startPrice: 0,
        endPrice: 0,
        isPeriodPositive: true,
        minPct: -5,
        maxPct: 5,
      };
    }
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const start = points[0].price;
    const end = points[points.length - 1].price;

    let allPcts = [...normalizedSeries.primaryPcts];
    if (compareAsset && normalizedSeries.comparePctsAligned.length > 0) {
      allPcts = allPcts.concat(normalizedSeries.comparePctsAligned);
    }
    const minP = allPcts.length > 0 ? Math.min(...allPcts, -0.5) : -5;
    const maxP = allPcts.length > 0 ? Math.max(...allPcts, 0.5) : 5;

    return {
      minPrice: min,
      maxPrice: max,
      startPrice: start,
      endPrice: end,
      isPeriodPositive: end >= start,
      minPct: minP,
      maxPct: maxP,
    };
  }, [points, normalizedSeries, compareAsset]);

  // Dimensions
  const width = 840;
  const height = 380;
  const margin = { top: 28, right: 64, bottom: 44, left: 18 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // D3 Scales
  const { xScale, yScale, volumeScale, yTicks } = useMemo(() => {
    if (!points.length) {
      return {
        xScale: d3.scaleLinear().domain([0, 1]).range([margin.left, margin.left + innerWidth]),
        yScale: d3.scaleLinear().domain([0, 100]).range([margin.top + innerHeight, margin.top]),
        volumeScale: d3.scaleLinear().domain([0, 100]).range([0, 40]),
        yTicks: [],
      };
    }

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(1, points.length - 1)])
      .range([margin.left, margin.left + innerWidth]);

    let y: d3.ScaleLinear<number, number>;
    let ticks: number[] = [];

    if (isPercentMode || compareAsset) {
      // Percentage Mode: both series share percentage scale relative to period baseline (0%)
      const rangeSpan = maxPct - minPct || 1;
      const pad = rangeSpan * 0.12;
      const yDomain = [minPct - pad, maxPct + pad];
      y = d3
        .scaleLinear()
        .domain(yDomain)
        .range([margin.top + innerHeight, margin.top]);
      ticks = y.ticks(5);
    } else {
      // Standard Price Mode
      const paddingRatio = 0.04;
      const priceRange = maxPrice - minPrice || 1;
      const yDomain = [
        Math.max(0, minPrice - priceRange * paddingRatio),
        maxPrice + priceRange * paddingRatio,
      ];
      y = d3
        .scaleLinear()
        .domain(yDomain)
        .range([margin.top + innerHeight, margin.top]);
      ticks = y.ticks(5);
    }

    const maxVol = d3.max(points, (d) => d.volume || 0) || 1;
    const vol = d3.scaleLinear().domain([0, maxVol]).range([0, innerHeight * 0.28]);

    return { xScale: x, yScale: y, volumeScale: vol, yTicks: ticks };
  }, [
    points,
    minPrice,
    maxPrice,
    minPct,
    maxPct,
    isPercentMode,
    compareAsset,
    innerWidth,
    innerHeight,
    margin.left,
    margin.top,
  ]);

  // Primary Asset D3 Path (supports Price or Percentage)
  const d3LinePath = useMemo(() => {
    if (points.length < 2) return "";
    const isPerc = isPercentMode || !!compareAsset;

    const lineGen = d3
      .line<HistoricalPoint>()
      .x((_, i) => xScale(i))
      .y((d, i) =>
        yScale(isPerc ? normalizedSeries.primaryPcts[i] || 0 : d.price)
      )
      .curve(d3.curveMonotoneX);

    return lineGen(points) || "";
  }, [points, xScale, yScale, isPercentMode, compareAsset, normalizedSeries]);

  // Primary Asset Area Gradient Path
  const d3AreaPath = useMemo(() => {
    if (points.length < 2 || compareAsset) return "";
    const baselineY = margin.top + innerHeight;
    const areaGen = d3
      .area<HistoricalPoint>()
      .x((_, i) => xScale(i))
      .y0(baselineY)
      .y1((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    return areaGen(points) || "";
  }, [points, xScale, yScale, margin.top, innerHeight, compareAsset]);

  // Secondary Comparison Asset D3 Path (Percentage normalized)
  const d3CompareLinePath = useMemo(() => {
    if (!compareAsset || normalizedSeries.comparePointsAligned.length < 2) return "";

    const lineGen = d3
      .line<HistoricalPoint>()
      .x((_, i) => xScale(i))
      .y((_, i) => yScale(normalizedSeries.comparePctsAligned[i] || 0))
      .curve(d3.curveMonotoneX);

    return lineGen(normalizedSeries.comparePointsAligned) || "";
  }, [compareAsset, normalizedSeries, xScale, yScale]);

  // D3 SMA (Simple Moving Average 5-period)
  const d3SmaPath = useMemo(() => {
    if (!showSMA || points.length < 5 || compareAsset) return "";
    const windowSize = 5;
    const smaData: { index: number; avg: number }[] = [];

    for (let i = windowSize - 1; i < points.length; i++) {
      const slice = points.slice(i - windowSize + 1, i + 1);
      const avg = d3.mean(slice, (d) => d.price) || 0;
      smaData.push({ index: i, avg });
    }

    const smaLineGen = d3
      .line<{ index: number; avg: number }>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.avg))
      .curve(d3.curveMonotoneX);

    return smaLineGen(smaData) || "";
  }, [points, showSMA, xScale, yScale, compareAsset]);

  // Benchmark Path using D3
  const d3BenchmarkPath = useMemo(() => {
    if (!showBenchmark || points.length < 2 || compareAsset) return "";
    const bPrices = points.map((p) => p.benchmarkPrice || 100);
    const bMin = d3.min(bPrices) || 90;
    const bMax = d3.max(bPrices) || 110;
    const bRange = bMax - bMin || 1;

    const bScale = d3
      .scaleLinear()
      .domain([bMin - bRange * 0.05, bMax + bRange * 0.05])
      .range([margin.top + innerHeight, margin.top]);

    const bLineGen = d3
      .line<HistoricalPoint>()
      .x((_, i) => xScale(i))
      .y((d) => bScale(d.benchmarkPrice || 100))
      .curve(d3.curveMonotoneX);

    return bLineGen(points) || "";
  }, [points, showBenchmark, xScale, margin.top, innerHeight, compareAsset]);

  const primaryColor = isPeriodPositive ? "#00c853" : "#58a6ff";
  const compareColor = "#f0883e"; // Distinct vibrant amber/orange for comparison ticker

  const glowFilterId = `d3-glow-${assetTicker.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const compareGlowFilterId = `d3-glow-compare-${assetTicker.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const gradientId = `d3-area-grad-${assetTicker.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  // Interactive mouse / touch move handler with D3 Bisector
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;

    // Constrain within inner width
    const clampedX = Math.max(margin.left, Math.min(margin.left + innerWidth, svgX));
    const approxIndex = Math.round(
      ((clampedX - margin.left) / innerWidth) * (points.length - 1)
    );
    const clampedIndex = Math.max(0, Math.min(points.length - 1, approxIndex));
    setHoveredIndex(clampedIndex);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  const formatPrice = (val: number, customCurrency?: string) => {
    return formatAssetDisplayPrice(val, customCurrency || currency);
  };

  // Hovered or active end point calculation
  const curIdx = hoveredIndex !== null ? hoveredIndex : Math.max(0, points.length - 1);
  const activePrimaryPoint = points[curIdx];
  const activePrimaryPct = normalizedSeries.primaryPcts[curIdx] ?? 0;

  const activeComparePoint = normalizedSeries.comparePointsAligned[curIdx];
  const activeComparePct = normalizedSeries.comparePctsAligned[curIdx] ?? 0;

  const spread = activePrimaryPct - activeComparePct;

  // Comparison asset search candidates
  const filteredCompareAssets = useMemo(() => {
    const search = compareSearch.trim().toLowerCase();
    return allAssets
      .filter((a) => a.ticker.toUpperCase() !== assetTicker.toUpperCase())
      .filter((a) => {
        if (!search) return true;
        return (
          a.ticker.toLowerCase().includes(search) ||
          a.name.toLowerCase().includes(search) ||
          a.category.toLowerCase().includes(search)
        );
      })
      .slice(0, 8);
  }, [allAssets, assetTicker, compareSearch]);

  // Quick compare suggestions
  const quickCompareTickers = ["IBOV", "S&P 500", "USD/BRL", "EUR/BRL", "PETR4", "VALE3", "ITUB4", "BTC"];

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-6 shadow-2xl relative transition-all"
    >
      {/* Top Header: Dynamic Price Display & Timeframe Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#21262d]">
        {/* Dynamic Price Display */}
        <div>
          {compareAsset ? (
            /* Dual Comparison Header HUD */
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Primary Asset Pill */}
                <div className="flex items-baseline gap-2 bg-[#0e1117] px-3 py-1.5 rounded-xl border border-[#30363d]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <span className="font-mono font-bold text-sm sm:text-base text-white">
                    {assetTicker}:
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-white">
                    {activePrimaryPoint ? formatPrice(activePrimaryPoint.price) : "---"}
                  </span>
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold ${
                      activePrimaryPct >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    ({activePrimaryPct >= 0 ? "+" : ""}{activePrimaryPct.toFixed(2)}%)
                  </span>
                </div>

                <span className="text-xs font-bold text-[#8b949e]">vs.</span>

                {/* Compare Asset Pill */}
                <div className="flex items-baseline gap-2 bg-[#0e1117] px-3 py-1.5 rounded-xl border border-[#f0883e]/40 shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f0883e]" />
                  <span className="font-mono font-bold text-sm sm:text-base text-[#f0883e]">
                    {compareAsset.ticker}:
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-white">
                    {activeComparePoint
                      ? formatPrice(activeComparePoint.price, compareAsset.currency)
                      : "---"}
                  </span>
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold ${
                      activeComparePct >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    ({activeComparePct >= 0 ? "+" : ""}{activeComparePct.toFixed(2)}%)
                  </span>
                  <button
                    onClick={handleClearCompare}
                    className="ml-1 p-0.5 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                    title="Remover comparação"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spread / Alpha Badge */}
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    spread >= 0
                      ? "bg-[#00c853]/15 text-[#00c853] border-[#00c853]/30"
                      : "bg-[#ff5252]/15 text-[#ff5252] border-[#ff5252]/30"
                  }`}
                >
                  {spread >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    Diferença de Performance: {spread >= 0 ? "+" : ""}{spread.toFixed(2)}%
                  </span>
                </span>
                <span className="text-[11px] text-[#8b949e]">
                  {spread >= 0
                    ? `${assetTicker} superando ${compareAsset.ticker} em ${spread.toFixed(2)}% no período (${period})`
                    : `${compareAsset.ticker} superando ${assetTicker} em ${Math.abs(spread).toFixed(2)}% no período (${period})`}
                </span>
              </div>
            </div>
          ) : (
            /* Single Asset Price Display */
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#e6edf3] tracking-tight">
                  {activePrimaryPoint ? formatPrice(activePrimaryPoint.price) : "---"}
                </span>
                <span
                  className={`flex items-center gap-1 font-mono text-sm sm:text-base font-bold ${
                    activePrimaryPct >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                  }`}
                >
                  <span>{activePrimaryPct >= 0 ? "+" : ""}</span>
                  <span>{formatPrice(activePrimaryPoint ? activePrimaryPoint.price - startPrice : 0)}</span>
                  <span>({activePrimaryPct >= 0 ? "+" : ""}{activePrimaryPct.toFixed(2)}%)</span>
                  <span className="text-xs text-[#8b949e] font-normal ml-1">no período ({period})</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#8b949e] mt-1 font-mono flex-wrap">
                <span>Data: {activePrimaryPoint?.date || "Hoje"}</span>
                {activePrimaryPoint?.time && <span>• {activePrimaryPoint.time}</span>}
                {activePrimaryPoint?.volume && (
                  <span>• Vol: {(activePrimaryPoint.volume / 1000).toFixed(0)}k</span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-[#0e1117] text-[10px] text-[#58a6ff] border border-[#30363d]">
                  Motor Gráfico D3 v7
                </span>
                {(isLoadingChart || isLoadingCompare) && (
                  <span className="text-[#58a6ff] flex items-center gap-1 font-sans">
                    <Loader2 className="w-3 h-3 animate-spin" /> Atualizando série histórica...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#0e1117] p-1 rounded-xl border border-[#30363d] overflow-x-auto scrollbar-none overscroll-x-contain scroll-touch-smooth max-w-full">
          {periods.map((p) => (
            <button
              key={p}
              id={`btn-period-${p.toLowerCase()}`}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                period === p
                  ? "bg-[#21262d] text-[#58a6ff] shadow-sm border border-[#58a6ff]/40"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Tools Bar & Comparison Trigger */}
      <div className="flex items-center justify-between py-3 text-xs text-[#8b949e] flex-wrap gap-2 border-b border-[#21262d]/50 relative overscroll-x-contain scroll-touch-smooth">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Style: Area / Line / Candle */}
          <div className="flex items-center bg-[#0e1117] rounded-lg p-0.5 border border-[#30363d]">
            <button
              onClick={() => setDisplayType("area")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                displayType === "area" ? "bg-[#21262d] text-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              Área
            </button>
            <button
              onClick={() => setDisplayType("line")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                displayType === "line" ? "bg-[#21262d] text-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              Linha
            </button>
            {!compareAsset && (
              <button
                onClick={() => setDisplayType("candle")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  displayType === "candle" ? "bg-[#21262d] text-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                Candlesticks
              </button>
            )}
          </div>

          {/* DUAL TICKER COMPARISON BUTTON & DROPDOWN */}
          <div className="relative" ref={compareMenuRef}>
            <button
              id="btn-compare-ticker"
              onClick={() => setIsCompareMenuOpen(!isCompareMenuOpen)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                compareAsset
                  ? "bg-[#f0883e]/15 border-[#f0883e] text-[#f0883e] hover:bg-[#f0883e]/25"
                  : "bg-[#0e1117] border-[#30363d] text-[#e6edf3] hover:border-[#58a6ff] hover:text-[#58a6ff]"
              }`}
              title="Comparar dois tickers no mesmo gráfico sobrepondo performances percentuais"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>
                {compareAsset ? `Comparando: ${compareAsset.ticker}` : "+ Comparar Ativo"}
              </span>
            </button>

            {/* Comparison Asset Selection Popover */}
            {isCompareMenuOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 bg-[#0e1117] border border-[#30363d] rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#21262d]">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-[#58a6ff]" />
                    <span>Selecionar Ativo para Comparação</span>
                  </span>
                  <button
                    onClick={() => setIsCompareMenuOpen(false)}
                    className="p-1 rounded text-[#8b949e] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar ação, moeda, índice ou cripto..."
                    value={compareSearch}
                    onChange={(e) => setCompareSearch(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                    autoFocus
                  />
                </div>

                {/* Quick Benchmark Chips */}
                <div className="mb-2.5">
                  <span className="text-[10px] font-semibold text-[#8b949e] uppercase block mb-1">
                    Benchmarks & Ativos Populares:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {quickCompareTickers
                      .filter((t) => t.toUpperCase() !== assetTicker.toUpperCase())
                      .map((t) => {
                        const found =
                          allAssets.find((a) => a.ticker.toUpperCase() === t.toUpperCase()) ||
                          ALL_ASSETS.find((a) => a.ticker.toUpperCase() === t.toUpperCase() || a.id.toLowerCase() === t.toLowerCase());
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              if (found) {
                                handleSelectCompare(found);
                              } else {
                                handleSelectCompare({
                                  id: t.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                                  ticker: t,
                                  name: t,
                                  price: 100,
                                  change: 0,
                                  changePercent: 0,
                                  currency: "BRL",
                                  exchange: "B3 / Global",
                                  category: "América Latina",
                                  metrics: {
                                    open: 100,
                                    high: 100,
                                    low: 100,
                                    high52w: 100,
                                    low52w: 100,
                                    prevClose: 100,
                                    volume: "---",
                                  },
                                  profile: {
                                    description: `Ativo de mercado ${t}`,
                                    sector: "Mercado Financeiro",
                                    headquarters: "Brasil",
                                    websiteUrl: "",
                                    websiteLabel: "",
                                    exchange: "B3",
                                    currency: "BRL",
                                  },
                                  relatedAssetIds: [],
                                  historical: historicalData,
                                  sparkline: [100, 101, 102],
                                });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors border cursor-pointer ${
                              compareAsset?.ticker.toUpperCase() === t.toUpperCase()
                                ? "bg-[#f0883e]/20 text-[#f0883e] border-[#f0883e]/50"
                                : "bg-[#161b22] text-[#8b949e] hover:text-white border-[#30363d]"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Filtered Asset List */}
                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredCompareAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectCompare(asset)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition-colors text-left cursor-pointer group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-mono font-bold text-xs text-white group-hover:text-[#58a6ff]">
                          {asset.ticker}
                        </div>
                        <div className="text-[11px] text-[#8b949e] truncate">
                          {asset.name}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs text-white">
                          {formatPrice(asset.price, asset.currency)}
                        </div>
                        <div
                          className={`font-mono text-[10px] font-semibold ${
                            asset.changePercent >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                          }`}
                        >
                          {asset.changePercent >= 0 ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle between % Performance and $ Price */}
          {compareAsset && (
            <button
              onClick={() => setIsPercentMode(!isPercentMode)}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 bg-[#21262d] text-[#58a6ff] border-[#30363d]"
              title="Alternar entre escala percentual (%) e valor monetário"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>{isPercentMode ? "Modo: % Retorno" : "Modo: Valor"}</span>
            </button>
          )}

          {/* Indicators Toggle */}
          {!compareAsset && (
            <>
              <button
                onClick={() => setShowSMA(!showSMA)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  showSMA
                    ? "bg-[#a371f7]/15 border-[#a371f7] text-[#d2a8ff]"
                    : "bg-[#0e1117] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Média Móvel (5)</span>
              </button>

              <button
                onClick={() => setShowBenchmark(!showBenchmark)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  showBenchmark
                    ? "bg-[#58a6ff]/15 border-[#58a6ff] text-[#58a6ff]"
                    : "bg-[#0e1117] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Benchmark Comparativo</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
              showVolume
                ? "bg-[#238636]/15 border-[#238636] text-[#7ee787]"
                : "bg-[#0e1117] border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Volume</span>
          </button>
        </div>

        {/* Legend / Range summary */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {compareAsset ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-white">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                {assetTicker} ({activePrimaryPct >= 0 ? "+" : ""}{activePrimaryPct.toFixed(2)}%)
              </span>
              <span className="text-[#30363d]">|</span>
              <span className="flex items-center gap-1 font-bold text-[#f0883e]">
                <span className="w-2 h-2 rounded-full bg-[#f0883e]" />
                {compareAsset.ticker} ({activeComparePct >= 0 ? "+" : ""}{activeComparePct.toFixed(2)}%)
              </span>
            </div>
          ) : (
            <>
              <span>Mín: {formatPrice(minPrice)}</span>
              <span className="text-[#30363d]">|</span>
              <span>Máx: {formatPrice(maxPrice)}</span>
            </>
          )}
        </div>
      </div>

      {/* Main D3 Interactive SVG Canvas */}
      <div className="w-full h-[320px] sm:h-[380px] relative my-2 select-none touch-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* D3 Primary Gradient Fill */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.32" />
              <stop offset="65%" stopColor={primaryColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>

            {/* D3 Glow Filter Primary */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={primaryColor} floodOpacity="0.4" />
            </filter>

            {/* D3 Glow Filter Compare */}
            <filter id={compareGlowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={compareColor} floodOpacity="0.45" />
            </filter>
          </defs>

          {/* D3 Grid Lines & Y-axis labels */}
          {yTicks.map((val, idx) => {
            const y = yScale(val);
            return (
              <g key={`d3-grid-${idx}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + innerWidth}
                  y2={y}
                  stroke={val === 0 && (isPercentMode || compareAsset) ? "#58a6ff/40" : "#21262d"}
                  strokeDasharray={val === 0 && (isPercentMode || compareAsset) ? "none" : "4 4"}
                  strokeWidth={val === 0 && (isPercentMode || compareAsset) ? "1.5" : "1"}
                />
                <text
                  x={margin.left + innerWidth + 8}
                  y={y + 3.5}
                  fill={val === 0 && (isPercentMode || compareAsset) ? "#58a6ff" : "#8b949e"}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={val === 0 && (isPercentMode || compareAsset) ? "bold" : "normal"}
                >
                  {isPercentMode || compareAsset
                    ? `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`
                    : formatPrice(val)}
                </text>
              </g>
            );
          })}

          {/* X-axis baseline */}
          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke="#30363d"
            strokeWidth="1"
          />

          {/* Volume Bars */}
          {showVolume &&
            !compareAsset &&
            points.map((p, idx) => {
              const x = xScale(idx);
              const barHeight = volumeScale(p.volume || 0);
              const y = margin.top + innerHeight - barHeight;
              const isUp = (p.close || p.price) >= (p.open || p.price);
              return (
                <rect
                  key={`d3-vol-${idx}`}
                  x={x - 2.5}
                  y={y}
                  width="5"
                  height={Math.max(barHeight, 2)}
                  fill={isUp ? "#00c853" : "#ff5252"}
                  opacity="0.22"
                  rx="1"
                />
              );
            })}

          {/* D3 Smooth Area Path (Primary) */}
          {displayType === "area" && d3AreaPath && !compareAsset && (
            <path d={d3AreaPath} fill={`url(#${gradientId})`} />
          )}

          {/* 1. D3 Primary Asset Smooth Curve */}
          {d3LinePath && (
            <path
              d={d3LinePath}
              fill="none"
              stroke={primaryColor}
              strokeWidth={compareAsset ? "3" : "2.75"}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
            />
          )}

          {/* 2. D3 Secondary Comparison Asset Smooth Curve */}
          {compareAsset && d3CompareLinePath && (
            <path
              d={d3CompareLinePath}
              fill="none"
              stroke={compareColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={period === "1D" ? "none" : "none"}
              filter={`url(#${compareGlowFilterId})`}
            />
          )}

          {/* Candlestick Visualization (When single ticker) */}
          {displayType === "candle" &&
            !compareAsset &&
            points.map((p, idx) => {
              const x = xScale(idx);
              const o = p.open || p.price;
              const c = p.close || p.price;
              const h = p.high || Math.max(o, c);
              const l = p.low || Math.min(o, c);

              const yHigh = yScale(h);
              const yLow = yScale(l);
              const yOpen = yScale(o);
              const yClose = yScale(c);

              const topBody = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2.5);
              const isBullish = c >= o;
              const candleColor = isBullish ? "#00c853" : "#ff5252";

              return (
                <g key={`d3-candle-${idx}`}>
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  <rect
                    x={x - 3.5}
                    y={topBody}
                    width="7"
                    height={bodyHeight}
                    fill={isBullish ? "#00c853" : "#ff5252"}
                    fillOpacity="0.85"
                    stroke={candleColor}
                    strokeWidth="0.8"
                    rx="1.5"
                  />
                </g>
              );
            })}

          {/* D3 Moving Average Line */}
          {showSMA && d3SmaPath && !compareAsset && (
            <path
              d={d3SmaPath}
              fill="none"
              stroke="#d2a8ff"
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity="0.9"
            />
          )}

          {/* D3 Comparative Benchmark Line (Preset) */}
          {showBenchmark && d3BenchmarkPath && !compareAsset && (
            <path
              d={d3BenchmarkPath}
              fill="none"
              stroke="#58a6ff"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              opacity="0.85"
            />
          )}

          {/* Event Annotations */}
          {activeAnnotations.map((ann, aIdx) => {
            const y = yScale(ann.price);
            return (
              <g key={`ann-${aIdx}`}>
                <circle cx={margin.left + innerWidth - 20} cy={y} r="4" fill="#e3b341" />
                <text
                  x={margin.left + innerWidth - 30}
                  y={y - 8}
                  fill="#e3b341"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="sans-serif"
                >
                  {ann.label}
                </text>
              </g>
            );
          })}

          {/* Interactive D3 Crosshair & Indicator Points */}
          {hoveredIndex !== null && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={xScale(hoveredIndex)}
                y1={margin.top}
                x2={xScale(hoveredIndex)}
                y2={margin.top + innerHeight}
                stroke="#58a6ff"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.75"
              />

              {/* Primary Asset Glowing Point */}
              {activePrimaryPoint && (
                <circle
                  cx={xScale(hoveredIndex)}
                  cy={yScale(
                    isPercentMode || compareAsset
                      ? activePrimaryPct
                      : activePrimaryPoint.price
                  )}
                  r="7"
                  fill={primaryColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${glowFilterId})`}
                />
              )}

              {/* Secondary Compare Asset Glowing Point */}
              {compareAsset && activeComparePoint && (
                <circle
                  cx={xScale(hoveredIndex)}
                  cy={yScale(activeComparePct)}
                  r="7"
                  fill={compareColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter={`url(#${compareGlowFilterId})`}
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Scrubber HUD Tooltip */}
        {hoveredIndex !== null && activePrimaryPoint && (
          <div
            className="absolute pointer-events-none z-20 bg-[#0e1117]/95 border border-[#30363d] rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md text-xs font-mono transition-transform"
            style={{
              left: Math.min(
                Math.max(16, (xScale(hoveredIndex) / width) * 100),
                70
              ) + "%",
              top: "10px",
            }}
          >
            <div className="flex items-center justify-between gap-3 text-[11px] text-[#8b949e] border-b border-[#21262d] pb-1 mb-1.5">
              <span>{activePrimaryPoint.date}</span>
              {activePrimaryPoint.time && <span>{activePrimaryPoint.time}</span>}
            </div>

            {/* Primary Asset Point Info */}
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: primaryColor }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span>{assetTicker}:</span>
              </span>
              <span className="text-white font-bold">
                {formatPrice(activePrimaryPoint.price)}
                <span
                  className={`ml-1 text-[11px] ${
                    activePrimaryPct >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                  }`}
                >
                  ({activePrimaryPct >= 0 ? "+" : ""}{activePrimaryPct.toFixed(2)}%)
                </span>
              </span>
            </div>

            {/* Compare Asset Point Info */}
            {compareAsset && activeComparePoint && (
              <div className="flex items-center justify-between gap-4 mt-1">
                <span className="flex items-center gap-1.5 font-bold text-[#f0883e]">
                  <span className="w-2 h-2 rounded-full bg-[#f0883e]" />
                  <span>{compareAsset.ticker}:</span>
                </span>
                <span className="text-white font-bold">
                  {formatPrice(activeComparePoint.price, compareAsset.currency)}
                  <span
                    className={`ml-1 text-[11px] ${
                      activeComparePct >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                    }`}
                  >
                    ({activeComparePct >= 0 ? "+" : ""}{activeComparePct.toFixed(2)}%)
                  </span>
                </span>
              </div>
            )}

            {/* Spread info */}
            {compareAsset && (
              <div className="pt-1.5 mt-1.5 border-t border-[#21262d] flex items-center justify-between text-[11px]">
                <span className="text-[#8b949e]">Spread:</span>
                <span
                  className={`font-bold ${
                    spread >= 0 ? "text-[#00c853]" : "text-[#ff5252]"
                  }`}
                >
                  {spread >= 0 ? "+" : ""}{spread.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
