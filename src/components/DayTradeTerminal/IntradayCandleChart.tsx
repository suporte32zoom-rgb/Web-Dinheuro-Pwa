import React, { useState, useMemo, useRef, useEffect } from "react";
import { Asset, DayTradePosition } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import {
  MousePointer,
  Crosshair,
  TrendingUp,
  Minus,
  Layers,
  RotateCcw,
  Trash2,
  Zap,
  X,
  Check,
} from "lucide-react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  ema9: number;
  sma21: number;
  ma200: number;
}

interface IntradayCandleChartProps {
  asset: Asset;
  activePosition?: DayTradePosition;
}

type TimeFrame = "1m" | "5m" | "15m" | "60m" | "1D";
export type DrawingToolType = "cursor" | "trendline" | "support_resistance" | "fibonacci";
export type SRKind = "support" | "resistance" | "neutral";

export interface TrendlineDrawing {
  id: string;
  type: "trendline";
  p1: { xIndex: number; price: number };
  p2: { xIndex: number; price: number };
  color: string;
}

export interface SupportResistanceDrawing {
  id: string;
  type: "support_resistance";
  price: number;
  kind: SRKind;
  color: string;
}

export interface FibonacciDrawing {
  id: string;
  type: "fibonacci";
  p1: { xIndex: number; price: number };
  p2: { xIndex: number; price: number };
  color: string;
}

export type ChartDrawing = TrendlineDrawing | SupportResistanceDrawing | FibonacciDrawing;

// Fibonacci Standard Ratios
const FIB_LEVELS = [
  { ratio: 0.0, label: "0.0%", color: "#8b949e" },
  { ratio: 0.236, label: "23.6%", color: "#f85149" },
  { ratio: 0.382, label: "38.2%", color: "#d29922" },
  { ratio: 0.5, label: "50.0%", color: "#3fb950" },
  { ratio: 0.618, label: "61.8% (Golden)", color: "#e3b341" },
  { ratio: 0.786, label: "78.6%", color: "#58a6ff" },
  { ratio: 1.0, label: "100.0%", color: "#8b949e" },
];

