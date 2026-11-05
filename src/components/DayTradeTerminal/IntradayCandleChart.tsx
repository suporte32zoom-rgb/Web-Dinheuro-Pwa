import React, { useState, useMemo } from "react";
import { Asset, DayTradePosition } from "../../types/finance";
import { formatAssetDisplayPrice } from "../../utils/formatters";
import { BarChart2, Eye, Maximize2, Zap, Clock } from "lucide-react";

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
}

interface IntradayCandleChartProps {
  asset: Asset;
  activePosition?: DayTradePosition;
}

type TimeFrame = "1m" | "5m" | "15m" | "60m" | "1D";

export const IntradayCandleChart: React.FC<IntradayCandleChartProps> = ({
  asset,
  activePosition,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>("5m");
  const [showVWAP, setShowVWAP] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

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
        ema9: Number((close * 0.998).toFixed(2)),
        sma21: Number((close * 0.994).toFixed(2)),
      });
    }

    // Force the last candle's close to exact live price
    if (list.length > 0) {
      const last = list[list.length - 1];
      last.close = base;
      last.high = Math.max(last.high, base);
      last.low = Math.min(last.low, base);
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

    const pad = (max - min) * 0.08 || 1;
    return {
      minVal: min - pad,
      maxVal: max + pad,
      maxVol: volMax,
    };
  }, [candleSeries, activePosition]);

  const getY = (val: number, height: number) => {
    if (maxVal === minVal) return height / 2;
    return height - ((val - minVal) / (maxVal - minVal)) * height;
  };

  const chartHeight = 260;
  const candleWidth = 14;
  const candleGap = 6;
  const svgWidth = Math.max(600, candleSeries.length * (candleWidth + candleGap) + 80);

  const activeCandle = hoveredCandle || candleSeries[candleSeries.length - 1];

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col shadow-lg overflow-hidden">
      {/* Chart Header: Asset Ticker, Timeframes & Indicators */}
      <div className="p-3 border-b border-[#21262d] bg-[#0e1117]/70 flex flex-wrap items-center justify-between gap-2">
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
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowVWAP(!showVWAP)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
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
              onClick={() => setShowEMA(!showEMA)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] font-bold ${
                showEMA
                  ? "bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40"
                  : "bg-transparent text-[#8b949e] border-transparent hover:border-[#30363d]"
              }`}
            >
              <span className="w-2 h-0.5 bg-[#58a6ff]" />
              EMA 9
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

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-x-auto scrollbar-none bg-[#0e1117] p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="w-full h-[280px] overflow-visible select-none"
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
                  x2={svgWidth - 60}
                  y2={y}
                  stroke="#21262d"
                  strokeDasharray="3 3"
                />
                <text
                  x={svgWidth - 55}
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
                .map((c, i) => `${i * (candleWidth + candleGap) + candleWidth / 2},${getY(c.vwap, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* EMA 9 Polyline */}
          {showEMA && (
            <polyline
              fill="none"
              stroke="#58a6ff"
              strokeWidth={1.5}
              points={candleSeries
                .map((c, i) => `${i * (candleWidth + candleGap) + candleWidth / 2},${getY(c.ema9, chartHeight - 50)}`)
                .join(" ")}
            />
          )}

          {/* Active Position Entry Price Line if present */}
          {activePosition && (
            <g>
              <line
                x1={0}
                y1={getY(activePosition.entryPrice, chartHeight - 50)}
                x2={svgWidth - 60}
                y2={getY(activePosition.entryPrice, chartHeight - 50)}
                stroke={activePosition.side === "BUY" ? "#00c853" : "#ff5252"}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              <rect
                x={svgWidth - 58}
                y={getY(activePosition.entryPrice, chartHeight - 50) - 8}
                width={56}
                height={16}
                rx={4}
                fill={activePosition.side === "BUY" ? "#238636" : "#da3633"}
              />
              <text
                x={svgWidth - 30}
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
            const volBarHeight = (c.volume / maxVol) * 40;
            const volY = chartHeight - volBarHeight;

            return (
              <g
                key={c.time}
                onMouseEnter={() => setHoveredCandle(c)}
                onMouseLeave={() => setHoveredCandle(null)}
                className="cursor-pointer"
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
        </svg>
      </div>

      {/* Chart Footer: Indicator Keys & Status */}
      <div className="p-2 border-t border-[#21262d] bg-[#0e1117] flex items-center justify-between text-[10px] text-[#8b949e] font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#e3b341]">
            <span className="w-2 h-0.5 bg-[#e3b341]" />
            VWAP: {activeCandle?.vwap || "--"}
          </span>
          <span className="flex items-center gap-1 text-[#58a6ff]">
            <span className="w-2 h-0.5 bg-[#58a6ff]" />
            EMA 9: {activeCandle?.ema9 || "--"}
          </span>
        </div>
        <span className="text-[#3fb950] flex items-center gap-1 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] animate-pulse" />
          Preço ao Vivo: {formatAssetDisplayPrice(asset.price, asset.currency)}
        </span>
      </div>
    </div>
  );
};