export const IntradayCandleChart: React.FC<IntradayCandleChartProps> = ({
  asset,
  activePosition,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>("5m");
  const [showVWAP, setShowVWAP] = useState(true);
  const [showMA9, setShowMA9] = useState(true);
  const [showMA21, setShowMA21] = useState(true);
  const [showMA200, setShowMA200] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  // Drawing Toolbar State
  const [activeTool, setActiveTool] = useState<DrawingToolType>("cursor");
  const [srKind, setSrKind] = useState<SRKind>("support");
  const [snapToCandle, setSnapToCandle] = useState(true);
  const [drawings, setDrawings] = useState<ChartDrawing[]>(() => {
    try {
      const saved = localStorage.getItem(`dinheuro_chart_drawings_${asset.ticker}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState<{ xIndex: number; price: number } | null>(null);
  const [mouseCoord, setMouseCoord] = useState<{
    x: number;
    y: number;
    price: number;
    xIndex: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Persist drawings per asset
  useEffect(() => {
    try {
      localStorage.setItem(`dinheuro_chart_drawings_${asset.ticker}`, JSON.stringify(drawings));
    } catch {
      // Ignore storage errors
    }
  }, [drawings, asset.ticker]);

  // Cancel draft on Escape key or delete selected on Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraftPoint(null);
        setActiveTool("cursor");
        setSelectedDrawingId(null);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedDrawingId) {
        setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDrawingId]);

  // Generate realistic intraday candle sequence tailored to the timeframe & asset price
  const candleSeries = useMemo(() => {
    const candlesCount = timeframe === "1m" ? 36 : timeframe === "5m" ? 30 : timeframe === "15m" ? 24 : 20;
    const base = asset.price;
    const volatility = base > 1000 ? 80 : base > 100 ? 1.5 : 0.25;

    const list: CandleData[] = [];
    let prevClose = base * 0.985;
    let cumVolume = 0;
    let cumVolPrice = 0;

    const now = new Date();
    const intervalMinutes = timeframe === "1m" ? 1 : timeframe === "5m" ? 5 : timeframe === "15m" ? 15 : 60;

    for (let i = 0; i < candlesCount; i++) {
      const offsetMinutes = (candlesCount - i) * intervalMinutes;
      const d = new Date(now.getTime() - offsetMinutes * 60 * 1000);
      const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

      const open = prevClose;
      const noise = (Math.random() - 0.48) * volatility;
      const close = i === candlesCount - 1 ? base : Math.max(open + noise, base * 0.5);
      const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.6);
      const volume = Math.floor(1500 + Math.random() * 45000);

      cumVolume += volume;
      cumVolPrice += ((high + low + close) / 3) * volume;
      const vwap = Number((cumVolPrice / cumVolume).toFixed(2));

      prevClose = close;

      list.push({
        time: timeStr,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        vwap,
        ema9: close,
        sma21: close,
        ma200: close,
      });
    }

    // Force the last candle's close to exact live price
    if (list.length > 0) {
      const last = list[list.length - 1];
      last.close = base;
      last.high = Math.max(last.high, base);
      last.low = Math.min(last.low, base);
    }

    // Dynamically calculate accurate Moving Averages (MA 9, MA 21, MA 200)
    for (let i = 0; i < list.length; i++) {
      // MA 9
      const slice9 = list.slice(Math.max(0, i - 8), i + 1);
      const avg9 = slice9.reduce((acc, c) => acc + c.close, 0) / slice9.length;
      list[i].ema9 = Number(avg9.toFixed(2));

      // MA 21
      const slice21 = list.slice(Math.max(0, i - 20), i + 1);
      const avg21 = slice21.reduce((acc, c) => acc + c.close, 0) / slice21.length;
      list[i].sma21 = Number(avg21.toFixed(2));

      // MA 200 (Long-term baseline moving average with gentle trend)
      const offsetRatio = (i - candlesCount * 0.7) * 0.0003;
      list[i].ma200 = Number((base * (0.988 + offsetRatio)).toFixed(2));
    }

    return list;
  }, [asset.price, timeframe]);

  // Chart min and max for scaling
  const { minVal, maxVal, maxVol } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let volMax = 1;

    candleSeries.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > volMax) volMax = c.volume;
    });

    if (activePosition) {
      if (activePosition.entryPrice < min) min = activePosition.entryPrice;
      if (activePosition.entryPrice > max) max = activePosition.entryPrice;
    }

    // Include drawings in price scaling so drawn lines don't clip
    drawings.forEach((d) => {
      if (d.type === "support_resistance") {
        if (d.price < min) min = d.price;
        if (d.price > max) max = d.price;
      } else if (d.type === "trendline" || d.type === "fibonacci") {
        if (d.p1.price < min) min = d.p1.price;
        if (d.p1.price > max) max = d.p1.price;
        if (d.p2.price < min) min = d.p2.price;
        if (d.p2.price > max) max = d.p2.price;
      }
    });

    const pad = (max - min) * 0.08 || 1;
    return {
      minVal: min - pad,
      maxVal: max + pad,
      maxVol: volMax,
    };
  }, [candleSeries, activePosition, drawings]);

  const chartHeight = 260;
  const candleWidth = 14;
  const candleGap = 6;
  const svgWidth = Math.max(640, candleSeries.length * (candleWidth + candleGap) + 90);

  const getY = (val: number, height: number) => {
    if (maxVal === minVal) return height / 2;
    return height - ((val - minVal) / (maxVal - minVal)) * height;
  };

  const getPriceFromY = (y: number, height: number) => {
    if (height <= 0) return minVal;
    const clampedY = Math.max(0, Math.min(height, y));
    const ratio = (height - clampedY) / height;
    return minVal + ratio * (maxVal - minVal);
  };

  const getIndexFromX = (x: number) => {
    const step = candleWidth + candleGap;
    const idx = Math.floor(x / step);
    return Math.max(0, Math.min(candleSeries.length - 1, idx));
  };

  const getXFromIndex = (index: number) => {
    return index * (candleWidth + candleGap) + candleWidth / 2;
  };

  // Convert client pointer event to SVG coordinates
  const calculateSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleX = svgWidth / rect.width;
    const scaleY = chartHeight / rect.height;

    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(0, Math.min(svgWidth - 60, rawX));
    const clampedY = Math.max(0, Math.min(chartHeight - 50, rawY));

    let price = getPriceFromY(clampedY, chartHeight - 50);
    const xIndex = getIndexFromX(clampedX);

    // Magnet snap to nearest candle point (High, Low, Close, Open)
    if (snapToCandle && candleSeries[xIndex]) {
      const c = candleSeries[xIndex];
      const targets = [c.high, c.low, c.close, c.open];
      let closest = targets[0];
      let minDiff = Math.abs(price - closest);
      for (const t of targets) {
        const diff = Math.abs(price - t);
        if (diff < minDiff) {
          minDiff = diff;
          closest = t;
        }
      }
      // If within 15% price sensitivity, snap to candle anchor
      if (minDiff / (maxVal - minVal) < 0.05) {
        price = closest;
      }
    }

    return {
      x: clampedX,
      y: getY(price, chartHeight - 50),
      price: Number(price.toFixed(price > 100 ? 1 : 2)),
      xIndex,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = calculateSvgCoords(e);
    if (!coords) return;
    setMouseCoord(coords);

    if (activeTool === "cursor") {
      setHoveredCandle(candleSeries[coords.xIndex] || null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setMouseCoord(null);
    if (activeTool === "cursor") {
      setHoveredCandle(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = calculateSvgCoords(e);
    if (!coords) return;

    if (activeTool === "support_resistance") {
      const color = srKind === "support" ? "#2ea043" : srKind === "resistance" ? "#f85149" : "#58a6ff";
      const newSR: SupportResistanceDrawing = {
        id: `sr_${Date.now()}`,
        type: "support_resistance",
        price: coords.price,
        kind: srKind,
        color,
      };
      setDrawings((prev) => [...prev, newSR]);
      setSelectedDrawingId(newSR.id);
      return;
    }

    if (activeTool === "trendline") {
      if (!draftPoint) {
        setDraftPoint({ xIndex: coords.xIndex, price: coords.price });
      } else {
        const newTrendline: TrendlineDrawing = {
          id: `trend_${Date.now()}`,
          type: "trendline",
          p1: draftPoint,
          p2: { xIndex: coords.xIndex, price: coords.price },
          color: "#58a6ff",
        };
        setDrawings((prev) => [...prev, newTrendline]);
        setSelectedDrawingId(newTrendline.id);
        setDraftPoint(null);
      }
      return;
    }

    if (activeTool === "fibonacci") {
      if (!draftPoint) {
        setDraftPoint({ xIndex: coords.xIndex, price: coords.price });
      } else {
        const newFib: FibonacciDrawing = {
          id: `fib_${Date.now()}`,
          type: "fibonacci",
          p1: draftPoint,
          p2: { xIndex: coords.xIndex, price: coords.price },
          color: "#e3b341",
        };
        setDrawings((prev) => [...prev, newFib]);
        setSelectedDrawingId(newFib.id);
        setDraftPoint(null);
      }
      return;
    }

    // Cursor mode: click to deselect or keep focus
    setSelectedDrawingId(null);
  };

  const handleUndo = () => {
    setDrawings((prev) => prev.slice(0, -1));
    setSelectedDrawingId(null);
    setDraftPoint(null);
  };

  const handleClearAll = () => {
    setDrawings([]);
    setSelectedDrawingId(null);
    setDraftPoint(null);
  };

  const activeCandle = hoveredCandle || candleSeries[candleSeries.length - 1];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col shadow-lg overflow-hidden select-none h-full">
      {/* 1. Header: Asset Ticker, Timeframes & Indicators */}
      <div className="px-2.5 py-1.5 border-b border-[#21262d] bg-[#0e1117]/80 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide">{asset.ticker}</span>
            <span className="text-[11px] text-[#8b949e]">Intraday</span>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
            {(["1m", "5m", "15m", "60m", "1D"] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/40 shadow-xs"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Technical Indicator Toggles */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowVWAP(!showVWAP)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
                showVWAP
                  ? "bg-[#e3b341]/15 text-[#e3b341] border-[#e3b341]/40"
                  : "bg-transparent text-[#8b949e] border-transparent hover:border-[#30363d]"
              }`}
            >
              <span className="w-2 h-0.5 bg-[#e3b341]" />
              VWAP
            </button>

            <button
              type="button"
              onClick={() => setShowMA9(!showMA9)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
                showMA9
                  ? "bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40"
                  : "bg-transparent text-[#8b949e] border-transparent hover:border-[#30363d]"
              }`}
            >
              <span className="w-2 h-0.5 bg-[#58a6ff]" />
              MA 9
            </button>

            <button
              type="button"
              onClick={() => setShowMA21(!showMA21)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
                showMA21
                  ? "bg-[#f0883e]/15 text-[#f0883e] border-[#f0883e]/40"
                  : "bg-transparent text-[#8b949e] border-transparent hover:border-[#30363d]"
              }`}
            >
              <span className="w-2 h-0.5 bg-[#f0883e]" />
              MA 21
            </button>

            <button
              type="button"
              onClick={() => setShowMA200(!showMA200)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
                showMA200
                  ? "bg-[#bc8cff]/15 text-[#bc8cff] border-[#bc8cff]/40"
                  : "bg-transparent text-[#8b949e] border-transparent hover:border-[#30363d]"
              }`}
            >
              <span className="w-2 h-0.5 bg-[#bc8cff]" />
              MA 200
            </button>
          </div>
        </div>

        {/* Live Candle OHLC Legend */}
        {activeCandle && (
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono">
            <span className="text-[#8b949e]">
              Abertura: <strong className="text-white">{activeCandle.open}</strong>
            </span>
            <span className="text-[#8b949e]">
              Máx: <strong className="text-[#00c853]">{activeCandle.high}</strong>
            </span>
            <span className="text-[#8b949e]">
              Mín: <strong className="text-[#ff5252]">{activeCandle.low}</strong>
            </span>
            <span className="text-[#8b949e]">
              Fechamento:{" "}
              <strong className={activeCandle.close >= activeCandle.open ? "text-[#00c853]" : "text-[#ff5252]"}>
                {activeCandle.close}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive Chart Drawing Toolbar */}
      <div className="px-2.5 py-1 border-b border-[#21262d] bg-[#12161d] flex flex-wrap items-center justify-between gap-1.5 text-xs shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-semibold text-[#8b949e] mr-1 hidden md:inline">
            Ferramentas Gráficas:
          </span>

          {/* Cursor / Inspecionar */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("cursor");
              setDraftPoint(null);
            }}
            title="Cursor de Inspeção (Inspecionar candles)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTool === "cursor"
                ? "bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/50 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1f242c]"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Cursor</span>
          </button>

          {/* Linha de Tendência */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("trendline");
              setDraftPoint(null);
            }}
            title="Traçar Linha de Tendência (LTA / LTB) entre 2 pontos"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTool === "trendline"
                ? "bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/60 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1f242c]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Linha de Tendência</span>
          </button>

          {/* Suporte & Resistência Horizontal */}
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveTool("support_resistance");
                setDraftPoint(null);
              }}
              title="Traçar Nível Horizontal (Suporte ou Resistência)"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTool === "support_resistance"
                  ? "bg-[#21262d] text-white"
                  : "text-[#8b949e] hover:text-white"
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Suporte / Resistência</span>
            </button>

            {/* Sub-selector: Suporte (Verde) vs Resistência (Vermelha) */}
            {activeTool === "support_resistance" && (
              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setSrKind("support")}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors ${
                    srKind === "support"
                      ? "bg-[#238636] text-white"
                      : "text-[#3fb950] hover:bg-[#238636]/20"
                  }`}
                  title="Configurar como Suporte (Verde)"
                >
                  Suporte
                </button>
                <button
                  type="button"
                  onClick={() => setSrKind("resistance")}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-colors ${
                    srKind === "resistance"
                      ? "bg-[#da3633] text-white"
                      : "text-[#f85149] hover:bg-[#da3633]/20"
                  }`}
                  title="Configurar como Resistência (Vermelha)"
                >
                  Resistência
                </button>
              </div>
            )}
          </div>

          {/* Retração de Fibonacci */}
          <button
            type="button"
            onClick={() => {
              setActiveTool("fibonacci");
              setDraftPoint(null);
            }}
            title="Traçar Retração de Fibonacci (Níveis 23.6%, 38.2%, 50%, 61.8% Golden)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTool === "fibonacci"
                ? "bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/60 shadow-xs"
                : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1f242c]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fibonacci</span>
          </button>

          {/* Imã / Snap to Candle Toggle */}
          <button
            type="button"
            onClick={() => setSnapToCandle(!snapToCandle)}
            title="Imã Inteligente: atrai o ponto para Máxima, Mínima ou Fechamento do candle"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              snapToCandle
                ? "bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/40"
                : "text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap Imã</span>
          </button>
        </div>

        {/* Right Side: Undo, Clear & Status */}
        <div className="flex items-center gap-2">
          {drawings.length > 0 && (
            <span className="text-[11px] text-[#8b949e] font-mono">
              {drawings.length} {drawings.length === 1 ? "desenho" : "desenhos"}
            </span>
          )}

          <button
            type="button"
            onClick={handleUndo}
            disabled={drawings.length === 0}
            title="Desfazer último traçado"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#8b949e] hover:text-white hover:bg-[#1f242c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={drawings.length === 0}
            title="Limpar todos os desenhos do gráfico"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#f85149] hover:bg-[#da3633]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {/* 3. Instruction Helper Strip when drawing is active */}
      {activeTool !== "cursor" && (
        <div className="px-3 py-1 bg-[#1f6feb]/10 border-b border-[#1f6feb]/20 text-[11px] text-[#79c0ff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-ping" />
            <span>
              {activeTool === "trendline" && !draftPoint && "Clique no 1º ponto do gráfico para iniciar a Linha de Tendência"}
              {activeTool === "trendline" && draftPoint && "Clique no 2º ponto para fixar a Linha de Tendência (Esc para cancelar)"}
              {activeTool === "support_resistance" && `Clique em qualquer altura do gráfico para fixar o nível de ${srKind === "support" ? "Suporte" : "Resistência"}`}
              {activeTool === "fibonacci" && !draftPoint && "Clique no topo ou fundo de referência (1º ponto de Fibonacci)"}
              {activeTool === "fibonacci" && draftPoint && "Clique no ponto oposto para traçar a Retração de Fibonacci (Esc para cancelar)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTool("cursor");
              setDraftPoint(null);
            }}
            className="text-[#8b949e] hover:text-white text-xs underline cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* 4. SVG Canvas Area */}
      <div className="relative w-full flex-1 overflow-x-auto scrollbar-none bg-[#0e1117] p-1.5 min-h-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          onClick={handleCanvasClick}
          className={`w-full h-[210px] overflow-visible select-none ${
            activeTool !== "cursor" ? "cursor-crosshair" : "cursor-default"
          }`}
        >
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct) => {
            const y = chartHeight * pct;
            const priceVal = maxVal - pct * (maxVal - minVal);
            return (
              <g key={pct}>
                <line
                  x1={0}
                  y1={y}
                  x2={svgWidth - 65}
                  y2={y}
                  stroke="#21262d"
                  strokeDasharray="3 3"
                />
                <text
                  x={svgWidth - 60}
                  y={y + 3}
                  fill="#8b949e"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {priceVal.toFixed(priceVal > 100 ? 0 : 2)}
                </text>
              </g>
            );
          })}

          {/* VWAP Polyline */}
          {showVWAP && (
            <polyline
              fill="none"
              stroke="#e3b341"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              points={candleSeries
                .map((c, i) => `${getXFromIndex(i)},${getY(c.vwap, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* MA 9 Polyline */}
          {showMA9 && (
            <polyline
              fill="none"
              stroke="#58a6ff"
              strokeWidth={1.5}
              points={candleSeries
                .map((c, i) => `${getXFromIndex(i)},${getY(c.ema9, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* MA 21 Polyline */}
          {showMA21 && (
            <polyline
              fill="none"
              stroke="#f0883e"
              strokeWidth={1.5}
              points={candleSeries
                .map((c, i) => `${getXFromIndex(i)},${getY(c.sma21, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* MA 200 Polyline */}
          {showMA200 && (
            <polyline
              fill="none"
              stroke="#bc8cff"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              points={candleSeries
                .map((c, i) => `${getXFromIndex(i)},${getY(c.ma200, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* Active Position Entry Price Line if present */}
          {activePosition && (
            <g>
              <line
                x1={0}
                y1={getY(activePosition.entryPrice, chartHeight - 50)}
                x2={svgWidth - 65}
                y2={getY(activePosition.entryPrice, chartHeight - 50)}
                stroke={activePosition.side === "BUY" ? "#00c853" : "#ff5252"}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <rect
                x={svgWidth - 62}
                y={getY(activePosition.entryPrice, chartHeight - 50) - 8}
                width={60}
                height={16}
                rx={4}
                fill={activePosition.side === "BUY" ? "#238636" : "#da3633"}
              />
              <text
                x={svgWidth - 32}
                y={getY(activePosition.entryPrice, chartHeight - 50) + 3}
                fill="#ffffff"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {activePosition.side === "BUY" ? "C" : "V"} {activePosition.entryPrice.toFixed(1)}
              </text>
            </g>
          )}

          {/* Candlesticks & Volume Bars */}
          {candleSeries.map((c, i) => {
            const x = i * (candleWidth + candleGap);
            const isBull = c.close >= c.open;
            const candleColor = isBull ? "#2ea043" : "#f85149";

            const yOpen = getY(c.open, chartHeight - 50);
            const yClose = getY(c.close, chartHeight - 50);
            const yHigh = getY(c.high, chartHeight - 50);
            const yLow = getY(c.low, chartHeight - 50);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);

            // Volume bar at the bottom
            const volBarHeight = (c.volume / maxVol) * 36;
            const volY = chartHeight - volBarHeight;

            return (
              <g
                key={c.time}
                onMouseEnter={() => {
                  if (activeTool === "cursor") setHoveredCandle(c);
                }}
                className={activeTool === "cursor" ? "cursor-pointer" : ""}
              >
                {/* Volume Bar */}
                <rect
                  x={x}
                  y={volY}
                  width={candleWidth}
                  height={volBarHeight}
                  fill={isBull ? "#238636" : "#da3633"}
                  opacity={0.35}
                />

                {/* Upper and Lower Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={yHigh}
                  x2={x + candleWidth / 2}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth={1.5}
                />

                {/* Candle Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx={1}
                />
              </g>
            );
          })}

          {/* 5. USER DRAWINGS RENDER LAYER */}

          {/* A. Support & Resistance Lines */}
          {drawings
            .filter((d): d is SupportResistanceDrawing => d.type === "support_resistance")
            .map((sr) => {
              const y = getY(sr.price, chartHeight - 50);
              const isSelected = selectedDrawingId === sr.id;
              const label = sr.kind === "support" ? "SUP" : sr.kind === "resistance" ? "RES" : "NÍVEL";

              return (
                <g
                  key={sr.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrawingId(sr.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Invisible broad hit box */}
                  <line
                    x1={0}
                    y1={y}
                    x2={svgWidth - 65}
                    y2={y}
                    stroke="transparent"
                    strokeWidth={12}
                  />

                  {/* Visible SR Line */}
                  <line
                    x1={0}
                    y1={y}
                    x2={svgWidth - 65}
                    y2={y}
                    stroke={sr.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isSelected ? "none" : "6 3"}
                  />

                  {/* Price Tag badge on right axis */}
                  <rect
                    x={svgWidth - 64}
                    y={y - 8}
                    width={62}
                    height={16}
                    rx={3}
                    fill={sr.color}
                    opacity={isSelected ? 1 : 0.9}
                  />
                  <text
                    x={svgWidth - 33}
                    y={y + 3}
                    fill="#ffffff"
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {label} {sr.price.toFixed(1)}
                  </text>

                  {/* Remove Button on selection */}
                  {isSelected && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawings((prev) => prev.filter((d) => d.id !== sr.id));
                        setSelectedDrawingId(null);
                      }}
                      className="cursor-pointer"
                    >
                      <circle cx={20} cy={y} r={7} fill="#da3633" />
                      <line x1={17} y1={y - 3} x2={23} y2={y + 3} stroke="#fff" strokeWidth={1.5} />
                      <line x1={23} y1={y - 3} x2={17} y2={y + 3} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  )}
                </g>
              );
            })}

          {/* B. Fibonacci Retracement Grids */}
          {drawings
            .filter((d): d is FibonacciDrawing => d.type === "fibonacci")
            .map((fib) => {
              const x1 = getXFromIndex(fib.p1.xIndex);
              const x2 = getXFromIndex(fib.p2.xIndex);
              const minX = Math.min(x1, x2);
              const maxX = svgWidth - 65;
              const isSelected = selectedDrawingId === fib.id;

              const diff = fib.p2.price - fib.p1.price;
              const y382 = getY(fib.p1.price + diff * 0.382, chartHeight - 50);
              const y618 = getY(fib.p1.price + diff * 0.618, chartHeight - 50);

              const goldenTop = Math.min(y382, y618);
              const goldenHeight = Math.abs(y618 - y382);

              return (
                <g
                  key={fib.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrawingId(fib.id);
                  }}
                  className="cursor-pointer"
                >
                  {/* Golden Pocket (38.2% - 61.8%) Shaded Band */}
                  <rect
                    x={minX}
                    y={goldenTop}
                    width={maxX - minX}
                    height={goldenHeight}
                    fill="#e3b341"
                    opacity={isSelected ? 0.2 : 0.12}
                  />

                  {/* Diagonal Reference Anchor Line */}
                  <line
                    x1={x1}
                    y1={getY(fib.p1.price, chartHeight - 50)}
                    x2={x2}
                    y2={getY(fib.p2.price, chartHeight - 50)}
                    stroke="#e3b341"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.6}
                  />

                  {/* 7 Horizontal Fibonacci Levels */}
                  {FIB_LEVELS.map((lvl) => {
                    const priceAtLvl = fib.p1.price + diff * lvl.ratio;
                    const yLvl = getY(priceAtLvl, chartHeight - 50);

                    return (
                      <g key={lvl.ratio}>
                        <line
                          x1={minX}
                          y1={yLvl}
                          x2={maxX}
                          y2={yLvl}
                          stroke={lvl.color}
                          strokeWidth={lvl.ratio === 0.618 ? 1.8 : 1}
                          strokeDasharray={lvl.ratio === 0 || lvl.ratio === 1 ? "none" : "3 2"}
                          opacity={isSelected ? 1 : 0.85}
                        />
                        <text
                          x={minX + 4}
                          y={yLvl - 3}
                          fill={lvl.color}
                          fontSize={8.5}
                          fontFamily="monospace"
                          fontWeight={lvl.ratio === 0.618 ? "bold" : "normal"}
                        >
                          {lvl.label} · {priceAtLvl.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Handles at start & end */}
                  <circle
                    cx={x1}
                    cy={getY(fib.p1.price, chartHeight - 50)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#e3b341"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={x2}
                    cy={getY(fib.p2.price, chartHeight - 50)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#e3b341"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />

                  {/* Remove button on selection */}
                  {isSelected && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawings((prev) => prev.filter((d) => d.id !== fib.id));
                        setSelectedDrawingId(null);
                      }}
                      className="cursor-pointer"
                    >
                      <circle cx={minX + 16} cy={goldenTop + goldenHeight / 2} r={7} fill="#da3633" />
                      <line x1={minX + 13} y1={goldenTop + goldenHeight / 2 - 3} x2={minX + 19} y2={goldenTop + goldenHeight / 2 + 3} stroke="#fff" strokeWidth={1.5} />
                      <line x1={minX + 19} y1={goldenTop + goldenHeight / 2 - 3} x2={minX + 13} y2={goldenTop + goldenHeight / 2 + 3} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  )}
                </g>
              );
            })}

          {/* C. Trendlines (LTA / LTB) */}
          {drawings
            .filter((d): d is TrendlineDrawing => d.type === "trendline")
            .map((t) => {
              const x1 = getXFromIndex(t.p1.xIndex);
              const y1 = getY(t.p1.price, chartHeight - 50);
              const x2 = getXFromIndex(t.p2.xIndex);
              const y2 = getY(t.p2.price, chartHeight - 50);
              const isSelected = selectedDrawingId === t.id;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const pctDiff = t.p1.price > 0 ? ((t.p2.price - t.p1.price) / t.p1.price) * 100 : 0;

              return (
                <g
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDrawingId(t.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Invisible broad hit box */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} />

                  {/* Visible Trendline */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={t.color}
                    strokeWidth={isSelected ? 2.5 : 2}
                    strokeLinecap="round"
                  />

                  {/* Anchors at endpoints */}
                  <circle cx={x1} cy={y1} r={isSelected ? 5 : 3.5} fill={t.color} stroke="#ffffff" strokeWidth={1.5} />
                  <circle cx={x2} cy={y2} r={isSelected ? 5 : 3.5} fill={t.color} stroke="#ffffff" strokeWidth={1.5} />

                  {/* Midpoint variation tag */}
                  <rect
                    x={midX - 26}
                    y={midY - 8}
                    width={52}
                    height={15}
                    rx={3}
                    fill="#161b22"
                    stroke={t.color}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    fill="#e6edf3"
                    fontSize={8.5}
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%
                  </text>

                  {/* Remove button on selection */}
                  {isSelected && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawings((prev) => prev.filter((d) => d.id !== t.id));
                        setSelectedDrawingId(null);
                      }}
                      className="cursor-pointer"
                    >
                      <circle cx={midX + 34} cy={midY} r={7} fill="#da3633" />
                      <line x1={midX + 31} y1={midY - 3} x2={midX + 37} y2={midY + 3} stroke="#fff" strokeWidth={1.5} />
                      <line x1={midX + 37} y1={midY - 3} x2={midX + 31} y2={midY + 3} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  )}
                </g>
              );
            })}

          {/* D. LIVE DRAWING DRAFT PREVIEW (While user is dragging or clicking point 2) */}
          {draftPoint && mouseCoord && (
            <g className="pointer-events-none">
              {activeTool === "trendline" && (
                <>
                  <line
                    x1={getXFromIndex(draftPoint.xIndex)}
                    y1={getY(draftPoint.price, chartHeight - 50)}
                    x2={mouseCoord.x}
                    y2={mouseCoord.y}
                    stroke="#58a6ff"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={getXFromIndex(draftPoint.xIndex)}
                    cy={getY(draftPoint.price, chartHeight - 50)}
                    r={4}
                    fill="#58a6ff"
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                  <circle cx={mouseCoord.x} cy={mouseCoord.y} r={4} fill="#58a6ff" stroke="#fff" strokeWidth={1.5} />
                </>
              )}

              {activeTool === "fibonacci" && (
                <>
                  <line
                    x1={getXFromIndex(draftPoint.xIndex)}
                    y1={getY(draftPoint.price, chartHeight - 50)}
                    x2={mouseCoord.x}
                    y2={mouseCoord.y}
                    stroke="#e3b341"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  {FIB_LEVELS.map((lvl) => {
                    const diff = mouseCoord.price - draftPoint.price;
                    const pAtLvl = draftPoint.price + diff * lvl.ratio;
                    const yLvl = getY(pAtLvl, chartHeight - 50);
                    return (
                      <g key={lvl.ratio}>
                        <line
                          x1={Math.min(getXFromIndex(draftPoint.xIndex), mouseCoord.x)}
                          y1={yLvl}
                          x2={svgWidth - 65}
                          y2={yLvl}
                          stroke={lvl.color}
                          strokeWidth={1}
                          strokeDasharray="3 2"
                        />
                        <text
                          x={Math.min(getXFromIndex(draftPoint.xIndex), mouseCoord.x) + 4}
                          y={yLvl - 2}
                          fill={lvl.color}
                          fontSize={8}
                          fontFamily="monospace"
                        >
                          {lvl.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </g>
          )}

          {/* E. Crosshair preview for Support / Resistance */}
          {activeTool === "support_resistance" && mouseCoord && (
            <g className="pointer-events-none opacity-80">
              <line
                x1={0}
                y1={mouseCoord.y}
                x2={svgWidth - 65}
                y2={mouseCoord.y}
                stroke={srKind === "support" ? "#2ea043" : srKind === "resistance" ? "#f85149" : "#58a6ff"}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              <rect
                x={svgWidth - 64}
                y={mouseCoord.y - 8}
                width={62}
                height={16}
                rx={3}
                fill={srKind === "support" ? "#238636" : srKind === "resistance" ? "#da3633" : "#1f6feb"}
              />
              <text
                x={svgWidth - 33}
                y={mouseCoord.y + 3}
                fill="#ffffff"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {srKind === "support" ? "SUP" : "RES"} {mouseCoord.price.toFixed(1)}
              </text>
            </g>
          )}

          {/* F. Crosshair Lines when Tool is Active or cursor hovering */}
          {activeTool !== "cursor" && mouseCoord && (
            <g className="pointer-events-none opacity-50">
              <line
                x1={mouseCoord.x}
                y1={0}
                x2={mouseCoord.x}
                y2={chartHeight - 40}
                stroke="#8b949e"
                strokeWidth={0.8}
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* 5. Chart Footer: Indicator Keys & Status */}
      <div className="px-2.5 py-1 border-t border-[#21262d] bg-[#0e1117] flex flex-wrap items-center justify-between gap-1.5 text-[9.5px] text-[#8b949e] font-mono shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[#e3b341]">
            <span className="w-2 h-0.5 bg-[#e3b341]" />
            VWAP: {activeCandle?.vwap || "--"}
          </span>
          <span className="flex items-center gap-1 text-[#58a6ff]">
            <span className="w-2 h-0.5 bg-[#58a6ff]" />
            EMA 9: {activeCandle?.ema9 || "--"}
          </span>
          {mouseCoord && activeTool !== "cursor" && (
            <span className="text-[#c9d1d9] hidden sm:inline">
              Preço Alvo: <strong className="text-white">{mouseCoord.price.toFixed(2)}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#8b949e] hidden sm:inline">
            Dica: <kbd className="px-1 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-[9px]">Esc</kbd> cancela · <kbd className="px-1 py-0.5 bg-[#21262d] rounded border border-[#30363d] text-[9px]">Del</kbd> remove
          </span>
          <span className="text-[#3fb950] flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
            Preço ao Vivo: {formatAssetDisplayPrice(asset.price, asset.currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
